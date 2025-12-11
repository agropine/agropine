/**
 * Color Scheme
 * Defines consistent colors throughout the app
 */

export const Colors = {
  // Primary
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  primaryDark: '#0051D3',

  // Secondary
  secondary: '#10B981',
  secondaryLight: '#D1FAE5',
  secondaryDark: '#059669',

  // Neutral
  neutral50: '#FFFFFF',
  neutral100: '#F9FAFB',
  neutral200: '#F3F4F6',
  neutral300: '#E5E7EB',
  neutral400: '#D1D5DB',
  neutral500: '#9CA3AF',
  neutral600: '#6B7280',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Light versions for backgrounds
  successLight: '#ECFDF5',
  warningLight: '#FFFBEB',
  errorLight: '#FEF2F2',
  infoLight: '#EFF6FF',

  // Semantic
  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  disabled: '#D1D5DB',
};

export const TextColors = {
  title: Colors.neutral900,
  subtitle: Colors.neutral700,
  body: Colors.neutral900,
  caption: Colors.neutral600,
  muted: Colors.neutral500,
  disabled: Colors.neutral400,
  success: Colors.success,
  error: Colors.error,
  warning: Colors.warning,
};

export const BackgroundColors = {
  primary: Colors.primaryLight,
  secondary: Colors.secondaryLight,
  success: Colors.successLight,
  error: Colors.errorLight,
  warning: Colors.warningLight,
  info: Colors.infoLight,
};

export const BorderColors = {
  light: Colors.neutral200,
  default: Colors.neutral300,
  dark: Colors.neutral400,
  primary: Colors.primary,
  error: Colors.error,
  success: Colors.success,
};
