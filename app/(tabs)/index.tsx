import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator 
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { ModeSwitcher } from '../../components/Home/ModeSwitcher';
import { HeroCard } from '../../components/Home/HeroCard';
import { 
  RecommendationCards, 
  DailyFocus, 
  ProgressGrid, 
  ActivityStrip, 
  InspirationPanel,
  HomeStats,
  DailyActivity 
} from '../../components/Home/EditorialSections';
import { FloatingNav } from '../../components/Home/FloatingNav';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/userService';

export default function HomeScreen() {
  const [activeMode, setActiveMode] = useState('reading');
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Her sekmeye dönüldüğünde otomatik yenile
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Paralel sorgular
      const [profile, profileStats, calendarData] = await Promise.all([
        userService.getUserProfile(user.id),
        userService.getProfileStats(user.id),
        userService.getActivityCalendar(user.id, 30),
      ]);

      // Journey hesaplaması
      const LEVEL_WORD_THRESHOLDS: Record<string, number> = {
        'A1': 500, 'A2': 1000, 'B1': 2000, 'B2': 4000, 'C1': 8000, 'C2': 16000,
      };
      const currentLevel = profile?.current_level || 'B1';
      const targetLevel = profile?.target_level || 'B2';
      const currentThreshold = LEVEL_WORD_THRESHOLDS[currentLevel] || 0;
      const targetThreshold = LEVEL_WORD_THRESHOLDS[targetLevel] || 1000;
      const totalLearned = profileStats?.learnedWords || 0;
      const progressToNext = Math.max(0, totalLearned - currentThreshold);
      const requiredForNext = Math.max(1, targetThreshold - currentThreshold);
      const journeyPercentage = Math.min(100, Math.round((progressToNext / requiredForNext) * 100));

      // Bu ayki kelime artışını hesapla
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const { count: monthlyNewWords } = await supabase
        .from('user_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());

      setHomeStats({
        streakCount: profile?.streak_count || 0,
        learnedWords: profileStats?.learnedWords || 0,
        monthlyNewWords: monthlyNewWords || 0,
        currentLevel,
        targetLevel,
        journeyPercentage,
      });

      setActivities(calendarData || []);
    } catch (e) {
      console.error('Home veri yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

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
          
          <ProgressGrid stats={homeStats} />
          
          <ActivityStrip activities={activities || []} />
          
          <InspirationPanel />
        </ScrollView>
      </SafeAreaView>
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
