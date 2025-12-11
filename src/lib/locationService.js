import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LOCATION_STORAGE_KEY = 'user_location';

/**
 * Request location permission from user
 * Returns { status, location } where status is 'granted' or 'denied'
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      console.log('Location permission granted');
      // Get current location
      const location = await getCurrentLocation();
      return { status: 'granted', location };
    } else {
      console.log('Location permission denied');
      return { status: 'denied', location: null };
    }
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { status: 'error', location: null };
  }
};

/**
 * Get current user location
 */
export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Date.now(),
    };
    
    console.log('Got current location:', userLocation);
    
    // Save to AsyncStorage for later use
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(userLocation));
    
    return userLocation;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Get saved user location from AsyncStorage
 */
export const getSavedUserLocation = async () => {
  try {
    const savedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      return JSON.parse(savedLocation);
    }
    return null;
  } catch (error) {
    console.error('Error getting saved location:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Refresh user location (call periodically or on demand)
 */
export const refreshUserLocation = async () => {
  try {
    const location = await getCurrentLocation();
    return location;
  } catch (error) {
    console.error('Error refreshing location:', error);
    return null;
  }
};
