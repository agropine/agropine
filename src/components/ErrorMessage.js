import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { parseError } from '../lib/errorHandler';
import { fontStyles } from '../styles/fonts';

/**
 * ErrorMessage Component
 * Displays formatted error messages with optional retry button
 */
const ErrorMessage = ({ error, onRetry, style }) => {
  const { colors } = useTheme();
  
  if (!error) return null;

  const parsedError = typeof error === 'string' 
    ? { title: 'Error', message: error, retryable: true }
    : parseError(error);

  return (
    <View 
      style={[
        { 
          backgroundColor: '#FEE2E2', 
          borderRadius: 8, 
          padding: 12, 
          flexDirection: 'row', 
          gap: 12 
        },
        style
      ]}
    >
      <Feather name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: '#DC2626', marginBottom: 6 }}>
          {parsedError?.title || 'Error'}
        </Text>
        <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#7F1D1D', marginBottom: onRetry ? 8 : 0 }}>
          {parsedError?.message || 'An error occurred'}
        </Text>
        {onRetry && parsedError?.retryable && (
          <Pressable
            onPress={onRetry}
            style={{ 
              backgroundColor: '#DC2626', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 4, 
              alignSelf: 'flex-start' 
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', ...fontStyles.semibold, color: '#FFFFFF' }}>
              Retry
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ErrorMessage;
