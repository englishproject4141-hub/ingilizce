import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { Headphones } from 'lucide-react-native';
import { FloatingNav } from '../../components/Home/FloatingNav';

export default function ListenScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Headphones size={48} color={Colors.text.muted} />
        <Text style={styles.title}>Dinle</Text>
        <Text style={styles.subtitle}>Sesli içerikler çok yakında burada olacak.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Colors.text.primary,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});
