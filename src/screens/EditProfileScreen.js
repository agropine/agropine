import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppButton,
    AppCard,
    AppHeader,
    AppInput,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validateAndCompressImage } from '../lib/imageService';
import { deleteProfilePhoto, uploadProfilePhoto } from '../lib/imageUploadService';
import { supabase } from '../lib/supabase';
import { showErrorToast, showSuccessToast } from '../lib/toastService';
import { fetchUserProfile, formatProfileData, updateUserProfile } from '../lib/userProfileService';
import { validateAddress, validateDescription, validateName, validatePhone, validateSocialMedia } from '../lib/validationService';
import { fontStyles } from '../styles/fonts';

// Temporary flag: set to true to disable image uploads
const IMAGE_UPLOADS_DISABLED = false;
const IMAGE_UPLOAD_MESSAGE = 'Image uploads are temporarily unavailable. You can save your profile without changing your photo.';

const EditProfileScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { userProfile } = route.params || {};
  console.log('EditProfileScreen - received userProfile:', userProfile);
  
  const [editedProfile, setEditedProfile] = useState(userProfile || {
    name: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    memberSince: '',
    shortDescription: '',
    harvestMonth: '',
    avatar: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
    facebook: '',
    businessRegistrationNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showHarvestMonthPicker, setShowHarvestMonthPicker] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!userProfile); // Show loading if no userProfile provided
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const harvestMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch user profile if not provided via route params
  useEffect(() => {
    if (!userProfile && user?.id) {
      const loadProfile = async () => {
        try {
          const { data: dbProfile, error } = await fetchUserProfile(user.id);
          console.log('Raw DB Profile:', dbProfile);
          
          if (error) {
            console.error('Error fetching profile:', error);
            setIsLoadingProfile(false);
            return;
          }
          
          if (dbProfile) {
            const formattedProfile = formatProfileData(dbProfile);
            console.log('Formatted Profile:', formattedProfile);
            setEditedProfile(formattedProfile);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      loadProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [user?.id, userProfile]);

  useEffect(() => {
    console.log('editedProfile.avatar changed:', editedProfile.avatar);
  }, [editedProfile.avatar]);

  // Handle back button - go back to Profile screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Profile');
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const validateField = (fieldName, value) => {
    let error = null;
    
    switch (fieldName) {
      case 'name':
        const nameValidation = validateName(value);
        error = nameValidation.error;
        break;
      case 'phone':
        const phoneValidation = validatePhone(value);
        error = phoneValidation.error;
        break;
      case 'address':
        const addressValidation = validateAddress(value);
        error = addressValidation.error;
        break;
      case 'shortDescription':
        const descValidation = validateDescription(value);
        error = descValidation.error;
        break;
      case 'whatsapp':
      case 'instagram':
      case 'tiktok':
      case 'facebook':
        const socialValidation = validateSocialMedia(fieldName, value);
        error = socialValidation.error;
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    return !error;
  };

  const handleFieldBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    validateField(fieldName, editedProfile[fieldName]);
  };

  const handleFieldChange = (fieldName, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Validate in real-time if field has been touched
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  };

  const validateAllFields = () => {
    let isValid = true;
    const requiredFields = ['name', 'phone', 'address', 'shortDescription'];
    
    requiredFields.forEach(field => {
      if (!validateField(field, editedProfile[field])) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handlePickPhoto = async () => {
    console.log('handlePickPhoto called');
    
    if (IMAGE_UPLOADS_DISABLED) {
      Alert.alert('Image Uploads Disabled', IMAGE_UPLOAD_MESSAGE);
      return;
    }
    
    try {
      // Request permission
      console.log('Requesting image picker permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Permission denied:', status);
        Alert.alert('Permission Denied', 'You need to allow photo library access to change your profile photo.');
        return;
      }

      console.log('Permission granted, launching image picker...');
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (result.canceled) {
        console.log('Image picker cancelled by user');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('No assets returned');
        Alert.alert('Error', 'No image selected');
        return;
      }

      console.log('Image selected successfully');
      setUploadingPhoto(true);
      
      // Compress image before upload
      const selectedImageUri = result.assets[0].uri;
      const compressionResult = await validateAndCompressImage(selectedImageUri);
      
      if (!compressionResult.isValid) {
        showErrorToast(compressionResult.error);
        setUploadingPhoto(false);
        return;
      }
      
      try {
        // Delete old photo if exists
        if (editedProfile.avatar) {
          console.log('Deleting old photo:', editedProfile.avatar);
          const deleteResult = await deleteProfilePhoto(editedProfile.avatar);
          console.log('Delete result:', deleteResult);
        }

        // Convert to format expected by uploadProfilePhoto
        const imageResponse = {
          assets: [
            {
              uri: result.assets[0].uri,
              type: 'image/jpeg',
            }
          ]
        };

        // Upload new photo
        console.log('Uploading new photo...');
        const uploadResult = await uploadProfilePhoto(user.id, imageResponse);
        console.log('Upload result:', uploadResult);

        if (uploadResult.error) {
          console.error('Upload failed:', uploadResult.error);
          Alert.alert('Error', 'Failed to upload photo: ' + uploadResult.error.message);
          setUploadingPhoto(false);
          return;
        }

        if (!uploadResult.url) {
          console.error('No URL returned from upload');
          Alert.alert('Error', 'Failed to get photo URL after upload');
          setUploadingPhoto(false);
          return;
        }

        // Update profile with new avatar URL
        console.log('Updating profile with new avatar URL:', uploadResult.url);
        const updatedProfile = { ...editedProfile, avatar: uploadResult.url };
        setEditedProfile(updatedProfile);
        setUploadingPhoto(false);
        Alert.alert('Success', 'Photo updated successfully. Tap "Save Profile" to save changes.');
      } catch (err) {
        console.error('Photo upload error:', err);
        setUploadingPhoto(false);
        Alert.alert('Error', 'Failed to update photo: ' + (err.message || String(err)));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker: ' + (error.message || String(error)));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validate all fields before saving
    if (!validateAllFields()) {
      showErrorToast('Please fix all errors before saving');
      return;
    }

    // Sanitize inputs
    const sanitizedProfile = {
      ...editedProfile,
      name: editedProfile.name?.trim().substring(0, 100) || '',
      bio: editedProfile.bio?.trim().substring(0, 500) || '',
      phone: editedProfile.phone?.trim().replace(/[^\d\s\+\-\(\)]/g, '').substring(0, 20) || '',
      address: editedProfile.address?.trim().substring(0, 255) || '',
    };

    setSaving(true);
    try {
      console.log('Saving profile with data:', sanitizedProfile);
      const { error } = await updateUserProfile(user.id, sanitizedProfile);
      console.log('Profile save result - error:', error);
      
      if (error) {
        showErrorToast(error.message || 'Failed to save profile');
        return;
      }

      showSuccessToast('Profile updated successfully!');
      
      // If name was changed, also update authentication metadata
      if (sanitizedProfile.name && sanitizedProfile.name !== user.user_metadata?.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: sanitizedProfile.name }
        });
        if (authError) {
          console.warn('Profile saved but couldn\'t sync name to account:', authError.message);
        }
      }

      // Navigate back to Profile screen after a short delay to allow toast to display
      setTimeout(() => {
        console.log('Navigating to Profile with updatedProfile:', sanitizedProfile);
        navigation.navigate('Profile', { updatedProfile: sanitizedProfile });
      }, 1500);
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AppHeader
            title="Edit Profile"
            onBackPress={handleCancel}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
              {/* Avatar Section */}
              <AppCard elevated style={{ padding: 16, alignItems: 'center', marginBottom: 16 }}>
                {editedProfile.avatar ? (
                  <Image
                    source={{ uri: editedProfile.avatar }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: colors.surfaceContainer,
                      marginBottom: 12,
                    }}
                    pointerEvents="none"
                  />
                ) : (
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: colors.surfaceContainer,
                      marginBottom: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name="user" size={40} color="#D1D5DB" />
                  </View>
                )}
                <View pointerEvents="auto">
                  <Pressable 
                    onPress={handlePickPhoto}
                    disabled={uploadingPhoto || saving}
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: uploadingPhoto ? '#CCCCCC' : (pressed ? '#0051D3' : '#007AFF'),
                        borderRadius: 8,
                        opacity: uploadingPhoto ? 0.6 : (pressed ? 0.8 : 1),
                        alignSelf: 'center',
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                      {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </Text>
                  </Pressable>
                </View>
              </AppCard>

              {/* Edit Form */}
              <AppCard elevated style={{ gap: 12, padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text, marginBottom: 8 }}>
                  Personal Information
                </Text>

                <AppInput
                  label="Full Name"
                  value={editedProfile.name}
                  onChangeText={(text) => handleFieldChange('name', text)}
                  onBlur={() => handleFieldBlur('name')}
                  placeholder="Enter your full name"
                  error={touched.name ? errors.name : null}
                />

                <AppInput
                  label="Email"
                  value={editedProfile.email}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                  keyboardType="email-address"
                  placeholder="Enter your email"
                  editable={false}
                />

                <AppInput
                  label="Phone"
                  value={editedProfile.phone}
                  onChangeText={(text) => handleFieldChange('phone', text)}
                  onBlur={() => handleFieldBlur('phone')}
                  keyboardType="phone-pad"
                  placeholder="Enter your phone number"
                  error={touched.phone ? errors.phone : null}
                />

                <AppInput
                  label="Address"
                  value={editedProfile.address}
                  onChangeText={(text) => handleFieldChange('address', text)}
                  onBlur={() => handleFieldBlur('address')}
                  multiline
                  numberOfLines={3}
                  placeholder="Enter your address"
                  error={touched.address ? errors.address : null}
                />

                <AppInput
                  label="Latitude"
                  value={editedProfile.latitude}
                  onChangeText={(text) => handleFieldChange('latitude', text)}
                  onBlur={() => handleFieldBlur('latitude')}
                  placeholder="e.g. 3.1395"
                  keyboardType="decimal-pad"
                />

                <AppInput
                  label="Longitude"
                  value={editedProfile.longitude}
                  onChangeText={(text) => handleFieldChange('longitude', text)}
                  onBlur={() => handleFieldBlur('longitude')}
                  placeholder="e.g. 101.6869"
                  keyboardType="decimal-pad"
                />

                <AppInput
                  label="Short Description"
                  value={editedProfile.shortDescription}
                  onChangeText={(text) => handleFieldChange('shortDescription', text)}
                  onBlur={() => handleFieldBlur('shortDescription')}
                  multiline
                  numberOfLines={3}
                  placeholder="Tell customers about your business"
                  error={touched.shortDescription ? errors.shortDescription : null}
                />

                <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginTop: 12, marginBottom: 6 }}>
                  Harvest Month (Optional)
                </Text>
                <Pressable
                  onPress={() => setShowHarvestMonthPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.surface,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: editedProfile.harvestMonth ? colors.text : colors.textTertiary }}>
                    {editedProfile.harvestMonth || 'Select a harvest month'}
                  </Text>
                  <Feather name="chevron-down" size={20} color={colors.textSecondary} />
                </Pressable>

                {/* Harvest Month Picker Modal */}
                <Modal
                  visible={showHarvestMonthPicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowHarvestMonthPicker(false)}
                >
                  <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }}>
                      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                          Select Harvest Month
                        </Text>
                        <Pressable onPress={() => setShowHarvestMonthPicker(false)}>
                          <Feather name="x" size={24} color={colors.textSecondary} />
                        </Pressable>
                      </View>
                      <ScrollView style={{ maxHeight: 400 }}>
                        {harvestMonths.map((month, index) => (
                          <Pressable
                            key={month}
                            onPress={() => {
                              setEditedProfile({ ...editedProfile, harvestMonth: month });
                              setShowHarvestMonthPicker(false);
                            }}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.text }}>
                              {month}
                            </Text>
                            {editedProfile.harvestMonth === month && (
                              <Feather name="check" size={20} color="#007AFF" />
                            )}
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>

                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginTop: 12 }}>Business Information</Text>

                <AppInput
                  label="Business Registration Number"
                  value={editedProfile.businessRegistrationNumber}
                  onChangeText={(text) => handleFieldChange('businessRegistrationNumber', text)}
                  onBlur={() => handleFieldBlur('businessRegistrationNumber')}
                  placeholder="Enter your business registration number (to get verified badge)"
                />

                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginTop: 12 }}>Social Media</Text>

                <AppInput
                  label="WhatsApp"
                  value={editedProfile.whatsapp}
                  onChangeText={(text) => handleFieldChange('whatsapp', text)}
                  onBlur={() => handleFieldBlur('whatsapp')}
                  keyboardType="phone-pad"
                  placeholder="Enter your WhatsApp number"
                  error={touched.whatsapp ? errors.whatsapp : null}
                />

                <AppInput
                  label="Instagram"
                  value={editedProfile.instagram}
                  onChangeText={(text) => handleFieldChange('instagram', text)}
                  onBlur={() => handleFieldBlur('instagram')}
                  placeholder="Enter your Instagram handle"
                  error={touched.instagram ? errors.instagram : null}
                />

                <AppInput
                  label="TikTok"
                  value={editedProfile.tiktok}
                  onChangeText={(text) => handleFieldChange('tiktok', text)}
                  onBlur={() => handleFieldBlur('tiktok')}
                  placeholder="Enter your TikTok handle"
                  error={touched.tiktok ? errors.tiktok : null}
                />

                <AppInput
                  label="Facebook"
                  value={editedProfile.facebook}
                  onChangeText={(text) => handleFieldChange('facebook', text)}
                  onBlur={() => handleFieldBlur('facebook')}
                  placeholder="Enter your Facebook page name"
                  error={touched.facebook ? errors.facebook : null}
                />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <AppButton
                    title={saving ? 'Saving...' : 'Save Changes'}
                    onPress={handleSaveProfile}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={saving}
                  />
                  <AppButton
                    title="Cancel"
                    onPress={handleCancel}
                    variant="secondary"
                    style={{ flex: 1 }}
                    disabled={saving}
                  />
                </View>
              </AppCard>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
