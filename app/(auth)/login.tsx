import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Apple, BookOpenText, ChevronRight, Globe, ShieldCheck, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows, Typography } from '../../constants/theme';
import { authService } from '../../services/authService';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const pulse = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [floatY, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handleGoogle = async () => {
    try {
      setLoadingProvider('google');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await authService.signInWithGoogle();
      router.replace('/onboarding');
    } catch (e) {
      Alert.alert('Google girisi basarisiz', e instanceof Error ? e.message : 'Tekrar dene.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleApple = async () => {
    try {
      setLoadingProvider('apple');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await authService.signInWithApple();
      router.replace('/onboarding');
    } catch (e) {
      Alert.alert('Apple girisi basarisiz', e instanceof Error ? e.message : 'Tekrar dene.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={require('../../assets/images/scandinavian_desk_hero.png')}
        style={styles.hero}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(246,241,235,0.1)', Colors.background, Colors.background]}
          locations={[0, 0.66, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.previewCard, cardStyle]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIcon}>
              <BookOpenText size={18} color={Colors.text.primary} />
            </View>
            <Text style={styles.previewMeta}>B1 • 8 dk • Listening</Text>
          </View>
          <Text style={styles.previewTitle}>Bugunku seansin hazir</Text>
          <View style={styles.previewProgress}>
            <View style={styles.previewProgressFill} />
          </View>
        </Animated.View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Sparkles size={18} color={Colors.accent.indigo} />
          </View>
          <Text style={styles.brandText}>LINGUA</Text>
        </View>

        <Text style={styles.title}>Ingilizce calisma ritmini baslat.</Text>
        <Text style={styles.subtitle}>
          Seviyene gore okuma, dinleme ve kelime tekrarlarini tek yerde takip et.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoogle}
            disabled={loadingProvider !== null}
            activeOpacity={0.86}
          >
            <View style={styles.buttonIcon}>
              {loadingProvider === 'google' ? (
                <ActivityIndicator size="small" color={Colors.text.primary} />
              ) : (
                <Globe size={20} color={Colors.text.primary} />
              )}
            </View>
            <Text style={styles.primaryButtonText}>Google ile devam et</Text>
            <ChevronRight size={18} color={Colors.text.primary} />
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleApple}
              disabled={loadingProvider !== null}
              activeOpacity={0.86}
            >
              <Apple size={20} color={Colors.surface.white} />
              <Text style={styles.secondaryButtonText}>Apple ile devam et</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border }]}
            onPress={() => router.replace('/onboarding')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: Colors.text.secondary }]}>Girişi Atla (Geliştirici Modu)</Text>
          </TouchableOpacity>
        </View>

        <Pressable style={styles.trustRow}>
          <ShieldCheck size={15} color={Colors.text.secondary} />
          <Text style={styles.trustText}>Supabase guvenli OAuth ile oturum acilir.</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    height: '48%',
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -width * 0.14,
    bottom: 28,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: Colors.accent.warmGold,
  },
  previewCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 18,
    padding: 18,
    ...Shadows.medium,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  previewTitle: {
    fontFamily: Typography.header,
    fontSize: 28,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  previewProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(30,43,74,0.08)',
    overflow: 'hidden',
  },
  previewProgressFill: {
    width: '64%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.accent.warmGold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.tag.indigo.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2.4,
    color: Colors.text.primary,
  },
  title: {
    fontFamily: Typography.header,
    fontSize: 42,
    lineHeight: 44,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text.secondary,
    marginBottom: 26,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    height: 62,
    borderRadius: 18,
    backgroundColor: Colors.surface.white,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    ...Shadows.subtle,
  },
  buttonIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.text.primary,
  },
  secondaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: Colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.surface.white,
  },
  trustRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  trustText: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
