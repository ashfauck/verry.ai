# Global API Loader Implementation

## Overview
Implemented a centralized, full-screen blocking loader that appears for all API calls except the scoring API. The loader centers on the screen and prevents user interactions while API requests are in progress.

## Architecture

### 1. Global Loading State (`src/store/atoms.ts`)
Uses existing Recoil atom for managing global loading state:
```typescript
export const globalLoadingState = atom<boolean>({
  key: 'globalLoadingState',
  default: false,
});
```

### 2. Loader Controller (`src/utils/loaderController.ts`)
A singleton controller that allows non-React code (like apiService) to control the loading state:
```typescript
class LoaderController {
  private setLoading: SetterOrUpdater<boolean> | null = null;

  setLoadingSetter(setter: SetterOrUpdater<boolean>) {
    this.setLoading = setter;
  }

  show() {
    if (this.setLoading) {
      this.setLoading(true);
    }
  }

  hide() {
    if (this.setLoading) {
      this.setLoading(false);
    }
  }
}
```

### 3. Global API Loader Component (`src/components/GlobalApiLoader.tsx`)
A Modal-based loader component that:
- ✅ Covers the entire screen with a semi-transparent overlay
- ✅ Centers a loading spinner with text
- ✅ Blocks all UI interactions when visible
- ✅ Registers itself with the LoaderController on mount
- ✅ Uses theme colors for consistent styling

Key Features:
- Uses React Native Modal with `transparent={true}` for full-screen coverage
- `onRequestClose` is empty to prevent dismissal
- Activity indicator shows "Processing... Please wait"
- Automatically hidden when no API calls are active

### 4. API Service Integration (`src/services/apiService.ts`)
Modified the `makeRequest` method to:
- Accept a `skipLoader` parameter (default: `false`)
- Show loader at the start of each request (unless `skipLoader` is `true`)
- Hide loader on success or error
- Skip loader for scoring API calls

```typescript
private async makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipLoader: boolean = false
): Promise<ApiResponse<T>> {
  // Show loader for all API calls except when skipLoader is true
  if (!skipLoader) {
    loaderController.show();
  }
  
  try {
    // ... API call logic
    
    // Hide loader on response
    if (!skipLoader) {
      loaderController.hide();
    }
    
    return response;
  } catch (error) {
    // Hide loader on error
    if (!skipLoader) {
      loaderController.hide();
    }
    
    throw error;
  }
}
```

**Scoring API Configuration:**
```typescript
async scoreMobileAppStage(...): Promise<ApiResponse<MobileAppScoringResponse>> {
  // Skip loader for scoring API - it's a background call
  return this.makeRequest<MobileAppScoringResponse>('mobile-app-scoring', {
    method: 'POST',
    headers: {...},
    body: JSON.stringify(req),
  }, true); // skipLoader = true
}
```

### 5. App Integration (`App.tsx`)
Added GlobalApiLoader to the root component:
```tsx
<RecoilRoot>
  <ThemeProvider>
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <SnackbarController ref={snackbarRef} />
        <NavigationContainer ref={navigationRef} linking={linkingConfig}>
          <AppNavigator />
        </NavigationContainer>
        {/* Global API Loader - appears above all screens */}
        <GlobalApiLoader />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  </ThemeProvider>
</RecoilRoot>
```

### 6. Screen Cleanup
Removed individual `isLoading` and `isProcessing` states from screens:
- ✅ `EmailVerificationScreen.tsx` - Removed `isLoading` state and references
- ✅ `FaceVerificationScreen.tsx` - Removed `isProcessing` state and references
- ✅ Button `loading` props removed (now handled by global loader)
- ✅ Input `editable` conditions simplified (no longer depend on loading state)

## Visual Design

The loader displays:
```
┌─────────────────────────────────────┐
│                                     │
│         ╔═══════════════╗           │
│         ║               ║           │
│         ║   ◯ Spinner   ║           │
│         ║               ║           │
│         ║  Processing...║           │
│         ║  Please wait  ║           │
│         ║               ║           │
│         ╚═══════════════╝           │
│                                     │
└─────────────────────────────────────┘
```

**Styling:**
- Semi-transparent black overlay: `rgba(0, 0, 0, 0.7)`
- Centered card with rounded corners (16px radius)
- Theme-aware background and text colors
- Large activity indicator with primary color
- Shadow/elevation for depth
- Minimum width: 200px
- Padding: 32px

## API Coverage

### APIs with Loader (Blocking UI):
1. ✅ `sendVerificationEmail` - Email verification
2. ✅ `verifyEmailCode` - Code verification
3. ✅ `uploadAttachments` - Document/face image upload
4. ✅ `uploadDocument` - Document verification records
5. ✅ `uploadFaceImage` - Face verification (if used directly)
6. ✅ `getVerificationStatus` - Status checks
7. ✅ `trackEvent` - Analytics (if enabled)

### APIs without Loader (Non-blocking):
1. ✅ `scoreMobileAppStage` - Background scoring API for all stages

## Benefits

### User Experience:
- ✅ **Single source of truth**: One loader for all API calls
- ✅ **Blocks interactions**: Prevents accidental double-submissions
- ✅ **Visual feedback**: Clear indication that processing is happening
- ✅ **Consistent behavior**: Same loading experience across all screens

### Developer Experience:
- ✅ **No manual state management**: Automatic show/hide based on API calls
- ✅ **Less boilerplate**: No need for individual loading states in screens
- ✅ **Easy to maintain**: Centralized loading logic
- ✅ **Selective control**: Can skip loader for specific APIs (e.g., scoring)

### Code Quality:
- ✅ **DRY principle**: Don't Repeat Yourself - one loader implementation
- ✅ **Separation of concerns**: Loading logic separated from business logic
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Theme-aware**: Respects light/dark mode

## Testing Checklist

- [ ] Loader appears during email verification
- [ ] Loader appears during email code verification
- [ ] Loader appears during document upload
- [ ] Loader appears during face verification
- [ ] Loader does NOT appear during scoring API calls
- [ ] Loader blocks all UI interactions when visible
- [ ] Loader hides automatically on success
- [ ] Loader hides automatically on error
- [ ] Loader styling matches theme (light/dark mode)
- [ ] Loader centers properly on all screen sizes
- [ ] Multiple rapid API calls don't cause flickering

## Files Modified

1. ✅ `src/components/GlobalApiLoader.tsx` - New loader component
2. ✅ `src/components/index.ts` - Export loader component
3. ✅ `src/utils/loaderController.ts` - New controller for non-React code
4. ✅ `src/services/apiService.ts` - Integrated loader show/hide
5. ✅ `App.tsx` - Added GlobalApiLoader to root
6. ✅ `src/screens/EmailVerificationScreen.tsx` - Removed individual loading state
7. ✅ `src/screens/FaceVerificationScreen.tsx` - Removed individual loading state

## Files Using Existing State

- `src/store/atoms.ts` - Already had `globalLoadingState` atom (no changes needed)

## Future Enhancements

Potential improvements:
- [ ] Add configurable loader text per API call
- [ ] Add progress indicators for long-running operations
- [ ] Add timeout warnings for slow API calls
- [ ] Add retry UI for failed requests
- [ ] Add animation transitions (fade in/out)
- [ ] Add haptic feedback on show/hide

## Notes

- The loader automatically handles all API calls through the service layer
- Scoring API is explicitly excluded to prevent blocking user flow
- The implementation is backwards compatible with existing code
- No changes needed to existing API call sites (except removing loading props)
- The loader controller pattern allows future expansion for other non-React contexts
