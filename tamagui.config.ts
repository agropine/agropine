import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { tokens as baseTokens, themes } from '@tamagui/themes';
import { createTamagui, createTokens } from 'tamagui';

const interFont = createInterFont();

const customTokens = createTokens({
  ...baseTokens,
  color: {
    ...baseTokens.color,
    primary: '#007AFF',
    primaryDark: '#0051D5',
    secondary: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    surfaceLight: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceDark: '#F3F4F6',
    borderLight: '#E5E7EB',
    border: '#D1D5DB',
    borderDark: '#9CA3AF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    13: 52,
    14: 56,
    15: 60,
    true: 16,
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    13: 52,
    14: 56,
    15: 60,
    full: '100%',
    true: 16,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    full: 9999,
  },
});

const customThemes = {
  light: {
    ...themes.light,
    primary: '#007AFF',
    primaryDark: '#0051D5',
    secondary: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceContainer: '#F3F4F6',
    surfaceContainerHigh: '#E5E7EB',
    surfaceContainerHighest: '#D1D5DB',
    onBackground: '#111827',
    onSurface: '#111827',
    onSurfaceVariant: '#6B7280',
    outline: '#D1D5DB',
    outlineVariant: '#E5E7EB',
  },
  dark: {
    ...themes.dark,
    primary: '#0A84FF',
    primaryDark: '#64B5F6',
    secondary: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF453A',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceContainer: '#2C2C2E',
    surfaceContainerHigh: '#3A3A3C',
    surfaceContainerHighest: '#48484A',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#A1A1A6',
    outline: '#5E5CE6',
    outlineVariant: '#8E8E93',
  },
};

const config = createTamagui({
  defaultTheme: 'light',
  shouldAddPrefersColorMediaQuery: true,
  themeClassPrefix: '',
  tokens: customTokens,
  themes: customThemes,
  fonts: {
    heading: interFont,
    body: interFont,
  },
  shorthands,
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
