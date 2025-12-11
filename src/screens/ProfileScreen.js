import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, BackHandler, Image, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppCard,
    AppHeader,
    FacebookIcon,
    InstagramIcon,
    TikTokIcon,
    WhatsAppIcon
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchVendorProducts } from '../lib/productService';
import { openFacebook, openInstagram, openTikTok, openWhatsApp } from '../lib/socialMediaService';
import { fetchUserProfile, formatProfileData } from '../lib/userProfileService';
import { fontStyles } from '../styles/fonts';

const ProfileScreen = ({ navigation, route }) => {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const vendorId = route?.params?.vendorId; // Get vendorId if viewing another vendor
  const isViewingOtherVendor = vendorId && vendorId !== user?.id;
  const actionSheetRef = useRef(null);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    memberSince: '',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    shortDescription: 'Premium pineapple vendor with fresh produce',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    whatsapp: '+1 (555) 123-4567',
    instagram: '@johndoe_pineapple',
    tiktok: '@johndoe',
    facebook: 'John Doe Pineapple',
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  // Check if profile is incomplete (only required fields)
  const isProfileIncomplete = () => {
    // Required fields: name, phone, address, description
    // Optional: social media, harvest month, business registration
    const noName = !userProfile.name || userProfile.name.trim() === '' || userProfile.name?.includes('@');
    const noDescription = !userProfile.shortDescription || userProfile.shortDescription.trim() === '' || userProfile.shortDescription === 'Premium pineapple vendor with fresh produce';
    const noPhone = !userProfile.phone || userProfile.phone.trim() === '' || userProfile.phone === '+1 (555) 123-4567';
    const noAddress = !userProfile.address || userProfile.address.trim() === '' || userProfile.address === '123 Main Street, City, State 12345';
    
    return noName || noDescription || noPhone || noAddress;
  };

  // Check if user is still logged in when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (!isViewingOtherVendor && !user) {
        // User has been logged out (e.g., account deleted), navigate to Home
        console.log('User logged out, navigating to Home');
        navigation.navigate('Home');
      }
    }, [user, isViewingOtherVendor, navigation])
  );

  // Fetch user profile data from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Determine which user ID to fetch (vendorId if viewing other vendor, otherwise current user)
        const profileUserId = isViewingOtherVendor ? vendorId : user?.id;
        
        if (profileUserId) {
          console.log('Fetching profile for user:', profileUserId);
          const { data: dbProfile, error } = await fetchUserProfile(profileUserId);
          console.log('Fetched profile from DB:', dbProfile);
          
          if (dbProfile) {
            const formattedProfile = formatProfileData(dbProfile);
            console.log('Formatted profile:', formattedProfile);
            
            // For vendor profiles, we don't have created_at, so we'll use current year as fallback
            const memberSince = dbProfile.created_at ? new Date(dbProfile.created_at).getFullYear() : new Date().getFullYear();

            const updatedProfile = {
              ...formattedProfile,
              memberSince: memberSince.toString(),
            };
            console.log('Updated profile with memberSince:', updatedProfile);
            setUserProfile(updatedProfile);
          } else {
            // Fallback to auth metadata if no database profile (only for current user)
            if (!isViewingOtherVendor && user) {
              const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
              const createdDate = new Date(user.created_at);
              const memberSince = createdDate.getFullYear();

              setUserProfile((prev) => ({
                ...prev,
                name: fullName,
                email: user.email,
                memberSince: memberSince.toString(),
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, vendorId, isViewingOtherVendor]);

  // Handle updated profile from EditProfile route params  
  useEffect(() => {
    const updatedProfile = route?.params?.updatedProfile;
    if (updatedProfile && !isViewingOtherVendor) {
      console.log('ProfileScreen: Received updatedProfile from route params:', updatedProfile);
      setUserProfile(prev => ({
        ...prev,
        ...updatedProfile,
      }));
      // Clear the route param so it doesn't trigger again
      navigation.setParams({ updatedProfile: undefined });
    }
  }, [route?.params?.updatedProfile, isViewingOtherVendor, navigation]);

  // Show profile completion prompt only when user navigates to profile page with incomplete profile
  useFocusEffect(
    useCallback(() => {
      // Only show once per session when user accesses their profile page
      // Ensure user is authenticated before showing prompt
      if (!isViewingOtherVendor && !loading && user && isProfileIncomplete() && !showProfilePrompt) {
        setShowProfilePrompt(true);
        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Cancel', 'Complete Profile'],
              cancelButtonIndex: 0,
              destructiveButtonIndex: 1,
              title: 'Welcome!',
              message: 'Your profile is incomplete. Please complete your profile to get started.',
            },
            (buttonIndex) => {
              if (buttonIndex === 1) {
                navigation.navigate('EditProfile', { userProfile });
              }
            }
          );
        } else {
          Alert.alert(
            'Welcome!',
            'Your profile is incomplete. Please complete your profile to get started.',
            [
              { text: 'Cancel', onPress: () => {} },
              { text: 'Complete Profile', onPress: () => navigation.navigate('EditProfile', { userProfile }) },
            ]
          );
        }
      }
    }, [loading, isViewingOtherVendor, user, userProfile, showProfilePrompt, navigation])
  );

  // Handle back button - go back to Home if viewing own profile, or to previous screen if viewing vendor
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isViewingOtherVendor) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, isViewingOtherVendor])
  );

  const handleProfileBackPress = () => {
    if (isViewingOtherVendor) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const profileUserId = isViewingOtherVendor ? vendorId : user?.id;
      
      if (profileUserId) {
        const { data: dbProfile, error } = await fetchUserProfile(profileUserId);
        
        if (dbProfile) {
          const formattedProfile = formatProfileData(dbProfile);
          const memberSince = dbProfile.created_at ? new Date(dbProfile.created_at).getFullYear() : new Date().getFullYear();
          const updatedProfile = {
            ...formattedProfile,
            memberSince: memberSince.toString(),
          };
          setUserProfile(updatedProfile);
        }
      }

      const productsUserId = isViewingOtherVendor ? vendorId : user?.id;
      if (productsUserId) {
        const { data: vendorProducts, error } = await fetchVendorProducts(productsUserId);
        if (!error && vendorProducts) {
          setProducts(vendorProducts || []);
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch vendor products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Determine which user's products to fetch
        const productsUserId = isViewingOtherVendor ? vendorId : user?.id;
        
        if (productsUserId) {
          console.log('Fetching products for vendor:', productsUserId);
          const { data: vendorProducts, error } = await fetchVendorProducts(productsUserId);
          if (error) {
            console.error('Error fetching products:', error);
            return;
          }
          console.log('Fetched vendor products:', vendorProducts);
          setProducts(vendorProducts || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, [user, vendorId, isViewingOtherVendor]);

  // Refetch profile and products when screen is focused (after returning from EditProfile or AddProduct)
  // Only refetch if viewing own profile
  useFocusEffect(
    useCallback(() => {
      if (isViewingOtherVendor) {
        // Don't refetch when viewing other vendor profiles
        return;
      }

      const fetchProfile = async () => {
        try {
          if (user) {
            console.log('Refetching profile on screen focus...');
            const { data: dbProfile, error } = await fetchUserProfile(user.id);
            console.log('Refetched profile from DB:', dbProfile);
            
            if (dbProfile) {
              const formattedProfile = formatProfileData(dbProfile);
              console.log('Refetched formatted profile:', formattedProfile);
              const createdDate = new Date(user.created_at);
              const memberSince = createdDate.getFullYear();

              const updatedProfile = {
                ...formattedProfile,
                memberSince: memberSince.toString(),
              };
              console.log('Refetched updated profile:', updatedProfile);
              setUserProfile(updatedProfile);
            }
          }
        } catch (error) {
          console.error('Error refetching user profile:', error);
        }
      };

      const refetchProducts = async () => {
        try {
          if (user) {
            console.log('Refetching products on screen focus...');
            const { data: vendorProducts, error } = await fetchVendorProducts(user.id);
            if (error) {
              console.error('Error refetching products:', error);
              return;
            }
            console.log('Refetched vendor products:', vendorProducts);
            setProducts(vendorProducts || []);
          }
        } catch (error) {
          console.error('Error refetching products:', error);
        }
      };

      fetchProfile();
      refetchProducts();
    }, [user, isViewingOtherVendor])
  );

  // Handle product updates from AddProductScreen or ProductDetail
  const handleProductUpdate = () => {
    // Refetch products when screen focus changes (triggered by useFocusEffect above)
  };

  const showMenuOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Profile', 'Settings', 'Logout'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
          tintColor: '#007AFF',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            navigation.navigate('EditProfile', { userProfile });
          } else if (buttonIndex === 2) {
            navigation.navigate('Settings');
          } else if (buttonIndex === 3) {
            // Handle Logout
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', onPress: () => {} },
              { 
                text: 'Logout', 
                onPress: async () => {
                  const { error } = await signOut();
                  if (!error) {
                    navigation.navigate('Auth', { mode: 'login' });
                  } else {
                    Alert.alert('Error', error.message);
                  }
                }, 
                style: 'destructive' 
              },
            ]);
          }
        }
      );
    } else {
      // For Android - use Alert.alert as action sheet alternative
      Alert.alert('Menu', 'Choose an option', [
        {
          text: 'Edit Profile',
          onPress: () => {
            navigation.navigate('EditProfile', { userProfile });
          },
        },
        {
          text: 'Settings',
          onPress: () => {
            navigation.navigate('Settings');
          },
        },
        {
          text: 'Logout',
          onPress: () => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', onPress: () => {} },
              { 
                text: 'Logout', 
                onPress: async () => {
                  const { error } = await signOut();
                  if (!error) {
                    navigation.navigate('Auth', { mode: 'login' });
                  } else {
                    Alert.alert('Error', error.message);
                  }
                }, 
                style: 'destructive' 
              },
            ]);
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader
          title={isViewingOtherVendor ? 'Vendor Profile' : 'Profile'}
          onBackPress={handleProfileBackPress}
          rightElement={
            !isViewingOtherVendor && (
              <Pressable onPress={showMenuOptions} hitSlop={10}>
                <Feather name="more-vertical" size={24} color={colors.text} />
              </Pressable>
            )
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <AppCard elevated style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                <Pressable onPress={() => setIsImageViewerVisible(true)}>
                {userProfile.avatar ? (
                  <Image
                    source={{ uri: userProfile.avatar }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.surfaceContainer,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.surfaceContainer,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name="user" size={32} color={colors.textTertiary} />
                  </View>
                )}
                </Pressable>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 20, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>
                        {userProfile.name}
                      </Text>
                      {userProfile.isVerified && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                          <Feather name="check-circle" size={14} color="#10B981" />
                          <Text style={{ fontSize: 11, fontWeight: '600', ...fontStyles.semibold, color: '#10B981' }}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                      Member since {userProfile.memberSince}
                    </Text>
                    <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary, marginTop: 4 }}>
                      {userProfile.shortDescription}
                    </Text>
                  </View>
                </View>
              </View>
            </AppCard>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
              <AppCard elevated style={{ flex: 1, padding: 12, gap: 4 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500', ...fontStyles.medium }}>Email</Text>
                <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.text }}>{userProfile.email}</Text>
              </AppCard>
              <AppCard elevated style={{ flex: 1, padding: 12, gap: 4 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500', ...fontStyles.medium }}>Phone</Text>
                <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.text }}>{userProfile.phone}</Text>
              </AppCard>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {userProfile.businessRegistrationNumber && (
              <AppCard elevated style={{ gap: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text, marginBottom: 4 }}>Business Information</Text>
                <View style={{ gap: 8 }}>
                  <View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500', ...fontStyles.medium }}>Registration Number</Text>
                    <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.text, marginTop: 4 }}>{userProfile.businessRegistrationNumber}</Text>
                  </View>
                </View>
              </AppCard>
            )}
            <AppCard elevated style={{ gap: 12, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text, marginBottom: 8 }}>Social Media</Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                {userProfile.whatsapp && (
                  <Pressable onPress={() => openWhatsApp(userProfile.whatsapp)}>
                    <WhatsAppIcon size={24} color="#25D366" />
                  </Pressable>
                )}
                {userProfile.instagram && (
                  <Pressable onPress={() => openInstagram(userProfile.instagram)}>
                    <InstagramIcon size={24} color="#E1306C" />
                  </Pressable>
                )}
                {userProfile.tiktok && (
                  <Pressable onPress={() => openTikTok(userProfile.tiktok)}>
                    <TikTokIcon size={24} color="#000000" />
                  </Pressable>
                )}
                {userProfile.facebook && (
                  <Pressable onPress={() => openFacebook(userProfile.facebook)}>
                    <FacebookIcon size={24} color="#1877F2" />
                  </Pressable>
                )}
              </View>
            </AppCard>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <AppCard elevated style={{ gap: 12, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Location</Text>
              <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.text, marginBottom: 12 }}>{userProfile.address}</Text>
              {userProfile.latitude && userProfile.longitude ? (
                <Pressable
                  onPress={() => {
                    const lat = userProfile.latitude;
                    const lng = userProfile.longitude;
                    const url = Platform.OS === 'ios' 
                      ? `maps://0,0?q=${lat},${lng}` 
                      : `geo:${lat},${lng}`;
                    Linking.openURL(url).catch(() => console.warn('Cannot open maps'));
                  }}
                  style={{ width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}
                >
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={{ width: '100%', height: 200 }}
                    initialRegion={{
                      latitude: parseFloat(userProfile.latitude),
                      longitude: parseFloat(userProfile.longitude),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(userProfile.latitude),
                        longitude: parseFloat(userProfile.longitude),
                      }}
                      title={userProfile.name}
                      description={userProfile.address}
                    />
                  </MapView>
                  <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ fontSize: 11, ...fontStyles.regular, color: '#007AFF' }}>Open in Maps</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={{ width: '100%', height: 200, borderRadius: 8, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="map" size={32} color={colors.textSecondary} />
                  <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary, marginTop: 8 }}>
                    No location coordinates
                  </Text>
                </View>
              )}
            </AppCard>
          </View>

          {userProfile.harvestMonth && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <AppCard elevated style={{ gap: 12, padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Harvest Month</Text>
                <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.text }}>{userProfile.harvestMonth}</Text>
              </AppCard>
            </View>
          )}



          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Products</Text>
              {!isViewingOtherVendor && (
                <Pressable onPress={() => navigation.navigate('AddProduct')}>
                  <Feather name="plus-circle" size={24} color="#007AFF" />
                </Pressable>
              )}
            </View>

            <View style={{ gap: 8 }}>
              {products && products.length > 0 ? (
                products.map((product) => (
                  <Pressable key={product.id} onPress={() => navigation.navigate('ProductDetail', { product })}>
                    <AppCard elevated style={{ gap: 12, padding: 12 }}>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                        <Image
                          source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            backgroundColor: colors.surfaceContainer,
                          }}
                        />
                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                          <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                              {product.name}
                            </Text>
                            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                              {product.category}
                            </Text>
                            {product.description && (
                              <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary, marginTop: 4 }} numberOfLines={2}>
                                {product.description}
                              </Text>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                              {product.price && (
                                <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                                  {product.category?.toLowerCase().trim() === 'raw' ? `RM${product.price} / per kg` : `RM${product.price}`}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </AppCard>
                  </Pressable>
                ))
              ) : (
                <AppCard elevated style={{ gap: 12, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="package" size={48} color="#D1D5DB" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 4 }}>
                    No products yet
                  </Text>
                  <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, textAlign: 'center' }}>
                    {isViewingOtherVendor ? 'This vendor hasn\'t added any products' : 'Start adding your products to showcase'}
                  </Text>
                  {!isViewingOtherVendor && (
                    <Pressable
                      onPress={() => navigation.navigate('AddProduct')}
                      style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#007AFF', borderRadius: 8 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                        Add Product
                      </Text>
                    </Pressable>
                  )}
                </AppCard>
              )}
            </View>
          </View>

        </ScrollView>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setIsImageViewerVisible(false)}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Feather name="x" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Profile Image */}
          {userProfile.avatar ? (
            <Image
              source={{ uri: userProfile.avatar }}
              style={{
                width: '90%',
                height: '70%',
                resizeMode: 'contain',
              }}
            />
          ) : (
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: colors.surfaceContainer,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Feather name="user" size={80} color={colors.textTertiary} />
            </View>
          )}

          {/* User Name */}
          <Text style={{ 
            position: 'absolute', 
            bottom: 50, 
            fontSize: 18, 
            fontWeight: '600', 
            ...fontStyles.semibold, 
            color: '#FFFFFF',
            textAlign: 'center',
          }}>
            {userProfile.name}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
