/**
 * System font families that work reliably across iOS and Android
 * Using: Segoe UI (Windows/Android), San Francisco (iOS), Arial (fallback)
 */
export const fontFamilies = {
  light: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '300',
  },
  regular: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '400',
  },
  medium: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '500',
  },
  semibold: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '600',
  },
  bold: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '700',
  },
};

/**
 * Get font styles for a specific weight
 * Works reliably across all platforms
 */
export const getFont = (weight = 'regular') => {
  return fontFamilies[weight] || fontFamilies.regular;
};

