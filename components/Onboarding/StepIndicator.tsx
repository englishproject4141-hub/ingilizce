import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ totalSteps, currentStep }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        
        const animatedStyle = useAnimatedStyle(() => {
          return {
            width: withSpring(isActive ? 28 : 8, { damping: 15 }),
            backgroundColor: isActive ? Colors.text.primary : Colors.text.muted,
            opacity: isActive ? 1 : 0.3,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, animatedStyle]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
