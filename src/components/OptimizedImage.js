import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

/**
 * Optimized Image Component with Lazy Loading
 * Handles caching, lazy loading, and placeholders
 */
export const OptimizedImage = ({
  uri,
  width = 200,
  height = 200,
  borderRadius = 8,
  placeholder = null,
  onLoad = null,
  resizeMode = 'cover',
  style = {},
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uri) {
      setError(true);
      setIsLoading(false);
    }
  }, [uri]);

  if (!uri || error) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius,
          backgroundColor: '#e0e0e0',
          justifyContent: 'center',
          alignItems: 'center',
          ...style,
        }}
      >
        {placeholder}
      </View>
    );
  }

  return (
    <View style={{ width, height, borderRadius, overflow: 'hidden', ...style }}>
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
            zIndex: 1,
          }}
        >
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius,
        }}
        resizeMode={resizeMode}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        cache="force-cache"
      />
    </View>
  );
};

export default OptimizedImage;
