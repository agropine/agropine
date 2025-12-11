import { Animated } from 'react-native';

// Spring animation configuration for smooth transitions
export const springConfig = {
  damping: 10,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 2,
  restDisplacementThreshold: 2,
};

// Fade in animation
export const createFadeInAnimation = (duration = 300) => {
  const fadeAnim = new Animated.Value(0);

  const startAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return {
    style: { opacity: fadeAnim },
    startAnimation,
    reset: () => fadeAnim.setValue(0),
  };
};

// Slide in from bottom animation
export const createSlideInAnimation = (duration = 300) => {
  const slideAnim = new Animated.Value(100);

  const startAnimation = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return {
    style: { transform: [{ translateY: slideAnim }] },
    startAnimation,
    reset: () => slideAnim.setValue(100),
  };
};

// Scale animation
export const createScaleAnimation = (duration = 300, fromScale = 0.9) => {
  const scaleAnim = new Animated.Value(fromScale);

  const startAnimation = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return {
    style: { transform: [{ scale: scaleAnim }] },
    startAnimation,
    reset: () => scaleAnim.setValue(fromScale),
  };
};

// Pulse animation (for loading indicators)
export const createPulseAnimation = () => {
  const pulseAnim = new Animated.Value(0.3);

  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.3,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  ).start();

  return {
    style: { opacity: pulseAnim },
  };
};

// Combined fade and slide animation
export const createFadeSlideAnimation = (duration = 300) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    style: {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    },
    startAnimation,
    reset: () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    },
  };
};

export default {
  springConfig,
  createFadeInAnimation,
  createSlideInAnimation,
  createScaleAnimation,
  createPulseAnimation,
  createFadeSlideAnimation,
};
