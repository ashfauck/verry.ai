package com.verryapp.document;

import androidx.annotation.NonNull;
import com.mrousavy.camera.frameprocessing.Frame;
import com.mrousavy.camera.frameprocessing.FrameProcessorPlugin;
import android.media.Image;
import java.nio.ByteBuffer;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

// NOTE: This implementation currently returns a shape-compatible object with placeholder
// confidence & quality metrics derived from simple heuristics on the Y plane (brightness/area).
// Once native OpenCV (C++) is linked, replace the heuristic scoring with JNI call for parity
// with iOS. The JS stability logic will immediately benefit from these metrics.

// VisionCamera frame processor plugin (Android)
// CURRENT: Placeholder returning width/height only.
// TODO (Tasks A-D):
//  A: Extract YUV_420_888 planes from Frame -> cv::Mat (grayscale) and run OpenCV contour detection.
//  B: Mirror iOS scoring (areaRatio, aspectRatio, sharpness via Laplacian variance, glareRatio, brightness).
//  C: Return full metric map so JS side stability/adaptive gating uses real data.
//  D: Optimize with downscale + ROI heuristic to keep processing under ~4-6ms on mid devices.
public class DocumentFrameProcessorPlugin extends FrameProcessorPlugin {
  static {
    try { System.loadLibrary("document-processor"); } catch (Throwable t) { /* ignore */ }
  }

  private static native Object[] detectFromY(ByteBuffer yBuffer, int width, int height, int rowStride);

  public DocumentFrameProcessorPlugin() { super("detectDocumentEdges"); }

  @Override
  public Object callback(@NonNull Frame frame, Object[] params) {
    final int w = frame.getWidth();
    final int h = frame.getHeight();
    Image image = frame.getImage();
    if (image == null) return null;
    Image.Plane[] planes = image.getPlanes();
    if (planes.length == 0) return null;
    ByteBuffer yBuf = planes[0].getBuffer();
    if (!yBuf.isDirect()) {
      // If buffer not direct, create a direct copy (rare)
      ByteBuffer direct = ByteBuffer.allocateDirect(yBuf.remaining());
      direct.put(yBuf); direct.rewind();
      yBuf = direct;
    }
    Object[] kv = detectFromY(yBuf, w, h, planes[0].getRowStride());
    if (kv == null) return null;
    // Convert flat key/value Object[] to a Map-like structure VisionCamera can serialize.
    Map<String, Object> out = new HashMap<>();
    for (int i = 0; i + 1 < kv.length; i += 2) {
      Object key = kv[i]; Object val = kv[i+1];
      if (key instanceof String) out.put((String) key, val);
    }
    return out;
  }
}
