// Global type declarations for VisionCamera and related types
// This file resolves TypeScript errors related to VisionCamera frame processors

declare module 'react-native-vision-camera' {
  export interface FrameProcessorPluginBase {
    // Base interface for frame processor plugins
  }
  
  export interface ReadonlyFrameProcessor {
    // Readonly frame processor interface
  }
  
  export interface DrawableFrameProcessor {
    // Drawable frame processor interface
  }
}

declare module 'react-native-reanimated' {
  export function runOnJS<Args extends any[], Return>(
    fn: (...args: Args) => Return
  ): (...args: Args) => void;
}

// Worklet directive type
declare global {
  interface WorkletFunction {
    'worklet': true;
  }
}

export {};