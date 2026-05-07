import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const ReaderSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBlock = ({ style }: { style?: any }) => (
    <Animated.View style={[styles.skeleton, style, { opacity }]} />
  );

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonBlock style={styles.category} />
        <SkeletonBlock style={styles.title} />
        <SkeletonBlock style={styles.titleSmall} />
        <View style={styles.divider} />
      </View>

      {/* Paragraph Skeletons */}
      {[1, 2, 3].map((_, i) => (
        <View key={i} style={styles.paragraph}>
          <SkeletonBlock style={styles.line} />
          <SkeletonBlock style={styles.line} />
          <SkeletonBlock style={[styles.line, { width: '80%' }]} />
          <SkeletonBlock style={[styles.line, { width: '60%' }]} />
        </View>
      ))}

      {/* Floating Player Skeleton */}
      <View style={styles.playerContainer}>
        <SkeletonBlock style={styles.player} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.surface.white,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  category: {
    width: 120,
    height: 14,
    marginBottom: 16,
  },
  title: {
    width: '100%',
    height: 32,
    marginBottom: 12,
  },
  titleSmall: {
    width: '60%',
    height: 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 32,
  },
  paragraph: {
    marginBottom: 32,
  },
  line: {
    width: '100%',
    height: 18,
    marginBottom: 12,
  },
  playerContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  player: {
    width: width - 40,
    height: 80,
    borderRadius: 40,
  },
});
