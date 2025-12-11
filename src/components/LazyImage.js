import { Feather } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * LazyImage Component - Simple image wrapper with loading and error states
 */
const LazyImage = ({ 
  source, 
  style,
  onLoad,
  ...props 
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <View style={[style, { backgroundColor: colors.surfaceContainer, position: 'relative' }]}>
      <Image
        source={source}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {isLoading && (
        <View
          style={[style, { position: 'absolute', top: 0, left: 0, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Feather name="image" size={24} color={colors.textTertiary} />
        </View>
      )}
      
      {hasError && (
        <View 
          style={[style, { position: 'absolute', top: 0, left: 0, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Feather name="image-off" size={20} color={colors.textTertiary} />
        </View>
      )}
    </View>
  );
};

LazyImage.propTypes = {
  source: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onLoad: PropTypes.func,
};

export default LazyImage;
