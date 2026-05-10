import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans';
import { supabase } from '../lib/supabase';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash can already be hidden during fast refresh.
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
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
      .then(async ({ data }) => {
        if (!mounted) return;
        const sessionExists = Boolean(data.session);
        setHasSession(sessionExists);

        // Onboarding kontrolü: profiles tablosunda display_name var mı?
        if (sessionExists && data.session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', data.session.user.id)
            .maybeSingle();
          
          if (mounted) {
            setOnboardingDone(!!profile?.display_name && profile.display_name.trim().length > 0);
          }
        } else {
          if (mounted) setOnboardingDone(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setHasSession(false);
        setOnboardingDone(null);
      })
      .finally(() => {
        if (!mounted) return;
        clearTimeout(timeout);
        setAuthReady(true);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setHasSession(Boolean(session));
      
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setOnboardingDone(!!profile?.display_name && profile.display_name.trim().length > 0);
      } else {
        setOnboardingDone(null);
      }
      
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
    const inOnboarding = firstSegment === 'onboarding';

    // 1. Oturum yoksa → login'e yönlendir
    if (!hasSession && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // 2. Oturum var ama onboarding yapılmamış → onboarding'e yönlendir
    if (hasSession && onboardingDone === false && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // 3. Oturum var, onboarding tamam, ama hâlâ auth/onboarding ekranında → ana sayfaya yönlendir
    if (hasSession && onboardingDone === true && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
      return;
    }
  }, [authReady, bootTimedOut, error, hasSession, onboardingDone, loaded, router, segments]);

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
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen 
          name="reader/[id]" 
          options={{ 
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom'
          }} 
        />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
