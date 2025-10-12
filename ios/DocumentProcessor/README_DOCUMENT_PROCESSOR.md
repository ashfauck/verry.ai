# Document Processor Native Module (iOS)

This folder contains a minimal JSI-based scaffold for document detection & perspective correction.
Currently detection returns a synthetic centered rectangle; perspective warp is only active if OpenCV
is manually provided and the `USE_OPENCV` compile flag is set.

## Why No CocoaPod
The public pods `OpenCV` / `OpenCV2` are either unavailable for the required version or unreliable in
recent RN + new-architecture combinations. We fall back to a vendored framework approach.

## Add OpenCV Manually
1. Download the official iOS OpenCV release (e.g. https://github.com/opencv/opencv/releases) -> choose the `opencv-4.x.x-ios-framework.zip`.
2. Unzip and drag `opencv2.framework` or `opencv2.xcframework` into the Xcode project (recommend placing under `ios/ThirdParty/OpenCV`).
   - In the add dialog: Check 'Copy items if needed' and add to the `VerryApp` target.
3. In Xcode project Build Settings for `VerryApp`:
   - Header Search Paths: add `$(PROJECT_DIR)/ThirdParty/OpenCV/**` (recursive).
   - Other Linker Flags: (usually none required, but if using non-modular frameworks add `-ObjC`).
4. Define a preprocessor macro `USE_OPENCV=1`:
   - Build Settings -> `Other C Flags` or `Swift Compiler - Custom Flags` (for ObjC++) add `-DUSE_OPENCV` for Debug & Release.

## Enabling the Warp
With `USE_OPENCV` defined, `DocumentProcessor.mm` compiles the warp logic:
- `warpAndCropDocument(imagePath, corners)` performs a perspective transform and writes a JPEG to tmp.
- Returns `{ uri, width, height }`.

If `USE_OPENCV` is NOT defined:
- Function returns the original image (no-op) so the JS side still works.

## Future: Real Detection
Detection should move from placeholder to real contour-based logic:
1. Access raw frame buffers via a VisionCamera Frame Processor plugin (C++). 
2. Convert YUV -> grayscale, blur, Canny edges.
3. `findContours`, filter by area & aspect ratio, `approxPolyDP` to quadrilaterals.
4. Rank by rectangularity & edge sharpness.
5. Return best quad with confidence.

## JSI Installation
`InstallDocumentProcessorRuntime` is called in `AppDelegate.swift` (best-effort). For robustness you can:
- Move installation to a dedicated TurboModule initializer.
- Or wrap inside a VisionCamera plugin setup call if integrating deeper.

## Android Parity
A matching JNI + C++ implementation should:
- Use `AAssetManager` or direct file path for image loading (or OpenCV imread if path accessible).
- Provide identical JS API shape.

## Troubleshooting
| Problem | Cause | Fix |
|--------|-------|-----|
| Warp always returns original | OpenCV not compiled | Add framework + define `USE_OPENCV` |
| Build fails: opencv2/opencv.hpp not found | Missing framework path | Add framework to project & header search path |
| App crash on install | Runtime pointer access changed in RN version | Adjust installer to new runtime retrieval method |

## Next Steps
- Implement real detection (can supply C++ template next).
- Add glare/blur scoring and dynamic confidence.
- Optimize warp with ROI pre-crop.

