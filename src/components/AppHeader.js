import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

export const AppHeader = ({ title, subtitle, onBackPress, rightElement }) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {onBackPress && (
            <Pressable onPress={onBackPress} hitSlop={10}>
              <Text style={{ fontSize: 24, ...fontStyles.semibold, color: colors.text, marginRight: 12 }}>
                ←
              </Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                ...fontStyles.bold,
                color: colors.text,
                letterSpacing: -0.5,
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 13, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightElement && <View>{rightElement}</View>}
      </View>
    </View>
  );
};

export default AppHeader;
