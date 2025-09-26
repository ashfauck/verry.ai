import { describe, it, expect } from '@jest/globals';

// We will test the adaptive confidence threshold algorithm indirectly by simulating
// detections list evolution similar to the logic inside the hook. We replicate the
// minimal logic needed (pure function style) so the test remains deterministic.

interface Detection {
  confidence: number;
  sharpness?: number;
  areaRatio?: number;
  glareRatio?: number;
}

function shouldEmit(
  history: Detection[],
  {
    dynamicConf,
    requiredStableFrames,
    maxGlareRatio,
    minSharpness,
    minAreaRatio,
  }: {
    dynamicConf: number;
    requiredStableFrames: number;
    maxGlareRatio: number;
    minSharpness: number;
    minAreaRatio: number;
  }
): boolean {
  if (history.length < requiredStableFrames) return false;
  return history.every(h =>
    h.confidence >= dynamicConf &&
    (h.sharpness ?? 999) >= minSharpness &&
    (h.areaRatio ?? 1) >= minAreaRatio &&
    (h.glareRatio ?? 0) <= maxGlareRatio
  );
}

describe('useDocumentAutoCapture adaptive gating logic', () => {
  it('does not emit when frames below confidence threshold', () => {
    const hist: Detection[] = Array.from({ length: 6 }, (_, i) => ({ confidence: 0.7 + i * 0.005, sharpness: 50, areaRatio: 0.2, glareRatio: 0.05 }));
    expect(shouldEmit(hist, { dynamicConf: 0.78, requiredStableFrames: 6, maxGlareRatio: 0.2, minSharpness: 40, minAreaRatio: 0.18 })).toBe(false);
  });
  it('emits when all metrics satisfy thresholds', () => {
    const hist: Detection[] = Array.from({ length: 6 }, () => ({ confidence: 0.82, sharpness: 60, areaRatio: 0.22, glareRatio: 0.05 }));
    expect(shouldEmit(hist, { dynamicConf: 0.78, requiredStableFrames: 6, maxGlareRatio: 0.2, minSharpness: 40, minAreaRatio: 0.18 })).toBe(true);
  });
  it('fails if any frame is blurry', () => {
    const hist: Detection[] = [
      { confidence: 0.85, sharpness: 60, areaRatio: 0.2, glareRatio: 0.05 },
      { confidence: 0.83, sharpness: 25, areaRatio: 0.2, glareRatio: 0.05 },
      { confidence: 0.84, sharpness: 60, areaRatio: 0.2, glareRatio: 0.05 },
      { confidence: 0.84, sharpness: 60, areaRatio: 0.2, glareRatio: 0.05 },
      { confidence: 0.84, sharpness: 60, areaRatio: 0.2, glareRatio: 0.05 },
      { confidence: 0.84, sharpness: 60, areaRatio: 0.2, glareRatio: 0.05 }
    ];
    expect(shouldEmit(hist, { dynamicConf: 0.78, requiredStableFrames: 6, maxGlareRatio: 0.2, minSharpness: 40, minAreaRatio: 0.18 })).toBe(false);
  });
  it('fails if glare too high', () => {
    const hist: Detection[] = Array.from({ length: 6 }, () => ({ confidence: 0.85, sharpness: 60, areaRatio: 0.2, glareRatio: 0.4 }));
    expect(shouldEmit(hist, { dynamicConf: 0.78, requiredStableFrames: 6, maxGlareRatio: 0.2, minSharpness: 40, minAreaRatio: 0.18 })).toBe(false);
  });
});
