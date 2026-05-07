import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const getRedirectUrl = () => {
  return Linking.createURL('auth/callback', { scheme: 'linguaapp' });
};

const setSessionFromUrl = async (url: string) => {
  const params = new URLSearchParams(url.includes('#') ? url.split('#')[1] : url.split('?')[1]);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    const error = params.get('error_description') || params.get('error');
    throw new Error(error || 'Google girisi tamamlanamadi.');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
};

export const authService = {
  getRedirectUrl,

  async signInWithGoogle() {
    const redirectTo = getRedirectUrl();
    console.log('[AUTH] Redirect URL:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('Google giris adresi alinamadi.');

    console.log('[AUTH] Opening browser for Google...');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log('[AUTH] Browser result type:', result.type);

    if (result.type !== 'success') {
      throw new Error('Google girisi iptal edildi veya tamamlanamadi.');
    }

    console.log('[AUTH] Callback URL:', (result as any).url);
    await setSessionFromUrl((result as any).url);

    // Oturumu doğrula
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[AUTH] Session after login:', sessionData.session ? 'VAR' : 'YOK');

    if (!sessionData.session) {
      throw new Error('Google girisi tamamlandi ama oturum olusturulamadi.');
    }
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async signInWithApple() {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple ile giris yalnizca iOS cihazlarda kullanilir.');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Bu cihazda Apple ile giris kullanilamiyor.');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple kimlik tokeni alinamadi.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
  },
};
