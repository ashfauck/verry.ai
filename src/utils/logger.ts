import {shouldLog, isDebugMode} from '../config/environment';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, data);
      console.log(formattedMessage);
    }
  }

  info(message: string, data?: any): void {
    if (shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, message, data);
      console.info(formattedMessage);
    }
  }

  warn(message: string, data?: any): void {
    if (shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage(LogLevel.WARN, message, data);
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: any): void {
    if (shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error);
      console.error(formattedMessage);
    }
  }

  // Document Scanner specific logging
  documentScan = {
    start: (side: 'front' | 'back') => {
      this.info(`Starting document scan for ${side} side`);
    },
    success: (side: 'front' | 'back', imagePath: string) => {
      this.info(`Document ${side} captured successfully`, { imagePath });
    },
    error: (side: 'front' | 'back', error: any) => {
      this.error(`Document ${side} scan failed`, error);
    },
    cancel: (side: 'front' | 'back') => {
      this.debug(`Document ${side} scan cancelled by user`);
    },
  };

  // Face verification specific logging
  faceVerification = {
    start: () => {
      this.info('Starting face verification');
    },
    success: (confidence: number) => {
      this.info('Face verification completed', { confidence });
    },
    error: (error: any) => {
      this.error('Face verification failed', error);
    },
  };

  // API specific logging
  api = {
    request: (method: string, url: string, data?: any) => {
      this.debug(`API Request: ${method} ${url}`, data);
    },
    response: (status: number, url: string, data?: any) => {
      this.debug(`API Response: ${status} ${url}`, data);
    },
    error: (url: string, error: any) => {
      this.error(`API Error: ${url}`, error);
    },
  };

  // Navigation specific logging
  navigation = {
    navigate: (screen: string, params?: any) => {
      this.info(`Navigating to ${screen}`, params);
    },
    back: (from: string) => {
      this.info(`Navigating back from ${from}`);
    },
  };

  // Performance logging
  performance = {
    mark: (label: string) => {
      if (isDebugMode()) {
        console.time(label);
      }
    },
    measure: (label: string) => {
      if (isDebugMode()) {
        console.timeEnd(label);
      }
    },
  };
}

export const logger = new Logger();
export default logger;