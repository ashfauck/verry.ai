package com.verryapp.document;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;

import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;

/** Placeholder installer – in a production setup you'd create a C++ JSI binding for performance. */
public class DocumentProcessorInstaller extends ReactContextBaseJavaModule {
  public DocumentProcessorInstaller(ReactApplicationContext ctx) { super(ctx); }

  static {
    try {
      System.loadLibrary("document-processor");
    } catch (Throwable t) {
      // Ignored; will fall back to JS side detection (none) if native load fails.
    }
  }

  private static native void installNative(long jsContextPtr);

  @Override
  public String getName() { return "DocumentProcessorInstaller"; }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();
    if (jsContext == null || jsContext.get() == 0) return false;
    try {
      installNative(jsContext.get());
      return true; // success
    } catch (Throwable t) {
      // Could log to Logcat if needed: Log.w("DocumentProcessorInstaller","Failed to install JSI", t);
      return false;
    }
  }
}
