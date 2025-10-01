# Environment Configuration Guide

## Overview
Verry.ai now supports multiple environment configurations for development, production, and local testing. This system allows you to manage different settings for API endpoints, logging levels, feature toggles, and more.

## Environment Files

### `.env` (Default)
- Used when no specific ENVFILE is set
- Points to development configuration by default
- Safe to commit to version control

### `.env.development`
- Development environment settings
- Lower quality settings for faster development
- Debug logging enabled
- Analytics and error reporting disabled
- Safe to commit to version control

### `.env.production`
- Production environment settings
- High quality settings
- Minimal logging (errors only)
- Analytics and error reporting enabled
- Certificate pinning and SSL verification enabled
- Safe to commit to version control

### `.env.local.example`
- Template for local development
- Copy to `.env.local` for personal local settings
- Never commit `.env.local` files

## Configuration Structure

### API Settings
```
API_BASE_URL=https://dev-api.verry.ai    # API endpoint
API_VERSION=v1                           # API version
API_TIMEOUT=30000                        # Request timeout (ms)
```

### Document Scanner
```
DOCUMENT_SCANNER_QUALITY=80              # Image quality (1-100)
DOCUMENT_SCANNER_MAX_DOCUMENTS=1         # Max documents per scan
```

### Face Verification
```
FACE_DETECTION_CONFIDENCE=0.8            # Detection confidence (0-1)
FACE_CAPTURE_TIMEOUT=30000               # Capture timeout (ms)
```

### Debug & Logging
```
DEBUG_MODE=true                          # Enable debug features
LOG_LEVEL=debug                          # debug, info, warn, error
ENABLE_FLIPPER=true                      # Enable Flipper debugging
```

### Analytics & Reporting
```
ANALYTICS_ENABLED=false                  # Enable analytics tracking
ERROR_REPORTING_ENABLED=false            # Enable error reporting
SENTRY_DSN=                             # Sentry DSN for error reporting
```

## Usage

### Running with Specific Environment

#### Development Environment
```bash
npm run start:dev     # Start Metro with development config
npm run ios:dev       # Run iOS with development config  
npm run android:dev   # Run Android with development config
```

#### Production Environment
```bash
npm run start:prod    # Start Metro with production config
npm run ios:prod      # Run iOS with production config
npm run android:prod  # Run Android with production config
```

#### Default Environment
```bash
npm start             # Uses .env (development by default)
npm run ios           # Uses .env (development by default)
npm run android       # Uses .env (development by default)
```

### Using Environment in Code

#### Import the environment configuration
```typescript
import environment, {
  isDevelopment,
  isProduction,
  buildApiUrl,
  shouldLog
} from '../config/environment';
```

#### Access configuration values
```typescript
// API configuration
const apiUrl = buildApiUrl('/auth/login');
const timeout = environment.apiTimeout;

// Document scanner settings
const quality = environment.documentScannerQuality;
const maxDocs = environment.documentScannerMaxDocuments;

// Environment checks
if (isDevelopment()) {
  // Development-only code
}

if (isProduction()) {
  // Production-only code
}
```

#### Logging with environment awareness
```typescript
import {logger} from '../utils/logger';

// Automatic log level filtering based on environment
logger.debug('Debug message');     // Only shows in debug/development
logger.info('Info message');       // Shows in info+ levels
logger.warn('Warning message');    // Shows in warn+ levels
logger.error('Error message');     // Always shows

// Specialized logging
logger.documentScan.start('front');
logger.api.request('POST', '/auth/login');
logger.navigation.navigate('DocumentCapture');
```

## Services Integration

### API Service
The `ApiService` automatically uses environment configuration:
```typescript
import {apiService} from '../services/apiService';

// Automatically uses correct API URL and timeout
const result = await apiService.sendVerificationEmail(email);
```

### Document Scanner
DocumentCaptureScreen now uses environment settings:
- Quality settings from `DOCUMENT_SCANNER_QUALITY`
- Max documents from `DOCUMENT_SCANNER_MAX_DOCUMENTS`
- Automatic logging based on `LOG_LEVEL`

## Development Tools

### Environment Info Screen
- Available in development mode only
- Shows all current configuration values
- Navigate from Home screen → "Environment Configuration"
- Useful for debugging configuration issues

### Logging
- Automatic log filtering based on environment
- Structured logging for different components
- Performance monitoring in debug mode

## Best Practices

### 1. Environment-Specific Settings
- **Development**: Lower quality, more logging, faster iteration
- **Production**: High quality, minimal logging, security features enabled

### 2. Sensitive Data
- Never put secrets in environment files that are committed to git
- Use `.env.local` for personal sensitive data
- Use secure storage for production secrets

### 3. Feature Toggles
- Use environment variables to enable/disable features
- Test with both development and production configurations

### 4. Logging Strategy
- Use appropriate log levels for different environments
- Debug logging only in development
- Error reporting only in production

## Troubleshooting

### Environment Not Loading
1. Check that `react-native-config` is properly installed
2. Verify the ENVFILE path is correct
3. Restart Metro bundler after changing environment files

### Configuration Not Updating
1. Clean and rebuild the project
2. Clear Metro cache: `npx react-native start --reset-cache`
3. For iOS: `cd ios && pod install`

### Missing Configuration Values
1. Check that all required variables are defined in your .env file
2. Verify the environment file is being loaded correctly
3. Use the EnvironmentInfoScreen to debug current values

## Migration from Hardcoded Values

When migrating existing hardcoded configuration:

1. **Identify hardcoded values** in your components
2. **Add them to environment files** with appropriate defaults
3. **Update code** to use `environment.configName`
4. **Test with both** development and production configurations
5. **Update documentation** for new configuration options

## Security Considerations

- ✅ **Safe to commit**: .env, .env.development, .env.production, .env.local.example
- ❌ **Never commit**: .env.local, .env.development.local, .env.production.local
- 🔐 **Production secrets**: Use secure deployment tools, not environment files
- 📝 **API Keys**: Use different keys for different environments
- 🛡️ **Certificate Pinning**: Enable only in production