import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components';
import { useTheme } from '../context/ThemeContext';
import { fontStyles } from '../styles/fonts';

const TermsOfServiceScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Terms of Service" onBackPress={() => navigation.goBack()} />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Text style={{ fontSize: 14, ...fontStyles.regular, color: colors.textSecondary, marginBottom: 16 }}>
          Last updated: December 8, 2025
        </Text>

        <View style={{ gap: 20 }}>
          <Section
            title="1. Acceptance of Terms"
            content="By accessing and using AgroPine, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services."
            colors={colors}
          />

          <Section
            title="2. Description of Service"
            content="AgroPine is a marketplace platform that connects pineapple vendors with buyers. We provide tools for vendors to list their products and for buyers to discover and contact vendors."
            colors={colors}
          />

          <Section 
            title="3. User Accounts"
            content="You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account."
            colors={colors}
          />

          <Section 
            title="4. Vendor Responsibilities"
            content="Vendors must provide accurate product information, including descriptions, prices, and availability. Vendors are responsible for all transactions with buyers and must comply with applicable laws and regulations."
            colors={colors}
          />

          <Section
            title="5. Prohibited Activities"
            content="You may not use AgroPine to post false, misleading, or fraudulent content; engage in illegal activities; harass other users; or attempt to gain unauthorized access to our systems."
            colors={colors}
          />

          <Section
            title="6. Content Ownership"
            content="You retain ownership of the content you post on AgroPine. By posting content, you grant us a non-exclusive license to use, display, and distribute your content within the platform."
            colors={colors}
          />

          <Section
            title="7. Product Listings"
            content="All product listings must be accurate and comply with local regulations. AgroPine reserves the right to remove listings that violate these terms or are deemed inappropriate."
            colors={colors}
          />

          <Section
            title="8. Payment and Fees"
            content="AgroPine currently does not charge fees for basic listings. We reserve the right to introduce fees in the future with proper notice to users."
            colors={colors}
          />

          <Section
            title="9. Disclaimer of Warranties"
            content="AgroPine is provided 'as is' without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or the availability of the service."
            colors={colors}
          />

          <Section
            title="10. Limitation of Liability"
            content="AgroPine shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service or any transactions between users."
            colors={colors}
          />

          <Section 
            title="11. Account Termination"
            content="We reserve the right to suspend or terminate your account at any time for violations of these terms. You may also delete your account at any time through the app settings."
            colors={colors}
          />

          <Section
            title="12. Changes to Terms"
            content="We may modify these terms at any time. Continued use of AgroPine after changes constitutes acceptance of the modified terms."
            colors={colors}
          />

          <Section
            title="13. Contact Information"
            content="For questions about these Terms of Service, please contact us at support@agropine.com"
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

export default TermsOfServiceScreen;
