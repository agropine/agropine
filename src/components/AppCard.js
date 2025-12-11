import { YStack } from 'tamagui';
import { useTheme } from '../context/ThemeContext';

export const AppCard = ({
  children,
  onPress,
  variant = 'default',
  padding = '$4',
  gap = '$3',
  elevated = true,
  ...props
}) => {
  const { colors } = useTheme();
  const cardStyle = {
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...(elevated && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    }),
  };

  if (variant === 'outlined') {
    cardStyle.borderWidth = 1;
    cardStyle.borderColor = colors.border;
    delete cardStyle.shadowColor;
    delete cardStyle.shadowOffset;
    delete cardStyle.shadowOpacity;
    delete cardStyle.shadowRadius;
    delete cardStyle.elevation;
  }

  return (
    <YStack
      p={padding}
      gap={gap}
      {...cardStyle}
      onPress={onPress}
      {...props}
    >
      {children}
    </YStack>
  );
};

export default AppCard;
