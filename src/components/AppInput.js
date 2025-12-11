import { Text, TextInput } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

export const AppInput = ({
  placeholder,
  value,
  onChangeText,
  icon,
  error,
  label,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <YStack gap="$1">
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            ...fontStyles.semibold,
            color: colors.text,
          }}
        >
          {label}
        </Text>
      )}
      <XStack
        alignItems={multiline ? 'flex-start' : 'center'}
        paddingHorizontal="$3"
        paddingVertical={multiline ? '$3' : '$2'}
        borderRadius="$3"
        borderWidth={1}
        borderColor={error ? '#FF3B30' : colors.border}
        backgroundColor={editable ? colors.surface : colors.surfaceContainer}
        gap="$2"
      >
        {icon}
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          placeholderTextColor={colors.textTertiary}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.text,
            padding: 0,
            ...fontStyles.regular,
          }}
          {...props}
        />
      </XStack>
      {error && (
        <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#FF3B30', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </YStack>
  );
};

export default AppInput;
