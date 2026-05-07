import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const SkeletonCard = () => {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.thumbnail, { opacity }]} />
      <View style={styles.body}>
        <Animated.View style={[styles.line, { width: '40%', opacity }]} />
        <Animated.View style={[styles.line, { width: '90%', height: 14, marginVertical: 8, opacity }]} />
        <Animated.View style={[styles.line, { width: '60%', opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - 64 - 16) / 2,
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: {
    height: 85,
    backgroundColor: '#E5E7EB',
  },
  body: {
    padding: 10,
  },
  line: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
  },
});
