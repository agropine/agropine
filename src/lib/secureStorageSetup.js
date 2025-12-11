/**
 * Secure Storage Setup & Verification Script
 * Run this on app startup to verify native secure storage is working correctly
 */

import { getAuthToken, getStorageInfo, hasAuthToken, verifySecureStorage } from '../lib/secureStorage';

/**
 * Initialize and verify secure storage on app startup
 * Call this in your AuthProvider or App.js
 */
export const initializeSecureStorage = async () => {
  try {
    console.log('🔐 Initializing Secure Storage...\n');

    // Get storage backend info
    const storageInfo = getStorageInfo();
    console.log('📱 Platform:', storageInfo.platform);
    console.log('🔒 Backend:', storageInfo.backend);
    console.log('✅ Available:', storageInfo.available ? 'Yes' : 'No');
    console.log('');

    // Verify secure storage is working
    console.log('🧪 Testing Secure Storage...');
    const isWorking = await verifySecureStorage();
    console.log('');

    if (isWorking) {
      console.log('✅ Secure Storage is WORKING correctly!\n');
      return true;
    } else {
      console.warn('⚠️ Secure Storage verification failed!\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing secure storage:', error);
    return false;
  }
};

/**
 * Log secure storage diagnostics
 */
export const logStorageDiagnostics = async () => {
  try {
    const storageInfo = getStorageInfo();
    const hasToken = await hasAuthToken();
    const token = hasToken ? await getAuthToken() : null;

    console.log('\n📊 Secure Storage Diagnostics:');
    console.log('================================');
    console.log('Platform:', storageInfo.platform);
    console.log('Backend:', storageInfo.backend);
    console.log('Has Auth Token:', hasToken ? 'Yes' : 'No');
    if (token) {
      console.log('Token Preview:', token.substring(0, 20) + '...');
    }
    console.log('================================\n');
  } catch (error) {
    console.error('Error logging diagnostics:', error);
  }
};

export default initializeSecureStorage;
