// Basic JSI + placeholder OpenCV integration for document detection & warp.
// NOTE: This is a minimal scaffold. For production, migrate detection to a VisionCamera
// Frame Processor plugin to access raw pixel buffers instead of placeholder geometry.

#import <React/RCTBridge+Private.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>
#import "DocumentProcessor.h"

// If OpenCV is manually vendored (e.g., OpenCV.xcframework added to project) keep these imports;
// otherwise they will be ignored when USE_OPENCV is not defined.
#ifdef USE_OPENCV
#import <opencv2/opencv.hpp>
#import <opencv2/imgcodecs/ios.h>
#import <opencv2/imgproc/imgproc.hpp>
#endif

using namespace facebook;

static jsi::Value makeCorners(jsi::Runtime &rt, double x, double y, double w, double h) {
  jsi::Array arr(rt, 4);
  // TL, TR, BR, BL
  {
    jsi::Object pt(rt);
    pt.setProperty(rt, "x", x);
    pt.setProperty(rt, "y", y);
    arr.setValueAtIndex(rt, 0, pt);
  }
  {
    jsi::Object pt(rt);
    pt.setProperty(rt, "x", x + w);
    pt.setProperty(rt, "y", y);
    arr.setValueAtIndex(rt, 1, pt);
  }
  {
    jsi::Object pt(rt);
    pt.setProperty(rt, "x", x + w);
    pt.setProperty(rt, "y", y + h);
    arr.setValueAtIndex(rt, 2, pt);
  }
  {
    jsi::Object pt(rt);
    pt.setProperty(rt, "x", x);
    pt.setProperty(rt, "y", y + h);
    arr.setValueAtIndex(rt, 3, pt);
  }
  return arr;
}

