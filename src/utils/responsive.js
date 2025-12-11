import { useWindowDimensions } from 'react-native';

export const useResponsiveLayout = () => {
  const dimensions = useWindowDimensions();
  
  return {
    isTablet: dimensions.width >= 768,
    isMobile: dimensions.width < 768,
    isLandscape: dimensions.height < dimensions.width,
    isPortrait: dimensions.height >= dimensions.width,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    
    // Responsive calculations
    getColumnCount: () => dimensions.width >= 768 ? 2 : 1,
    getItemWidth: (gutter = 16) => {
      const availableWidth = dimensions.width - (gutter * 2);
      return dimensions.width >= 768 ? (availableWidth / 2) - (gutter / 2) : availableWidth;
    },
    getPadding: () => dimensions.width >= 768 ? 24 : 16,
    getGap: () => dimensions.width >= 768 ? 16 : 12,
    
    // Font sizes responsive
    getHeadingSize: () => dimensions.width >= 768 ? 24 : 18,
    getSubheadingSize: () => dimensions.width >= 768 ? 18 : 16,
    getBodySize: () => dimensions.width >= 768 ? 16 : 14,
    getCaptionSize: () => dimensions.width >= 768 ? 14 : 12,
  };
};

export const ResponsiveValue = (mobile, tablet) => {
  const { isTablet } = useResponsiveLayout();
  return isTablet ? tablet : mobile;
};

export default {
  useResponsiveLayout,
  ResponsiveValue,
};
