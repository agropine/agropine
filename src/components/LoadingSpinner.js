import { ActivityIndicator, Animated, View } from 'react-native';
import { createPulseAnimation } from '../utils/animations';

export const LoadingSpinner = ({ size = 'large', color = '#007AFF' }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

export const LoadingOverlay = ({ visible = false, size = 'large', color = '#007AFF' }) => {
  const pulseAnim = createPulseAnimation();

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <Animated.View style={pulseAnim.style}>
        <ActivityIndicator size={size} color={color} />
      </Animated.View>
    </View>
  );
};

export default {
  LoadingSpinner,
  LoadingOverlay,
};