static jsi::Value detectDocumentEdgesJSI(jsi::Runtime &rt, const jsi::Value *args, size_t count) {
  // args[0] expected Frame (VisionCamera). For placeholder we ignore pixel data & return centered rect.
  // This lets JS side integration work before real OpenCV integration.
  if (count < 1 || !args[0].isObject()) return jsi::Value::null();
  auto frameObj = args[0].asObject(rt);
  double width = 0, height = 0;
  if (frameObj.hasProperty(rt, "width")) width = frameObj.getProperty(rt, "width").asNumber();
  if (frameObj.hasProperty(rt, "height")) height = frameObj.getProperty(rt, "height").asNumber();
  if (width <= 0 || height <= 0) return jsi::Value::null();

#ifdef USE_OPENCV
  // Attempt real detection if pixel buffer extraction becomes available.
  // CURRENT: We do not yet have direct pixel access from VisionCamera Frame in this file.
  // The extraction function below is a stub returning false; once integrated with a proper
  // frame processor plugin you can populate rgba Mat and the algorithm will run.
  auto attemptDetect = [&](cv::Mat &rgba) -> jsi::Value {
    if (rgba.empty()) return jsi::Value::null();
    cv::Mat gray; cv::cvtColor(rgba, gray, cv::COLOR_RGBA2GRAY);
    double scale = 1.0;
    int maxDim = std::max(gray.cols, gray.rows);
    if (maxDim > 1280) {
      scale = 1280.0 / maxDim;
      cv::Mat resized; cv::resize(gray, resized, cv::Size(), scale, scale, cv::INTER_AREA);
      gray = resized;
    }
    cv::Mat blurImg; cv::GaussianBlur(gray, blurImg, cv::Size(3,3), 0);
    cv::Mat edges; cv::Canny(blurImg, edges, 40, 100);
    // Morph close to connect edges
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3,3));
    cv::morphologyEx(edges, edges, cv::MORPH_CLOSE, kernel);
    std::vector<std::vector<cv::Point>> contours; std::vector<cv::Vec4i> hierarchy;
    cv::findContours(edges, contours, hierarchy, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    double frameArea = (double)gray.cols * gray.rows;
    struct Candidate { std::vector<cv::Point> poly; double score; double areaRatio; double aspect; double sharp; double glare; double brightness; } best{ {}, 0,0,0,0,0,0 };
    for (auto &c : contours) {
      double area = cv::contourArea(c);
      if (area < frameArea * 0.05) continue; // min area
      std::vector<cv::Point> approx; cv::approxPolyDP(c, approx, cv::arcLength(c,true)*0.02, true);
      if (approx.size() != 4 || !cv::isContourConvex(approx)) continue;
      // Order points via sort on y then x simplistic (refine later)
      std::vector<cv::Point2f> ordered; for (auto &p: approx) ordered.emplace_back((float)p.x,(float)p.y);
      // Compute metrics
      cv::Rect bbox = cv::boundingRect(approx);
      double areaRatio = area / frameArea;
      double aspect = (double)bbox.width / (double)bbox.height;
      // Sharpness: Laplacian variance inside bbox mask
      cv::Mat mask(gray.size(), CV_8UC1, cv::Scalar(0));
      std::vector<std::vector<cv::Point>> polyVec{approx};
      cv::drawContours(mask, polyVec, 0, cv::Scalar(255), cv::FILLED);
      cv::Mat cropped; gray.copyTo(cropped, mask);
      cv::Mat lap; cv::Laplacian(cropped, lap, CV_16S, 3);
      cv::Scalar meanLap, stdLap; cv::meanStdDev(lap, meanLap, stdLap, mask);
      double sharpness = stdLap[0];
      // Brightness / glare
      cv::Scalar meanVal = cv::mean(gray, mask);
      double brightness = meanVal[0];
      int brightPixels = 0; int totalDoc = 0;
      for (int y=0; y<gray.rows; ++y){
        const uchar *gptr = gray.ptr<uchar>(y); const uchar *mptr = mask.ptr<uchar>(y);
        for (int x=0; x<gray.cols; ++x){ if (mptr[x]) { totalDoc++; if (gptr[x] > 250) brightPixels++; }}
      }
      double glareRatio = totalDoc>0 ? (double)brightPixels / (double)totalDoc : 0.0;
      // Aspect similarity (target ~1.58 typical ID) choose nearest of common ratios
      double targets[3] = {1.58, 1.42, 1.30};
      double bestAspectDelta = 10.0;
      for (double t : targets) bestAspectDelta = std::min(bestAspectDelta, std::abs(aspect - t)/t);
      double aspectScore = 1.0 - std::min(1.0, bestAspectDelta);
      double normSharp = std::min(1.0, sharpness / 180.0);
      double areaScore = std::min(1.0, std::sqrt(areaRatio));
      double glarePenalty = std::min(1.0, glareRatio * 2.5); // >0.4 => heavy penalty
      double brightnessScore = 1.0 - std::abs(brightness - 140.0)/140.0; // crude normalization
      double score = (0.35*areaScore + 0.25*aspectScore + 0.25*normSharp + 0.15*brightnessScore) * (1.0 - glarePenalty*0.7);
      if (score > best.score) {
        best = {approx, score, areaRatio, aspect, sharpness, glareRatio, brightness};
      }
    }
    if (best.score > 0) {
      // Build result (scale back if resized)
      double invScale = 1.0/scale;
      jsi::Array corners(rt, 4);
      // reorder roughly TL TR BR BL
      std::vector<cv::Point> pts = best.poly;
      // Sort by y then x
      std::sort(pts.begin(), pts.end(), [](const cv::Point &a, const cv::Point &b){ if (a.y==b.y) return a.x<b.x; return a.y<b.y; });
      cv::Point tl = pts[0]; cv::Point tr = pts[1]; cv::Point bl = pts[2]; cv::Point br = pts[3];
      // heuristic swap if needed for ordering
      if (tr.x < tl.x) std::swap(tr, tl);
      if (br.y < bl.y) std::swap(br, bl);
      cv::Point orderedPts[4] = {tl,tr,br,bl};
      for (int i=0;i<4;i++) {
        jsi::Object pt(rt);
        pt.setProperty(rt, "x", orderedPts[i].x*invScale);
        pt.setProperty(rt, "y", orderedPts[i].y*invScale);
        corners.setValueAtIndex(rt, i, pt);
      }
      cv::Rect bbox = cv::boundingRect(best.poly);
      jsi::Object bounding(rt);
      bounding.setProperty(rt, "x", bbox.x*invScale);
      bounding.setProperty(rt, "y", bbox.y*invScale);
      bounding.setProperty(rt, "width", bbox.width*invScale);
      bounding.setProperty(rt, "height", bbox.height*invScale);
      jsi::Object res(rt);
      res.setProperty(rt, "confidence", best.score);
      res.setProperty(rt, "boundingRect", bounding);
      res.setProperty(rt, "corners", corners);
      res.setProperty(rt, "aspectRatio", best.aspect);
      res.setProperty(rt, "areaRatio", best.areaRatio);
      res.setProperty(rt, "sharpness", best.sharp);
      res.setProperty(rt, "glareRatio", best.glare);
      res.setProperty(rt, "brightness", best.brightness);
      res.setProperty(rt, "isBlurry", best.sharp < 40.0);
      res.setProperty(rt, "isGlare", best.glare > 0.25);
      return res;
    }
    return jsi::Value::null();
  };

  cv::Mat rgba; // Will remain empty until extraction implemented
  // TODO: integrate VisionCamera frame pixel extraction here.
  // if (extractFrameToRgba(frameObj, rgba)) { auto val = attemptDetect(rgba); if (!val.isNull()) return val; }
