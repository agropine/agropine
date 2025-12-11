/**
 * Validation Service
 * Provides validation functions for user input
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: null };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  return { isValid: true, error: null };
};

export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name must not exceed 50 characters' };
  }
  return { isValid: true, error: null };
};

export const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  return { isValid: true, error: null };
};

export const validateAddress = (address) => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: 'Address is required' };
  }
  if (address.trim().length < 5) {
    return { isValid: false, error: 'Address must be at least 5 characters' };
  }
  if (address.trim().length > 100) {
    return { isValid: false, error: 'Address must not exceed 100 characters' };
  }
  return { isValid: true, error: null };
};

export const validateDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return { isValid: false, error: 'Description is required' };
  }
  if (description.trim().length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters' };
  }
  if (description.trim().length > 500) {
    return { isValid: false, error: 'Description must not exceed 500 characters' };
  }
  return { isValid: true, error: null };
};

export const validateSignup = (email, password, confirmPassword) => {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: null };
};

export const validateProfileComplete = (profile) => {
  const errors = [];

  const nameValidation = validateName(profile.name);
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  const phoneValidation = validatePhone(profile.phone);
  if (!phoneValidation.isValid) errors.push(phoneValidation.error);

  const addressValidation = validateAddress(profile.address);
  if (!addressValidation.isValid) errors.push(addressValidation.error);

  const descriptionValidation = validateDescription(profile.shortDescription);
  if (!descriptionValidation.isValid) errors.push(descriptionValidation.error);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

export const validateSocialMedia = (platform, value) => {
  if (!value || value.trim().length === 0) {
    return { isValid: true, error: null }; // Social media is optional
  }

  switch (platform) {
    case 'whatsapp':
      return validatePhone(value);
    case 'instagram':
      if (!value.match(/^@?[a-zA-Z0-9_.-]+$/)) {
        return { isValid: false, error: 'Invalid Instagram username format' };
      }
      return { isValid: true, error: null };
    case 'tiktok':
      if (!value.match(/^@?[a-zA-Z0-9_.-]+$/)) {
        return { isValid: false, error: 'Invalid TikTok username format' };
      }
      return { isValid: true, error: null };
    case 'facebook':
      if (value.length < 2) {
        return { isValid: false, error: 'Facebook name must be at least 2 characters' };
      }
      return { isValid: true, error: null };
    default:
      return { isValid: true, error: null };
  }
};

// Product validation
export const validatePrice = (price) => {
  if (!price || price.toString().trim().length === 0) {
    return { isValid: false, error: 'Price is required' };
  }
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return { isValid: false, error: 'Price must be a positive number' };
  }
  if (numPrice > 999999) {
    return { isValid: false, error: 'Price cannot exceed RM 999,999' };
  }
  return { isValid: true, error: null };
};

export const validateProductName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Product name is required' };
  }
  if (name.trim().length < 3) {
    return { isValid: false, error: 'Product name must be at least 3 characters' };
  }
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Product name must not exceed 100 characters' };
  }
  return { isValid: true, error: null };
};

export const validateCategory = (category) => {
  const validCategories = ['Raw', 'Processed', 'Beverages', 'Goods', 'Health'];
  if (!category || !validCategories.includes(category)) {
    return { isValid: false, error: 'Please select a valid category' };
  }
  return { isValid: true, error: null };
};

export const validateProduct = (product) => {
  const errors = [];

  const nameValidation = validateProductName(product.name);
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  const categoryValidation = validateCategory(product.category);
  if (!categoryValidation.isValid) errors.push(categoryValidation.error);

  const priceValidation = validatePrice(product.price);
  if (!priceValidation.isValid) errors.push(priceValidation.error);

  const descriptionValidation = validateDescription(product.description);
  if (!descriptionValidation.isValid) errors.push(descriptionValidation.error);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

// Sanitization functions to prevent XSS and SQL injection
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Remove potential SQL injection characters
  return input
    .replace(/[;'"\\]/g, '') // Remove SQL special chars
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim();
};

export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  return email.toLowerCase().trim();
};

export const sanitizePrice = (price) => {
  if (!price) return 0;
  const numPrice = parseFloat(price);
  return isNaN(numPrice) ? 0 : Math.abs(numPrice);
};
