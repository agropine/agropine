import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppInput } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sanitizeEmail, sanitizeInput, validateEmail, validateName, validatePassword } from '../lib/validationService';
import { fontStyles } from '../styles/fonts';

const AuthScreen = ({ navigation, route }) => {
  const { signIn, signUp, resetPasswordWithOTP, verifyOTPAndUpdatePassword } = useAuth();
  const { colors } = useTheme();
  const initialMode = route?.params?.mode || 'login'; // 'login', 'register', 'forgot', 'resetToken'
  const [authMode, setAuthMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: enter email, 2: enter token & new password

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      Alert.alert('Invalid Email', emailValidation.error);
      return;
    }
    
    setLoading(true);
    try {
      const sanitizedEmail = sanitizeEmail(email);
      const { data, error } = await signIn(sanitizedEmail, password);
      if (error) {
        Alert.alert('Login Failed', error.message || 'Invalid email or password');
      } else {
        // Close auth modal on successful login
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate all fields are filled
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate name
    const nameValidation = validateName(fullName);
    if (!nameValidation.isValid) {
      Alert.alert('Invalid Name', nameValidation.error);
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      Alert.alert('Invalid Email', emailValidation.error);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Invalid Password', passwordValidation.error);
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedName = sanitizeInput(fullName);
      const { data, error } = await signUp(sanitizedEmail, password, sanitizedName);
      if (error) {
        Alert.alert('Registration Failed', error.message || 'Failed to create account');
      } else {
        // Auto-login after successful registration
        const { error: loginError } = await signIn(sanitizedEmail, password);
        if (loginError) {
          Alert.alert('Success', 'Account created! Please log in.', [
            { text: 'OK', onPress: () => setAuthMode('login') }
          ]);
        } else {
          // Close auth modal on successful registration and login
          navigation.goBack();
        }
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetStep === 1) {
      // Step 1: Send OTP to email
      if (!email) {
        Alert.alert('Error', 'Please enter your email');
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await resetPasswordWithOTP(email);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert(
            'Token Sent',
            'A reset token has been sent to your email. Enter it below along with your new password.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setResetStep(2);
                },
              },
            ]
          );
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    } else if (resetStep === 2) {
      // Step 2: Verify token and update password
      if (!otp || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await verifyOTPAndUpdatePassword(email, otp, password);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Success', 'Password updated! Please login with your new password.', [
            {
              text: 'OK',
              onPress: () => {
                setAuthMode('login');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setOtp('');
                setResetStep(1);
              },
            },
          ]);
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'space-between' }}>
            {/* Close Button - Only show if we can go back */}
            {navigation.canGoBack() ? (
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={{ alignSelf: 'flex-end', marginBottom: 16 }}
              >
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            ) : (
              <View style={{ marginBottom: 16 }} />
            )}

            {/* Header */}
            <View style={{ gap: 16, marginBottom: 40 }}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: '#007AFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  <Image
                    source={require('../../assets/images/logo.png')}
                    style={{ width: 100, height: 100 }}
                    resizeMode="cover"
                  />
                </View>
                <Text style={{
                  fontSize: 28,
                  fontWeight: '700',
                  ...fontStyles.bold,
                  color: colors.text
                }}>AgroPine</Text>
                <Text style={{
                  fontSize: 14,
                  ...fontStyles.regular,
                  color: colors.textSecondary
                }}>Find Fresh Pineapple Vendors</Text>
              </View>
            </View>

            {/* Auth Forms */}
            <View style={{ gap: 24, marginBottom: 24 }}>
              {/* Login Form */}
              {authMode === 'login' && (
                <View style={{ gap: 16 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    ...fontStyles.bold,
                    color: colors.text
                  }}>Login to AgroPine</Text>

                  <AppInput
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    editable={!loading}
                    icon={<Feather name="mail" size={18} color={colors.textSecondary} />}
                  />

                  <View style={{ position: 'relative' }}>
                    <AppInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      icon={<Feather name="lock" size={18} color={colors.textSecondary} />}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center'
                      }}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <AppButton
                    title={loading ? 'Logging in...' : 'Login'}
                    onPress={handleLogin}
                    disabled={loading}
                  />

                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      <Text style={{
                        fontSize: 14,
                        ...fontStyles.regular,
                        color: colors.textSecondary
                      }}>Don't have an account?</Text>
                      <Text
                        onPress={() => {
                          setAuthMode('register');
                          setEmail('');
                          setPassword('');
                        }}
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          ...fontStyles.semibold,
                          color: '#007AFF'
                        }}
                      >
                        Register
                      </Text>
                    </View>

                    <Text
                      onPress={() => {
                        setAuthMode('forgot');
                        setEmail('');
                      }}
                      style={{
                        fontSize: 13,
                        ...fontStyles.regular,
                        color: '#007AFF',
                        textAlign: 'center'
                      }}
                    >
                      Forgot Password?
                    </Text>
                  </View>
                </View>
              )}

              {/* Register Form */}
              {authMode === 'register' && (
                <View style={{ gap: 16 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    ...fontStyles.bold,
                    color: colors.text
                  }}>Create Account</Text>

                  <AppInput
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                    icon={<Feather name="user" size={18} color={colors.textSecondary} />}
                  />

                  <AppInput
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    editable={!loading}
                    icon={<Feather name="mail" size={18} color={colors.textSecondary} />}
                  />

                  <View style={{ position: 'relative' }}>
                    <AppInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      icon={<Feather name="lock" size={18} color={colors.textSecondary} />}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center'
                      }}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <View style={{ position: 'relative' }}>
                    <AppInput
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                      icon={<Feather name="lock" size={18} color={colors.textSecondary} />}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={10}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center'
                      }}
                    >
                      <Feather
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <AppButton
                    title={loading ? 'Creating Account...' : 'Register'}
                    onPress={handleRegister}
                    disabled={loading}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Text style={{
                      fontSize: 14,
                      ...fontStyles.regular,
                      color: colors.textSecondary
                    }}>Already have an account?</Text>
                    <Text
                      onPress={() => {
                        setAuthMode('login');
                        setFullName('');
                        setEmail('');
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        ...fontStyles.semibold,
                        color: '#007AFF'
                      }}
                    >
                      Login
                    </Text>
                  </View>
                </View>
              )}

              {/* Forgot Password Form */}
              {authMode === 'forgot' && (
                <View style={{ gap: 16 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    ...fontStyles.bold,
                    color: colors.text
                  }}>Reset Password</Text>

                  {resetStep === 1 ? (
                    <>
                      <Text style={{
                        fontSize: 14,
                        ...fontStyles.regular,
                        color: colors.textSecondary,
                        lineHeight: 20
                      }}>Enter your email address and we'll send you a reset token.</Text>

                      <AppInput
                        placeholder="Email address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        editable={!loading}
                        icon={<Feather name="mail" size={18} color={colors.textSecondary} />}
                      />

                      <AppButton
                        title={loading ? 'Sending...' : 'Send Reset Token'}
                        onPress={handleForgotPassword}
                        disabled={loading}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={{
                        fontSize: 14,
                        ...fontStyles.regular,
                        color: colors.textSecondary,
                        lineHeight: 20
                      }}>Enter the token from your email and your new password.</Text>

                      <AppInput
                        placeholder="Reset token"
                        value={otp}
                        onChangeText={setOtp}
                        editable={!loading}
                        icon={<Feather name="key" size={18} color={colors.textSecondary} />}
                      />

                      <View style={{ position: 'relative' }}>
                        <AppInput
                          placeholder="New password"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          editable={!loading}
                          icon={<Feather name="lock" size={18} color={colors.textSecondary} />}
                        />
                        <Pressable
                          onPress={() => setShowPassword(!showPassword)}
                          hitSlop={10}
                          style={{
                            position: 'absolute',
                            right: 16,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center'
                          }}
                        >
                          <Feather
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={18}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>

                      <View style={{ position: 'relative' }}>
                        <AppInput
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          editable={!loading}
                          icon={<Feather name="lock" size={18} color={colors.textSecondary} />}
                        />
                        <Pressable
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          hitSlop={10}
                          style={{
                            position: 'absolute',
                            right: 16,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center'
                          }}
                        >
                          <Feather
                            name={showConfirmPassword ? 'eye-off' : 'eye'}
                            size={18}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>

                      <AppButton
                        title={loading ? 'Updating...' : 'Update Password'}
                        onPress={handleForgotPassword}
                        disabled={loading}
                      />

                      <Text
                        onPress={() => {
                          setResetStep(1);
                          setOtp('');
                          setPassword('');
                          setConfirmPassword('');
                        }}
                        style={{
                          fontSize: 13,
                          ...fontStyles.regular,
                          color: '#007AFF',
                          textAlign: 'center'
                        }}
                      >
                        Back to email entry
                      </Text>
                    </>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Text style={{
                      fontSize: 14,
                      ...fontStyles.regular,
                      color: colors.textSecondary
                    }}>Remember your password?</Text>
                    <Text
                      onPress={() => {
                        setAuthMode('login');
                        setEmail('');
                        setResetStep(1);
                      }}
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        ...fontStyles.semibold,
                        color: '#007AFF'
                      }}
                    >
                      Login
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={{ gap: 12, paddingTop: 24 }}>
              <View style={{
                height: 1,
                backgroundColor: colors.border
              }} />
              <Text style={{
                fontSize: 12,
                ...fontStyles.regular,
                color: colors.textTertiary,
                textAlign: 'center'
              }}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;
