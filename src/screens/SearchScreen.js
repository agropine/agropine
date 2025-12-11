import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard, AppHeader } from '../components';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import { useTheme } from '../context/ThemeContext';
import { clearSearchHistory, getSearchHistory, saveSearchQuery } from '../lib/cacheService';
import { fetchProducts } from '../lib/productService';
import { fontStyles } from '../styles/fonts';

const SearchScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const debounceTimerRef = useRef(null);

  const CATEGORIES = ['All', 'Raw', 'Processed', 'Beverages', 'Goods', 'Health'];

  // Load search history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await getSearchHistory();
      setSearchHistory(data);
    };
    loadHistory();
  }, []);

  // Fetch all products
  useEffect(() => {
    fetchAllProducts();
  }, [selectedCategory]);

  // Filter and sort products based on search query and sort option
  useEffect(() => {
    filterAndSortProducts();
  }, [searchQuery, sortBy, allProducts]);

  const handleSearchChange = async (query) => {
    setSearchQuery(query);
    setShowHistory(false);
    
    // Save to history only if query is not empty and has been searched
    if (query.trim().length > 0) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        await saveSearchQuery(query.trim());
        const { data } = await getSearchHistory();
        setSearchHistory(data);
      }, 1000);
    }
  };

  const handleSearchHistorySelect = (query) => {
    setSearchQuery(query);
    setShowHistory(false);
  };

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setSearchHistory([]);
  };

  const fetchAllProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters = selectedCategory !== 'All' ? { category: selectedCategory } : {};
      const { data, error: fetchError } = await fetchProducts(filters);

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        console.log('Fetched products for search:', data.length);
        setAllProducts(data);
      } else {
        setAllProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products. Please try again.');
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let results = allProducts.filter((product) => {
      const matchesSearch =
        searchQuery.length === 0 ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        results.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        results.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    setFilteredProducts(results);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const filters = selectedCategory !== 'All' ? { category: selectedCategory } : {};
      const { data, error: fetchError } = await fetchProducts(filters);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        setAllProducts(data);
      } else {
        setAllProducts([]);
      }
    } catch (err) {
      console.error('Error refreshing search results:', err);
      setError(err.message || 'Failed to refresh search results');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRetry = () => {
    fetchAllProducts();
  };

  const renderProductCard = ({ item: product }) => (
    <Pressable onPress={() => navigation.navigate('ProductDetail', { product })}>
      <AppCard elevated style={{ gap: 12, padding: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          {product.image_url && (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                backgroundColor: colors.surfaceContainer,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>Image</Text>
              </View>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
              {product.name}
            </Text>
            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary, marginTop: 4 }}>
              {product.category}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF', marginTop: 6 }}>
              RM{product.price}
            </Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Search Products" onBackPress={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
          {/* Search Bar */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceContainer,
                borderRadius: 8,
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Feather name="search" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => setShowHistory(true)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  fontSize: 14,
                  ...fontStyles.regular,
                }}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Search History */}
            {showHistory && searchHistory.length > 0 && searchQuery.length === 0 && (
              <View style={{ backgroundColor: colors.surfaceContainer, borderRadius: 8, padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: colors.textSecondary }}>
                    Recent Searches
                  </Text>
                  <Pressable onPress={handleClearHistory}>
                    <Text style={{ fontSize: 11, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>
                      Clear
                    </Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {searchHistory.map((query, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSearchHistorySelect(query)}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.text }}>
                        {query}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Sort Options */}
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
              {['newest', 'price_low', 'price_high'].map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSortBy(option)}
                  style={{
                    flex: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: sortBy === option ? '#007AFF' : '#F3F4F6',
                    borderWidth: 1,
                    borderColor: sortBy === option ? '#007AFF' : colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      ...fontStyles.semibold,
                      color: sortBy === option ? '#FFFFFF' : colors.text,
                    }}
                  >
                    {option === 'newest' ? 'Newest' : option === 'price_low' ? 'Price ↑' : 'Price ↓'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: selectedCategory === cat ? '#007AFF' : '#F3F4F6',
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

          {/* Loading State */}
          {isLoading && (
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              {[1, 2, 3].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View style={{ paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' }}>
              <Feather name="alert-circle" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 8 }}>
                Oops! Something went wrong
              </Text>
              <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </Text>
              <Pressable
                onPress={handleRetry}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  backgroundColor: '#007AFF',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredProducts.length === 0 && (
            <View style={{ paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' }}>
              <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 8 }}>
                No products found
              </Text>
              <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}

          {/* Products List */}
          {!isLoading && !error && filteredProducts.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.textSecondary, marginBottom: 12 }}>
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
              {filteredProducts.map((product) => renderProductCard({ item: product }))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;
