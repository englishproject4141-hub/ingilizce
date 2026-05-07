import { Tabs } from 'expo-router';
import React from 'react';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: Colors.background }
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="words" />
    </Tabs>
  );
}
