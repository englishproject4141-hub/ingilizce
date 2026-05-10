import { Tabs } from 'expo-router';
import React from 'react';
import { Colors, Typography } from '../../constants/theme';
import { Home, Compass, Headphones, Bookmark, User } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { FloatingNav } from '../../components/Home/FloatingNav';
import { MiniPlayer } from '../../components/Reader/MiniPlayer';

export default function TabLayout() {
  const pathname = usePathname();
  
  // Hangi tabın aktif olduğunu pathname'den bul (Basit versiyon)
  const activeTab = pathname.includes('discover') ? 'discover' : 
                    pathname.includes('listen') ? 'listen' : 
                    pathname.includes('words') ? 'words' : 
                    pathname.includes('profile') ? 'profile' : 'home';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: Colors.background }
        }}>
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
        <Tabs.Screen name="discover" options={{ title: 'Keşfet' }} />
        <Tabs.Screen name="listen" options={{ title: 'Dinle' }} />
        <Tabs.Screen name="words" options={{ title: 'Kelimelerim' }} />
        <Tabs.Screen name="profile" options={{ title: 'Ben' }} />
      </Tabs>
      
      {/* ── PERSISTENT NAVIGATION & PLAYER ── */}
      <View style={styles.navContainer}>
        <MiniPlayer />
        <FloatingNav activeTab={activeTab} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    pointerEvents: 'box-none', // Altındaki tıklamaları engellememesi için
  }
});
