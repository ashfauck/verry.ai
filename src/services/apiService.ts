// --- Document Upload API Types ---
export interface DocumentUploadRequest {
  image_url: string;
  verification_id: string;
  attempt_id: string;
  document_type: string;
  scan_type: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data: {
    verification_id: string;
    attempt_id: string;
    document_type: string;
    scan_type: string;
    image_url: string;
    file_path: string;
    uploaded_at: string;
    document_record_id: string;
    image_side: string;
  };
}
// --- Attachment Upload Types ---
export interface AttachmentUploadRequest {
  attachments: Array<{
    file: {
      uri: string;
      type: string;
      name: string;
    };
    fileId: string;
    contentType: string;
    metadata?: Record<string, any>;
  }>;
}

export interface AttachmentUploadResult {
  fileId: string;
  attachmentId?: string;
  fileName?: string;
  contentType?: string;
  uploadTime?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
}

export interface AttachmentUploadResponse {
  success: boolean;
  message: string;
  results: AttachmentUploadResult[];
}
// --- Verify Email Code Types ---
export interface VerifyEmailCodeRequest {
  email: string;
  verificationAttemptId: string;
  code: string;
}

export interface VerificationStatus {
  emailVerified: boolean;
  currentStage: string;
  verificationId: string;
}

export interface VerifyEmailCodeResponse {
  success: boolean;
  message: string;
  nextStep: string;
  verificationStatus: VerificationStatus;
}
// --- Email Verification Types ---
export interface SendVerificationEmailRequest {
  email: string;
  verificationAttemptId: string;
}

export interface SendVerificationEmailResponse {
  success: boolean;
  message: string;
  emailId: string;
}
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
      if (options.body) {
        try {
          const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          console.log('Request Body:', parsedBody);
        } catch (e) {
          console.log('Request Body (raw):', options.body);
        }
      }
      if (options.headers) {
        console.log('Request Headers:', options.headers);
      }
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
        console.log(`API Response: ${response.status} ${url}`);
        console.log('Response Data:', responseData);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
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
  /**
   * Sends a verification email using the Verry.ai API.
   * @param email The email address to send verification to.
   * @param verificationAttemptId The attempt ID for tracking verification.
   * @returns ApiResponse with success, message, and emailId.
   */
  async sendVerificationEmail(
    req: SendVerificationEmailRequest,
    apiKey: string = 'ak_39f459c596d049b085071f74',
    clientId: string = 'cli_4mtqfircysno'
  ): Promise<ApiResponse<SendVerificationEmailResponse>> {
    return this.makeRequest<SendVerificationEmailResponse>('send-verification-email', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-client-id': clientId,
      },
      body: JSON.stringify(req),
    });
  }

  /**
   * Verifies the email code using the Verry.ai API.
   * @param req The request body containing email, verificationAttemptId, and code.
   * @param apiKey The API key for authentication.
   * @param clientId The client ID for authentication.
   * @returns ApiResponse with success, message, nextStep, and verificationStatus.
   */
  async verifyEmailCode(
    req: VerifyEmailCodeRequest,
    apiKey: string = 'ak_39f459c596d049b085071f74',
    clientId: string = 'cli_4mtqfircysno'
  ): Promise<ApiResponse<VerifyEmailCodeResponse>> {
    return this.makeRequest<VerifyEmailCodeResponse>('/verify-email-code', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-client-id': clientId,
      },
      body: JSON.stringify(req),
    });
  }

  /**
   * Uploads document images as attachments using FormData.
   */
  async uploadAttachments(
    req: AttachmentUploadRequest,
    apiKey: string = 'ak_39f459c596d049b085071f74',
    clientId: string = 'cli_4mtqfircysno'
  ): Promise<ApiResponse<AttachmentUploadResponse>> {
    const formData = new FormData();
    req.attachments.forEach((att, idx) => {
      formData.append(`attachments[${idx}].file`, att.file);
      formData.append(`attachments[${idx}].fileId`, att.fileId);
      formData.append(`attachments[${idx}].contentType`, att.contentType);
      if (att.metadata) {
        formData.append(`attachments[${idx}].metadata`, JSON.stringify(att.metadata));
      }
    });
    return this.makeRequest<AttachmentUploadResponse>('attachments-upload', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-client-id': clientId,
        'Accept': 'application/json',
      },
      body: formData,
    });
  }

  // Document Verification
  async uploadDocument(
    req: DocumentUploadRequest,
    apiKey: string = 'ak_39f459c596d049b085071f74',
    clientId: string = 'cli_4mtqfircysno'
  ): Promise<ApiResponse<DocumentUploadResponse>> {
    return this.makeRequest<DocumentUploadResponse>('upload-verification-image', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
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