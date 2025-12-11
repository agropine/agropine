import { Feather } from '@expo/vector-icons';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

const ConfirmDialog = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default', 'danger', 'warning'
  icon = 'alert-circle',
  isLoading = false,
}) => {
  const { colors } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: '#DC2626',
          confirmBg: '#DC2626',
          confirmText: '#FFFFFF',
        };
      case 'warning':
        return {
          iconColor: '#F59E0B',
          confirmBg: '#F59E0B',
          confirmText: '#FFFFFF',
        };
      default:
        return {
          iconColor: '#007AFF',
          confirmBg: '#007AFF',
          confirmText: '#FFFFFF',
        };
    }
  };

  const variantColors = getVariantColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={isLoading ? null : onClose}
      >
        <Pressable 
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconContainer}>
            <Feather name={icon} size={48} color={variantColors.iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.text }, fontStyles.bold]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }, fontStyles.regular]}>
            {message}
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: colors.border },
                isLoading && styles.buttonDisabled
              ]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }, fontStyles.semibold]}>
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: variantColors.confirmBg },
                isLoading && styles.buttonDisabled
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={[styles.confirmButtonText, { color: variantColors.confirmText }, fontStyles.semibold]}>
                  Loading...
                </Text>
              ) : (
                <Text style={[styles.confirmButtonText, { color: variantColors.confirmText }, fontStyles.semibold]}>
                  {confirmText}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfirmDialog;
