import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { clearAuthData, getSession, storeSession } from '../lib/secureStorage';
import { supabase } from '../lib/supabase';
import { createUserProfile } from '../lib/userProfileService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Token refresh function
  const refreshToken = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh error:', error);
        
        // Only sign out for critical errors, not for session missing
        if (error.message !== 'Auth session missing!' && 
            error.name !== 'AuthSessionMissingError') {
          // If refresh fails for other reasons, sign out user
          await signOut();
        }
        return { success: false, error };
      }
      
      if (data?.session) {
        await storeSession(data.session);
        return { success: true, session: data.session };
      }
      return { success: false };
    } catch (error) {
      console.error('Token refresh exception:', error);
      
      // Don't sign out on session missing error
      if (error.message !== 'Auth session missing!' && 
          error.name !== 'AuthSessionMissingError') {
        await signOut();
      }
      return { success: false, error };
    }
  };

  // Setup token refresh interval (refresh every 50 minutes, tokens expire in 60 min)
  const setupTokenRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Refresh token every 50 minutes
    refreshIntervalRef.current = setInterval(async () => {
      console.log('Auto-refreshing token...');
      await refreshToken();
    }, 50 * 60 * 1000); // 50 minutes
  };

  const clearTokenRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Try to get session from secure storage first
        const storedSession = await getSession();
        
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data?.session) {
          setUser(data.session.user);
          setIsLoggedIn(true);
          
          // Store session securely
          await storeSession(data.session);
          
          // Setup auto token refresh
          setupTokenRefresh();
        } else if (storedSession) {
          // If no active session but we have stored session, try to refresh
          console.log('Attempting to restore session...');
          const result = await refreshToken();
          if (result.success) {
            setupTokenRefresh();
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        await clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        if (session) {
          setUser(session.user);
          setIsLoggedIn(true);
          
          // Store session securely
          await storeSession(session);
          
          // Setup token refresh on sign in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setupTokenRefresh();
          }
        } else {
          setUser(null);
          setIsLoggedIn(false);
          clearTokenRefresh();
          await clearAuthData();
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe?.();
      clearTokenRefresh();
    };
  }, []);

  // Sign up
  const signUp = async (email, password, fullName) => {
    try {
      console.log('Starting signup process for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: 'pinehub://home', // Auto-confirms email
        },
      });

      if (error) {
        console.error('Auth signup error:', error);
        throw error;
      }

      console.log('Auth signup successful. User ID:', data?.user?.id);

      // Create user profile in database
      // Note: If a database trigger is set up, the profile might already exist
      if (data?.user) {
        console.log('Creating user profile for user:', data.user.id);
        
        // Try to create profile with a small delay to ensure auth is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await createUserProfile(data.user.id, email, fullName);
        if (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Log but don't fail - profile creation is fallback to trigger
        } else {
          console.log('User profile created successfully');
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  // Sign in
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setUser(data.user);
      setIsLoggedIn(true);
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      clearTokenRefresh();
      await clearAuthData();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setIsLoggedIn(false);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  // Reset user - used after account deletion to clear state immediately
  const resetUser = async () => {
    try {
      clearTokenRefresh();
      await clearAuthData();
      setUser(null);
      setIsLoggedIn(false);
      return { error: null };
    } catch (error) {
      console.error('Reset user error:', error);
      return { error };
    }
  };

  // Reset password with OTP (token-based)
  const resetPasswordWithOTP = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Verify OTP token and update password
  const verifyOTPAndUpdatePassword = async (email, token, newPassword) => {
    try {
      // Verify the token
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (sessionError) throw sessionError;

      // If OTP is valid, update the password
      if (sessionData?.session) {
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;
        return { data: updateData, error: null };
      }
    } catch (error) {
      return { data: null, error };
    }
  };

  // Reset password (legacy method - now using OTP)
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    signUp,
    signIn,
    signOut,
    resetUser,
    resetPassword,
    resetPasswordWithOTP,
    verifyOTPAndUpdatePassword,
    updatePassword,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
