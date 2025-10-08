import Config from 'react-native-config';

export interface VerificationStatusResponse {
  verification_id: string;
  status: string;
  attempt_id?: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
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

    if (!this.apiKey || !this.clientId) {
      console.warn('Verry.ai API credentials not configured properly');
    }
  }

  async getVerificationStatus(verificationId: string): Promise<VerificationStatusResponse> {
    try {
      const url = `${this.baseUrl}/functions/v1/verification-status/${verificationId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'x-client-id': this.clientId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      return data as VerificationStatusResponse;
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

  hasAttemptId(response: VerificationStatusResponse): boolean {
    return Array.isArray(response.attempt_id) && response.attempt_id.length > 0;
  }
}

export const verificationService = new VerificationService();