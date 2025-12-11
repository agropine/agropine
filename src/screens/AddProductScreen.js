import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppButton,
    AppCard,
    AppHeader,
    AppInput,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { uploadProductImage } from '../lib/imageUploadService';
import { createProduct, updateProduct } from '../lib/productService';
import { fontStyles } from '../styles/fonts';

// Temporary flag: set to true to disable image uploads
const IMAGE_UPLOADS_DISABLED = false;
const IMAGE_UPLOAD_MESSAGE = 'Image upload failed, but product was saved without image';

const AddProductScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const editingProduct = route?.params?.editingProduct;
  const isEditMode = !!editingProduct;

  const [product, setProduct] = useState({
    name: editingProduct?.name || '',
    description: editingProduct?.description || '',
    category: editingProduct?.category || 'Raw',
    price: editingProduct?.price?.toString() || '',
  });
  const [productImage, setProductImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(editingProduct?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const CATEGORIES = [
    { id: 'Raw', label: 'Raw' },
    { id: 'Processed', label: 'Processed' },
    { id: 'Beverages', label: 'Beverages' },
    { id: 'Goods', label: 'Goods' },
    { id: 'Health', label: 'Health' },
  ];

  const selectedCategory = CATEGORIES.find(cat => cat.id === product.category);

  const handlePickImage = async () => {
    if (IMAGE_UPLOADS_DISABLED) {
      Alert.alert('Image Uploads Disabled', IMAGE_UPLOAD_MESSAGE);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProductImage(result.assets[0]);
    }
  };

  const handleAddProduct = async () => {
    // Sanitize inputs
    const sanitizedName = product.name.trim().substring(0, 255);
    const sanitizedDescription = product.description.trim().substring(0, 1000);
    const sanitizedPrice = parseFloat(product.price);
    
    // Validation
    if (!sanitizedName) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }

    if (!sanitizedPrice || sanitizedPrice <= 0 || isNaN(sanitizedPrice)) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (sanitizedPrice > 1000000) {
      Alert.alert('Error', 'Price cannot exceed 1,000,000');
      return;
    }

    // Require image for new products
    if (!isEditMode && !productImage && !currentImageUrl) {
      Alert.alert('Error', 'Please select a product image');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = currentImageUrl;

      const productData = {
        name: sanitizedName,
        description: sanitizedDescription,
        category: product.category,
        price: sanitizedPrice,
        priceUnit: 'per kg',
        quantityAvailable: 0,
        quantityUnit: 'kg',
        imageUrl: imageUrl,
      };

      console.log(isEditMode ? 'Updating product with data:' : 'Adding product with data:', productData);
      
      let result;
      let productId;
      
      if (isEditMode) {
        result = await updateProduct(editingProduct.id, productData);
        productId = editingProduct.id;
      } else {
        result = await createProduct(user.id, productData);
        productId = result.data?.id;
      }

      const { data, error } = result;

      if (error) {
        Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} product: ` + error.message);
        return;
      }

      // Upload image after product is created/updated
      if (productImage && productId) {
        setUploadingImage(true);
        try {
          // Delete old image if updating
          if (isEditMode && currentImageUrl && currentImageUrl.includes('supabase')) {
            const { deleteProductImage } = require('../lib/imageUploadService');
            await deleteProductImage(currentImageUrl);
            console.log('Old product image deleted');
          }
          
          imageUrl = await uploadProductImage(user.id, productImage, productId);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (imgErr) {
          console.error('Image upload error:', imgErr);
          Alert.alert('Warning', 'Image upload failed, but product was saved');
        } finally {
          setUploadingImage(false);
        }
      }

      Alert.alert('Success', `Product ${isEditMode ? 'updated' : 'added'} successfully!`, [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} product: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AppHeader
            title={isEditMode ? 'Edit Product' : 'Add Product'}
            onBackPress={() => navigation.goBack()}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {/* Product Image */}
              <AppCard elevated style={{ gap: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}>
                {productImage ? (
                  <Image
                    source={{ uri: productImage.uri }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                ) : currentImageUrl ? (
                  <Image
                    source={{ uri: currentImageUrl }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceContainer,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textTertiary }}>No Image</Text>
                  </View>
                )}
                <Pressable
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: '#007AFF',
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                    {uploadingImage ? 'Uploading...' : (isEditMode && currentImageUrl ? 'Change Image' : 'Upload Image')}
                  </Text>
                </Pressable>
              </AppCard>

              {/* Product Details */}
              <AppCard elevated style={{ gap: 12, padding: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                  Product Details
                </Text>

                <AppInput
                  label="Product Name"
                  value={product.name}
                  onChangeText={(text) => setProduct({ ...product, name: text })}
                  placeholder="e.g., Fresh Pineapple"
                />

                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: colors.textSecondary }}>Category</Text>
                  <Pressable
                    onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: colors.surfaceContainer,
                    }}
                  >
                    <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.text }}>
                      {selectedCategory?.label || 'Select category'}
                    </Text>
                  </Pressable>

                  {showCategoryPicker && (
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            setProduct({ ...product, category: cat.id });
                            setShowCategoryPicker(false);
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            backgroundColor: product.category === cat.id ? '#007AFF' : colors.surfaceContainer,
                            borderRadius: 6,
                            borderLeftWidth: 3,
                            borderLeftColor: product.category === cat.id ? '#007AFF' : '#D1D5DB',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              ...fontStyles.regular,
                              color: product.category === cat.id ? '#FFFFFF' : colors.text,
                            }}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <AppInput
                  label="Description"
                  value={product.description}
                  onChangeText={(text) => setProduct({ ...product, description: text })}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe your product..."
                />
              </AppCard>

              {/* Pricing */}
              <AppCard elevated style={{ gap: 12, padding: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                  Pricing
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label={product.category === 'Raw' ? 'Price (per kg)' : 'Price'}
                      value={product.price}
                      onChangeText={(text) => setProduct({ ...product, price: text })}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </AppCard>

              {/* Summary */}
              <AppCard elevated style={{ gap: 12, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                  Summary
                </Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary }}>Product:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                      {product.name || 'Not set'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary }}>Price:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                      {product.price ? (product.category === 'Raw' ? `RM${parseFloat(product.price).toFixed(2)}/kg` : `RM${parseFloat(product.price).toFixed(2)}`) : 'Not set'}
                    </Text>
                  </View>
                </View>
              </AppCard>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
            <AppButton
              title={loading ? (isEditMode ? 'Updating Product...' : 'Adding Product...') : (isEditMode ? 'Update Product' : 'Add Product')}
              onPress={handleAddProduct}
              disabled={loading}
            />
            <AppButton
              title="Cancel"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddProductScreen;
