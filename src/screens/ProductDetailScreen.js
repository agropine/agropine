import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppButton,
    AppCard,
    AppHeader
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteProduct, fetchProductById } from '../lib/productService';
import { fetchUserProfile, formatProfileData } from '../lib/userProfileService';
import { fontStyles } from '../styles/fonts';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product: initialProduct } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  // Fetch vendor profile
  useEffect(() => {
    const loadVendorProfile = async () => {
      try {
        if (product.vendor_id) {
          console.log('Fetching vendor profile for:', product.vendor_id);
          const { data: dbProfile, error } = await fetchUserProfile(product.vendor_id);
          if (error) {
            console.error('Error fetching vendor profile:', error);
            console.warn('Vendor profile fetch blocked - check RLS policies on user_profiles table');
            setVendorProfile(null);
            return;
          }
          if (dbProfile) {
            console.log('Fetched vendor profile:', dbProfile);
            const formattedProfile = formatProfileData(dbProfile);
            setVendorProfile(formattedProfile);
          } else {
            console.log('No vendor profile data returned');
            setVendorProfile(null);
          }
        }
      } catch (error) {
        console.error('Error loading vendor profile:', error);
        setVendorProfile(null);
      }
    };

    loadVendorProfile();
  }, [product]);

  // Refetch product data when screen comes back into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      const refreshProduct = async () => {
        try {
          const { data, error } = await fetchProductById(product.id);
          if (error) {
            console.error('Error refetching product:', error);
            return;
          }
          if (data) {
            console.log('Product refreshed:', data);
            setProduct(data);
          }
        } catch (err) {
          console.error('Error refreshing product:', err);
        }
      };

      refreshProduct();
    }, [product.id])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data: updatedProduct, error } = await fetchProductById(product.id);
      if (!error && updatedProduct) {
        setProduct(updatedProduct);
      }
    } catch (err) {
      console.error('Error refreshing product details:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if current user is the product owner
  useEffect(() => {
    if (user && product.vendor_id) {
      setIsOwner(user.id === product.vendor_id);
    }
  }, [user, product]);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  const handleEditProduct = () => {
    navigation.navigate('AddProduct', { editingProduct: product });
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setDeleting(true);
            try {
              // Delete product image from storage if exists
              if (product.image_url && product.image_url.includes('supabase')) {
                const { deleteProductImage } = require('../lib/imageUploadService');
                await deleteProductImage(product.image_url);
                console.log('Product image deleted from storage');
              }
              
              // Delete product from database
              const { error } = await deleteProduct(product.id);
              if (error) {
                Alert.alert('Error', 'Failed to delete product: ' + error.message);
                setDeleting(false);
                return;
              }
              Alert.alert('Success', 'Product deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (err) {
              Alert.alert('Error', 'An error occurred while deleting the product');
              console.error('Delete error:', err);
              setDeleting(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader
          title="Product Details"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
          {/* Product Image */}
          <View style={{ padding: 16 }}>
            <Pressable onPress={() => setIsImageViewerVisible(true)}>
              <Image
                source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
                style={{
                  width: '100%',
                  height: 300,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceContainer,
                }}
                resizeMode="cover"
              />
            </Pressable>
          </View>

          {/* Product Info - Title Only */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <AppCard elevated style={{ padding: 16, gap: 12 }}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>
                  {product.name}
                </Text>
              </View>
            </AppCard>
          </View>

          {/* Product Details */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <AppCard elevated style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text, marginBottom: 4 }}>
                Product Information
              </Text>

              {product.category && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Category</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.semibold, color: colors.text }}>{product.category}</Text>
                </View>
              )}

              {product.price && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Price</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.semibold, color: '#007AFF' }}>
                    {product.category?.toLowerCase().trim() === 'raw' ? `RM${product.price} / per kg` : `RM${product.price}`}
                  </Text>
                </View>
              )}

              {product.description && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Description</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.text, flex: 1, textAlign: 'right', marginLeft: 8 }}>
                    {product.description}
                  </Text>
                </View>
              )}

              {product.weight && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Weight</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.semibold, color: colors.text }}>{product.weight}</Text>
                </View>
              )}

              {product.stock !== undefined && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Stock</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.semibold, color: product.stock > 0 ? '#10B981' : '#EF4444' }}>
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </Text>
                </View>
              )}

              {product.origin && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Origin</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.semibold, color: colors.text }}>{product.origin}</Text>
                </View>
              )}

              {product.freshness && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>Freshness</Text>
                  <Text style={{ fontSize: 14, ...fontStyles.semibold, color: colors.text }}>{product.freshness}</Text>
                </View>
              )}
            </AppCard>
          </View>

          {/* Vendor Info */}
          {vendorProfile && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Pressable onPress={() => navigation.navigate('Profile', { vendorId: product.vendor_id })}>
                <AppCard elevated style={{ padding: 16, gap: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text, marginBottom: 4 }}>
                    Vendor Information
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {vendorProfile.avatar && (
                      <Image
                        source={{ uri: vendorProfile.avatar }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: colors.surfaceContainer,
                        }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                          {vendorProfile.name}
                        </Text>
                        {vendorProfile.isVerified && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Feather name="check-circle" size={12} color="#10B981" />
                            <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981' }}>Verified</Text>
                          </View>
                        )}
                      </View>
                      {vendorProfile.shortDescription && (
                        <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                          {vendorProfile.shortDescription}
                        </Text>
                      )}
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                  </View>
                </AppCard>
              </Pressable>
            </View>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
              <AppButton
                title="Edit Product"
                onPress={handleEditProduct}
                variant="primary"
              />
              <AppButton
                title={deleting ? 'Deleting...' : 'Delete Product'}
                onPress={handleDeleteProduct}
                disabled={deleting}
                variant="danger"
              />
            </View>
          )}
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

          {/* Product Image */}
          <Image
            source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
            style={{
              width: '90%',
              height: '70%',
              resizeMode: 'contain',
            }}
          />

          {/* Product Name */}
          <Text style={{ 
            position: 'absolute', 
            bottom: 50, 
            fontSize: 18, 
            fontWeight: '600', 
            ...fontStyles.semibold, 
            color: '#FFFFFF',
            textAlign: 'center',
            paddingHorizontal: 20,
          }}>
            {product.name}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;
