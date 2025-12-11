/**
 * Authentication Service
 * Handles password changes and account deletion
 */

import { supabase } from './supabase';

/**
 * Change user password
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Promise} Result of password change
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // First, verify the current password by attempting to re-authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email,
      password: currentPassword,
    });

    if (authError) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    console.log('Password changed successfully');
    return data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Delete user account and all associated data
 * @param {string} userId - User ID to delete
 * @returns {Promise} Result of account deletion
 */
export const deleteAccount = async (userId) => {
  try {
    console.log('Starting account deletion for user:', userId);

    // Step 1: Get all products by user to delete their images
    console.log('Step 1: Fetching user products...');
    const { data: products, error: fetchProductsError } = await supabase
      .from('products')
      .select('image_url')
      .eq('vendor_id', userId);

    if (fetchProductsError) {
      console.warn('Error fetching products:', fetchProductsError);
    } else if (products && products.length > 0) {
      console.log('Found', products.length, 'products to delete images for');
      
      // Delete product images from storage
      for (const product of products) {
        if (product.image_url && product.image_url.includes('supabase')) {
          try {
            const urlParts = product.image_url.split('/storage/v1/object/public/products/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              await supabase.storage
                .from('products')
                .remove([filePath]);
              console.log('Deleted product image:', filePath);
            }
          } catch (imgError) {
            console.warn('Failed to delete product image:', imgError);
            // Continue with deletion even if image deletion fails
          }
        }
      }
    }

    // Step 2: Get user profile to delete profile photo
    console.log('Step 2: Fetching user profile...');
    const { data: profile, error: fetchProfileError } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (fetchProfileError && fetchProfileError.code !== 'PGRST116') {
      console.warn('Error fetching profile:', fetchProfileError);
    } else if (profile && profile.avatar_url && profile.avatar_url.includes('supabase')) {
      try {
        const urlParts = profile.avatar_url.split('/storage/v1/object/public/avatars/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage
            .from('avatars')
            .remove([filePath]);
          console.log('Deleted profile avatar:', filePath);
        }
      } catch (avatarError) {
        console.warn('Failed to delete avatar:', avatarError);
        // Continue with deletion even if avatar deletion fails
      }
    }

    // Step 3: Delete all products created by user
    console.log('Step 3: Deleting user products from database...');
    const { data: deleteProductsData, error: productsError, count: deletedProductsCount } = await supabase
      .from('products')
      .delete()
      .eq('vendor_id', userId)
      .select('id');

    console.log('Delete products response:', { data: deleteProductsData, error: productsError, count: deletedProductsCount });
    
    if (productsError) {
      console.error('Error deleting products:', productsError);
      throw new Error(`Failed to delete product data: ${productsError.message}`);
    }
    
    const deletedCount = deleteProductsData?.length || 0;
    console.log(`Products deleted successfully: ${deletedCount} products removed`);

    // Step 4: Delete user profile from user_profiles table
    console.log('Step 4: Deleting user profile...');
    const { data: deleteProfileData, error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)
      .select('id');

    console.log('Delete profile response:', { data: deleteProfileData, error: profileError });
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error(`Failed to delete profile data: ${profileError.message}`);
    }
    
    const profileDeleted = deleteProfileData?.length > 0;
    console.log('Profile deleted successfully:', profileDeleted);

    // Step 5: Delete auth user via Edge Function (secure)
    console.log('Step 5: Deleting auth user via Edge Function...');
    try {
      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Call Edge Function to delete user (with service role access)
      const supabaseUrl = 'https://uuflnhsbctfwappzenyy.supabase.co';
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.details || result.error || 'Failed to delete auth user');
      }

      console.log('Auth user deleted successfully via Edge Function');
      
      // Sign out the user session
      await supabase.auth.signOut();
      console.log('User signed out successfully');
      
    } catch (deleteError) {
      console.error('Auth user deletion error:', deleteError);
      
      // Check if it's a network/Edge Function deployment issue
      const errorMessage = deleteError.message || '';
      const isNetworkError = errorMessage.includes('fetch') || 
                            errorMessage.includes('Network') || 
                            errorMessage.includes('Failed to fetch');
      
      // Sign out user anyway since data is deleted from database
      try {
        await supabase.auth.signOut();
        console.log('User signed out (despite auth deletion error)');
      } catch (signOutError) {
        console.warn('Error signing out:', signOutError);
      }
      
      if (isNetworkError) {
        throw new Error('Database cleanup successful. Auth deletion requires Edge Function deployment. Please redeploy the delete-user function or contact support.');
      } else {
        throw new Error('Database cleanup successful, but auth user deletion failed. Please try again or contact support.');
      }
    }

    console.log('Account deletion completed successfully');
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

/**
 * Get current user session
 * @returns {Promise} Current user session
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

/**
 * Sign out user
 * @returns {Promise} Sign out result
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    console.log('User signed out successfully');
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
