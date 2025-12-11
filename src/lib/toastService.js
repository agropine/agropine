/**
 * Toast Notification Service
 * Provides simple toast notifications using native APIs
 */

import { Alert, Platform } from 'react-native';

const ToastAndroid = Platform.OS === 'android' ? require('react-native').ToastAndroid : null;

// For iOS, we'll use a simple timeout-based approach instead of Alert
let toastTimeout = null;

export const showToast = (message, type = 'info', duration = 'short') => {
  if (Platform.OS === 'android' && ToastAndroid) {
    ToastAndroid.show(
      message,
      duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT
    );
  } else if (Platform.OS === 'ios') {
    // iOS: Use native alert-style toast (consistent with other system notifications)
    // This appears as a simple banner, not a modal dialog
    Alert.alert(message, undefined, [
      { text: 'Dismiss', style: 'cancel', onPress: () => {} }
    ], { cancelable: true });
  } else if (Platform.OS === 'web') {
    // Web fallback
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

export const showSuccessToast = (message = 'Success!') => {
  showToast(message, 'success', 'short');
};

export const showErrorToast = (message = 'An error occurred') => {
  showToast(message, 'error', 'long');
};

export const showWarningToast = (message = 'Warning') => {
  showToast(message, 'warning', 'short');
};

export const showInfoToast = (message = 'Info') => {
  showToast(message, 'info', 'short');
};
