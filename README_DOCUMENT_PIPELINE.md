# Document Detection & Warp Pipeline (Planned Implementation)

This file tracks the remaining native work to convert the current placeholder detection into a real OpenCV-based pipeline on iOS & Android.

## Goals
- Robust quadrilateral detection for ID / passport / license.
- High quality perspective warp output (reduced background, correct proportions).
- Quality metrics for gating: sharpness, glare, brightness, area coverage, aspect ratio similarity.
- Performance: <15ms per processed frame on modern devices using downscaling and selective frame skipping.

## iOS Implementation Plan
1. Integrate OpenCV (already scaffolded with `#ifdef USE_OPENCV`).
2. Create a VisionCamera Frame Processor plugin (Objective-C++ file) to access pixel buffer (YUV/RGBA) directly.
3. Convert pixel buffer to grayscale `cv::Mat` (downscale if max dimension > 1280).
4. Preprocess: Gaussian blur (3x3), adaptive or Otsu threshold + Canny.
5. Contours: `findContours` -> filter by area (min 8% frame) & hierarchy (outer contours only) & convexity.
6. Polygon approx: `approxPolyDP` -> keep quads with acceptable aspect & area ratio.
7. Score each quad:
   - areaScore = sqrt(areaRatio)
   - aspectScore = 1 - min(|aspect - targetA|/targetA, |aspect - targetB|/targetB, ...)
   - edgeScore via average gradient magnitude on edges (Sobel or Canny edge density)
   - glarePenalty based on bright pixel proportion (>250) inside quad mask
   - sharpness via Laplacian variance mapped to [0,1]
   - confidence = weighted sum (e.g., 0.35 area + 0.25 aspect + 0.25 edge + 0.15 sharpness) * (1 - glarePenalty)
8. Select best scoring quad; populate metrics & return.
9. Warp capture: use existing `warpAndCropDocument` (already implemented when `USE_OPENCV`). Add optional CLAHE on L channel for contrast.

## Android Implementation Plan
1. Bundle OpenCV SDK inside `third_party/opencv` or use package manager if available.
2. Update `CMakeLists.txt`:
   ```cmake
   find_package(OpenCV REQUIRED)
   include_directories(${OpenCV_INCLUDE_DIRS})
   target_link_libraries(document-processor ${OpenCV_LIBS} ${log-lib})
   ```
3. Implement detection identical to iOS in `DocumentProcessor.cpp` guarded by `#ifdef USE_OPENCV`.
4. Provide warp using `cv::getPerspectiveTransform` + `cv::warpPerspective`.
5. Add quality metrics matching iOS for consistent gating.

## Quality Metric Details
- sharpness: `Laplacian gray -> variance`; map variance V to score S via S = min(1, V / 180.0).
- glareRatio: For masked pixels, count where gray > 250; ratio vs total doc pixels.
- brightness: Mean gray inside mask; helpful for guidance messaging.
- areaRatio: doc area / frame area.
- aspectRatio: width / height after ordering corners.

## Guidance Strings (JS Layer)
Map failing metric to user guidance:
- areaRatio < threshold: "Move closer"
- sharpness low (blurry): "Hold steady"
- glareRatio high: "Reduce glare / adjust angle"
- confidence low: "Align document inside frame"

## Adaptive Threshold Evolution
- Start confidence threshold at 0.78.
- Increase by 0.02 after each successful capture up to 0.90.
- Decrease by 0.04 after tracking lost for 2+ frames until at baseline.

## Edge Cases
- Multiple quads: choose with highest confidence; if tie prefer larger area.
- Passport open (booklet) may have double width; treat aspect outlier but still allow if area high & glare low.
- Dark documents: rely more on edgeScore + areaScore when brightness < 60.

## Next Steps Checklist
- [ ] Vendor OpenCV iOS & define USE_OPENCV.
- [ ] Implement pixel buffer extraction from VisionCamera Frame.
- [ ] Replace placeholder detection code inside `detectDocumentEdgesJSI` with real pipeline.
- [ ] Add Android OpenCV linking.
- [ ] Implement Android detection + warp.
- [ ] Add guidance overlay component reacting to gating reasons.
- [ ] Add unit test (JS) for adaptive threshold logic (mock inputs).
 - [ ] Integrate iOS Frame Processor plugin (`DocumentFramePlugin.mm`) with actual CVPixelBuffer to RGBA conversion and call pure C++ detector.
 - [ ] Integrate Android Frame Processor plugin (`DocumentFrameProcessorPlugin.java`) extracting YUV planes and converting to RGBA Mat.

