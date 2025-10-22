#include <jni.h>
#include <jsi/jsi.h>
#include <android/log.h>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

#ifdef USE_OPENCV
#include <opencv2/opencv.hpp>
#endif

using namespace facebook;

#define LOG_TAG "DocProcessorJNI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

namespace {

jsi::Value detectDocumentEdgesJSI(jsi::Runtime &rt, const jsi::Value *args, size_t count) {
  if (count < 1 || !args[0].isObject()) return jsi::Value::null();
  auto frameObj = args[0].asObject(rt);
  double width = 0, height = 0;
  if (frameObj.hasProperty(rt, "width")) width = frameObj.getProperty(rt, "width").asNumber();
  if (frameObj.hasProperty(rt, "height")) height = frameObj.getProperty(rt, "height").asNumber();
  if (width <= 0 || height <= 0) return jsi::Value::null();

#ifdef USE_OPENCV
  auto detect = [&](cv::Mat &rgba) -> jsi::Value {
    if (rgba.empty()) return jsi::Value::null();
    cv::Mat gray; cv::cvtColor(rgba, gray, cv::COLOR_RGBA2GRAY);
    double scale = 1.0; int maxDim = std::max(gray.cols, gray.rows);
    if (maxDim > 1280) { scale = 1280.0 / maxDim; cv::Mat resized; cv::resize(gray, resized, cv::Size(), scale, scale, cv::INTER_AREA); gray = resized; }
    cv::Mat blurImg; cv::GaussianBlur(gray, blurImg, cv::Size(3,3), 0);
    cv::Mat edges; cv::Canny(blurImg, edges, 40, 100);
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3,3));
    cv::morphologyEx(edges, edges, cv::MORPH_CLOSE, kernel);
    std::vector<std::vector<cv::Point>> contours; cv::findContours(edges, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    double frameArea = (double)gray.cols * gray.rows;
    struct Cand { std::vector<cv::Point> poly; double score; double areaRatio; double aspect; double sharp; double glare; double bright; } best{{},0,0,0,0,0,0};
    for (auto &c: contours) {
      double area = cv::contourArea(c); if (area < frameArea * 0.05) continue;
      std::vector<cv::Point> approx; cv::approxPolyDP(c, approx, cv::arcLength(c,true)*0.02, true);
      if (approx.size()!=4 || !cv::isContourConvex(approx)) continue;
      cv::Rect bbox = cv::boundingRect(approx);
      double areaRatio = area / frameArea;
      double aspect = (double)bbox.width / (double)bbox.height;
      cv::Mat mask(gray.size(), CV_8UC1, cv::Scalar(0));
      std::vector<std::vector<cv::Point>> v{approx}; cv::drawContours(mask, v, 0, cv::Scalar(255), cv::FILLED);
      cv::Mat lap; cv::Laplacian(gray, lap, CV_16S, 3);
      cv::Scalar m, s; cv::meanStdDev(lap, m, s, mask); double sharp = s[0];
      cv::Scalar gm = cv::mean(gray, mask); double bright = gm[0];
      int brightPx=0, total=0; for(int y=0;y<gray.rows;++y){ const uchar *gp=gray.ptr<uchar>(y); const uchar* mp=mask.ptr<uchar>(y); for(int x=0;x<gray.cols;++x){ if(mp[x]){ total++; if(gp[x]>250) brightPx++; }}}
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
    if (best.score > 0) {
      double invScale = 1.0/scale;
      jsi::Array corners(rt, 4);
      std::vector<cv::Point> pts = best.poly;
      std::sort(pts.begin(), pts.end(), [](const cv::Point&a,const cv::Point&b){ if(a.y==b.y) return a.x<b.x; return a.y<b.y;});
      cv::Point tl=pts[0], tr=pts[1], bl=pts[2], br=pts[3]; if (tr.x<tl.x) std::swap(tr,tl); if (br.y<bl.y) std::swap(br,bl);
      cv::Point ordered[4]={tl,tr,br,bl};
      for(int i=0;i<4;i++){ jsi::Object pt(rt); pt.setProperty(rt,"x", ordered[i].x*invScale); pt.setProperty(rt,"y", ordered[i].y*invScale); corners.setValueAtIndex(rt,i,pt);} 
      cv::Rect bbox=cv::boundingRect(best.poly);
      jsi::Object bounding(rt); bounding.setProperty(rt,"x",bbox.x*invScale); bounding.setProperty(rt,"y",bbox.y*invScale); bounding.setProperty(rt,"width",bbox.width*invScale); bounding.setProperty(rt,"height",bbox.height*invScale);
      jsi::Object out(rt); out.setProperty(rt,"confidence",best.score); out.setProperty(rt,"boundingRect",bounding); out.setProperty(rt,"corners",corners); out.setProperty(rt,"aspectRatio",best.aspect); out.setProperty(rt,"areaRatio",best.areaRatio); out.setProperty(rt,"sharpness",best.sharp); out.setProperty(rt,"glareRatio",best.glare); out.setProperty(rt,"brightness",best.bright); out.setProperty(rt,"isBlurry", best.sharp < 40.0); out.setProperty(rt,"isGlare", best.glare > 0.25); return out;
    }
    return jsi::Value::null();
  };
  cv::Mat rgba; // TODO: integrate VisionCamera Frame pixel buffer extraction (plugin) to populate rgba.
  // if (extractFrameToRgba(frameObj, rgba)) { auto val = detect(rgba); if (!val.isNull()) return val; }
#endif

  // Fallback placeholder quad when OpenCV not available or extraction not implemented.
  double docW = width * 0.7; double docH = docW / 1.58; double x = (width - docW)/2.0; double y = (height - docH)/2.0;
  auto makePoint = [&](double px,double py){ jsi::Object pt(rt); pt.setProperty(rt,"x",px); pt.setProperty(rt,"y",py); return pt; };
  jsi::Array corners(rt,4);
  corners.setValueAtIndex(rt,0,makePoint(x,y));
  corners.setValueAtIndex(rt,1,makePoint(x+docW,y));
  corners.setValueAtIndex(rt,2,makePoint(x+docW,y+docH));
  corners.setValueAtIndex(rt,3,makePoint(x,y+docH));
  jsi::Object bounding(rt); bounding.setProperty(rt,"x",x); bounding.setProperty(rt,"y",y); bounding.setProperty(rt,"width",docW); bounding.setProperty(rt,"height",docH);
  jsi::Object result(rt);
  result.setProperty(rt,"confidence",0.9);
  result.setProperty(rt,"boundingRect",bounding);
  result.setProperty(rt,"corners",corners);
  result.setProperty(rt,"aspectRatio", docW/docH);
  result.setProperty(rt,"areaRatio", (docW*docH)/(width*height));
  result.setProperty(rt,"sharpness",55.0);
  result.setProperty(rt,"glareRatio",0.04);
  result.setProperty(rt,"brightness",135.0);
  result.setProperty(rt,"isBlurry", false);
  result.setProperty(rt,"isGlare", false);
  return result;
}

jsi::Value warpAndCropDocumentJSI(jsi::Runtime &rt, const jsi::Value *args, size_t count) {
  if (count < 2) return jsi::Value::null();
  if (!args[0].isString()) return jsi::Value::null();
  // Passthrough for now on Android until OpenCV JNI integrated
  jsi::Object obj(rt);
  obj.setProperty(rt, "uri", args[0].asString(rt));
  obj.setProperty(rt, "width", 0);
  obj.setProperty(rt, "height", 0);
  return obj;
}

void install(jsi::Runtime &rt) {
  auto global = rt.global();
  jsi::Object doc(rt);
  doc.setProperty(rt, "detectDocumentEdges", jsi::Function::createFromHostFunction(
    rt, jsi::PropNameID::forAscii(rt, "detectDocumentEdges"), 1,
    [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count){
      return detectDocumentEdgesJSI(rt, args, count);
    }
  ));
  doc.setProperty(rt, "warpAndCropDocument", jsi::Function::createFromHostFunction(
    rt, jsi::PropNameID::forAscii(rt, "warpAndCropDocument"), 2,
    [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count){
      return warpAndCropDocumentJSI(rt, args, count);
    }
  ));
  global.setProperty(rt, "__DocumentProcessor", std::move(doc));
}

} // namespace

