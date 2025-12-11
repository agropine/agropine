import { Feather } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';
import { AppCard } from './index';

/**
 * ProductGrid Component
 * Displays a list/grid of products with loading and error states
 */
const ProductGrid = ({ 
  products, 
  loading, 
  error, 
  getDistanceText, 
  onProductPress, 
  onRetry,
  emptyMessage = 'No products found',
  emptySubtext = 'Try selecting a different category'
}) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary }}>
          Loading products...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
        <Feather name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#DC2626', marginBottom: 6 }}>
            Unable to load products
          </Text>
          <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#7F1D1D', marginBottom: 8 }}>
            {error}
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
                Retry
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 4 }}>
          {emptyMessage}
        </Text>
        <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, textAlign: 'center' }}>
          {emptySubtext}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {products.map((product) => (
        <Pressable key={product.id} onPress={() => onProductPress(product)}>
          <AppCard elevated style={{ padding: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
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
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', ...fontStyles.bold, color: colors.text, flex: 1 }} numberOfLines={1}>
                      {product.name}
                    </Text>
                    {product.vendor_is_verified && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Feather name="check-circle" size={10} color="#10B981" />
                        <Text style={{ fontSize: 9, fontWeight: '600', ...fontStyles.semibold, color: '#10B981' }}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF', marginBottom: 4 }}>
                    {product.category}
                  </Text>
                  <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }} numberOfLines={2}>
                    {product.description || 'Fresh pineapple products'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  {product.price && (
                    <Text style={{ fontSize: 14, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                      RM {product.price}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="map-pin" size={12} color={colors.textTertiary} />
                    <Text style={{ fontSize: 11, ...fontStyles.regular, color: colors.textTertiary }}>
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
  );
};

export default ProductGrid;
