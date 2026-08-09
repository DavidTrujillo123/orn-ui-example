import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { SafeAreaUIProvider } from 'orn-ui/safe-area';
import { AlertProvider } from 'orn-ui/alert-provider';
import { ToastProvider } from 'orn-ui/toast-provider';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/presentation/state/AuthContext';
import { CartProvider } from '@/presentation/state/CartContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaUIProvider defaultMode="system">
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AlertProvider>
          <ToastProvider position="top">
            <AuthProvider>
              <CartProvider>
                <AnimatedSplashOverlay />
                <AppTabs />
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaUIProvider>
  );
}
