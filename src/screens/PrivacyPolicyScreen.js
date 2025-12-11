import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Privacy Policy" onBackPress={() => navigation.goBack()} />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary, marginBottom: 16 }}>
          Last updated: December 8, 2025
        </Text>

        <View style={{ gap: 20 }}>
          <Section 
            title="1. Information We Collect"
            content="We collect information you provide directly to us, including your name, email address, phone number, profile photo, business address, and product listings. We also collect information about your use of our services."
            colors={colors}
          />

          <Section 
            title="2. How We Use Your Information"
            content="We use the information we collect to provide, maintain, and improve our services, to process your transactions, to send you technical notices and support messages, and to communicate with you about products, services, and events."
            colors={colors}
          />

          <Section 
            title="3. Information Sharing"
            content="We do not share your personal information with third parties except as described in this policy. We may share your information with vendors and service providers who perform services on our behalf."
            colors={colors}
          />

          <Section 
            title="4. Data Security"
            content="We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. Your data is stored securely using industry-standard encryption."
            colors={colors}
          />

          <Section 
            title="5. Your Rights"
            content="You have the right to access, update, or delete your personal information at any time through your profile settings. You may also request a copy of your data or close your account."
            colors={colors}
          />

          <Section 
            title="6. Location Data"
            content="We collect and use location information to provide location-based features, such as showing products near you. You can control location permissions through your device settings."
            colors={colors}
          />

          <Section 
            title="7. Photos and Images"
            content="Photos you upload for your profile or products are stored securely and displayed publicly within the app. You can delete or change your photos at any time."
            colors={colors}
          />

          <Section 
            title="8. Children's Privacy"
            content="Our services are not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13."
            colors={colors}
          />

          <Section 
            title="9. Changes to This Policy"
            content="We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last updated' date."
            colors={colors}
          />

          <Section
            title="10. Contact Us"
            content="If you have any questions about this Privacy Policy, please contact us at support@agropine.com"
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Section = ({ title, content, colors }) => (
  <View>
    <Text style={{ fontSize: 16, fontWeight: '700', ...fontStyles.bold, color: colors.text, marginBottom: 8 }}>
      {title}
    </Text>
    <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary, lineHeight: 22 }}>
      {content}
    </Text>
  </View>
);

export default PrivacyPolicyScreen;
