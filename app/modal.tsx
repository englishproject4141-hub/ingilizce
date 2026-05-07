import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography } from '../constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Modal', presentation: 'modal' }} />
      <Text style={styles.title}>Bu bir modal ekranıdır</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Ana ekrana dön</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Colors.text.primary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 16,
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
