import { supabase } from './supabase';

// Default timeout in milliseconds (10 seconds)
const DEFAULT_TIMEOUT = 10000;

/**
 * Wraps a promise with a timeout
 */
const withTimeout = (promise, timeoutMs = DEFAULT_TIMEOUT) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout. Please check your connection and try again.')), timeoutMs)
    ),
  ]);
};

/**
 * Get user-friendly error message
 */
const getUserFriendlyError = (error) => {
  if (!error) return 'An unknown error occurred';

  // Timeout error
  if (error.message && error.message.includes('timeout')) {
    return 'Request timeout. Please check your connection and try again.';
  }

  // Network errors
  if (error.message && error.message.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }

  // Supabase specific errors
  if (error.code === 'PGRST116') {
    return 'Product not found.';
  }

  if (error.code === '23505') {
    return 'This product already exists.';
  }

  if (error.code === '42P01') {
    return 'Database error. Please try again later.';
  }

  // RLS policy errors
  if (error.message && error.message.includes('new row violates row-level security policy')) {
    return 'You do not have permission to perform this action.';
  }

  // Generic error message
  return error.message || 'Something went wrong. Please try again.';
};

/**
 * Fetch all products (with optional filters and pagination)
 * @param {Object} filters - Optional filters { category, vendorId, searchTerm, limit, offset }
 */
export const fetchProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }
    if (filters.searchTerm) {
      query = query.ilike('name', `%${filters.searchTerm}%`);
    }

    // Apply pagination
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const queryPromise = query.order('created_at', { ascending: false });
    const { data, error, count } = await withTimeout(queryPromise, DEFAULT_TIMEOUT);

    if (error) {
      const userError = getUserFriendlyError(error);
      console.error('Error fetching products:', error);
      return { data: null, error: new Error(userError), count: 0 };
    }

    // Fetch vendor coordinates and verification status for each product
    let transformedData = data || [];
    if (transformedData.length > 0) {
      const vendorIds = [...new Set(transformedData.map(p => p.vendor_id))];
      
      const { data: vendorProfiles, error: vendorError } = await supabase
        .from('user_profiles')
        .select('id, latitude, longitude, is_verified')
        .in('id', vendorIds);

      if (!vendorError && vendorProfiles) {
        const vendorMap = {};
        vendorProfiles.forEach(profile => {
          vendorMap[profile.id] = {
            latitude: profile.latitude,
            longitude: profile.longitude,
            is_verified: profile.is_verified,
          };
        });

        transformedData = transformedData.map(product => ({
          ...product,
          owner_latitude: vendorMap[product.vendor_id]?.latitude,
          owner_longitude: vendorMap[product.vendor_id]?.longitude,
          vendor_is_verified: vendorMap[product.vendor_id]?.is_verified || false,
        }));
      }
    }

    return { data: transformedData, error: null, count: count || data?.length || 0 };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error fetching products:', error);
    return { data: null, error: new Error(userError) };
  }
};

/**
 * Fetch single product by ID
 */
export const fetchProductById = async (productId) => {
  try {
    const promise = supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    const { data, error } = await withTimeout(promise, DEFAULT_TIMEOUT);

    if (error && error.code !== 'PGRST116') {
      const userError = getUserFriendlyError(error);
      console.error('Error fetching product:', error);
      return { data: null, error: new Error(userError) };
    }

    return { data, error: null };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error fetching product:', error);
    return { data: null, error: new Error(userError) };
  }
};

/**
 * Fetch products by vendor ID (with optional pagination)
 */
export const fetchVendorProducts = async (vendorId, filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendorId);

    // Apply pagination
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const promise = query.order('created_at', { ascending: false });
    const { data, error, count } = await withTimeout(promise, DEFAULT_TIMEOUT);

    if (error) {
      const userError = getUserFriendlyError(error);
      console.error('Error fetching vendor products:', error);
      return { data: null, error: new Error(userError), count: 0 };
    }

    return { data, error: null, count: count || data?.length || 0 };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error fetching vendor products:', error);
    return { data: null, error: new Error(userError), count: 0 };
  }
};

/**
 * Create new product
 */
export const createProduct = async (vendorId, productData) => {
  try {
    console.log('Creating product:', productData);

    const promise = supabase
      .from('products')
      .insert([
        {
          vendor_id: vendorId,
          name: productData.name,
          description: productData.description || '',
          category: productData.category,
          price: parseFloat(productData.price),
          price_unit: productData.priceUnit || 'per kg',
          quantity_available: parseFloat(productData.quantityAvailable) || 0,
          quantity_unit: productData.quantityUnit || 'kg',
          image_url: productData.imageUrl || '',
          in_stock: productData.inStock !== false,
        },
      ])
      .select()
      .single();

    const { data, error } = await withTimeout(promise, DEFAULT_TIMEOUT);

    if (error) {
      const userError = getUserFriendlyError(error);
      console.error('Error creating product:', error);
      return { data: null, error: new Error(userError) };
    }

    console.log('Product created:', data);
    return { data, error: null };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error creating product:', error);
    return { data: null, error: new Error(userError) };
  }
};

