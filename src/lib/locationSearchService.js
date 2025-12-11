import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Throttling constants
const GEOCODE_THROTTLE_MS = 300; // Minimum ms between requests
const GEOCODE_CACHE_KEY = 'geocode_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Track last geocoding request time
let lastGeocodeTime = 0;
let geocodeCache = {};

/**
 * Load cache from AsyncStorage
 */
const loadGeocodeCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(GEOCODE_CACHE_KEY);
    if (cached) {
      geocodeCache = JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Error loading geocode cache:', error);
  }
};

/**
 * Save cache to AsyncStorage
 */
const saveGeocodeCache = async () => {
  try {
    await AsyncStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(geocodeCache));
  } catch (error) {
    console.warn('Error saving geocode cache:', error);
  }
};

/**
 * Initialize cache on first load
 */
loadGeocodeCache();

/**
 * Throttle requests to avoid rate limiting
 */
const throttleGeocode = async (fn) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodeTime;
  
  if (timeSinceLastRequest < GEOCODE_THROTTLE_MS) {
    const waitTime = GEOCODE_THROTTLE_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastGeocodeTime = Date.now();
  return fn();
};

/**
 * Search for locations by place name
 * Uses reverse geocoding to find coordinates
 */
export const searchLocation = async (query) => {
  try {
    if (!query || query.trim().length === 0) {
      return { results: [], error: null };
    }

    const geocodedLocations = await Location.geocodeAsync(query);
    
    if (!geocodedLocations || geocodedLocations.length === 0) {
      return { results: [], error: null };
    }

    // Transform to user-friendly format
    const results = geocodedLocations.map((location, index) => ({
      id: `${location.latitude}-${location.longitude}-${index}`,
      name: query,
      latitude: location.latitude,
      longitude: location.longitude,
      address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    }));

    return { results, error: null };
  } catch (error) {
    console.error('Error searching location:', error);
    return { results: [], error: error.message };
  }
};

/**
 * Reverse geocode coordinates to get place name (city and state only)
 * Implements caching and throttling to avoid rate limits
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      return { placeName: null, error: null };
    }

    // Create cache key
    const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    
    // Check if in cache and not expired
    if (geocodeCache[cacheKey]) {
      const cached = geocodeCache[cacheKey];
      if (Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        console.log('Using cached location:', cacheKey);
        return { placeName: cached.placeName, error: null };
      }
    }

    // Throttle the actual API request
    const result = await throttleGeocode(async () => {
      return await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
    });

    if (result && result.length > 0) {
      const place = result[0];
      // Extract city and region/state, filtering out postal codes and numbers
      const city = place.city ? place.city.replace(/\s*\d+\s*/g, '').trim() : '';
      const region = place.region ? place.region.replace(/\s*\d+\s*/g, '').trim() : '';
      
      // Build place name with city and region only
      const parts = [city, region].filter(Boolean);
      const placeName = parts.length > 0 ? parts.join(', ') : null;
      
      // Cache the result
      geocodeCache[cacheKey] = {
        placeName,
        timestamp: Date.now()
      };
      
      // Save to persistent storage (non-blocking)
      saveGeocodeCache().catch(err => console.warn('Failed to save cache:', err));
      
      return { placeName, error: null };
    }

    return { placeName: null, error: null };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    // Return cached value even if expired on error
    const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    const cached = geocodeCache[cacheKey];
    if (cached) {
      console.log('Using expired cache due to error:', cacheKey);
      return { placeName: cached.placeName, error: null };
    }
    return { placeName: null, error: error.message };
  }
};

/**
 * Calculate distance and check if within radius
 * Returns true if distance is within radius (in km)
 */
export const isWithinRadius = (userLat, userLon, vendorLat, vendorLon, radiusKm = 50) => {
  if (!userLat || !userLon || !vendorLat || !vendorLon) {
    return false;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((vendorLat - userLat) * Math.PI) / 180;
  const dLon = ((vendorLon - userLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((vendorLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
};
