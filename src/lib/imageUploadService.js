import * as FileSystem from 'expo-file-system/legacy';
import { validateAndCompressImage } from './imageService';
import { supabase } from './supabase';

/**
 * Convert Base64 string to Uint8Array
 * @param {string} base64 - Base64 encoded string
 * @returns {Uint8Array} - Uint8Array buffer
 */
const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Upload user profile photo to Supabase Storage
 * @param {string} userId - User ID
 * @param {object} imageResult - Result from react-native-image-picker
 * @returns {Promise<{url: string, error: null} | {url: null, error: object}>}
 */
export const uploadProfilePhoto = async (userId, imageResult) => {
  try {
    console.log('Starting profile image upload...');
    console.log('imageResult:', imageResult);
    
    if (!imageResult.assets || imageResult.assets.length === 0) {
      return { url: null, error: new Error('No image selected') };
    }

    const asset = imageResult.assets[0];
    console.log('Selected asset:', asset);
    
    const imageUri = asset.uri;
    
    if (!imageUri) {
      return { url: null, error: new Error('Invalid image URI') };
    }

    // Validate and compress the image first
    console.log('Validating and compressing image...');
    const compressionResult = await validateAndCompressImage(imageUri);
    
    if (!compressionResult.isValid) {
      console.error('Image compression failed:', compressionResult.error);
      return { url: null, error: new Error(compressionResult.error) };
    }

    const compressedUri = compressionResult.uri;
    console.log('Image compressed successfully');

    console.log('Reading file from:', compressedUri);
    
    // Read file as base64 using FileSystem
    const base64Data = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: 'base64',
    });
    
    console.log('Image read as base64, size:', base64Data.length);
    
    // Check authentication before upload
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session exists:', !!session);
    console.log('User ID:', session?.user?.id);
    console.log('User ID from param:', userId);
    
    if (!session) {
      console.error('No active session - user not authenticated');
      return { url: null, error: new Error('User not authenticated. Please log in again.') };
    }
    
    // Upload to Supabase Storage
    const mimeType = asset.type || 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `${userId}-${Date.now()}.${extension}`;
    const filePath = `${userId}/${filename}`;
    
    console.log('Uploading to avatars bucket...');
    console.log('File path:', filePath);
    
    // Decode base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Upload using Supabase SDK with ArrayBuffer
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, bytes.buffer, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      console.error('Error details:', JSON.stringify(error));
      return { url: null, error };
    }
    
    console.log('Upload successful via SDK');
    console.log('Upload data:', data);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    console.log('Public URL:', publicUrl);
    
    // Update user_profiles with the storage URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.warn('Failed to update user_profiles with new avatar URL:', updateError);
      // Don't return error - image is already stored successfully
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload exception:', error);
    return { url: null, error };
  }
};

/**
 * Upload product photo to Supabase Storage
 * @param {string} userId - User ID (vendor ID)
 * @param {object} imageResult - Result from expo-image-picker
 * @param {string} productId - Product ID to update (optional for new products)
 * @returns {Promise<string>} - Returns public URL of the uploaded image
 */
export const uploadProductImage = async (userId, imageResult, productId = null) => {
  try {
    console.log('Starting product image upload...');
    console.log('imageResult:', imageResult);
    console.log('productId:', productId);
    
    let imageUri = imageResult.uri;
    
    if (!imageUri) {
      throw new Error('Invalid image URI');
    }

    // Validate and compress the image first
    console.log('Validating and compressing product image...');
    const compressionResult = await validateAndCompressImage(imageUri);
    
    if (!compressionResult.isValid) {
      console.error('Image compression failed:', compressionResult.error);
      throw new Error(compressionResult.error);
    }

    imageUri = compressionResult.uri;
    console.log('Product image compressed successfully');

    console.log('Reading file from:', imageUri);
    
    // Read file as base64 using FileSystem
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    
    console.log('Image read as base64, size:', base64Data.length);
    
    // Check authentication before upload
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session exists:', !!session);
    console.log('User ID:', session?.user?.id);
    console.log('User ID from param:', userId);
    
    if (!session) {
      console.error('No active session - user not authenticated');
      throw new Error('User not authenticated. Please log in again.');
    }
    
    // Upload to Supabase Storage
    const mimeType = imageResult.mimeType || imageResult.type || 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `${userId}-${Date.now()}.${extension}`;
    const filePath = `${userId}/${filename}`;
    
    console.log('Uploading to products bucket...');
    console.log('File path:', filePath);
    
    // Decode base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('Uploading ArrayBuffer, size:', bytes.length);
    
    // Upload using Supabase SDK with ArrayBuffer
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, bytes.buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      console.error('Error details:', JSON.stringify(error));
      throw error;
    }

    console.log('Upload successful via SDK');
    console.log('Upload data:', data);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    console.log('Upload successful, public URL:', publicUrl);
    
    // If productId is provided, update the product with the image
    if (productId) {
      console.log('Updating product with image URL...');
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)
        .eq('vendor_id', userId);

      if (updateError) {
        console.warn('Failed to update product with image URL:', updateError);
        // Don't throw - image is already stored successfully
      }
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Product upload exception:', error);
    throw error;
  }
};

/**
 * Delete old profile photo from database
 * @param {string} photoUrl - Photo URL (Base64 or old storage URL)
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: object}>}
 */
export const deleteProfilePhoto = async (photoUrl) => {
  try {
    // Base64 data URLs can't be deleted, just skip
    if (photoUrl && photoUrl.startsWith('data:')) {
      return { success: true, error: null };
    }
    
    if (!photoUrl || !photoUrl.includes('supabase')) {
      return { success: true, error: null };
    }

    // Extract file path from old storage URL if needed
    const urlParts = photoUrl.split('/storage/v1/object/public/avatars/');
    if (urlParts.length < 2) {
      return { success: true, error: null };
    }

    const filePath = urlParts[1];

    // Delete from old storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.warn('Failed to delete old photo:', error);
      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch (error) {
    console.warn('Error deleting photo:', error);
    return { success: true, error: null };
  }
};

/**
 * Delete product image from storage
 * @param {string} imageUrl - Product image URL
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: object}>}
 */
export const deleteProductImage = async (imageUrl) => {
  try {
    // Base64 data URLs can't be deleted, just skip
    if (imageUrl && imageUrl.startsWith('data:')) {
      return { success: true, error: null };
    }
    
    if (!imageUrl || !imageUrl.includes('supabase')) {
      return { success: true, error: null };
    }

    // Extract file path from storage URL
    const urlParts = imageUrl.split('/storage/v1/object/public/products/');
    if (urlParts.length < 2) {
      return { success: true, error: null };
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from('products')
      .remove([filePath]);

    if (error) {
      console.warn('Failed to delete product image:', error);
      return { success: true, error: null };
    }

    console.log('Product image deleted successfully:', filePath);
    return { success: true, error: null };
  } catch (error) {
    console.warn('Error deleting product image:', error);
    return { success: true, error: null };
  }
};
