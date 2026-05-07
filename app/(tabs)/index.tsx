import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { ModeSwitcher } from '../../components/Home/ModeSwitcher';
import { HeroCard } from '../../components/Home/HeroCard';
import { 
  RecommendationCards, 
  DailyFocus, 
  ProgressGrid, 
  ActivityStrip, 
  InspirationPanel 
} from '../../components/Home/EditorialSections';
import { FloatingNav } from '../../components/Home/FloatingNav';

export default function HomeScreen() {
  const [activeMode, setActiveMode] = useState('reading');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerSpacer} />
          
          <ModeSwitcher 
            activeMode={activeMode} 
            onModeChange={setActiveMode} 
          />
          
          <HeroCard />
          
          <View style={styles.sectionSpacer} />
          
          <RecommendationCards />
          
          <DailyFocus />
          
          <ProgressGrid />
          
          <ActivityStrip />
          
          <InspirationPanel />
        </ScrollView>
      </SafeAreaView>

      <FloatingNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSpacer: {
    height: 20,
  },
  sectionSpacer: {
    height: 32,
  },
});
