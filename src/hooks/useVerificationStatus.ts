import {useCallback} from 'react';
import {useRecoilState, useSetRecoilState} from 'recoil';
import {verificationStatusState, attemptIdState} from '../store/atoms';
import {verificationService} from '../services/verificationService';
import type {ApiError} from '../services/verificationService';

export const useVerificationStatus = () => {
  const [statusState, setStatusState] = useRecoilState(verificationStatusState);
  const setAttemptId = useSetRecoilState(attemptIdState);

  const checkVerificationStatus = useCallback(async (verificationId: string, attemptId: string) => {
    setStatusState(prev => ({
      ...prev,
      status: 'loading',
      error: null,
    }));

    try {
      const response = await verificationService.getVerificationStatus(verificationId);
      
      setStatusState({
        status: response.success ? 'success' : 'error',
        hasAttemptId: response.verification_attempts && response.verification_attempts.filter(a => a.id === attemptId).length > 0 ? true : false,
        error: null,
      });

      return {
        success: response.success,
        hasAttemptId: response.verification_attempts && response.verification_attempts.filter(a => a.id === attemptId).length > 0 ? true : false,
        data: response.success ? response : null,
        error: response.success ? null : 'Unknown error',
      };
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Failed to check verification status';
      
      setStatusState({
        status: 'error',
        hasAttemptId: false,
        error: errorMessage,
      });

      return {
        success: false,
        hasAttemptId: false,
        error: errorMessage,
      };
    }
  }, [setStatusState, setAttemptId]);

  const resetStatus = useCallback(() => {
    setStatusState({
      status: 'idle',
      hasAttemptId: false,
      error: null,
    });
  }, [setStatusState]);

  return {
    statusState,
    checkVerificationStatus,
    resetStatus,
    isLoading: statusState.status === 'loading',
    hasError: statusState.status === 'error',
    error: statusState.error,
  };
};