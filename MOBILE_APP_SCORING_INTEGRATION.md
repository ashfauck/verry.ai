# Mobile App Scoring API Integration

## Overview
Integrated the mobile-app-scoring API across all verification stages to track user progress asynchronously without blocking the user flow.

## API Details
- **Endpoint**: `POST /functions/v1/mobile-app-scoring`
- **Authentication**: 
  - `x-api-key`: `ak_7de890fa1b8649dbb7b3d554`
  - `x-client-id`: `cli_4mtqfircysno`
- **Stages**: `email`, `document`, `face`, `final`

## Implementation Summary

### 1. API Service (`src/services/apiService.ts`)
Added new types and method:
- **Types**:
  - `MobileAppScoringRequest`: Contains `verification_id`, `attempt_id`, and `stage`
  - `MobileAppScoringResponse`: API response structure
- **Method**: 
  - `scoreMobileAppStage()`: Sends scoring data to the API

### 2. Email Verification Screen (`src/screens/EmailVerificationScreen.tsx`)
- **Trigger Point**: After successful email code verification
- **Stage**: `email`
- **Implementation**: Fires async API call immediately after verification succeeds, extracting `verification_id` from the response
- **Error Handling**: Logs warning on failure, doesn't block navigation

### 3. Document Capture Screen (`src/screens/DocumentCaptureScreen.tsx`)
- **Trigger Point**: After successful document upload (front and back)
- **Stage**: `document`
- **Implementation**: Fires async API call after all document verification records are uploaded successfully
- **Error Handling**: Logs warning on failure, doesn't block navigation

### 4. Face Verification Screen (`src/screens/FaceVerificationScreen.tsx`)
- **Trigger Point**: After successful face image upload and verification
- **Stage**: `face`
- **Implementation**: Fires async API call after face document verification completes
- **Error Handling**: Logs warning on failure, doesn't block navigation

### 5. Home Screen (`src/screens/HomeScreen.tsx`)
- **Trigger Point**: When user reaches the completion screen (HomeScreen mounts)
- **Stage**: `final`
- **Implementation**: Uses React `useEffect` hook to fire API call once when component mounts
- **Prevents Duplicate Calls**: Uses `hasScoredFinal` state to ensure the API is called only once
- **Error Handling**: Logs warning on failure, doesn't affect user experience

## Key Features

### ✅ Asynchronous Execution
All scoring API calls are fire-and-forget:
```typescript
apiService.scoreMobileAppStage({
  verification_id: verificationId,
  attempt_id: attemptId,
  stage: 'email', // or 'document', 'face', 'final'
}).catch(error => {
  console.warn('Stage scoring failed:', error);
  // Don't block user flow on scoring failure
});
```

### ✅ Non-Blocking
- User navigation proceeds immediately
- API failures are logged but don't interrupt the verification flow
- No loading states or user-facing errors for scoring failures

### ✅ Proper Timing
- Email stage: Immediately after code verification succeeds
- Document stage: After both front and back documents are uploaded
- Face stage: After face image is uploaded and verified
- Final stage: When user reaches the completion screen

### ✅ Data Flow
Each stage receives:
- `verification_id`: From the API response or Recoil state
- `attempt_id`: From Recoil state (generated at onboarding start)
- `stage`: Hardcoded per screen

## Testing Checklist

- [ ] Email verification triggers `email` stage scoring
- [ ] Document upload triggers `document` stage scoring
- [ ] Face verification triggers `face` stage scoring
- [ ] HomeScreen mount triggers `final` stage scoring
- [ ] API failures don't block user flow
- [ ] Scoring calls are made only once per stage
- [ ] Correct `verification_id` and `attempt_id` are passed

## Example API Response
```json
{
  "success": true,
  "message": "Email stage scoring completed successfully",
  "data": {
    "verification_id": "ver_b40e20b943e9d3b70816",
    "attempt_id": "5e79ab60-6dbd-48cc-a8f9-ca4546c57a1d",
    "stage": "email",
    "email_verification_score": 100,
    "email_verification_status": "completed",
    "onboarding_channel": "mobile"
  }
}
```

## Files Modified
1. `src/services/apiService.ts` - Added API method and types
2. `src/screens/EmailVerificationScreen.tsx` - Email stage scoring
3. `src/screens/DocumentCaptureScreen.tsx` - Document stage scoring
4. `src/screens/FaceVerificationScreen.tsx` - Face stage scoring
5. `src/screens/HomeScreen.tsx` - Final stage scoring

## Notes
- All API calls use default credentials defined in the service method
- Scoring is purely for backend analytics and doesn't affect app functionality
- The implementation follows the existing error handling patterns in the app
