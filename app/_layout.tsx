import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans';
import { supabase } from '../lib/supabase';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash can already be hidden during fast refresh.
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loaded, error] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBootTimedOut(true);
    }, 3500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setAuthReady(true);
    }, 3500);

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setHasSession(Boolean(data.session));
      })
      .catch(() => {
        if (!mounted) return;
        setHasSession(false);
      })
      .finally(() => {
        if (!mounted) return;
        clearTimeout(timeout);
        setAuthReady(true);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if ((!loaded && !error && !bootTimedOut) || !authReady) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(auth)' || firstSegment === 'auth';

    // Geliştirme aşamasında girişi atlamak için bu kontrolü geçici olarak kapatıyoruz
    /*
    if (!hasSession && !inAuthGroup) {
      router.replace('/login');
    }
    */

    if (hasSession && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [authReady, bootTimedOut, error, hasSession, loaded, router, segments]);

  useEffect(() => {
    if (loaded || error || bootTimedOut) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore duplicate hide calls.
      });
    }
  }, [loaded, error, bootTimedOut]);

  if (!loaded && !error && !bootTimedOut) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="reader/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom'
          }} 
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
