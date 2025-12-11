import { reverseGeocode } from './locationSearchService';

/**
 * Shared vendor location cache service
 * Provides centralized location caching for products with vendor coordinates
 */

// In-memory cache shared across components
let vendorLocationCache = {};

/**
 * Get cached location for a coordinate pair
 */
export const getCachedLocation = (latitude, longitude) => {
  const cacheKey = `${latitude},${longitude}`;
  return vendorLocationCache[cacheKey] || null;
};

/**
 * Get locations for multiple products in batch
 * Returns a map of coordinate keys to place names
 */
export const batchGetVendorLocations = async (products) => {
  const newCache = { ...vendorLocationCache };
  
  // Filter products that need location resolution
  const productsNeedingLocation = products.filter(product => {
    if (!product.owner_latitude || !product.owner_longitude) {
      return false;
    }
    
    const cacheKey = `${product.owner_latitude},${product.owner_longitude}`;
    return !newCache[cacheKey];
  });
  
  // Resolve locations for uncached products
  for (const product of productsNeedingLocation) {
    const cacheKey = `${product.owner_latitude},${product.owner_longitude}`;
    
    try {
      const { placeName } = await reverseGeocode(product.owner_latitude, product.owner_longitude);
      newCache[cacheKey] = placeName || 'Unknown Location';
    } catch (error) {
      console.warn('Failed to get vendor location:', error);
      newCache[cacheKey] = 'Unknown Location';
    }
  }
  
  // Update shared cache
  vendorLocationCache = newCache;
  
  return newCache;
};

/**
 * Clear the entire vendor location cache
 */
export const clearVendorLocationCache = () => {
  vendorLocationCache = {};
};

/**
 * Get the entire cache (for use with useState)
 */
export const getVendorLocationCache = () => {
  return { ...vendorLocationCache };
};
