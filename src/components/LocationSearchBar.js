import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';
import { AppInput } from './index';

/**
 * LocationSearchBar Component
 * Provides location search functionality with dropdown results
 */
const LocationSearchBar = ({
  locationQuery,
  onLocationQueryChange,
  showDropdown,
  isSearching,
  searchResults,
  userLocation,
  locationDisplayName,
  onSelectLocation,
  onClearLocation,
}) => {
  const { colors } = useTheme();

  return (
    <View style={{ position: 'relative', zIndex: 1000 }}>
      <AppInput
        placeholder="Search location..."
        value={locationQuery}
        onChangeText={onLocationQueryChange}
        icon={<Feather name="map-pin" size={18} color={colors.textSecondary} />}
        rightIcon={
          locationQuery ? (
            <Pressable onPress={onClearLocation}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null
        }
      />

      {/* Location Dropdown */}
      {showDropdown && (
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
                onPress={() => onSelectLocation(userLocation)}
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
            {isSearching ? (
              <View style={{ paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                  Searching...
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <Pressable
                  key={result.id}
                  onPress={() => onSelectLocation(result)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
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
            ) : (
              <View style={{ paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>
                  No results found
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default LocationSearchBar;
