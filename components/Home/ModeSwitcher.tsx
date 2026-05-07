import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Book, Headset, RotateCcw } from 'lucide-react-native';

const MODES = [
  { id: 'reading', label: 'Okuma', icon: Book },
  { id: 'listening', label: 'Dinleme', icon: Headset },
  { id: 'review', label: 'Tekrar', icon: RotateCcw },
];

export const ModeSwitcher = ({ activeMode, onModeChange }: any) => {
  return (
    <View style={styles.container}>
      {MODES.map((mode) => {
        const isActive = activeMode === mode.id;
        const Icon = mode.icon;
        return (
          <TouchableOpacity
            key={mode.id}
            onPress={() => onModeChange(mode.id)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Icon 
              size={18} 
              color={isActive ? Colors.text.primary : Colors.text.secondary} 
              strokeWidth={1.5} 
            />
            <Text style={[
              styles.label, 
              { color: isActive ? Colors.text.primary : Colors.text.secondary },
              isActive && { fontFamily: Typography.bodyMedium }
            ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: Colors.secondarySurface,
    borderRadius: 32,
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: Spacing.outer,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
  },
  activeTab: {
    backgroundColor: Colors.cardBackground,
    // Soft elevation as requested
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: Typography.body,
    letterSpacing: -0.14,
  },
});