#endif // USE_OPENCV

  double docW = width * 0.7;
  double docH = docW / 1.58;
  double x = (width - docW) / 2.0;
  double y = (height - docH) / 2.0;

  jsi::Object bounding(rt);
  bounding.setProperty(rt, "x", x);
  bounding.setProperty(rt, "y", y);
  bounding.setProperty(rt, "width", docW);
  bounding.setProperty(rt, "height", docH);

  jsi::Object result(rt);
  result.setProperty(rt, "confidence", 0.92);
  result.setProperty(rt, "boundingRect", bounding);
  result.setProperty(rt, "corners", makeCorners(rt, x, y, docW, docH));
  result.setProperty(rt, "aspectRatio", docW / docH);
  result.setProperty(rt, "areaRatio", (docW * docH) / (width * height));
  // Placeholder quality metrics (real implementation will analyze pixels)
  result.setProperty(rt, "sharpness", 60.0);
  result.setProperty(rt, "glareRatio", 0.05);
  result.setProperty(rt, "brightness", 140.0);
  result.setProperty(rt, "isBlurry", false);
  result.setProperty(rt, "isGlare", false);
  return result;
}

static std::string stripFilePrefix(const std::string &p) {
  if (p.rfind("file://", 0) == 0) return p.substr(7);
  return p;
}

static bool orderFourCorners(
#ifdef USE_OPENCV
  std::vector<cv::Point2f> &pts
#else
  void * /*unused*/
#endif
) {
#ifndef USE_OPENCV
  return false;
#else
  if (pts.size() != 4) return false;
  // Compute centroid
  cv::Point2f c(0,0);
  for (auto &p: pts) c += p;
  c.x /= 4.f; c.y /= 4.f;
  // Classify by quadrant relative to centroid
  std::vector<cv::Point2f> tl, tr, br, bl;
  for (auto &p: pts) {
    if (p.x < c.x && p.y < c.y) tl.push_back(p);
    else if (p.x > c.x && p.y < c.y) tr.push_back(p);
    else if (p.x > c.x && p.y > c.y) br.push_back(p);
    else bl.push_back(p);
  }
  if (tl.empty() || tr.empty() || br.empty() || bl.empty()) return false;
  pts.clear();
  pts.push_back(tl[0]);
  pts.push_back(tr[0]);
  pts.push_back(br[0]);
  pts.push_back(bl[0]);
  return true;
#endif
}

