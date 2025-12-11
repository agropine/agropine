import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'pinehub://', 'https://xttpdvahweydbxfjmafx.supabase.co/auth/v1/callback'],
  config: {
    screens: {
      // Handle Supabase auth callbacks
      Auth: 'auth/v1/callback',
      Home: 'home',
      '*': '*',
    },
  },
};

export const useDeepLinking = (navigationRef) => {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [navigationRef]);

  const handleDeepLink = async ({ url }) => {
    const parsed = Linking.parse(url);
    
    // Handle Supabase password reset callback
    if (parsed.path?.includes('auth/v1/callback')) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data?.session) {
          // Session is active, user can now reset password
          await AsyncStorage.setItem('resetPasswordToken', JSON.stringify(data.session));
          navigationRef?.navigate('Auth', { mode: 'resetPassword' });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
      }
    }
  };
};

export default {
  linking,
  useDeepLinking,
};
