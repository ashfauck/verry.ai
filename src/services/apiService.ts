import environment, {buildApiUrl, shouldLog} from '../config/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ApiService {
  private baseTimeout = environment.apiTimeout;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    
    if (shouldLog('debug')) {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.baseTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (shouldLog('debug')) {
        console.log(`API Response: ${response.status}`, responseData);
      }

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `HTTP Error: ${response.status}`,
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (shouldLog('error')) {
        console.error('API Error:', error);
      }

      if (environment.errorReportingEnabled) {
        // Send error to reporting service
        // e.g., Sentry.captureException(error);
      }

      return {
        success: false,
        error: error.name === 'AbortError' 
          ? 'Request timeout' 
          : error.message || 'Network error',
      };
    }
  }

  // Email Verification
  async sendVerificationEmail(email: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(email: string, code: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  // Document Verification
  async uploadDocument(
    documentData: {
      frontImage: string;
      backImage: string;
      documentType: string;
    }
  ): Promise<ApiResponse> {
    return this.makeRequest('/verification/document', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  }

  // Face Verification
  async uploadFaceImage(imageData: string): Promise<ApiResponse> {
    return this.makeRequest('/verification/face', {
      method: 'POST',
      body: JSON.stringify({ image: imageData }),
    });
  }

  // Verification Status
  async getVerificationStatus(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/verification/status/${userId}`);
  }

  // Analytics (if enabled)
  async trackEvent(event: string, data: any): Promise<void> {
    if (!environment.analyticsEnabled) {
      return;
    }

    try {
      await this.makeRequest('/analytics/track', {
        method: 'POST',
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
          apiKey: environment.analyticsApiKey,
        }),
      });
    } catch (error) {
      if (shouldLog('warn')) {
        console.warn('Analytics tracking failed:', error);
      }
    }
  }
}

export const apiService = new ApiService();
export default apiService;