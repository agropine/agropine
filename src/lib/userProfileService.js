import { supabase } from './supabase';

/**
 * Fetch user profile from database
 */
export const fetchUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

/**
 * Create user profile (called after signup)
 * Note: If a database trigger is set up, the profile will be created automatically
 * This function serves as a fallback/upsert to ensure the profile exists
 */
export const createUserProfile = async (userId, email, fullName) => {
  try {
    console.log('Creating/upserting profile for userId:', userId, 'email:', email, 'fullName:', fullName);
    
    // Use upsert to handle cases where profile might already exist (from trigger)
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          phone: '',
          address: '',
          description: '',
          harvest_month: '',
          social_media: {
            whatsapp: '',
            instagram: '',
            tiktok: '',
            facebook: '',
          },
          avatar_url: '',
          business_registration_number: '',
          is_verified: false,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error.message, error.code, error.details);
      throw error;
    }
    console.log('Profile created/updated successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user profile:', error.message || error);
    return { data: null, error };
  }
};

/**
 * Update user profile (or create if doesn't exist)
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log('updateUserProfile called with:', userId, profileData);
    
    if (!userId) {
      throw new Error('User ID is required for profile update');
    }

    // Validate required fields
    if (!profileData.name) {
      throw new Error('Name is required');
    }

    // Use upsert to create or update
    const updateData = {
      id: userId,
      email: profileData.email || '',
      full_name: profileData.name,
      phone: profileData.phone || '',
      address: profileData.address || '',
      description: profileData.shortDescription || '',
      harvest_month: profileData.harvestMonth || '',
      social_media: {
        whatsapp: profileData.whatsapp || '',
        instagram: profileData.instagram || '',
        tiktok: profileData.tiktok || '',
        facebook: profileData.facebook || '',
      },
      avatar_url: profileData.avatar || '',
      latitude: profileData.latitude || null,
      longitude: profileData.longitude || null,
      business_registration_number: profileData.businessRegistrationNumber || '',
      // Set is_verified to true if business_registration_number is provided
      is_verified: !!(profileData.businessRegistrationNumber && profileData.businessRegistrationNumber.trim()),
      updated_at: new Date().toISOString(),
    };

    console.log('Sending update data:', updateData);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(updateData, {
        onConflict: 'id'
      })
      .select()
      .maybeSingle();

    console.log('Update result - data:', data, 'error:', error);

    if (error) {
      console.error('Supabase error details:', error.message, error.code, error.details);
      throw error;
    }
    
    if (!data) {
      console.warn('Update succeeded but no data returned');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

/**
 * Get user profile by email
 */
export const getUserProfileByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile by email:', error);
    return { data: null, error };
  }
};

/**
 * Format database profile to UI profile
 */
export const formatProfileData = (dbProfile) => {
  if (!dbProfile) return null;

  return {
    name: dbProfile.full_name || '',
    email: dbProfile.email || '',
    phone: dbProfile.phone || '',
    address: dbProfile.address || '',
    shortDescription: dbProfile.description || '',
    harvestMonth: dbProfile.harvest_month || '',
    avatar: dbProfile.avatar_url || '',
    latitude: dbProfile.latitude ? String(dbProfile.latitude) : '',
    longitude: dbProfile.longitude ? String(dbProfile.longitude) : '',
    whatsapp: dbProfile.social_media?.whatsapp || '',
    instagram: dbProfile.social_media?.instagram || '',
    tiktok: dbProfile.social_media?.tiktok || '',
    facebook: dbProfile.social_media?.facebook || '',
    businessRegistrationNumber: dbProfile.business_registration_number || '',
    isVerified: dbProfile.is_verified || false,
  };
};

/**
 * Fetch vendor verification status for multiple vendor IDs
 */
export const fetchVendorsVerificationStatus = async (vendorIds) => {
  if (!vendorIds || vendorIds.length === 0) {
    return { data: {}, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, is_verified')
      .in('id', vendorIds);

    if (error) throw error;

    // Convert to map for easy lookup
    const verificationMap = {};
    (data || []).forEach(vendor => {
      verificationMap[vendor.id] = vendor.is_verified || false;
    });

    return { data: verificationMap, error: null };
  } catch (error) {
    console.error('Error fetching vendor verification status:', error);
    return { data: {}, error };
  }
};
