import React, { useEffect } from 'react';
import {RecoilRoot} from 'recoil';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StyleSheet} from 'react-native';

import AppNavigator from '@navigation/AppNavigator';
import ThemeProvider from '@components/ThemeProvider';


// Lightweight diagnostic to confirm OpenCV + plugin availability at runtime.
function runDocumentProcessorDiagnostics() {
  try {
    // @ts-ignore access global set by JSI installer
    const ns = global.__DocumentProcessor;
    // @ts-ignore access VisionCamera frame processor plugin symbol if registered
    const plugin = global.detectDocumentEdges;
    const diagnostics: Record<string, any> = {
      hasJSINamespace: !!ns,
      hasNativeDetect: !!(ns && ns.detectDocumentEdges),
      hasWarp: !!(ns && ns.warpAndCropDocument),
      hasPluginGlobal: typeof plugin === 'function'
    };
    // Probe OpenCV path indirectly: create a fake frame object with width/height and see if extra metrics returned.
    if (diagnostics.hasNativeDetect) {
      try {
        const probe = ns.detectDocumentEdges({ width: 640, height: 400 });
        diagnostics.nativeDetectReturnsMetrics = !!(probe && typeof probe.confidence === 'number' && probe.sharpness !== undefined);
      } catch {}
    }
    // eslint-disable-next-line no-console
    console.log('[DocumentProcessor][Diagnostics]', diagnostics);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[DocumentProcessor][Diagnostics] Failed', e);
  }
}



// Attempt to install native document processor JSI early.
function useInstallDocumentProcessor() {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native').NativeModules.DocumentProcessorInstaller;
      if (mod && mod.install) {
        const ok = mod.install();
        if (!ok) {
          // eslint-disable-next-line no-console
          console.warn('DocumentProcessor JSI install returned false (placeholder or missing)');
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('DocumentProcessor installer not available', e);
    }
    // Run diagnostics shortly after install attempt (give JSI a tick)
    setTimeout(runDocumentProcessorDiagnostics, 500);
  }, []);
}

const App = (): JSX.Element => {
  useInstallDocumentProcessor();
  return (
    <RecoilRoot>
      <ThemeProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.container}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ThemeProvider>
    </RecoilRoot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;