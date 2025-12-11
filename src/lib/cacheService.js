/**
 * Offline Cache Service
 * Handles caching with AsyncStorage for offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@pinehub_cache_';
const CACHE_EXPIRY_PREFIX = '@pinehub_expiry_';
const DEFAULT_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// Products cache
export const cacheProducts = async (key, data, duration = DEFAULT_CACHE_DURATION) => {
  try {
    const cacheKey = `${CACHE_PREFIX}products_${key}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}products_${key}`;
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(expiryKey, JSON.stringify(Date.now() + duration));
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error caching products:', error);
    return { success: false, error: error.message };
  }
};

export const getCachedProducts = async (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}products_${key}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}products_${key}`;
    
    const expiryTime = await AsyncStorage.getItem(expiryKey);
    
    if (!expiryTime || Date.now() > parseInt(expiryTime)) {
      // Cache expired
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(expiryKey);
      return { data: null, isExpired: true };
    }
    
    const cachedData = await AsyncStorage.getItem(cacheKey);
    return { data: cachedData ? JSON.parse(cachedData) : null, isExpired: false };
  } catch (error) {
    console.error('Error retrieving cached products:', error);
    return { data: null, isExpired: false };
  }
};

export const clearProductCache = async (key = null) => {
  try {
    if (key) {
      const cacheKey = `${CACHE_PREFIX}products_${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}products_${key}`;
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(expiryKey);
    } else {
      // Clear all product caches
      const keys = await AsyncStorage.getAllKeys();
      const productCacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX + 'products_'));
      const expiryCacheKeys = keys.filter(k => k.startsWith(CACHE_EXPIRY_PREFIX + 'products_'));
      await AsyncStorage.multiRemove([...productCacheKeys, ...expiryCacheKeys]);
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Error clearing product cache:', error);
    return { success: false, error: error.message };
  }
};

// Search history
export const saveSearchQuery = async (query) => {
  try {
    const searchHistoryKey = `${CACHE_PREFIX}search_history`;
    const historyStr = await AsyncStorage.getItem(searchHistoryKey);
    let history = historyStr ? JSON.parse(historyStr) : [];
    
    // Remove duplicate if exists and add to front
    history = history.filter(q => q !== query);
    history.unshift(query);
    
    // Keep only last 20 searches
    history = history.slice(0, 20);
    
    await AsyncStorage.setItem(searchHistoryKey, JSON.stringify(history));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving search query:', error);
    return { success: false, error: error.message };
  }
};

export const getSearchHistory = async () => {
  try {
    const searchHistoryKey = `${CACHE_PREFIX}search_history`;
    const historyStr = await AsyncStorage.getItem(searchHistoryKey);
    return { data: historyStr ? JSON.parse(historyStr) : [], error: null };
  } catch (error) {
    console.error('Error retrieving search history:', error);
    return { data: [], error: error.message };
  }
};

export const clearSearchHistory = async () => {
  try {
    const searchHistoryKey = `${CACHE_PREFIX}search_history`;
    await AsyncStorage.removeItem(searchHistoryKey);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error clearing search history:', error);
    return { success: false, error: error.message };
  }
};

// User data cache
export const cacheUserProfile = async (userId, data) => {
  try {
    const cacheKey = `${CACHE_PREFIX}user_${userId}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}user_${userId}`;
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(expiryKey, JSON.stringify(Date.now() + DEFAULT_CACHE_DURATION));
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error caching user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getCachedUserProfile = async (userId) => {
  try {
    const cacheKey = `${CACHE_PREFIX}user_${userId}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}user_${userId}`;
    
    const expiryTime = await AsyncStorage.getItem(expiryKey);
    
    if (!expiryTime || Date.now() > parseInt(expiryTime)) {
      // Cache expired
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(expiryKey);
      return { data: null, isExpired: true };
    }
    
    const cachedData = await AsyncStorage.getItem(cacheKey);
    return { data: cachedData ? JSON.parse(cachedData) : null, isExpired: false };
  } catch (error) {
    console.error('Error retrieving cached user profile:', error);
    return { data: null, isExpired: false };
  }
};

// Clear all cache
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_EXPIRY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return { success: false, error: error.message };
  }
};
