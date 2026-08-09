import { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import type { ThemeMode } from 'orn-ui/theme';
import { AlertProvider } from 'orn-ui/alert-provider';
import { ToastProvider } from 'orn-ui/toast-provider';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BrandProvider } from '@/components/BrandProvider';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/presentation/state/AuthContext';
import { CartProvider } from '@/presentation/state/CartContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Controlado acá, no en <SafeAreaUIProvider>, porque BrandProvider necesita
  // el modo actual para reconstruir el theme cuando cambia también el color.
  const [mode, setMode] = useState<ThemeMode>('system');

  return (
    <BrandProvider mode={mode} onModeChange={setMode}>
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
    </BrandProvider>
  );
}