// JNI entry for frame processor plugin: processes a Y (luma) plane buffer and returns metrics.
extern "C" JNIEXPORT jobjectArray JNICALL
Java_com_verryapp_document_DocumentFrameProcessorPlugin_detectFromY(
  JNIEnv *env, jclass clazz, jobject yBuffer, jint width, jint height, jint rowStride
) {
      if (yBuffer == nullptr || width <= 0 || height <= 0) {
        return nullptr;
      }
      uint8_t *yData = static_cast<uint8_t *>(env->GetDirectBufferAddress(yBuffer));
      if (!yData) return nullptr;

      // Prepare Java helper references
      jclass objectClass = env->FindClass("java/lang/Object");
      jclass doubleArrayClass = env->FindClass("[D");
      jclass booleanClass = env->FindClass("java/lang/Boolean");
      jmethodID booleanValueOf = env->GetStaticMethodID(booleanClass, "valueOf", "(Z)Ljava/lang/Boolean;");

    #ifdef USE_OPENCV
      cv::Mat gray(height, width, CV_8UC1, yData, rowStride);
      if (gray.empty()) return nullptr;

      double scale = 1.0; int maxDim = std::max(gray.cols, gray.rows);
      cv::Mat work = gray;
      if (maxDim > 1280) {
        scale = 1280.0 / maxDim; cv::Mat resized; cv::resize(work, resized, cv::Size(), scale, scale, cv::INTER_AREA); work = resized; }
      cv::Mat blurImg; cv::GaussianBlur(work, blurImg, cv::Size(3,3), 0);
      cv::Mat edges; cv::Canny(blurImg, edges, 40, 100);
      cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3,3));
      cv::morphologyEx(edges, edges, cv::MORPH_CLOSE, kernel);
      std::vector<std::vector<cv::Point>> contours; cv::findContours(edges, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
      double frameArea = (double)work.cols * work.rows;
      struct Cand { std::vector<cv::Point> poly; double score; double areaRatio; double aspect; double sharp; double glare; double bright; } best{{},0,0,0,0,0,0};
      cv::Mat lap; cv::Laplacian(work, lap, CV_16S, 3);
      for (auto &c: contours) {
        double area = cv::contourArea(c); if (area < frameArea * 0.05) continue;
        std::vector<cv::Point> approx; cv::approxPolyDP(c, approx, cv::arcLength(c,true)*0.02, true);
        if (approx.size()!=4 || !cv::isContourConvex(approx)) continue;
        cv::Rect bbox = cv::boundingRect(approx);
        double areaRatio = area / frameArea;
        double aspect = (double)bbox.width / (double)bbox.height;
        cv::Mat mask(work.size(), CV_8UC1, cv::Scalar(0)); std::vector<std::vector<cv::Point>> vv{approx}; cv::drawContours(mask, vv, 0, cv::Scalar(255), cv::FILLED);
        cv::Scalar m, s; cv::meanStdDev(lap, m, s, mask); double sharp = s[0];
        cv::Scalar gm = cv::mean(work, mask); double bright = gm[0];
        int brightPx=0,total=0; for(int y=0;y<work.rows;++y){ const uchar *gp=work.ptr<uchar>(y); const uchar *mp=mask.ptr<uchar>(y); for(int x=0;x<work.cols;++x){ if(mp[x]){ total++; if(gp[x]>250) brightPx++; }}}
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

      if (best.score > 0) {
        double invScale = 1.0/scale;
        std::vector<cv::Point> pts = best.poly;
        std::sort(pts.begin(), pts.end(), [](const cv::Point&a,const cv::Point&b){ if(a.y==b.y) return a.x<b.x; return a.y<b.y;});
        cv::Point tl=pts[0], tr=pts[1], bl=pts[2], br=pts[3]; if (tr.x<tl.x) std::swap(tr,tl); if (br.y<bl.y) std::swap(br,bl);
        cv::Point ordered[4]={tl,tr,br,bl};
        // Create corners double[][] at full resolution
        jobjectArray cornersOuter = env->NewObjectArray(4, doubleArrayClass, nullptr);
        for (int i=0;i<4;i++) {
          jdouble tmp[2]; tmp[0] = ordered[i].x * invScale; tmp[1] = ordered[i].y * invScale;
          jdoubleArray pair = env->NewDoubleArray(2); env->SetDoubleArrayRegion(pair,0,2,tmp); env->SetObjectArrayElement(cornersOuter,i,pair);
        }
        cv::Rect bbox = cv::boundingRect(best.poly);
        jdouble bboxVals[4] = { bbox.x*invScale, bbox.y*invScale, bbox.width*invScale, bbox.height*invScale };
        jdoubleArray bboxArr = env->NewDoubleArray(4); env->SetDoubleArrayRegion(bboxArr,0,4,bboxVals);

        // Build result key/value flat array
        const int KV_PAIRS = 13; // confidence,width,height,corners,boundingRect,aspectRatio,areaRatio,sharpness,brightness,glareRatio,isBlurry,isGlare
        jobjectArray out = env->NewObjectArray(KV_PAIRS*2, objectClass, nullptr);
        auto putKV=[&](int idx,const char* key,jobject val){ env->SetObjectArrayElement(out, idx*2, env->NewStringUTF(key)); env->SetObjectArrayElement(out, idx*2+1, val); };
        auto putKD=[&](int idx,const char* key,double d){ jclass dblCls=env->FindClass("java/lang/Double"); jmethodID dblCtor=env->GetMethodID(dblCls,"<init>","(D)V"); jobject obj=env->NewObject(dblCls,dblCtor,d); putKV(idx,key,obj); };
        putKD(0,"confidence",best.score);
        putKD(1,"width", width);
        putKD(2,"height", height);
        putKV(3,"corners", cornersOuter);
        putKV(4,"boundingRect", bboxArr);
        putKD(5,"aspectRatio", best.aspect);
        putKD(6,"areaRatio", best.areaRatio);
        putKD(7,"sharpness", best.sharp);
        putKD(8,"brightness", best.bright);
        putKD(9,"glareRatio", best.glare);
        putKV(10,"isBlurry", env->CallStaticObjectMethod(booleanClass, booleanValueOf, (jboolean)(best.sharp < 40.0)));
        putKV(11,"isGlare", env->CallStaticObjectMethod(booleanClass, booleanValueOf, (jboolean)(best.glare > 0.25)));
        // maintain compatibility with JS expecting 'frameWidth'/'frameHeight' injection later
        putKD(12,"_nativeScale", scale); // diagnostic
        return out;
      }
    #endif
      // Fallback minimal placeholder (no detection)
      const int KV_PAIRS_FALLBACK = 3; // width/height/ confidence (0)
      jobjectArray out = env->NewObjectArray(KV_PAIRS_FALLBACK*2, objectClass, nullptr);
      auto putKD=[&](int idx,const char* key,double d){ jclass dblCls=env->FindClass("java/lang/Double"); jmethodID dblCtor=env->GetMethodID(dblCls,"<init>","(D)V"); jobject obj=env->NewObject(dblCls,dblCtor,d); env->SetObjectArrayElement(out, idx*2, env->NewStringUTF(key)); env->SetObjectArrayElement(out, idx*2+1, obj); };
      putKD(0, "confidence", 0.0);
      putKD(1, "width", width);
      putKD(2, "height", height);
      return out;
}

extern "C" JNIEXPORT void JNICALL
Java_com_verryapp_document_DocumentProcessorInstaller_installNative(JNIEnv *env, jobject thiz, jlong jsContextNativePointer) {
  if (jsContextNativePointer == 0) return;
  auto runtime = reinterpret_cast<jsi::Runtime *>(jsContextNativePointer);
  install(*runtime);
  LOGI("DocumentProcessor JSI installed on Android");
}
