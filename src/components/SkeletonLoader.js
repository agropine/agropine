import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const ProductCardSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={{ gap: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12 }}>
    {/* Image skeleton */}
    <View
      style={{
        width: '100%',
        height: 120,
        backgroundColor: colors.surfaceContainer,
        borderRadius: 8,
      }}
    />
    
    {/* Name skeleton */}
    <View
      style={{
        height: 16,
        backgroundColor: colors.surfaceContainer,
        borderRadius: 4,
        width: '70%',
      }}
    />
    
    {/* Category & Distance skeleton */}
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '30%' }} />
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '25%' }} />
    </View>
    
    {/* Description skeleton */}
    <View style={{ gap: 4 }}>
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4 }} />
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '80%' }} />
    </View>
    
    {/* Price skeleton */}
    <View style={{ height: 16, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '40%' }} />
  </View>
  );
};

export const VendorCardSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={{ gap: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12 }}>
    {/* Image skeleton */}
    <View
      style={{
        width: '100%',
        height: 160,
        backgroundColor: colors.surfaceContainer,
        borderRadius: 8,
      }}
    />
    
    {/* Name skeleton */}
    <View style={{ height: 16, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '60%' }} />
    
    {/* Category & Rating */}
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '30%' }} />
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '25%' }} />
    </View>
    
    {/* Description skeleton */}
    <View style={{ gap: 4 }}>
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4 }} />
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '75%' }} />
    </View>
    
    {/* Delivery info skeleton */}
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '30%' }} />
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '30%' }} />
    </View>
  </View>
  );
};

export const ProfileHeaderSkeleton = () => {
  const { colors } = useTheme();
  return (
  <View style={{ gap: 12, padding: 16 }}>
    {/* Avatar skeleton */}
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 80,
          height: 80,
          backgroundColor: colors.surfaceContainer,
          borderRadius: 40,
        }}
      />
      
      {/* Name skeleton */}
      <View style={{ height: 20, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '50%' }} />
      
      {/* Member since skeleton */}
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '40%' }} />
    </View>
    
    {/* Description skeleton */}
    <View style={{ gap: 4 }}>
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4 }} />
      <View style={{ height: 12, backgroundColor: colors.surfaceContainer, borderRadius: 4, width: '90%' }} />
    </View>
  </View>
  );
};

export default {
  ProductCardSkeleton,
  VendorCardSkeleton,
  ProfileHeaderSkeleton,
};
