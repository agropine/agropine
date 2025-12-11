import { Feather } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';
import AppCard from './AppCard';

export const VendorCard = ({ vendor, onPress, compact = false }) => {
  const { colors } = useTheme();
  if (compact) {
    return (
      <YStack
        width={140}
        height={220}
        marginHorizontal="$2"
        borderRadius={12}
        backgroundColor={colors.surface}
        overflow="hidden"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.08}
        shadowRadius={8}
        elevation={3}
        onPress={onPress}
      >
        <Image
          source={{ uri: vendor.image }}
          style={{
            width: '100%',
            height: 120,
            resizeMode: 'cover',
          }}
        />
        <YStack p="$4" gap="$2" flex={1} justifyContent="space-between">
          <YStack gap="$1">
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                ...fontStyles.bold,
                color: colors.text,
              }}
              numberOfLines={2}
            >
              {vendor.name}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                ...fontStyles.semibold,
                color: '#007AFF',
              }}
              numberOfLines={1}
            >
              {vendor.category}
            </Text>
            {vendor.distance && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="map-pin" size={10} color={colors.textTertiary} />
                <Text
                  style={{
                    fontSize: 10,
                    ...fontStyles.regular,
                    color: colors.textTertiary,
                  }}
                  numberOfLines={1}
                >
                  {vendor.distance}
                </Text>
              </View>
            )}
          </YStack>
        </YStack>
      </YStack>
    );
  }

  return (
    <AppCard gap="$3" mb="$3" elevated onPress={onPress}>
      <XStack gap="$3">
        <Image
          source={{ uri: vendor.image }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 12,
            resizeMode: 'cover',
          }}
        />
        <YStack flex={1} justifyContent="space-between">
          <YStack gap="$1">
            <XStack alignItems="center" gap="$1">
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  ...fontStyles.bold,
                  color: colors.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {vendor.name}
              </Text>
              {vendor.isVerified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Feather name="check-circle" size={12} color="#10B981" />
                  <Text style={{ fontSize: 10, fontWeight: '600', ...fontStyles.semibold, color: '#10B981' }}>Verified</Text>
                </View>
              )}
            </XStack>
            <Text style={{ fontSize: 13, fontWeight: '600', ...fontStyles.semibold, color: '#007AFF' }}>
              {vendor.category}
            </Text>
            {vendor.description && (
              <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary, marginTop: 2 }} numberOfLines={2}>
                {vendor.description}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              {vendor.price && (
                <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: '#007AFF' }}>
                  RM {vendor.price}
                </Text>
              )}
              {vendor.distance && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name="map-pin" size={12} color={colors.textTertiary} />
                  <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary }}>
                    {vendor.distance}
                  </Text>
                </View>
              )}
            </View>
          </YStack>
        </YStack>
      </XStack>
    </AppCard>
  );
};

export default VendorCard;
