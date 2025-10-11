import Config from 'react-native-config';

export interface VerificationAttempt {
  id: string;
  current_stage: string;
  email_verified: boolean;
  document_scanned: boolean;
  face_verified: boolean;
  overall_status: string;
  verification_score: number;
  created_at: string;
  completed_at?: string;
}

export interface VerificationStatusResponse {
  success: boolean;
  verification_id: string;
  status: string;
  completion_percentage?: number;
  next_steps?: any[];
  customer_data?: Record<string, any>;
  verification_attempts?: VerificationAttempt[];
  created_at: string;
  environment?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class VerificationService {
  private baseUrl: string;
  private apiKey: string;
  private clientId: string;

  constructor() {
    this.baseUrl = Config.API_BASE_URL || 'https://api.verry.ai';
    this.apiKey = Config.VERRY_API_KEY || '';
    this.clientId = Config.VERRY_CLIENT_ID || '';

    console.log("API KEY", this.apiKey, "Config" , Config.VERRY_API_KEY);
    console.log("CLIENT ID", this.clientId, "Config" , Config.VERRY_CLIENT_ID);

    if (!this.apiKey || !this.clientId) {
      console.warn('Verry.ai API credentials not configured properly');
    }
  }

  async getVerificationStatus(verificationId: string): Promise<VerificationStatusResponse> {
    try {
      const url = `${this.baseUrl}/functions/v1/verification-status/${verificationId}`;

      console.log("URL getVerificationStatus:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'x-client-id': this.clientId,
        },
      });

      console.log("Response: getVerificationStatus", response);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code,
          status: response.status,
        } as ApiError;
      }

      const data: VerificationStatusResponse = await response.json();      

      console.log("Response: VerificationStatusResponse", data);

      return {
        ...data
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network')) {
        throw {
          message: 'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR',
        } as ApiError;
      }

      throw error;
    }
  }
}

export const verificationService = new VerificationService();