static jsi::Value warpAndCropDocumentJSI(jsi::Runtime &rt, const jsi::Value *args, size_t count) {
  if (count < 2) return jsi::Value::null();
  if (!args[0].isString()) return jsi::Value::null();
  if (!args[1].isObject()) return jsi::Value::null();

  std::string path = stripFilePrefix(args[0].asString(rt).utf8(rt));
#ifndef USE_OPENCV
  // OpenCV not available -> simple passthrough
  jsi::Object passthrough(rt);
  passthrough.setProperty(rt, "uri", jsi::String::createFromUtf8(rt, std::string("file://") + path));
  passthrough.setProperty(rt, "width", (int)0);
  passthrough.setProperty(rt, "height", (int)0);
  return passthrough;
#else
  cv::Mat image = cv::imread(path);
  if (image.empty()) {
    jsi::Object err(rt);
    err.setProperty(rt, "uri", jsi::String::createFromUtf8(rt, path));
    err.setProperty(rt, "width", (int)0);
    err.setProperty(rt, "height", (int)0);
    return err; // fallback
  }

  // Extract corners array
  std::vector<cv::Point2f> corners;
  jsi::Object cornerObj = args[1].asObject(rt);
  if (cornerObj.isArray(rt)) {
    jsi::Array arr = cornerObj.asArray(rt);
    size_t len = arr.length(rt);
    for (size_t i = 0; i < len; ++i) {
      jsi::Object obj = arr.getValueAtIndex(rt, i).asObject(rt);
      if (obj.hasProperty(rt, "x") && obj.hasProperty(rt, "y") && obj.getProperty(rt, "x").isNumber() && obj.getProperty(rt, "y").isNumber()) {
        float cx = (float)obj.getProperty(rt, "x").asNumber();
        float cy = (float)obj.getProperty(rt, "y").asNumber();
        corners.emplace_back(cx, cy);
      }
    }
  }
  if (corners.size() != 4) {
    // Return original if invalid
    jsi::Object obj(rt);
    obj.setProperty(rt, "uri", jsi::String::createFromUtf8(rt, path));
    obj.setProperty(rt, "width", (int)image.cols);
    obj.setProperty(rt, "height", (int)image.rows);
    return obj;
  }
  orderFourCorners(corners); // best-effort ordering (guarded)

  // Compute target dimensions based on max side lengths
  auto wTop = cv::norm(corners[1] - corners[0]);
  auto wBottom = cv::norm(corners[2] - corners[3]);
  auto hLeft = cv::norm(corners[3] - corners[0]);
  auto hRight = cv::norm(corners[2] - corners[1]);
  float targetW = std::max(wTop, wBottom);
  float targetH = std::max(hLeft, hRight);

  // Clamp extreme values
  targetW = std::max(50.f, std::min(targetW, 3000.f));
  targetH = std::max(50.f, std::min(targetH, 3000.f));

  std::vector<cv::Point2f> dst;
  dst.emplace_back(0.f, 0.f);
  dst.emplace_back(targetW - 1.f, 0.f);
  dst.emplace_back(targetW - 1.f, targetH - 1.f);
  dst.emplace_back(0.f, targetH - 1.f);

  cv::Mat M = cv::getPerspectiveTransform(corners, dst);
  cv::Mat warped;
  cv::warpPerspective(image, warped, M, cv::Size((int)targetW, (int)targetH), cv::INTER_LINEAR, cv::BORDER_REPLICATE);

  // Optional: basic contrast enhancement (CLAHE) on L channel (disabled by default) – placeholder
  // (Can be enabled later if quality improvements needed.)

  // Write output
  NSString *tmp = NSTemporaryDirectory();
  NSString *filename = [NSString stringWithFormat:@"doc_warp_%@.jpg", [[NSUUID UUID] UUIDString]];
  NSString *full = [tmp stringByAppendingPathComponent:filename];
  std::vector<int> params = { cv::IMWRITE_JPEG_QUALITY, 90 };
  cv::imwrite([full UTF8String], warped, params);

  std::string outPath = std::string("file://") + [full UTF8String];
  jsi::Object obj(rt);
  obj.setProperty(rt, "uri", jsi::String::createFromUtf8(rt, outPath));
  obj.setProperty(rt, "width", (int)warped.cols);
  obj.setProperty(rt, "height", (int)warped.rows);
  return obj;
#endif // USE_OPENCV
}

void installDocumentProcessor(jsi::Runtime &runtime) {
  auto global = runtime.global();
  auto docNS = jsi::Object(runtime);
  docNS.setProperty(runtime, "detectDocumentEdges", jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "detectDocumentEdges"),
    1,
    [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
      return detectDocumentEdgesJSI(rt, args, count);
    }
  ));
  docNS.setProperty(runtime, "warpAndCropDocument", jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "warpAndCropDocument"),
    2,
    [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
      return warpAndCropDocumentJSI(rt, args, count);
    }
  ));
  global.setProperty(runtime, "__DocumentProcessor", docNS);
}

extern "C" void InstallDocumentProcessorRuntime(void *rtPtr) {
  if (rtPtr == nullptr) return;
  auto runtime = reinterpret_cast<jsi::Runtime *>(rtPtr);
  installDocumentProcessor(*runtime);
}
