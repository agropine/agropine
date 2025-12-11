/**
 * Global font styles using system fonts
 * Works reliably on all platforms without depending on external font loading
 */

export const fontStyles = {
  // Light weight (300)
  light: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '300',
  },

  // Regular weight (400) - most common
  regular: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '400',
  },

  // Medium weight (500)
  medium: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '500',
  },

  // Semi-bold weight (600)
  semibold: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '600',
  },

  // Bold weight (700)
  bold: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    fontWeight: '700',
  },

  // Heading styles
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  heading4: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },

  // Body text styles
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },

  // Label styles
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
  },
};

export const getFont = (weight = 'regular') => {
  return fontStyles[weight] || fontStyles.regular;
};
