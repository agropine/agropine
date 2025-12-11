/**
 * Server-side validation rules
 * These validate data before/after database operations
 */

/**
 * Validate product data on server
 */
export const validateProductOnServer = (product) => {
  const errors = [];

  // Check required fields
  if (!product.name || typeof product.name !== 'string' || product.name.trim().length === 0) {
    errors.push('Product name is required');
  } else if (product.name.length < 3 || product.name.length > 100) {
    errors.push('Product name must be between 3 and 100 characters');
  }

  if (!product.category || typeof product.category !== 'string') {
    errors.push('Product category is required');
  } else {
    const validCategories = ['Raw', 'Processed', 'Beverages', 'Goods', 'Health'];
    if (!validCategories.includes(product.category)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }

  if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
    errors.push('Product price must be a positive number');
  } else if (product.price > 1000000) {
    errors.push('Product price seems too high');
  }

  if (product.description) {
    if (typeof product.description !== 'string') {
      errors.push('Description must be text');
    } else if (product.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
  }

  if (product.vendor_id && typeof product.vendor_id !== 'string') {
    errors.push('Invalid vendor ID');
  }

  if (product.image_url && typeof product.image_url !== 'string') {
    errors.push('Invalid image URL');
  }

  if (product.owner_latitude && (typeof product.owner_latitude !== 'number' || product.owner_latitude < -90 || product.owner_latitude > 90)) {
    errors.push('Invalid latitude');
  }

  if (product.owner_longitude && (typeof product.owner_longitude !== 'number' || product.owner_longitude < -180 || product.owner_longitude > 180)) {
    errors.push('Invalid longitude');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user profile on server
 */
export const validateUserProfileOnServer = (profile) => {
  const errors = [];

  if (!profile.id || typeof profile.id !== 'string') {
    errors.push('User ID is required');
  }

  if (!profile.email || typeof profile.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push('Valid email is required');
  }

  if (!profile.full_name || typeof profile.full_name !== 'string' || profile.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (profile.bio && typeof profile.bio !== 'string' && profile.bio.length > 500) {
    errors.push('Bio cannot exceed 500 characters');
  }

  if (profile.latitude && (typeof profile.latitude !== 'number' || profile.latitude < -90 || profile.latitude > 90)) {
    errors.push('Invalid latitude');
  }

  if (profile.longitude && (typeof profile.longitude !== 'number' || profile.longitude < -180 || profile.longitude > 180)) {
    errors.push('Invalid longitude');
  }

  if (profile.avatar_url && typeof profile.avatar_url !== 'string') {
    errors.push('Invalid avatar URL');
  }

  if (typeof profile.is_verified !== 'undefined' && typeof profile.is_verified !== 'boolean') {
    errors.push('Verification status must be boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize and validate product before saving
 */
export const sanitizeProductData = (product) => {
  return {
    name: product.name?.trim().substring(0, 100) || '',
    category: product.category?.trim() || '',
    price: Math.max(0, Number(product.price) || 0),
    description: product.description?.trim().substring(0, 1000) || '',
    image_url: product.image_url || null,
    owner_latitude: product.owner_latitude || null,
    owner_longitude: product.owner_longitude || null,
    vendor_id: product.vendor_id || null,
  };
};

/**
 * Sanitize and validate user profile before saving
 */
export const sanitizeUserProfileData = (profile) => {
  return {
    email: profile.email?.trim().toLowerCase() || '',
    full_name: profile.full_name?.trim().substring(0, 100) || '',
    bio: profile.bio?.trim().substring(0, 500) || '',
    latitude: profile.latitude || null,
    longitude: profile.longitude || null,
    avatar_url: profile.avatar_url || null,
    is_verified: !!profile.is_verified,
  };
};
