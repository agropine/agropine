import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, ConfirmDialog } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { changePassword, deleteAccount } from '../lib/authService';
import { showErrorToast, showSuccessToast } from '../lib/toastService';
import { fontStyles } from '../styles/fonts';

const SettingsScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showPasswordChangeConfirm, setShowPasswordChangeConfirm] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      showErrorToast('Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      showErrorToast('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      showErrorToast('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      showErrorToast('New password must be different from current password');
      return;
    }

    // Show confirmation dialog
    setShowPasswordChangeConfirm(true);
  };

  const confirmPasswordChange = async () => {
    setIsLoadingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSuccessToast('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      setShowPasswordChangeConfirm(false);
    } catch (error) {
      showErrorToast(error.message || 'Failed to change password');
      console.error('Change password error:', error);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This action cannot be undone. All your data, products, and profile information will be permanently deleted.',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete cancelled'),
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          onPress: confirmDeleteAccount,
          style: 'destructive',
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    // Validate user exists
    if (!user || !user.id) {
      showErrorToast('User information not found. Please try again.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(user.id);
      showSuccessToast('Account deleted successfully');
      await signOut();
      // Close the Auth modal and go to Home
      navigation.goBack();
      navigation.navigate('Home');
    } catch (error) {
      showErrorToast(error.message || 'Failed to delete account');
      console.error('Delete account error:', error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title="Settings"
        subtitle="Manage your account"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Appearance Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 12 }}>
            Appearance
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <Feather name={theme === 'dark' ? 'moon' : 'sun'} size={20} color="#007AFF" />
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                  Dark Mode
                </Text>
                <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                  {theme === 'dark' ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#34C759' }}
              thumbColor={theme === 'dark' ? '#0A84FF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Account Information Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 12 }}>
            Account & Security
          </Text>
          <View style={{ gap: 8 }}>
            {/* Email */}
            <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>Email</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', ...fontStyles.semibold, color: colors.text, marginTop: 4 }}>
                {user?.email}
              </Text>
            </View>

            {/* Change Password */}
            <View>
              <Pressable
                onPress={() => setIsChangingPassword(!isChangingPassword)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.surfaceContainer : colors.surface,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <Feather name="lock" size={20} color="#007AFF" />
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: colors.text }}>
                        Change Password
                      </Text>
                      <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary, marginTop: 2 }}>
                        Update your password
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={isChangingPassword ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>

              {isChangingPassword && (
                <View style={{ marginTop: 16, gap: 12, padding: 16, backgroundColor: colors.surfaceContainer, borderRadius: 8 }}>
                  {/* Current Password */}
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 8 }}>
                      Current Password
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPassword}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          paddingRight: 40,
                          fontSize: 14,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          backgroundColor: colors.surface
                        }}
                        placeholderTextColor={colors.textTertiary}
                        editable={!isLoadingPassword}
                      />
                      <Pressable
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        hitSlop={10}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 0,
                          bottom: 0,
                          justifyContent: 'center'
                        }}
                      >
                        <Feather name={showCurrentPassword ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>

                  {/* New Password */}
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 8 }}>
                      New Password
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          paddingRight: 40,
                          fontSize: 14,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          backgroundColor: colors.surface
                        }}
                        placeholderTextColor={colors.textTertiary}
                        editable={!isLoadingPassword}
                      />
                      <Pressable
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        hitSlop={10}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 0,
                          bottom: 0,
                          justifyContent: 'center'
                        }}
                      >
                        <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Confirm Password */}
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 8 }}>
                      Confirm Password
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          paddingRight: 40,
                          fontSize: 14,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          backgroundColor: colors.surface
                        }}
                        placeholderTextColor={colors.textTertiary}
                        editable={!isLoadingPassword}
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={10}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 0,
                          bottom: 0,
                          justifyContent: 'center'
                        }}
                      >
                        <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Buttons */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <AppButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      style={{ flex: 1 }}
                      disabled={isLoadingPassword}
                    />
                    <AppButton
                      title="Change Password"
                      onPress={handleChangePassword}
                      style={{ flex: 1 }}
                      loading={isLoadingPassword}
                      disabled={isLoadingPassword}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Delete Account */}
            <Pressable
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#FEE2E2' : colors.surface,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#FCA5A5',
                opacity: isDeletingAccount ? 0.6 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <Feather name="trash-2" size={20} color="#DC2626" />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', ...fontStyles.semibold, color: '#DC2626' }}>
                      Delete Account
                    </Text>
                    <Text style={{ fontSize: 12, ...fontStyles.regular, color: '#991B1B', marginTop: 2 }}>
                      Permanently delete your account and data
                    </Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={20} color="#DC2626" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Legal & Support */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', ...fontStyles.semibold, color: colors.text, marginBottom: 12 }}>
            Legal & Support
          </Text>
          <View style={{ gap: 8 }}>
            {/* Privacy Policy */}
            <Pressable
              onPress={() => navigation.navigate('PrivacyPolicy')}
              style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Feather name="shield" size={20} color="#007AFF" />
                <Text style={{ fontSize: 14, fontWeight: '500', ...fontStyles.semibold, color: colors.text }}>
                  Privacy Policy
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Terms of Service */}
            <Pressable
              onPress={() => navigation.navigate('TermsOfService')}
              style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Feather name="file-text" size={20} color="#007AFF" />
                <Text style={{ fontSize: 14, fontWeight: '500', ...fontStyles.semibold, color: colors.text }}>
                  Terms of Service
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Support Email */}
            <Pressable
              onPress={() => Linking.openURL('mailto:support@agropine.com')}
              style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Feather name="mail" size={20} color="#007AFF" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textSecondary }}>Support</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', ...fontStyles.semibold, color: '#007AFF', marginTop: 2 }}>
                    support@agropine.com
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* App Version */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, ...fontStyles.regular, color: colors.textTertiary }}>
              App Version
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', ...fontStyles.semibold, color: colors.textSecondary, marginTop: 4 }}>
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Password Change Confirmation Dialog */}
      <ConfirmDialog
        visible={showPasswordChangeConfirm}
        onClose={() => setShowPasswordChangeConfirm(false)}
        onConfirm={confirmPasswordChange}
        title="Change Password?"
        message="Are you sure you want to change your password? You will need to use the new password for future logins."
        confirmText="Change Password"
        cancelText="Cancel"
        variant="warning"
        icon="lock"
        isLoading={isLoadingPassword}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;
