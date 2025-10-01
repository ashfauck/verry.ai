import Config from 'react-native-config';

export interface EnvironmentConfig {
  nodeEnv: string;
  apiBaseUrl: string;
  apiVersion: string;
  apiTimeout: number;
  documentScannerQuality: number;
  documentScannerMaxDocuments: number;
  faceDetectionConfidence: number;
  faceCaptureTimeout: number;
  defaultTheme: 'light' | 'dark';
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableFlipper: boolean;
  metroPort: number;
  cameraQuality: 'low' | 'medium' | 'high';
  cameraFlashMode: 'on' | 'off' | 'auto';
  analyticsEnabled: boolean;
  analyticsApiKey: string;
  errorReportingEnabled: boolean;
  sentryDsn: string;
  certificatePinning?: boolean;
  sslVerify?: boolean;
}

const environment: EnvironmentConfig = {
  nodeEnv: Config.NODE_ENV || 'development',
  apiBaseUrl: Config.API_BASE_URL || 'https://dev-api.verry.ai',
  apiVersion: Config.API_VERSION || 'v1',
  apiTimeout: parseInt(Config.API_TIMEOUT || '30000', 10),
  documentScannerQuality: parseInt(Config.DOCUMENT_SCANNER_QUALITY || '80', 10),
  documentScannerMaxDocuments: parseInt(Config.DOCUMENT_SCANNER_MAX_DOCUMENTS || '1', 10),
  faceDetectionConfidence: parseFloat(Config.FACE_DETECTION_CONFIDENCE || '0.8'),
  faceCaptureTimeout: parseInt(Config.FACE_CAPTURE_TIMEOUT || '30000', 10),
  defaultTheme: (Config.DEFAULT_THEME as 'light' | 'dark') || 'light',
  debugMode: Config.DEBUG_MODE === 'true',
  logLevel: (Config.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'debug',
  enableFlipper: Config.ENABLE_FLIPPER === 'true',
  metroPort: parseInt(Config.METRO_PORT || '8081', 10),
  cameraQuality: (Config.CAMERA_QUALITY as 'low' | 'medium' | 'high') || 'medium',
  cameraFlashMode: (Config.CAMERA_FLASH_MODE as 'on' | 'off' | 'auto') || 'off',
  analyticsEnabled: Config.ANALYTICS_ENABLED === 'true',
  analyticsApiKey: Config.ANALYTICS_API_KEY || '',
  errorReportingEnabled: Config.ERROR_REPORTING_ENABLED === 'true',
  sentryDsn: Config.SENTRY_DSN || '',
  certificatePinning: Config.CERTIFICATE_PINNING === 'true',
  sslVerify: Config.SSL_VERIFY === 'true',
};

export default environment;

// Helper functions for common environment checks
export const isDevelopment = (): boolean => environment.nodeEnv === 'development';
export const isProduction = (): boolean => environment.nodeEnv === 'production';
export const isDebugMode = (): boolean => environment.debugMode;

// API URL builder
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = environment.apiBaseUrl.endsWith('/') 
    ? environment.apiBaseUrl.slice(0, -1) 
    : environment.apiBaseUrl;
  const version = environment.apiVersion;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}/${version}${cleanEndpoint}`;
};

// Logger configuration based on environment
export const getLogLevel = (): string => environment.logLevel;
export const shouldLog = (level: string): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(environment.logLevel);
  const requestedLevelIndex = levels.indexOf(level);
  
  return requestedLevelIndex >= currentLevelIndex;
};