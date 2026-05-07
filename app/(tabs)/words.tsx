import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Archive, Repeat, Landmark, Sparkles, ChevronRight, Search, X, Zap, CheckCircle2, Clock3 } from 'lucide-react-native';
import { Colors, Typography, Spacing, Shadows } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingNav } from '../../components/Home/FloatingNav';
import { userService } from '../../services/userService';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

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
        <WordsHeader />

        {/* --- CUSTOM SEGMENTED CONTROL --- */}
        <WordsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'vault' && <VaultTabPolished words={userWords} loading={loading} />}
          {activeTab === 'srs' && <SRSTab onStart={() => setIsSRSRunning(true)} />}
          {activeTab === 'museum' && <MuseumTab />}
        </ScrollView>
      </SafeAreaView>

      <FloatingNav activeTab="review" />
    </View>
  );
}

// --- SUB-TABS ---

const WordsHeader = () => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerTitle}>Kelimeler</Text>
      <Text style={styles.headerSubtitle}>Koleksiyonun büyüyor</Text>
    </View>
    <TouchableOpacity style={styles.searchButton}>
      <Search size={22} color={Theme.textPrimary} />
    </TouchableOpacity>
  </View>
);

const WordsTabs = ({ activeTab, setActiveTab }: { activeTab: TabType, setActiveTab: (tab: TabType) => void }) => (
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
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const VaultTabPolished = ({ words, loading }: { words: any[], loading: boolean }) => {
  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={Theme.accent} />
        <Text style={styles.loadingText}>Kelimeler hazırlanıyor</Text>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Archive size={28} color={Theme.accent} />
          </View>
          <Text style={styles.emptyTitle}>Henüz kelime yok</Text>
          <Text style={styles.emptyText}>
            Okuma sırasında bilmediğin kelimelere dokun. Burada anlamları, seviyeleri ve öğrenme durumlarıyla birikir.
          </Text>
        </View>
      </View>
    );
  }

  const masteredCount = words.filter(w => w.status === 'known').length;
  const learningCount = words.filter(w => w.status === 'learning').length;

  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#FFFFFF', '#F7F3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.vaultHero}
      >
        <View style={styles.vaultHeroIcon}>
          <Sparkles size={18} color={Theme.accent} />
        </View>
        <View style={styles.vaultHeroCopy}>
          <Text style={styles.vaultHeroKicker}>Kelime Hazinesi</Text>
          <Text style={styles.vaultHeroTitle}>{words.length} kelimelik kişisel arşiv</Text>
          <Text style={styles.vaultHeroText}>Zayıf kelimeler öne çıkar, bildiklerin daha sakin görünür.</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{words.length}</Text>
          <Text style={styles.statLabel}>Keşfedilen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{learningCount}</Text>
          <Text style={styles.statLabel}>Çalışılan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{masteredCount}</Text>
          <Text style={styles.statLabel}>Bilinen</Text>
        </View>
      </View>

      <View style={styles.wordListHeader}>
        <Text style={styles.wordListTitle}>Kayıtlı kelimeler</Text>
        <Text style={styles.wordListCount}>{words.length}</Text>
      </View>

      {words.map((item, index) => (
        <WordCardPolished
          key={`${item.word}-${index}`}
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

const WordCardPolished = ({ item }: { item: any }) => {
  const isMastered = item.mastery === 100;
  const isLearning = item.mastery >= 50 && item.mastery < 100;
  const masteryLabel = isMastered ? 'Biliniyor' : isLearning ? 'Tekrarda' : 'Yeni';
  const masteryIcon = isMastered ? (
    <CheckCircle2 size={14} color={Colors.tag.green.text} />
  ) : (
    <Clock3 size={14} color={isLearning ? Theme.accent : Colors.tag.amber.text} />
  );

  return (
    <TouchableOpacity activeOpacity={0.84} style={styles.wordCardPolished}>
      <View style={styles.cardHeader}>
        <View style={styles.wordInfo}>
          <View style={styles.wordTitleRow}>
            <Text style={styles.wordTitlePolished} numberOfLines={1}>{item.word}</Text>
            <View style={[styles.levelBadge, item.rarity === 'A1' || item.rarity === 'A2' ? styles.levelBadgeEasy : styles.levelBadgeMid]}>
              <Text style={styles.levelText}>{item.rarity}</Text>
            </View>
          </View>
          <Text style={styles.wordMeaningPolished} numberOfLines={2}>{item.meaning}</Text>
        </View>
        <View style={[styles.masteryPill, isMastered && styles.masteryPillDone, isLearning && styles.masteryPillLearning]}>
          {masteryIcon}
          <Text style={[styles.masteryPillText, isMastered && styles.masteryPillTextDone, isLearning && styles.masteryPillTextLearning]}>
            {masteryLabel}
          </Text>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Öğrenme seviyesi</Text>
        <Text style={styles.progressValue}>{item.mastery}%</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.mastery}%` },
                isLearning && styles.progressFillLearning,
                isMastered && styles.progressFillDone
              ]}
            />
          </View>
        </View>
        <View style={styles.chevronCircle}>
          <ChevronRight size={16} color={Theme.textSecondary} />
        </View>
      </View>

      {isMastered && <View style={styles.masteredGlow} />}
    </TouchableOpacity>
  );
};

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
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 92,
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: Theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    paddingHorizontal: 28,
    paddingVertical: 36,
    marginTop: 20,
    ...Shadows.subtle,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(91, 79, 240, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: Typography.header,
    fontSize: 28,
    color: Theme.textPrimary,
  },
  emptyText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  vaultHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  vaultHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(91, 79, 240, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  vaultHeroCopy: {
    flex: 1,
  },
  vaultHeroKicker: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  vaultHeroTitle: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Theme.textPrimary,
  },
  vaultHeroText: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Theme.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    ...Shadows.subtle,
  },
  statValue: {
    fontFamily: Typography.header,
    fontSize: 23,
    color: Theme.accent,
  },
  statLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Theme.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  wordListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordListTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Theme.textPrimary,
  },
  wordListCount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: Theme.accent,
    backgroundColor: 'rgba(91, 79, 240, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  wordCardPolished: {
    backgroundColor: Theme.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  wordInfo: {
    flex: 1,
    paddingRight: 12,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordTitlePolished: {
    flexShrink: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 19,
    color: Theme.textPrimary,
  },
  wordMeaningPolished: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Theme.textSecondary,
    lineHeight: 19,
    marginTop: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadgeEasy: {
    backgroundColor: Colors.tag.green.bg,
  },
  levelBadgeMid: {
    backgroundColor: Colors.tag.indigo.bg,
  },
  levelText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    color: Theme.accent,
    letterSpacing: 0.7,
  },
  masteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.tag.amber.bg,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },
  masteryPillLearning: {
    backgroundColor: Colors.tag.indigo.bg,
  },
  masteryPillDone: {
    backgroundColor: Colors.tag.green.bg,
  },
  masteryPillText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 11,
    color: Colors.tag.amber.text,
  },
  masteryPillTextLearning: {
    color: Theme.accent,
  },
  masteryPillTextDone: {
    color: Colors.tag.green.text,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: Theme.textSecondary,
  },
  progressValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 11,
    color: Theme.textPrimary,
  },
  progressFillLearning: {
    backgroundColor: Theme.accent,
  },
  progressFillDone: {
    backgroundColor: Colors.tag.green.text,
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 43, 74, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
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
