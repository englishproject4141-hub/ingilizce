import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Archive, Repeat, Landmark, Sparkles, Trophy, ChevronRight, Search, X, Zap } from 'lucide-react-native';
import { Colors, Typography, Spacing, Shadows } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingNav } from '../../components/Home/FloatingNav';

const { width, height } = Dimensions.get('window');

// --- DESIGN CONSTANTS (Editorial Light Theme) ---
const Theme = {
  background: Colors.background,
  accent: Colors.accent.indigo,
  accentGold: Colors.accent.warmGold,
  card: Colors.surface.white,
  cardBorder: Colors.border,
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  cyan: '#2DE2E6',
};

import { userService } from '../../services/userService';
import { supabase } from '../../lib/supabase';

type TabType = 'vault' | 'srs' | 'museum';

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export default function WordsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('vault');
  const [isSRSRunning, setIsSRSRunning] = useState(false);
  const [userWords, setUserWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserWords = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 5000);
        if (session?.user?.id) {
          const words = await withTimeout(userService.getUserWords(session.user.id), 7000);
          setUserWords(words);
        }
      } catch (e) {
        console.error('fetchUserWords error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserWords();
  }, []);

  if (isSRSRunning) {
    return <SRSSession onExit={() => setIsSRSRunning(false)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBarBackground />
      
      <SafeAreaView style={styles.safeArea}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>KELİMELER</Text>
            <Text style={styles.headerSubtitle}>Koleksiyonun büyüyor</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={22} color={Theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* --- CUSTOM SEGMENTED CONTROL --- */}
        <View style={styles.tabBar}>
          <TabButton 
            title="Hazine" 
            icon={<Archive size={18} color={activeTab === 'vault' ? Theme.accent : Theme.textSecondary} />}
            isActive={activeTab === 'vault'} 
            onPress={() => setActiveTab('vault')} 
          />
          <TabButton 
            title="Tekrar" 
            icon={<Repeat size={18} color={activeTab === 'srs' ? Theme.accent : Theme.textSecondary} />}
            isActive={activeTab === 'srs'} 
            onPress={() => setActiveTab('srs')} 
          />
          <TabButton 
            title="Müze" 
            icon={<Landmark size={18} color={activeTab === 'museum' ? Theme.accent : Theme.textSecondary} />}
            isActive={activeTab === 'museum'} 
            onPress={() => setActiveTab('museum')} 
          />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'vault' && <VaultTab words={userWords} loading={loading} />}
          {activeTab === 'srs' && <SRSTab onStart={() => setIsSRSRunning(true)} />}
          {activeTab === 'museum' && <MuseumTab />}
        </ScrollView>
      </SafeAreaView>

      <FloatingNav activeTab="review" />
    </View>
  );
}

// --- SUB-TABS ---

const VaultTab = ({ words, loading }: { words: any[], loading: boolean }) => {
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
        <ActivityIndicator color={Theme.accent} />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={[styles.headerSubtitle, { textAlign: 'center', marginTop: 40 }]}>
          Henüz kelime kaydetmedin. Okurken kelimelere basarak listene ekleyebilirsin.
        </Text>
      </View>
    );
  }

  const masteredCount = words.filter(w => w.status === 'known').length;

  return (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{words.length}</Text>
          <Text style={styles.statLabel}>Keşfedilen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{masteredCount}</Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
      </View>

      {words.map((item, index) => (
        <WordCard 
          key={index} 
          item={{
            word: item.word,
            meaning: item.dictionary?.definition_tr || 'Tanım yükleniyor...',
            mastery: item.status === 'known' ? 100 : (item.status === 'learning' ? 50 : 10),
            rarity: item.dictionary?.cefr_level || 'B1',
          }} 
        />
      ))}
    </View>
  );
};

const SRSTab = ({ onStart }: { onStart: () => void }) => {
  return (
    <View style={styles.srsContainer}>
      <View style={styles.srsHeader}>
        <Sparkles color={Theme.accent} size={24} />
        <Text style={styles.srsTitle}>Günlük Ritual</Text>
        <Text style={styles.srsSubtitle}>Bugün tekrar etmen gereken 12 kelime var</Text>
      </View>

      <TouchableOpacity style={styles.startSRSBtn} onPress={onStart}>
        <LinearGradient
          colors={[Colors.accent.indigo, '#4C3BFF']}
          style={styles.gradientBtn}
        >
          <Text style={styles.startSRSText}>OTURUMU BAŞLAT</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.srsStatsContainer}>
        <View style={styles.srsStatItem}>
          <Text style={styles.srsStatVal}>85%</Text>
          <Text style={styles.srsStatLab}>Hatırlama Oranı</Text>
        </View>
        <View style={styles.srsStatItem}>
          <Text style={styles.srsStatVal}>12</Text>
          <Text style={styles.srsStatLab}>Seri (Gün)</Text>
        </View>
      </View>
    </View>
  );
};

const MuseumTab = () => {
  return (
    <View style={styles.museumContainer}>
      <View style={styles.museumPlaceholder}>
        <Landmark size={64} color="rgba(0,0,0,0.05)" />
        <Text style={styles.museumPlaceholderTitle}>Bağlam Müzesi</Text>
        <Text style={styles.museumPlaceholderText}>
          Kelimeleri gerçek dünya sahnelerinde gör. (Faz 2 Yakında)
        </Text>
      </View>
    </View>
  );
};

// --- SRS SESSION VIEW (Light Premium SRS) ---

