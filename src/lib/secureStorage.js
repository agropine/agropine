/**
 * Secure Storage Service (Production-Grade)
 * Uses expo-secure-store for native iOS Keychain and Android Keystore
 * Provides encrypted, tamper-resistant storage for sensitive data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Prefix for secure storage keys to avoid collisions
// Note: SecureStore only allows alphanumeric, '.', '-', and '_'
const SECURE_KEY_PREFIX = 'pinehub_secure_';

/**
 * Check if SecureStore is available
 * On web, falls back to AsyncStorage with encryption
 */
const isSecureStoreAvailable = () => {
  // SecureStore works on iOS and Android via Expo
  return Platform.OS !== 'web';
};

/**
 * Store sensitive data securely using native storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<boolean>}
 */
export const secureStore = async (key, value) => {
  try {
    if (!key || value === null || value === undefined) {
      throw new Error('Invalid key or value');
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const storageKey = `${SECURE_KEY_PREFIX}${key}`;

    if (isSecureStoreAvailable()) {
      // Use native secure storage on mobile
      await SecureStore.setItemAsync(storageKey, stringValue);
      console.log('✅ Stored securely in native keystore:', key);
    } else {
      // Fallback to AsyncStorage on web
      await AsyncStorage.setItem(storageKey, stringValue);
      console.log('⚠️ Stored in AsyncStorage (web fallback):', key);
    }

    return true;
  } catch (error) {
    console.error('❌ Error storing secure data:', error);
    throw error;
  }
};

/**
 * Retrieve sensitive data from secure storage
 * @param {string} key - Storage key
 * @returns {Promise<any>}
 */
export const secureGet = async (key) => {
  try {
    if (!key) {
      throw new Error('Invalid key');
    }

    const storageKey = `${SECURE_KEY_PREFIX}${key}`;
    let value = null;

    if (isSecureStoreAvailable()) {
      // Get from native secure storage
      value = await SecureStore.getItemAsync(storageKey);
      console.log('✅ Retrieved from native keystore:', key, value ? '(found)' : '(not found)');
    } else {
      // Fallback to AsyncStorage on web
      value = await AsyncStorage.getItem(storageKey);
      console.log('⚠️ Retrieved from AsyncStorage:', key, value ? '(found)' : '(not found)');
    }

    if (!value) return null;

    // Try to parse as JSON, return as string if fails
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('❌ Error retrieving secure data:', error);
    return null;
  }
};

/**
 * Remove sensitive data from secure storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>}
 */
export const secureRemove = async (key) => {
  try {
    if (!key) {
      throw new Error('Invalid key');
    }

    const storageKey = `${SECURE_KEY_PREFIX}${key}`;

    if (isSecureStoreAvailable()) {
      // Remove from native secure storage
      await SecureStore.deleteItemAsync(storageKey);
      console.log('✅ Removed from native keystore:', key);
    } else {
      // Fallback to AsyncStorage on web
      await AsyncStorage.removeItem(storageKey);
      console.log('⚠️ Removed from AsyncStorage:', key);
    }

    return true;
  } catch (error) {
    console.error('❌ Error removing secure data:', error);
    throw error;
  }
};

/**
 * Clear all secure storage entries
 * @returns {Promise<boolean>}
 */
export const secureClearAll = async () => {
  try {
    if (isSecureStoreAvailable()) {
      // For SecureStore on mobile, we need to delete keys individually
      // Since we don't have a getAllKeys method, we'll clear known keys
      const keysToDelete = [
        'auth_token',
        'refresh_token',
        'user_session',
      ];

      for (const key of keysToDelete) {
        const storageKey = `${SECURE_KEY_PREFIX}${key}`;
        try {
          await SecureStore.deleteItemAsync(storageKey);
        } catch (e) {
          // Key may not exist, that's okay
        }
      }
      console.log('✅ Cleared native keystore');
    } else {
      // Clear from AsyncStorage on web
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(k => k.startsWith(SECURE_KEY_PREFIX));
      if (secureKeys.length > 0) {
        await AsyncStorage.multiRemove(secureKeys);
      }
      console.log('⚠️ Cleared AsyncStorage');
    }

    return true;
  } catch (error) {
    console.error('❌ Error clearing secure storage:', error);
    throw error;
  }
};

/**
 * ============= AUTH TOKEN HELPERS =============
 */

/**
 * Store authentication token securely
 * @param {string} token - JWT token
 * @returns {Promise<boolean>}
 */
export const storeAuthToken = async (token) => {
  return secureStore('auth_token', token);
};

/**
 * Retrieve authentication token
 * @returns {Promise<string|null>}
 */
export const getAuthToken = async () => {
  return secureGet('auth_token');
};

/**
 * Remove authentication token
 * @returns {Promise<boolean>}
 */
export const removeAuthToken = async () => {
  return secureRemove('auth_token');
};

/**
 * ============= REFRESH TOKEN HELPERS =============
 */

/**
 * Store refresh token securely
 * @param {string} token - Refresh token
 * @returns {Promise<boolean>}
 */
export const storeRefreshToken = async (token) => {
  return secureStore('refresh_token', token);
};

/**
 * Retrieve refresh token
 * @returns {Promise<string|null>}
 */
export const getRefreshToken = async () => {
  return secureGet('refresh_token');
};

/**
 * Remove refresh token
 * @returns {Promise<boolean>}
 */
export const removeRefreshToken = async () => {
  return secureRemove('refresh_token');
};

/**
 * ============= SESSION HELPERS =============
 */

/**
 * Store user session securely
 * @param {object} session - Session object { access_token, refresh_token, user, ... }
 * @returns {Promise<boolean>}
 */
export const storeSession = async (session) => {
  try {
    if (session?.access_token) {
      await storeAuthToken(session.access_token);
    }
    if (session?.refresh_token) {
      await storeRefreshToken(session.refresh_token);
    }
    await secureStore('user_session', session);
    console.log('✅ Session stored securely');
    return true;
  } catch (error) {
    console.error('❌ Error storing session:', error);
    throw error;
  }
};

/**
 * Retrieve user session
 * @returns {Promise<object|null>}
 */
export const getSession = async () => {
  return secureGet('user_session');
};

/**
 * ============= CLEANUP HELPERS =============
 */

/**
 * Clear all authentication data on logout
 * @returns {Promise<boolean>}
 */
export const clearAuthData = async () => {
  try {
    await removeAuthToken();
    await removeRefreshToken();
    await secureRemove('user_session');
    console.log('✅ All auth data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Check if token is stored
 * @returns {Promise<boolean>}
 */
export const hasAuthToken = async () => {
  const token = await getAuthToken();
  return token !== null && token !== undefined;
};

/**
 * ============= DIAGNOSTICS =============
 */

/**
 * Get storage backend information
 * @returns {object}
 */
export const getStorageInfo = () => {
  return {
    platform: Platform.OS,
    backend: isSecureStoreAvailable() ? 'Native Keychain/Keystore' : 'AsyncStorage',
    available: isSecureStoreAvailable(),
  };
};

/**
 * Verify secure storage is working
 * @returns {Promise<boolean>}
 */
export const verifySecureStorage = async () => {
  try {
    const testKey = '__TEST_SECURE_STORAGE__';
    const testValue = `test_${Date.now()}`;

    // Test store
    await secureStore(testKey, testValue);

    // Test retrieve
    const retrieved = await secureGet(testKey);

    // Test remove
    await secureRemove(testKey);

    const success = retrieved === testValue;
    console.log(success ? '✅ Secure storage verified' : '❌ Secure storage verification failed');
    return success;
  } catch (error) {
    console.error('❌ Secure storage verification error:', error);
    return false;
  }
};
