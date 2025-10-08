/**
 * Test the verification API integration
 * Run with: cd /Users/ashfauck/Development/Projects/Personal/Verry.ai && npx ts-node testVerificationAPI.ts
 */

import { verificationService } from './src/services/verificationService';

async function testVerificationAPI() {
  console.log('🧪 Testing Verification API Integration...');
  
  // Test with a mock verification ID
  const testVerificationId = 'test-verification-123';
  
  try {
    console.log(`\n📡 Calling API for verification ID: ${testVerificationId}`);
    const result = await verificationService.getVerificationStatus(testVerificationId);
    
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    
    const hasAttemptId = verificationService.hasAttemptId(result);
    console.log(`🔍 Has attempt_id: ${hasAttemptId}`);
    
    if (hasAttemptId) {
      console.log('➡️  User should proceed to EmailVerification screen');
    } else {
      console.log('➡️  User should go to NotFound screen');
    }
    
  } catch (error: any) {
    console.log('❌ API Error:', error.message || error);
    console.log('➡️  User should go to NotFound screen (due to error)');
  }
}

testVerificationAPI();