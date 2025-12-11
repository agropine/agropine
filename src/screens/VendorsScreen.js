import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppButton,
    AppHeader,
    AppInput,
    VendorCard
} from '../components';
import { VendorCardSkeleton } from '../components/SkeletonLoader';
import { useTheme } from '../context/ThemeContext';
import { cacheProducts, getCachedProducts } from '../lib/cacheService';
import { fetchProducts } from '../lib/productService';
import { fetchVendorsVerificationStatus } from '../lib/userProfileService';
import { batchGetVendorLocations, getCachedLocation } from '../lib/vendorLocationCache';
import { fontStyles } from '../styles/fonts';
import { createFadeSlideAnimation } from '../utils/animations';

const VendorsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  
  // Vendor location cache for reverse geocoding
  const [vendorLocationCache, setVendorLocationCache] = useState({}); // Trigger re-render when cache updates
  const [vendorVerificationCache, setVendorVerificationCache] = useState({}); // Cache for vendor verification status
  
  const fadeSlideAnimRef = useRef(createFadeSlideAnimation(300));
  const fadeSlideAnim = fadeSlideAnimRef.current;
  const dimensions = useWindowDimensions();
  const isTablet = dimensions.width >= 768;

  const categories = ['All', 'Raw', 'Processed', 'Beverages', 'Goods', 'Health'];
  const PAGE_SIZE = 12;

  // Helper function to get distance text for a vendor
  const getDistanceText = (product) => {
    if (!product.owner_latitude || !product.owner_longitude) {
      return 'Unknown Location';
    }
    
    // Use shared cache service
    const cachedLocation = getCachedLocation(product.owner_latitude, product.owner_longitude);
    if (cachedLocation) {
      return cachedLocation;
    }
    
    // Return placeholder while loading
    return 'Loading...';
  };

  // Populate vendor location cache
  useEffect(() => {
    const populateVendorLocations = async () => {
      const cache = await batchGetVendorLocations(allProducts);
      setVendorLocationCache(cache); // Trigger re-render
    };
    
    if (allProducts.length > 0) {
      populateVendorLocations();
    }
  }, [allProducts]);

  // Populate vendor verification cache
  useEffect(() => {
    const populateVendorVerification = async () => {
      try {
        if (allProducts.length === 0) return;

        // Get unique vendor IDs
        const vendorIds = [...new Set(allProducts.map(p => p.vendor_id))];
        
        // Fetch verification status for all vendors
        const { data: verificationMap, error } = await fetchVendorsVerificationStatus(vendorIds);
        
        if (!error && verificationMap) {
          setVendorVerificationCache(verificationMap);
        }
      } catch (error) {
        console.warn('Failed to fetch vendor verification status:', error);
      }
    };

    if (allProducts.length > 0) {
      populateVendorVerification();
    }
  }, [allProducts]);

  // Fetch products from database
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
    setError(null);
  }, [selectedCategory]);

  // Fetch first page on category change
  useEffect(() => {
    if (page === 1) {
      loadProducts(1, true);
    }
  }, [selectedCategory]);

  const loadProducts = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
        setError(null);
        setIsOffline(false);
      } else {
        setIsLoadingMore(true);
      }

      const offset = (pageNum - 1) * PAGE_SIZE;
      const filters = selectedCategory !== 'All' ? { category: selectedCategory, limit: PAGE_SIZE, offset } : { limit: PAGE_SIZE, offset };
      const cacheKey = selectedCategory !== 'All' ? `vendors_${selectedCategory}` : 'vendors_all';
      
      try {
        // Try to fetch from network
        const { data, error: fetchError, count } = await fetchProducts(filters);
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (data) {
          if (reset || pageNum === 1) {
            setAllProducts(data);
            // Cache first page results
            await cacheProducts(cacheKey, data);
          } else {
            setAllProducts(prev => [...prev, ...data]);
          }
          setPage(pageNum);
          // Check if there are more products to load
          setHasMore((offset + PAGE_SIZE) < (count || 0));
        }
      } catch (networkError) {
        // Network failed, try cache (only on first page load)
        if (pageNum === 1) {
          console.warn('Network error, attempting to use cache:', networkError);
          const cachedData = await getCachedProducts(cacheKey);
          
          if (cachedData && cachedData.length > 0) {
            console.log('Using cached vendors:', cachedData.length);
            setAllProducts(cachedData);
            setIsOffline(true);
          } else {
            // No cache available, throw error
            throw networkError;
          }
        } else {
          throw networkError;
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      if (pageNum === 1) {
        fadeSlideAnim.startAnimation();
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      setIsOffline(false);
      
      const offset = 0;
      const filters = selectedCategory !== 'All' ? { category: selectedCategory, limit: 12, offset } : { limit: 12, offset };
      const cacheKey = selectedCategory !== 'All' ? `vendors_${selectedCategory}` : 'vendors_all';
      
      try {
        // Try to fetch from network
        const { data, error: fetchError, count } = await fetchProducts(filters);
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (data) {
          setAllProducts(data);
          setPage(1);
          setHasMore((offset + 12) < (count || 0));
          // Cache the refreshed data
          await cacheProducts(cacheKey, data);
        }
      } catch (networkError) {
        // Network failed, try cache
        const cachedData = await getCachedProducts(cacheKey);
        if (cachedData && cachedData.length > 0) {
          setAllProducts(cachedData);
          setPage(1);
          setIsOffline(true);
        } else {
          throw networkError;
        }
      }
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError(err.message || 'Failed to refresh products');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredVendors = allProducts.filter((v) => {
    const matchesSearch = searchQuery.length === 0 || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {isOffline && (
          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="wifi-off" size={16} color={colors.text} />
            <Text style={{ fontSize: 12, fontWeight: '500', ...fontStyles.semibold, color: '#92400E' }}>
              You're offline. Showing cached data.
            </Text>
          </View>
        )}
        <AppHeader
          title="All Vendors"
          subtitle="Pineapple vendors near you"
          onBackPress={() => navigation.goBack()}
        />

        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
          <AppInput
            placeholder="Search vendors or categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Feather name="search" size={18} color={colors.textSecondary} />}
          />

          {/* Category Filter */}
          <View style={{ paddingTop: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: selectedCategory === cat ? '#007AFF' : colors.surfaceContainer,
                    borderWidth: selectedCategory === cat ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      ...fontStyles.semibold,
                      color: selectedCategory === cat ? '#FFFFFF' : colors.text,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {isLoading ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
            {[1, 2, 3].map((i) => (
              <VendorCardSkeleton key={i} />
            ))}
          </ScrollView>
        ) : (
          <Animated.ScrollView style={fadeSlideAnim.style} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
            {error && (
              <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
                <Feather name="alert-circle" size={20} color={colors.text} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 6 }}>
                    Unable to load products
                  </Text>
                  <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#7F1D1D', marginBottom: 8 }}>
                    {error}
                  </Text>
                  <Pressable
                    onPress={() => loadProducts(1, true)}
                    style={{ backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                      Retry
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
            {filteredVendors.length > 0 ? (
              <View style={{ gap: 12 }}>
                {filteredVendors.map((product) => (
                  <Pressable key={product.id} onPress={() => navigation.navigate('ProductDetail', { product })}>
                    <VendorCard vendor={{
                      id: product.id,
                      name: product.name,
                      category: product.category,
                      image: product.image_url,
                      description: product.description,
                      price: product.price,
                      rating: 4.5,
                      reviews: 0,
                      distance: getDistanceText(product),
                      isVerified: vendorVerificationCache[product.vendor_id] || false,
                    }} />
                  </Pressable>
                ))}
                {hasMore && (
                  <View style={{ paddingTop: 12, paddingBottom: 12 }}>
                    {isLoadingMore ? (
                      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                        <Feather name="loader" size={24} color="#007AFF" />
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => loadProducts(page + 1)}
                        style={{
                          backgroundColor: colors.surfaceContainer,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>
                          Load More Products
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 8 }}>
                  No products found
                </Text>
                <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textTertiary, marginBottom: 24 }}>
                  Try adjusting your search terms
                </Text>
                <AppButton
                  title="Clear Search"
                  onPress={() => setSearchQuery('')}
                  variant="secondary"
                />
              </View>
            )}
          </Animated.ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default VendorsScreen;
