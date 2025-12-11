import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation';
import config from './tamagui.config';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme, isLoading } = useTheme();

  useEffect(() => {
    // Hide splash screen immediately since we're using system fonts
    SplashScreen.hideAsync();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config} defaultTheme={theme}>
        <AuthProvider>
          <RootNavigator />
          <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        </AuthProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
