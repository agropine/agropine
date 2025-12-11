import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';
import { OptimizedImage } from './OptimizedImage';

/**
 * Memoized Product Card - Only re-renders if props change
 */
export const MemoizedProductCard = memo(({
  product,
  onPress,
  imageHeight = 180,
}) => {
  const { colors } = useTheme();

  if (!product) {
    return null;
  }

  return (
    <Pressable
      onPress={() => onPress?.(product)}
      style={{
        marginBottom: 16,
        marginHorizontal: 16,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <OptimizedImage
        uri={product.image_url}
        width="100%"
        height={imageHeight}
        borderRadius={0}
      />
      
      <View style={{ padding: 12 }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 14,
            fontWeight: '600',
            ...fontStyles.semibold,
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {product.name}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            ...fontStyles.regular,
            color: colors.textSecondary,
            marginBottom: 8,
          }}
        >
          {product.category}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              ...fontStyles.bold,
              color: colors.primary,
            }}
          >
            ${product.price?.toFixed(2) || '0.00'}
          </Text>
          
          {product.vendor_is_verified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="check-circle" size={14} color="#22c55e" />
              <Text style={{ fontSize: 11, color: '#22c55e' }}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - return true if props are equal (skip re-render)
  return (
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.product?.name === nextProps.product?.name &&
    prevProps.product?.price === nextProps.product?.price &&
    prevProps.product?.image_url === nextProps.product?.image_url
  );
});

MemoizedProductCard.displayName = 'MemoizedProductCard';

/**
 * Memoized Vendor Card - Only re-renders if props change
 */
export const MemoizedVendorCard = memo(({
  vendor,
  onPress,
  imageHeight = 150,
}) => {
  const { colors } = useTheme();

  if (!vendor) {
    return null;
  }

  return (
    <Pressable
      onPress={() => onPress?.(vendor)}
      style={{
        marginBottom: 16,
        marginHorizontal: 16,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <OptimizedImage
        uri={vendor.avatar_url}
        width="100%"
        height={imageHeight}
        borderRadius={0}
      />
      
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: '600',
              ...fontStyles.semibold,
              color: colors.text,
              flex: 1,
            }}
          >
            {vendor.full_name}
          </Text>
          {vendor.is_verified && (
            <Feather name="check-circle" size={16} color="#22c55e" />
          )}
        </View>

        {vendor.bio && (
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12,
              ...fontStyles.regular,
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            {vendor.bio}
          </Text>
        )}

        {vendor.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="map-pin" size={12} color={colors.textSecondary} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                ...fontStyles.regular,
                color: colors.textSecondary,
              }}
            >
              {vendor.location}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.vendor?.id === nextProps.vendor?.id &&
    prevProps.vendor?.full_name === nextProps.vendor?.full_name &&
    prevProps.vendor?.avatar_url === nextProps.vendor?.avatar_url
  );
});

MemoizedVendorCard.displayName = 'MemoizedVendorCard';
