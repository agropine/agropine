import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

/**
 * CategoryFilter Component
 * Displays a horizontal list of category filters
 */
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => onSelectCategory(cat)}
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
  );
};

export default CategoryFilter;
