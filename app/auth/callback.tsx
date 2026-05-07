import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackScreen() {
  useEffect(() => {
    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? '/(tabs)' : '/login');
    };

    finish();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.accent.indigo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