/**
 * Update product
 */
export const updateProduct = async (productId, productData) => {
  try {
    console.log('Updating product:', productId, productData);

    const promise = supabase
      .from('products')
      .update({
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: parseFloat(productData.price),
        price_unit: productData.priceUnit,
        quantity_available: parseFloat(productData.quantityAvailable),
        quantity_unit: productData.quantityUnit,
        image_url: productData.imageUrl,
        in_stock: productData.inStock,
      })
      .eq('id', productId)
      .select()
      .single();

    const { data, error } = await withTimeout(promise, DEFAULT_TIMEOUT);

    if (error) {
      const userError = getUserFriendlyError(error);
      console.error('Error updating product:', error);
      return { data: null, error: new Error(userError) };
    }

    console.log('Product updated:', data);
    return { data, error: null };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error updating product:', error);
    return { data: null, error: new Error(userError) };
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId) => {
  try {
    console.log('Deleting product:', productId);

    const promise = supabase
      .from('products')
      .delete()
      .eq('id', productId);

    const { error } = await withTimeout(promise, DEFAULT_TIMEOUT);

    if (error) {
      const userError = getUserFriendlyError(error);
      console.error('Error deleting product:', error);
      return { error: new Error(userError) };
    }

    console.log('Product deleted');
    return { error: null };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error deleting product:', error);
    return { error: new Error(userError) };
  }
};

/**
 * Get category-specific price unit
 * For 'raw' category, price is always per kg
 */
export const getPriceUnitForCategory = (category) => {
  const categoryPriceUnits = {
    'raw': 'per kg',
    'processed': 'per unit',
    'organic': 'per kg',
    'fresh': 'per kg',
    'frozen': 'per kg',
    'dried': 'per kg',
  };

  return categoryPriceUnits[category] || 'per unit';
};

/**
 * Fetch products from verified vendors only
 * @param {Object} filters - Optional filters { category, limit, offset }
 */
export const fetchProductsFromVerifiedVendors = async (filters = {}) => {
  try {
    // First, fetch all vendors with verified status
    let vendorQuery = supabase
      .from('user_profiles')
      .select('id')
      .eq('is_verified', true);

    const { data: verifiedVendors, error: vendorError } = await withTimeout(vendorQuery, DEFAULT_TIMEOUT);

    if (vendorError) {
      console.error('Error fetching verified vendors:', vendorError);
      return { data: null, error: vendorError, count: 0 };
    }

    const verifiedVendorIds = (verifiedVendors || []).map(v => v.id);

    if (verifiedVendorIds.length === 0) {
      return { data: [], error: null, count: 0 };
    }

    // Then fetch products from verified vendors
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .in('vendor_id', verifiedVendorIds);

    // Apply category filter if provided
    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    // Apply pagination
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const queryPromise = query.order('created_at', { ascending: false });
    const { data, error, count } = await withTimeout(queryPromise, DEFAULT_TIMEOUT);

    if (error) {
      const userError = getUserFriendlyError(error);
      console.error('Error fetching products from verified vendors:', error);
      return { data: null, error: new Error(userError), count: 0 };
    }

    // Fetch vendor coordinates for each product
    let transformedData = data || [];
    if (transformedData.length > 0) {
      const vendorIds = [...new Set(transformedData.map(p => p.vendor_id))];
      
      const { data: vendorProfiles, error: vendorError } = await supabase
        .from('user_profiles')
        .select('id, latitude, longitude, is_verified')
        .in('id', vendorIds);

      if (!vendorError && vendorProfiles) {
        const vendorCoordinates = {};
        vendorProfiles.forEach(v => {
          vendorCoordinates[v.id] = { latitude: v.latitude, longitude: v.longitude, is_verified: v.is_verified };
        });

        transformedData = transformedData.map(product => ({
          ...product,
          owner_latitude: vendorCoordinates[product.vendor_id]?.latitude,
          owner_longitude: vendorCoordinates[product.vendor_id]?.longitude,
          vendor_is_verified: vendorCoordinates[product.vendor_id]?.is_verified || false,
        }));
      }
    }

    return { data: transformedData, error: null, count: count || 0 };
  } catch (error) {
    const userError = getUserFriendlyError(error);
    console.error('Error in fetchProductsFromVerifiedVendors:', error);
    return { data: null, error: new Error(userError), count: 0 };
  }
};

/**
 * Get category-specific quantity unit
 */
export const getQuantityUnitForCategory = (category) => {
  const categoryQuantityUnits = {
    'raw': 'kg',
    'processed': 'units',
    'organic': 'kg',
    'fresh': 'kg',
    'frozen': 'kg',
    'dried': 'kg',
  };

  return categoryQuantityUnits[category] || 'units';
};
