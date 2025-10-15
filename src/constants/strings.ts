// Application strings
export const STRINGS = {
  // App Info
  appName: 'Verry.ai',
  appTagline: 'Secure Identity Verification',
  
  // Common
  common: {
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    done: 'Done',
    continue: 'Continue',
    cancel: 'Cancel',
    retry: 'Retry',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
  },
  
  // Authentication
  auth: {
    emailVerification: 'Email Verification',
    emailPlaceholder: 'Enter your email address',
    emailLabel: 'Email Address',
    sendCode: 'Send Verification Code',
    verificationCode: 'Verification Code',
    codePlaceholder: 'Enter 6-digit code',
    resendCode: 'Resend Code',
    verifyEmail: 'Verify Email',
    emailSent: 'Verification code sent to your email',
    invalidEmail: 'Please enter a valid email address',
    invalidCode: 'Invalid verification code',
    codeExpired: 'Verification code has expired',
    emailVerified: 'Email verified successfully!',
  },
  
  // Document Verification
  document: {
    documentVerification: 'Document Verification',
    uploadDocument: 'Upload Document',
    frontSide: 'Front Side',
    backSide: 'Back Side',
    takePicture: 'Take Picture',
    retakePicture: 'Retake Picture',
    frontIdTitle: 'Scan Front of ID',
    backIdTitle: 'Scan Back of ID',
    frontIdInstruction: 'Position your ID within the frame and tap to capture',
    backIdInstruction: 'Flip your ID and position the back within the frame',
    documentCaptured: 'Document captured successfully',
    documentError: 'Error capturing document',
    documentRequired: 'Please capture both sides of your document',
    processingDocument: 'Processing document...',
  },
  
  // Document Verification Screen
  documentVerification: {
    scanFrontTitle: 'Scan Front of ID',
    scanBackTitle: 'Scan Back of ID', 
    scanFrontSubtitle: 'Position the front of your ID document in good lighting and tap "Scan Document" to begin.',
    scanBackSubtitle: 'Now position the back of your ID document and tap "Scan Document" to complete verification.',
  },
  
  // Facial Recognition
  face: {
    facialVerification: 'Facial Verification',
    positionFace: 'Position Your Face',
    faceInstruction: 'Look directly at the camera and keep your face within the circle',
    faceDetected: 'Face detected',
    faceNotDetected: 'No face detected',
    faceCapturing: 'Capturing...',
    faceCaptured: 'Face captured successfully',
    faceError: 'Error capturing face',
    processingFace: 'Processing facial data...',
    faceVerified: 'Facial verification complete!',
    lookStraight: 'Look straight at the camera',
    moveCloser: 'Move closer to the camera',
    moveFurther: 'Move further from the camera',
  },
  
  // Navigation
  navigation: {
    home: 'Home',
    verification: 'Verification',
    profile: 'Profile',
    settings: 'Settings',
  },
  
  // Errors
  errors: {
    networkError: 'Network error. Please check your connection.',
    cameraPermission: 'Camera permission is required',
    cameraNotAvailable: 'Camera not available',
    serverError: 'Server error. Please try again.',
    unexpectedError: 'An unexpected error occurred',
    timeoutError: 'Request timeout. Please try again.',
  },
  
  // Success Messages
  success: {
    verificationComplete: 'Verification completed successfully!',
    documentUploaded: 'Document uploaded successfully',
    profileUpdated: 'Profile updated successfully',
    thanks: 'Thanks for submitting your documents we\'ll verify it and complete your KYC as soon as possible.',
    kycComplete: 'KYC Completed',
  },
  
  // Settings
  settings: {
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemMode: 'System',
    notifications: 'Notifications',
    privacy: 'Privacy',
    about: 'About',
    version: 'Version',
    logout: 'Logout',
  },
  
  // Onboarding
  onboarding: {
    welcome: 'Welcome to Verry.ai',
    step1Title: 'Secure Email Verification',
    step1Description: 'Verify your identity with a secure email verification process',
    step2Title: 'Document Scanning',
    step2Description: 'Scan your government-issued ID with our advanced camera technology',
    step3Title: 'Facial Recognition',
    step3Description: 'Complete verification with secure facial recognition',
    getStarted: 'Get Started',
  },
} as const;