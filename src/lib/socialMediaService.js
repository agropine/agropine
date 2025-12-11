import { Alert, Linking, Platform } from 'react-native';

/**
 * Open WhatsApp with the provided number
 * @param {string} phoneNumber - Phone number with country code (e.g., +1234567890)
 */
export const openWhatsApp = async (phoneNumber) => {
  if (!phoneNumber) {
    Alert.alert('Error', 'WhatsApp number not provided');
    return;
  }

  try {
    // Remove all non-numeric characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // WhatsApp deep link format
    const url = `whatsapp://send?phone=${cleanNumber}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web WhatsApp
      const webUrl = `https://wa.me/${cleanNumber}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to open WhatsApp: ' + error.message);
  }
};

/**
 * Open Instagram profile
 * @param {string} username - Instagram username (with or without @)
 */
export const openInstagram = async (username) => {
  if (!username) {
    Alert.alert('Error', 'Instagram username not provided');
    return;
  }

  try {
    // Remove @ if present
    const cleanUsername = username.replace('@', '');
    
    const url = Platform.OS === 'ios'
      ? `instagram://user?username=${cleanUsername}`
      : `https://www.instagram.com/${cleanUsername}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web Instagram
      await Linking.openURL(`https://www.instagram.com/${cleanUsername}`);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to open Instagram: ' + error.message);
  }
};

/**
 * Open TikTok profile
 * @param {string} username - TikTok username (with or without @)
 */
export const openTikTok = async (username) => {
  if (!username) {
    Alert.alert('Error', 'TikTok username not provided');
    return;
  }

  try {
    // Remove @ if present
    const cleanUsername = username.replace('@', '');
    
    const url = Platform.OS === 'ios'
      ? `tiktok://user/@${cleanUsername}`
      : `https://www.tiktok.com/@${cleanUsername}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web TikTok
      await Linking.openURL(`https://www.tiktok.com/@${cleanUsername}`);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to open TikTok: ' + error.message);
  }
};

/**
 * Open Facebook profile
 * @param {string} username - Facebook username or page name
 */
export const openFacebook = async (username) => {
  if (!username) {
    Alert.alert('Error', 'Facebook profile not provided');
    return;
  }

  try {
    // Try to open via Facebook app first
    const facebookAppUrl = Platform.OS === 'ios'
      ? `fb://profile/${username}`
      : `https://www.facebook.com/${username}`;
    
    const supported = await Linking.canOpenURL(facebookAppUrl);
    if (supported && Platform.OS === 'ios') {
      await Linking.openURL(facebookAppUrl);
    } else {
      // Fallback to web Facebook
      await Linking.openURL(`https://www.facebook.com/${username}`);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to open Facebook: ' + error.message);
  }
};