const SRSSession = ({ onExit }: { onExit: () => void }) => {
  const [showMeaning, setShowMeaning] = useState(false);
  
  return (
    <View style={[styles.container, { backgroundColor: Theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.srsSessionHeader}>
          <TouchableOpacity onPress={onExit}>
            <X size={24} color={Theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.srsProgressTrack}>
            <View style={[styles.srsProgressFill, { width: '40%' }]} />
          </View>
          <View style={styles.srsBadge}>
            <Zap size={14} color={Theme.accent} />
            <Text style={styles.srsBadgeText}>4/12</Text>
          </View>
        </View>

        <View style={styles.flashcardContainer}>
          <Pressable 
            style={styles.flashcard}
            onPress={() => setShowMeaning(!showMeaning)}
          >
            <Text style={styles.flashcardWord}>PRODUCTIVITY</Text>
            
            {showMeaning && (
              <View style={styles.meaningOverlayLight}>
                <Text style={styles.meaningText}>output per unit effort</Text>
                <Text style={styles.exampleText}>{'"'}The new tools significantly improved our productivity.{'"'}</Text>
              </View>
            )}
            
            {!showMeaning && (
              <Text style={styles.tapToReveal}>Dokun ve öğren</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.srsControls}>
          <Text style={styles.confidenceLabel}>Ne kadar eminsin?</Text>
          <View style={styles.confidenceSliderBg}>
            <LinearGradient
              colors={['#FF4B2B', '#FF416C', '#2DE2E6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confidenceSliderFill}
            />
            <View style={styles.confidenceThumb} />
          </View>
          <View style={styles.confidenceTicks}>
            <Text style={styles.tickLabel}>Hiç</Text>
            <Text style={styles.tickLabel}>Biraz</Text>
            <Text style={styles.tickLabel}>Tamam!</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- COMPONENTS ---

const TabButton = ({ title, icon, isActive, onPress }: { title: string, icon: any, isActive: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.tabButton, isActive && styles.tabButtonActive]} 
    onPress={onPress}
  >
    {icon}
    <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const WordCard = ({ item }: { item: any }) => {
  const isMastered = item.mastery === 100;

  return (
    <View style={styles.wordCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.wordTitle}>{item.word}</Text>
          <Text style={styles.wordMeaning} numberOfLines={1}>{item.meaning}</Text>
        </View>
        <View style={[styles.rarityBadge, item.rarity === 'EPIC' && styles.rarityEpic]}>
          <Text style={styles.rarityText}>{item.rarity}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${item.mastery}%` },
                isMastered && { backgroundColor: Theme.accent }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{item.mastery}% Mastery</Text>
        </View>
        <ChevronRight size={18} color={Theme.textSecondary} />
      </View>

      {isMastered && (
        <View style={styles.masteredGlow} />
      )}
    </View>
  );
};

const StatusBarBackground = () => (
  <View style={styles.statusBarBg} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  statusBarBg: {
    height: 60,
    width: '100%',
    backgroundColor: Theme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.outer,
    paddingVertical: 20,
  },
  headerTitle: {
    fontFamily: Typography.header,
    fontSize: 28,
    color: Theme.textPrimary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Theme.textSecondary,
    marginTop: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.outer,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: Theme.card,
    ...Shadows.subtle,
  },
  tabButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  tabButtonTextActive: {
    color: Theme.accent,
  },
  scrollContent: {
    paddingHorizontal: Spacing.outer,
    paddingBottom: 100,
  },
  tabContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    ...Shadows.subtle,
  },
  statValue: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Theme.accent,
  },
  statLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Theme.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wordCard: {
    backgroundColor: Theme.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  wordTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 20,
    color: Theme.textPrimary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  wordMeaning: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: 4,
    width: width * 0.5,
  },
  rarityBadge: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityEpic: {
    backgroundColor: 'rgba(91, 79, 240, 0.1)',
  },
  rarityText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    color: Theme.accent,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginRight: 20,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.textSecondary,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Theme.textSecondary,
  },
  masteredGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Theme.accentGold,
    opacity: 0.5,
  },
  // --- SRS STYLES ---
  srsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  srsHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  srsTitle: {
    fontFamily: Typography.header,
    fontSize: 32,
    color: Theme.textPrimary,
    marginTop: 16,
  },
  srsSubtitle: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  startSRSBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 40,
    ...Shadows.medium,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startSRSText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 2,
  },
  srsStatsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  srsStatItem: {
    alignItems: 'center',
  },
  srsStatVal: {
    fontFamily: Typography.header,
    fontSize: 28,
    color: Theme.accent,
  },
  srsStatLab: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Theme.textSecondary,
    marginTop: 4,
  },
  // --- MUSEUM STYLES ---
  museumContainer: {
    flex: 1,
    height: 400,
    justifyContent: 'center',
  },
  museumPlaceholder: {
    alignItems: 'center',
  },
  museumPlaceholderTitle: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Theme.textPrimary,
    marginTop: 20,
  },
  museumPlaceholderText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  // --- SRS SESSION STYLES ---
  srsSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.outer,
    paddingVertical: 20,
  },
  srsProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  srsProgressFill: {
    height: '100%',
    backgroundColor: Theme.accent,
  },
  srsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 79, 240, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  srsBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: Theme.accent,
  },
  flashcardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.outer,
  },
  flashcard: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: Theme.card,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.medium,
  },
  flashcardWord: {
    fontFamily: Typography.header,
    fontSize: 42,
    color: Theme.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  tapToReveal: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Theme.textSecondary,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  meaningOverlayLight: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: Theme.cardBorder,
  },
  meaningText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Theme.accent,
    textAlign: 'center',
  },
  exampleText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Theme.textPrimary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  srsControls: {
    paddingHorizontal: Spacing.outer,
    paddingBottom: 60,
  },
  confidenceLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  confidenceSliderBg: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  confidenceSliderFill: {
    width: '60%',
    height: '100%',
  },
  confidenceThumb: {
    position: 'absolute',
    left: '60%',
    top: -4,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#E5E7EB',
  },
  confidenceTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tickLabel: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
