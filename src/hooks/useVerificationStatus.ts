import {useCallback} from 'react';
import {useRecoilState, useSetRecoilState} from 'recoil';
import {verificationStatusState, attemptIdState} from '../store/atoms';
import {verificationService} from '../services/verificationService';
import type {ApiError} from '../services/verificationService';

export const useVerificationStatus = () => {
  const [statusState, setStatusState] = useRecoilState(verificationStatusState);
  const setAttemptId = useSetRecoilState(attemptIdState);

  const checkVerificationStatus = useCallback(async (verificationId: string) => {
    setStatusState(prev => ({
      ...prev,
      status: 'loading',
      error: null,
    }));

    try {
      const response = await verificationService.getVerificationStatus(verificationId);
      const hasAttemptId = verificationService.hasAttemptId(response);
      
      // If API response contains attempt_id, store the first one in state
      if (hasAttemptId && response.attempt_id && response.attempt_id.length > 0) {
        setAttemptId(response.attempt_id[0]);
      }
      
      setStatusState({
        status: 'success',
        hasAttemptId,
        error: null,
      });

      return {
        success: true,
        hasAttemptId,
        data: response,
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