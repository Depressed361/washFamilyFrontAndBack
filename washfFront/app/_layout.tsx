// app/_layout.tsx
import { UserProvider } from '@/context/user.context';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null; // ou un SplashScreen/loading indicator
  }

  const theme =  DefaultTheme;

  return (
    <UserProvider>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <Stack>
         
            {/* Main app flow */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Fallback 404 */}
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </UserProvider>
  );
}
