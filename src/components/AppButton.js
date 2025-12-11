import { Pressable, Text } from 'react-native';
import { XStack } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

export const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  ...props
}) => {
  const { colors } = useTheme();
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.border : '#007AFF',
          pressedColor: '#0051D5',
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: colors.surfaceContainer,
          pressedColor: colors.border,
          textColor: colors.text,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#FCA5A5' : '#FF3B30',
          pressedColor: '#E60000',
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
          pressedColor: colors.surfaceContainer,
        };
      default:
        return {
          backgroundColor: '#007AFF',
          pressedColor: '#0051D5',
          textColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          fontSize: 13,
        };
      case 'md':
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 15,
        };
      case 'lg':
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          fontSize: 17,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 15,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? variantStyles.pressedColor : variantStyles.backgroundColor,
          borderRadius: 10,
          borderWidth: variantStyles.borderWidth || 0,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          minHeight: 44,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        props.style && { flex: props.style.flex },
      ]}
    >
      <XStack justifyContent="center" alignItems="center" gap={8}>
        {icon}
        <Text
          style={{
            color: variantStyles.textColor || '#FFFFFF',
            fontWeight: '600',
            ...fontStyles.semibold,
            fontSize: sizeStyles.fontSize,
          }}
        >
          {loading ? 'Loading...' : title}
        </Text>
      </XStack>
    </Pressable>
  );
};

export default AppButton;
