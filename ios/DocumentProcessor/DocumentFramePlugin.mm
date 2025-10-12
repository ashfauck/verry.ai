// VisionCamera Frame Processor plugin – performs real-time document edge detection
// using OpenCV when USE_OPENCV is defined. Falls back to width/height placeholder otherwise.
// Returns a map/object with: confidence, corners[4]{x,y}, boundingRect{x,y,width,height},
// areaRatio, aspectRatio, sharpness, glareRatio, brightness, isBlurry, isGlare.

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <CoreVideo/CoreVideo.h>
#ifdef USE_OPENCV
#import <opencv2/opencv.hpp>
#endif

@interface DocumentFramePlugin : FrameProcessorPlugin
@end

@implementation DocumentFramePlugin

-(id)callback:(Frame*)frame withArgs:(NSArray* _Nonnull)arguments {
#ifndef USE_OPENCV
  // Placeholder when OpenCV not compiled in
  return @{ @"width": @(frame.width), @"height": @(frame.height) };
#else
  CVPixelBufferRef pb = frame.buffer;
  if (!pb) {
    return @{ @"width": @(frame.width), @"height": @(frame.height) };
  }
  OSType format = CVPixelBufferGetPixelFormatType(pb);
  // We only handle common YUV bi-planar formats for now (as delivered by VisionCamera)
  if (!(format == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange ||
        format == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange)) {
    return @{ @"width": @(frame.width), @"height": @(frame.height) };
  }
  CVPixelBufferLockBaseAddress(pb, kCVPixelBufferLock_ReadOnly);
  size_t w = CVPixelBufferGetWidth(pb);
  size_t h = CVPixelBufferGetHeight(pb);
  size_t yStride = CVPixelBufferGetBytesPerRowOfPlane(pb, 0);
  uint8_t *yBase = (uint8_t*)CVPixelBufferGetBaseAddressOfPlane(pb, 0);
  if (!yBase || w == 0 || h == 0) {
    CVPixelBufferUnlockBaseAddress(pb, kCVPixelBufferLock_ReadOnly);
    return @{ @"width": @(frame.width), @"height": @(frame.height) };
  }
  // Create grayscale Mat referencing the Y plane. (No copy)
  cv::Mat gray((int)h, (int)w, CV_8UC1, yBase, yStride);

  // --- Detection Algorithm (mirrors JSI scaffold, optimized for grayscale) ---
  cv::Mat work = gray;
  double scale = 1.0; int maxDim = std::max(work.cols, work.rows);
  if (maxDim > 1280) {
    scale = 1280.0 / maxDim;
    cv::Mat resized; cv::resize(work, resized, cv::Size(), scale, scale, cv::INTER_AREA);
    work = resized;
  }
  cv::Mat blurImg; cv::GaussianBlur(work, blurImg, cv::Size(3,3), 0);
  cv::Mat edges; cv::Canny(blurImg, edges, 40, 100);
  cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3,3));
  cv::morphologyEx(edges, edges, cv::MORPH_CLOSE, kernel);
  std::vector<std::vector<cv::Point>> contours; cv::findContours(edges, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
  double frameArea = (double)work.cols * work.rows;
  struct Cand { std::vector<cv::Point> poly; double score; double areaRatio; double aspect; double sharp; double glare; double bright; } best{{},0,0,0,0,0,0};

  // Precompute Laplacian for sharpness metric
  cv::Mat lap; cv::Laplacian(work, lap, CV_16S, 3);
  for (auto &c : contours) {
    double area = cv::contourArea(c); if (area < frameArea * 0.05) continue;
    std::vector<cv::Point> approx; cv::approxPolyDP(c, approx, cv::arcLength(c,true)*0.02, true);
    if (approx.size() != 4 || !cv::isContourConvex(approx)) continue;
    cv::Rect bbox = cv::boundingRect(approx);
    double areaRatio = area / frameArea;
    double aspect = (double)bbox.width / (double)bbox.height;
    cv::Mat mask(work.size(), CV_8UC1, cv::Scalar(0)); std::vector<std::vector<cv::Point>> vv{approx}; cv::drawContours(mask, vv, 0, cv::Scalar(255), cv::FILLED);
    cv::Scalar mSharp, sSharp; cv::meanStdDev(lap, mSharp, sSharp, mask); double sharp = sSharp[0];
    cv::Scalar meanBright = cv::mean(work, mask); double bright = meanBright[0];
    int brightPx=0,total=0; for(int yy=0; yy<work.rows; ++yy){ const uchar *gptr=work.ptr<uchar>(yy); const uchar *mp=mask.ptr<uchar>(yy); for(int xx=0; xx<work.cols; ++xx){ if(mp[xx]){ total++; if(gptr[xx]>250) brightPx++; }}}
    double glare = total? (double)brightPx/total : 0.0;
    double targets[3]={1.58,1.42,1.30}; double bestAspectDelta=10.0; for(double t:targets) bestAspectDelta=std::min(bestAspectDelta,std::abs(aspect-t)/t);
    double aspectScore = 1.0 - std::min(1.0, bestAspectDelta);
    double normSharp = std::min(1.0, sharp / 180.0);
    double areaScore = std::min(1.0, std::sqrt(areaRatio));
    double glarePenalty = std::min(1.0, glare * 2.5);
    double brightnessScore = 1.0 - std::abs(bright - 140.0)/140.0;
    double score = (0.35*areaScore + 0.25*aspectScore + 0.25*normSharp + 0.15*brightnessScore) * (1.0 - glarePenalty*0.7);
    if (score > best.score) best = {approx, score, areaRatio, aspect, sharp, glare, bright};
  }

  if (best.score <= 0) {
    CVPixelBufferUnlockBaseAddress(pb, kCVPixelBufferLock_ReadOnly);
    return @{ @"width": @(frame.width), @"height": @(frame.height) }; // no detection
  }
  double invScale = 1.0 / scale;
  // Order points (simple heuristic: sort by y then x, adjust)
  std::vector<cv::Point> pts = best.poly;
  std::sort(pts.begin(), pts.end(), [](const cv::Point &a, const cv::Point &b){ if(a.y==b.y) return a.x<b.x; return a.y<b.y;});
  cv::Point tl=pts[0], tr=pts[1], bl=pts[2], br=pts[3];
  if (tr.x < tl.x) std::swap(tr, tl);
  if (br.y < bl.y) std::swap(br, bl);
  NSArray *corners = @[
    @{ @"x": @(tl.x * invScale), @"y": @(tl.y * invScale) },
    @{ @"x": @(tr.x * invScale), @"y": @(tr.y * invScale) },
    @{ @"x": @(br.x * invScale), @"y": @(br.y * invScale) },
    @{ @"x": @(bl.x * invScale), @"y": @(bl.y * invScale) },
  ];
  cv::Rect bbox = cv::boundingRect(best.poly);
  NSDictionary *bounding = @{ @"x": @(bbox.x * invScale), @"y": @(bbox.y * invScale), @"width": @(bbox.width * invScale), @"height": @(bbox.height * invScale) };
  NSDictionary *out = @{ @"confidence": @(best.score),
                          @"corners": corners,
                          @"boundingRect": bounding,
                          @"areaRatio": @(best.areaRatio),
                          @"aspectRatio": @(best.aspect),
                          @"sharpness": @(best.sharp),
                          @"glareRatio": @(best.glare),
                          @"brightness": @(best.bright),
                          @"isBlurry": @(best.sharp < 40.0),
                          @"isGlare": @(best.glare > 0.25) };
  CVPixelBufferUnlockBaseAddress(pb, kCVPixelBufferLock_ReadOnly);
  return out;
#endif
}

@end

VISION_EXPORT_FRAME_PROCESSOR(DocumentFramePlugin, detectDocumentEdges)
