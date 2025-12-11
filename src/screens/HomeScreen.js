import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppCard,
    AppHeader,
    AppInput,
    LazyImage
} from '../components';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cacheProducts, getCachedProducts } from '../lib/cacheService';
import { isWithinRadius, reverseGeocode, searchLocation } from '../lib/locationSearchService';
import { getSavedUserLocation, requestLocationPermission } from '../lib/locationService';
import { fetchProducts, fetchProductsFromVerifiedVendors } from '../lib/productService';
import { batchGetVendorLocations, getCachedLocation } from '../lib/vendorLocationCache';
import { fontStyles } from '../styles/fonts';
import { createFadeSlideAnimation } from '../utils/animations';

const HomeScreen = ({ navigation }) => {
  const { isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [verifiedVendorProducts, setVerifiedVendorProducts] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationDisplayName, setLocationDisplayName] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [vendorLocationCache, setVendorLocationCache] = useState({}); // Trigger re-render when cache updates
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const fadeSlideAnimRef = useRef(createFadeSlideAnimation(300));
  const fadeSlideAnim = fadeSlideAnimRef.current;
  const dimensions = useWindowDimensions();
  const isTablet = dimensions.width >= 768;

  const categories = ['All', 'Raw', 'Processed', 'Beverages', 'Goods', 'Health'];

  // Helper function to get distance text for a product
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
      const cache = await batchGetVendorLocations(featuredProducts);
      setVendorLocationCache(cache); // Trigger re-render
    };
    
    if (featuredProducts.length > 0) {
      populateVendorLocations();
    }
  }, [featuredProducts]);

  // Filter products based on selected location (radius 50km)
  const filteredProducts = useMemo(() => {
    const searchLocation = selectedLocation || userLocation;
    
    if (!searchLocation) {
      return featuredProducts;
    }
    
    // Filter products within 50km radius
    return featuredProducts.filter(product => 
      isWithinRadius(
        searchLocation.latitude,
        searchLocation.longitude,
        product.owner_latitude,
        product.owner_longitude,
        50 // 50km radius
      )
    );
  }, [featuredProducts, selectedLocation, userLocation]);

  // Filter verified vendor products based on selected location (radius 50km)
  const verifiedVendorsFiltered = useMemo(() => {
    const searchLocation = selectedLocation || userLocation;
    
    if (!searchLocation) {
      return verifiedVendorProducts;
    }
    
    // Filter products within 50km radius
    return verifiedVendorProducts.filter(product => 
      isWithinRadius(
        searchLocation.latitude,
        searchLocation.longitude,
        product.owner_latitude,
        product.owner_longitude,
        50 // 50km radius
      )
    );
  }, [verifiedVendorProducts, selectedLocation, userLocation]);

  // Filter products from non-verified vendors based on selected location (radius 50km)
  const nonVerifiedProductsFiltered = useMemo(() => {
    const searchLocation = selectedLocation || userLocation;
    
    // First filter out verified products (show products that are NOT verified)
    const nonVerifiedProducts = featuredProducts.filter(product => {
      // Show product if vendor_is_verified is false or undefined (non-verified)
      return product.vendor_is_verified !== true;
    });
    
    if (!searchLocation) {
      return nonVerifiedProducts;
    }
    
    // Then filter products within 50km radius, but only if we have valid coordinates
    return nonVerifiedProducts.filter(product => {
      // If product doesn't have location data, include it anyway
      if (!product.owner_latitude || !product.owner_longitude) {
        return true;
      }
      
      return isWithinRadius(
        searchLocation.latitude,
        searchLocation.longitude,
        product.owner_latitude,
        product.owner_longitude,
        50 // 50km radius
      );
    });
  }, [featuredProducts, selectedLocation, userLocation]);

  // Load user location when component mounts
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        // Request location permission first (works for both logged-in and visitor users)
        console.log('Requesting location permission on HomeScreen mount');
        await requestLocationPermission();
        
        const location = await getSavedUserLocation();
        if (location) {
          console.log('Loaded user location:', location);
          setUserLocation(location);
          
          // Get place name for the location
          const { placeName } = await reverseGeocode(location.latitude, location.longitude);
          if (placeName) {
            setLocationDisplayName(placeName);
          } else {
            setLocationDisplayName(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
          }
        } else {
          console.log('No saved user location found');
        }
      } catch (error) {
        console.error('Error loading user location:', error);
      }
    };

    loadUserLocation();
  }, []);

  // Fetch products from database with caching and pagination
  useEffect(() => {
    // Reset pagination when category changes
    setPage(1);
    setHasMore(true);
    setFeaturedProducts([]);
  }, [selectedCategory]);

  useEffect(() => {
    if (page === 1) {
      loadProducts(1, true);
    }
  }, [page, selectedCategory]);

  const loadProducts = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      setIsOffline(false);
      
      const filters = {
        ...(selectedCategory !== 'All' && { category: selectedCategory }),
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
      };
      
      const cacheKey = `products_${selectedCategory}_page_${pageNum}`;
      
      try {
        // Try to fetch from network
        const { data, error: fetchError, count } = await fetchProducts(filters);
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Use products from database
        if (data) {
          console.log(`Fetched page ${pageNum} products:`, data.length, 'of', count);
          
          if (reset) {
            setFeaturedProducts(data);
          } else {
            setFeaturedProducts(prev => [...prev, ...data]);
          }
          
          // Check if there are more products
          setHasMore(data.length === PAGE_SIZE && (pageNum * PAGE_SIZE) < count);
          
          // Cache the products
          await cacheProducts(cacheKey, data);
        } else {
          console.log('No products found in database');
          if (reset) {
            setFeaturedProducts([]);
          }
          setHasMore(false);
        }
      } catch (networkError) {
        // Network failed, try to use cache
        console.warn('Network error, attempting to use cache:', networkError);
        const cachedData = await getCachedProducts(cacheKey);
        
        if (cachedData && cachedData.length > 0) {
          console.log('Using cached products:', cachedData.length);
          if (reset) {
            setFeaturedProducts(cachedData);
          } else {
            setFeaturedProducts(prev => [...prev, ...cachedData]);
          }
          setIsOffline(true);
        } else if (pageNum === 1) {
          // No cache available for first page, throw error
          throw networkError;
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products. Please try again.');
      if (pageNum === 1) {
        setFeaturedProducts([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      if (pageNum === 1) {
        fadeSlideAnim.startAnimation();
      }
    }
  };

  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setPage(prev => prev + 1);
      loadProducts(page + 1, false);
    }
  };

  // Load verified vendor products
  useEffect(() => {
    const loadVerifiedVendorProducts = async () => {
      try {
        const filters = selectedCategory !== 'All' ? { category: selectedCategory } : {};
        const cacheKey = selectedCategory !== 'All' ? `verified_products_${selectedCategory}` : 'verified_products_all';
        
        try {
          // Try to fetch from network
          const { data, error: fetchError } = await fetchProductsFromVerifiedVendors(filters);
          
          if (fetchError) {
            console.warn('Error fetching verified products:', fetchError);
            // Use cached data as fallback
            const cachedData = await getCachedProducts(cacheKey);
            if (cachedData && cachedData.length > 0) {
              setVerifiedVendorProducts(cachedData);
            } else {
              setVerifiedVendorProducts([]);
            }
            return;
          }
          
          if (data) {
            console.log('Fetched verified vendor products:', data.length);
            setVerifiedVendorProducts(data);
            // Cache the products
            await cacheProducts(cacheKey, data);
          } else {
            setVerifiedVendorProducts([]);
          }
        } catch (networkError) {
          // Network failed, try to use cache
          console.warn('Network error fetching verified products, attempting to use cache:', networkError);
          const cachedData = await getCachedProducts(cacheKey);
          
          if (cachedData && cachedData.length > 0) {
            console.log('Using cached verified products:', cachedData.length);
            setVerifiedVendorProducts(cachedData);
          } else {
            setVerifiedVendorProducts([]);
          }
        }
      } catch (err) {
        console.error('Error loading verified products:', err);
        setVerifiedVendorProducts([]);
      }
    };

    loadVerifiedVendorProducts();
  }, [selectedCategory]);

  // Handle location search
  const handleLocationSearch = async (query) => {
    setSearchLocationQuery(query);
    
    if (!query.trim()) {
      setLocationSearchResults([]);
      return;
    }
    
    setIsSearchingLocation(true);
    try {
      const { results, error } = await searchLocation(query);
      if (error) {
        console.error('Location search error:', error);
        setLocationSearchResults([]);
      } else {
        setLocationSearchResults(results);
      }
    } catch (error) {
      console.error('Error during location search:', error);
      setLocationSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle location selection
  const handleSelectLocation = async (location) => {
    setSelectedLocation(location);
    setSearchLocationQuery(location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    setLocationSearchResults([]);
    setShowLocationDropdown(false);
    
    // Get place name for the selected location
    const { placeName } = await reverseGeocode(location.latitude, location.longitude);
    if (placeName) {
      setLocationDisplayName(placeName);
    } else {
      setLocationDisplayName(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      setIsOffline(false);
      
      // Reset pagination state
      setPage(1);
      setHasMore(true);
      setFeaturedProducts([]);
      
      // Load first page with force refresh
      await loadProducts(1, true);
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError(err.message || 'Failed to refresh products. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {isOffline && (
        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="wifi-off" size={16} color={colors.text} />
          <Text style={{ fontSize: 12, fontWeight: '500', ...fontStyles.semibold, color: '#92400E' }}>
            You're offline. Showing cached data.
          </Text>
        </View>
      )}
      <AppHeader
        title="AgroPine"
        subtitle="Find pineapple vendors & farmers"
        rightElement={
          <Pressable 
            onPress={() => {
              if (isLoggedIn) {
                navigation.navigate('Profile');
              } else {
                navigation.navigate('Auth', { mode: 'login' });
              }
            }} 
            hitSlop={10}
          >
            <Feather name="user" size={24} color={colors.textSecondary} />
          </Pressable>
        }
      />

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
            <View style={{ height: 44, backgroundColor: colors.surfaceContainer, borderRadius: 8 }} />
          </View>

          {/* Category skeleton */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={{ width: 80, height: 32, backgroundColor: colors.surfaceContainer, borderRadius: 8 }} />
              ))}
            </ScrollView>
          </View>

          {/* Featured skeleton */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ height: 20, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '30%', marginBottom: 12 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ width: 140, height: 220, backgroundColor: colors.surfaceContainer, borderRadius: 12 }} />
              ))}
            </ScrollView>
          </View>

          {/* Recommended skeleton */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ height: 20, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '35%', marginBottom: 12 }} />
            {[1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      ) : Platform.OS === 'web' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }} style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View>
              <AppInput
                placeholder="Search location..."
                value={searchLocationQuery}
                onChangeText={handleLocationSearch}
                onFocus={() => setShowLocationDropdown(true)}
                icon={<Feather name="map-pin" size={18} color={colors.textSecondary} />}
              />
              
              {/* Location Dropdown */}
              {showLocationDropdown && (
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: colors.surfaceContainer,
                    borderRadius: 12,
                    overflow: 'hidden',
                    maxHeight: 250,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ScrollView scrollEnabled={true} nestedScrollEnabled={true}>
                    {/* Current Location Button */}
                    {userLocation && (
                      <Pressable
                        onPress={() => {
                          handleSelectLocation(userLocation);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Feather name="crosshair" size={16} color="#007AFF" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.bold, color: '#007AFF' }}>
                            Current Location
                          </Text>
                          <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                            {locationDisplayName || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
                          </Text>
                        </View>
                      </Pressable>
                    )}

                    {/* Search Results */}
                    {isSearchingLocation ? (
                      <View style={{ paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                          Searching...
                        </Text>
                      </View>
                    ) : locationSearchResults.length > 0 ? (
                      locationSearchResults.map((result, index) => (
                        <Pressable
                          key={result.id}
                          onPress={() => handleSelectLocation(result)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderBottomWidth: index < locationSearchResults.length - 1 ? 1 : 0,
                            borderBottomColor: colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Feather name="map-pin" size={16} color={colors.textSecondary} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '500', ...fontStyles.semibold, color: colors.text }}>
                              {result.name}
                            </Text>
                            <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                              {result.address}
                            </Text>
                          </View>
                        </Pressable>
                      ))
                    ) : searchLocationQuery.trim().length > 0 ? (
                      <View style={{ paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                          No locations found
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
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

          <View style={{ paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Verified Vendors</Text>
              <Pressable onPress={() => navigation.navigate('Vendors')}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>See all →</Text>
              </Pressable>
            </View>

            {verifiedVendorsFiltered.length === 0 ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' }}>
                <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 4 }}>
                  No verified vendors
                </Text>
                <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, textAlign: 'center' }}>
                  Check back soon for verified vendors
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                {verifiedVendorsFiltered.map((item) => (
                <Pressable 
                  key={item.id} 
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  style={{ width: 280, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
                >
                  <Image
                    source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
                    style={{
                      width: '100%',
                      height: 160,
                      backgroundColor: colors.surfaceContainer,
                    }}
                  />
                  <View style={{ padding: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={{ fontSize: 14, fontWeight: '700', ...fontStyles.bold, color: colors.text, flex: 1 }} numberOfLines={1}>{item.name}</Text>{item.vendor_is_verified && (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Feather name="check-circle" size={10} color="#10B981" /><Text style={{ fontSize: 9, fontWeight: '600', ...fontStyles.semibold, color: '#10B981' }}>Verified</Text></View>)}</View>
                    <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>
                      {item.category}
                    </Text>
                    <Text 
                      style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}
                      numberOfLines={2}
                    >
                      {item.description || 'Fresh pineapple products'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      {item.price && (
                        <Text style={{ fontSize: 14, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                          RM {item.price}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="map-pin" size={12} color={colors.textTertiary} />
                        <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textTertiary }}>
                          {getDistanceText(item)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Featured</Text>
              <Pressable onPress={() => navigation.navigate('Vendors')}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>See all →</Text>
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              {error && (
                <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
                  <Feather name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#DC2626', marginBottom: 6 }}>
                      Unable to load products
                    </Text>
                    <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#7F1D1D', marginBottom: 8 }}>
                      {error}
                    </Text>
                    <Pressable
                      onPress={() => setSelectedCategory(selectedCategory)}
                      style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                        Retry
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {nonVerifiedProductsFiltered.length === 0 && !error && (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 4 }}>
                    No products found
                  </Text>
                  <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, textAlign: 'center' }}>
                    Try selecting a different category
                  </Text>
                </View>
              )}
              {nonVerifiedProductsFiltered.map((product) => (
                <Pressable key={product.id} onPress={() => navigation.navigate('ProductDetail', { product })}>
                  <AppCard elevated style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <LazyImage
                        source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 12,
                          backgroundColor: colors.surfaceContainer,
                        }}
                      />
                      <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ fontSize: 17, fontWeight: '700', ...fontStyles.bold, color: colors.text }} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF', marginTop: 2 }}>
                            {product.category}
                          </Text>
                          {product.description && (
                            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary, marginTop: 4 }} numberOfLines={2}>
                              {product.description}
                            </Text>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          {product.price && (
                            <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                              RM {product.price}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Feather name="map-pin" size={12} color={colors.textTertiary} />
                            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary }}>
                              {getDistanceText(product)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </AppCard>
                </Pressable>
              ))}
            </View>
          </View>

          </ScrollView>
      ) : (
        <Animated.ScrollView 
          style={[fadeSlideAnim.style, { flex: 1 }]} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }} 
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
            if (isCloseToBottom && !isLoadingMore && hasMore) {
              loadMoreProducts();
            }
          }}
          scrollEventThrottle={400}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
            <View>
              <AppInput
                placeholder="Search location..."
                value={searchLocationQuery}
                onChangeText={handleLocationSearch}
                onFocus={() => setShowLocationDropdown(true)}
                icon={<Feather name="map-pin" size={18} color={colors.textSecondary} />}
              />
              
              {/* Location Dropdown */}
              {showLocationDropdown && (
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: colors.surfaceContainer,
                    borderRadius: 12,
                    overflow: 'hidden',
                    maxHeight: 250,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ScrollView scrollEnabled={true} nestedScrollEnabled={true}>
                    {/* Current Location Button */}
                    {userLocation && (
                      <Pressable
                        onPress={() => {
                          handleSelectLocation(userLocation);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Feather name="crosshair" size={16} color="#007AFF" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.bold, color: '#007AFF' }}>
                            Current Location
                          </Text>
                          <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                            {locationDisplayName || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
                          </Text>
                        </View>
                      </Pressable>
                    )}

                    {/* Search Results */}
                    {isSearchingLocation ? (
                      <View style={{ paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                          Searching...
                        </Text>
                      </View>
                    ) : locationSearchResults.length > 0 ? (
                      locationSearchResults.map((result, index) => (
                        <Pressable
                          key={result.id}
                          onPress={() => handleSelectLocation(result)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderBottomWidth: index < locationSearchResults.length - 1 ? 1 : 0,
                            borderBottomColor: colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Feather name="map-pin" size={16} color={colors.textSecondary} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '500', ...fontStyles.semibold, color: colors.text }}>
                              {result.name}
                            </Text>
                            <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                              {result.address}
                            </Text>
                          </View>
                        </Pressable>
                      ))
                    ) : searchLocationQuery.trim().length > 0 ? (
                      <View style={{ paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                          No locations found
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
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

          <View style={{ paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Verified Vendors</Text>
              <Pressable onPress={() => navigation.navigate('Vendors')}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>See all →</Text>
              </Pressable>
            </View>

            {verifiedVendorsFiltered.length === 0 ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' }}>
                <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 4 }}>
                  No verified vendors
                </Text>
                <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, textAlign: 'center' }}>
                  Check back soon for verified vendors
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                {verifiedVendorsFiltered.map((item) => (
                  <Pressable 
                    key={item.id} 
                    onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    style={{ width: 280, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
                  >
                    <Image
                      source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
                      style={{
                        width: '100%',
                        height: 160,
                        backgroundColor: colors.surfaceContainer,
                      }}
                    />
                    <View style={{ padding: 12, gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={{ fontSize: 14, fontWeight: '700', ...fontStyles.bold, color: colors.text, flex: 1 }} numberOfLines={1}>{item.name}</Text>{item.vendor_is_verified && (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Feather name="check-circle" size={10} color="#10B981" /><Text style={{ fontSize: 9, fontWeight: '600', ...fontStyles.semibold, color: '#10B981' }}>Verified</Text></View>)}</View>
                      <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>
                        {item.category}
                      </Text>
                      <Text 
                        style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}
                        numberOfLines={2}
                      >
                        {item.description || 'Fresh pineapple products'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        {item.price && (
                          <Text style={{ fontSize: 14, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                            RM {item.price}
                          </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Feather name="map-pin" size={12} color={colors.textTertiary} />
                          <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textTertiary }}>
                            {getDistanceText(item)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', ...fontStyles.bold, color: colors.text }}>Featured</Text>
              <Pressable onPress={() => navigation.navigate('Vendors')}>
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>See all →</Text>
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              {error && (
                <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
                  <Feather name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#DC2626', marginBottom: 6 }}>
                      Unable to load products
                    </Text>
                    <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#7F1D1D', marginBottom: 8 }}>
                      {error}
                    </Text>
                    <Pressable
                      onPress={() => setSelectedCategory(selectedCategory)}
                      style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                        Retry
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {nonVerifiedProductsFiltered.length === 0 && !error && (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 4 }}>
                    No products found
                  </Text>
                  <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, textAlign: 'center' }}>
                    Try selecting a different category
                  </Text>
                </View>
              )}
              {nonVerifiedProductsFiltered.map((product) => (
                <Pressable key={product.id} onPress={() => navigation.navigate('ProductDetail', { product })}>
                  <AppCard elevated style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <LazyImage
                        source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop' }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 12,
                          backgroundColor: colors.surfaceContainer,
                        }}
                      />
                      <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ fontSize: 17, fontWeight: '700', ...fontStyles.bold, color: colors.text }} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF', marginTop: 2 }}>
                            {product.category}
                          </Text>
                          {product.description && (
                            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary, marginTop: 4 }} numberOfLines={2}>
                              {product.description}
                            </Text>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          {product.price && (
                            <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                              RM {product.price}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Feather name="map-pin" size={12} color={colors.textTertiary} />
                            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary }}>
                              {getDistanceText(product)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </AppCard>
                </Pressable>
              ))}
            </View>

            {/* Load More Indicator */}
            {isLoadingMore && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>
                  Loading more products...
                </Text>
              </View>
            )}

            {!hasMore && featuredProducts.length > 0 && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary }}>
                  No more products to load
                </Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

export default HomeScreen;








