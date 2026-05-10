import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, FontSizes } from '../../constants/theme';
import {
  Play,
  ChevronRight,
  Headphones,
  Layers,
  Quote,
  Flame,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ── TYPES ──────────────────────────────────────────────────────────
export interface HomeStats {
  streakCount: number;
  learnedWords: number;
  monthlyNewWords: number;
  currentLevel: string;
  targetLevel: string;
  journeyPercentage: number;
}

export interface DailyActivity {
  date: string;
  totalMinutes: number;
}

// --- SECTION HEADER ---
const SectionHeader = ({ title, showAll = true }: { title: string, showAll?: boolean }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {showAll && (
      <TouchableOpacity style={styles.showAllBtn}>
        <Text style={styles.showAllText}>Tümünü Gör</Text>
        <ChevronRight size={14} color={Colors.text.muted} />
      </TouchableOpacity>
    )}
  </View>
);

// --- RECOMMENDATION CARDS ---
export const RecommendationCards = () => {
  const router = useRouter();
  
  const handlePress = (id: string) => {
    router.push({ pathname: '/reader/[id]', params: { id } });
  };

  const cards = [
    {
      id: 'text_101',
      title: 'Medical Vocabulary: Checkup',
      tag: 'ÖNERİLEN',
      tagColor: Colors.tag.indigo.bg,
      tagTextColor: Colors.tag.indigo.text,
      meta: 'B1  •  12 dk  •  Sağlık',
      context: 'Seviyene uygun yeni içerik',
      icon: <Play size={18} color={Colors.text.primary} fill={Colors.text.primary} />
    },
    {
      id: 'text_102',
      title: '12 kelime vadesi geldi',
      tag: '12 KELİME BEKLİYOR',
      tagColor: Colors.tag.amber.bg,
      tagTextColor: Colors.tag.amber.text,
      meta: 'B1  •  8 dk  •  Genel',
      context: 'Tekrar zamanı geldi',
      icon: <ArrowRight size={20} color={Colors.text.primary} />
    },
  ];

  return (
    <View style={styles.section}>
      <SectionHeader title="SİZE ÖZEL ÖNERİLER" />
      {cards.map((card, idx) => (
        <TouchableOpacity 
          key={idx} 
          style={styles.recCard}
          activeOpacity={0.8}
          onPress={() => handlePress(card.id)}
        >
          <LinearGradient
            colors={['#FFFFFF', Colors.cardBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.recLeft}>
            <View style={[styles.cardTag, { backgroundColor: card.tagColor }]}>
              <Text style={[styles.cardTagText, { color: card.tagTextColor }]}>{card.tag}</Text>
            </View>
            <Text style={styles.recTitle}>{card.title}</Text>
            <Text style={styles.recMeta}>{card.meta}</Text>
            <Text style={styles.recContext}>{card.context}</Text>
          </View>
          <View style={styles.cardActionButton}>
            {card.icon}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- DAILY FOCUS ---
export const DailyFocus = () => {
  return (
    <View style={styles.section}>
      <SectionHeader title="GÜNLÜK ODAĞIN" showAll={false} />
      <View style={styles.focusCard}>
        <LinearGradient
          colors={['#FFFFFF', '#FDFBF9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.focusHeader}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.focusMainTitle}>Today's focus</Text>
              <Sparkles size={16} color={Colors.text.primary} opacity={0.6} />
            </View>
            <Text style={styles.focusSubtitle}>Business small talk</Text>
          </View>
          <TouchableOpacity style={styles.whyButton}>
            <Text style={styles.whyButtonText}>Neden bu?</Text>
            <Sparkles size={12} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.focusStatsRow}>
          <View style={styles.focusStatItem}>
            <View style={styles.focusIconCircle}>
              <Headphones size={20} color={Colors.text.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.focusStatValue}>5 dk</Text>
            <Text style={styles.focusStatLabel}>Dinleme</Text>
          </View>

          <View style={styles.focusStatItem}>
            <View style={styles.focusIconCircle}>
              <Layers size={20} color={Colors.text.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.focusStatValue}>12</Text>
            <Text style={styles.focusStatLabel}>Kelime</Text>
          </View>

          <View style={styles.focusStatItem}>
            <View style={styles.focusIconCircle}>
              <Quote size={20} color={Colors.text.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.focusStatValue}>1</Text>
            <Text style={styles.focusStatLabel}>İfade</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- PROGRESS GRID (Gerçek Veri) ---
export const ProgressGrid = ({ stats }: { stats: HomeStats | null }) => {
  const s = stats || {
    streakCount: 0,
    learnedWords: 0,
    monthlyNewWords: 0,
    currentLevel: 'B1',
    targetLevel: 'B2',
    journeyPercentage: 0,
  };

  // Streak mesajı
  const streakMsg = s.streakCount >= 30 ? 'Efsanevi!' 
    : s.streakCount >= 14 ? 'Harika gidiyorsun!'
    : s.streakCount >= 7 ? 'İyi gidiyorsun!'
    : s.streakCount >= 3 ? 'Devam et!'
    : s.streakCount > 0 ? 'Başladın bile!' : 'Bugün başla!';

  return (
    <View style={[styles.section, styles.statsRow]}>
      <View style={styles.smallStatCard}>
        <LinearGradient colors={['#FFFFFF', '#FDFBF9']} style={StyleSheet.absoluteFill} />
        <Flame size={18} color={Colors.chart.flame} fill={Colors.chart.flame} />
        <View style={styles.smallStatContent}>
          <Text style={styles.smallStatValue}>{s.streakCount}</Text>
          <Text style={styles.smallStatLabel}>gün seri</Text>
          <Text style={styles.smallStatSub}>{streakMsg}</Text>
        </View>
      </View>

      <View style={styles.smallStatCard}>
        <LinearGradient colors={['#FFFFFF', '#FDFBF9']} style={StyleSheet.absoluteFill} />
        <BookOpen size={18} color={Colors.accent.indigo} />
        <View style={styles.smallStatContent}>
          <Text style={styles.smallStatValue}>{s.learnedWords}</Text>
          <Text style={styles.smallStatLabel}>kelime öğrendin</Text>
          <Text style={styles.smallStatSub}>Bu ay +{s.monthlyNewWords}</Text>
        </View>
      </View>

      <View style={styles.smallStatCard}>
        <LinearGradient colors={['#FFFFFF', '#FDFBF9']} style={StyleSheet.absoluteFill} />
        <View style={styles.smallStatContent}>
          <Text style={[styles.smallStatValue, { color: Colors.accent.indigo }]}>
            {s.currentLevel} → {s.targetLevel}
          </Text>
          <Text style={styles.smallStatLabel}>{s.journeyPercentage}% ilerledi</Text>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, { width: `${Math.min(s.journeyPercentage, 100)}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

// --- ACTIVITY STRIP (Gerçek Veri) ---
export const ActivityStrip = ({ activities }: { activities: DailyActivity[] }) => {
  // Son 14 günü oluştur
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dStr = d.toISOString().split('T')[0];
    const match = activities.find(a => a.date === dStr);
    return match ? match.totalMinutes : 0;
  });

  // Mutlak ölçek: 30 dk = tam yükseklik (35px)
  // Tek seans olsa bile abartılı görünmez
  const MAX_BAR_HEIGHT = 35;
  const SCALE_TARGET = Math.max(30, ...last14Days); // En az 30 dk baseline

  return (
    <View style={styles.section}>
      <SectionHeader title="SON 14 GÜN" showAll={false} />
      <View style={styles.barsContainer}>
        {last14Days.map((minutes, i) => {
          // Mutlak ölçek: dakika / hedef * max yükseklik
          const height = minutes > 0 
            ? Math.max(Math.min((minutes / SCALE_TARGET) * MAX_BAR_HEIGHT, MAX_BAR_HEIGHT), 4) 
            : 4;
          const isCurrent = i === 13;
          const isActive = minutes > 0;

          return (
            <View key={i} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  { height },
                  isCurrent ? styles.barCurrent : (isActive ? styles.barActive : styles.barMuted)
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- INSPIRATION PANEL ---
export const InspirationPanel = () => {
  return (
    <View style={styles.inspireCard}>
      <LinearGradient colors={['#FDFBF9', '#F9F7F5']} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1 }}>
        <Quote size={24} color={Colors.text.primary} style={{ marginBottom: 12, opacity: 0.8 }} />
        <Text style={styles.quote}>"Her gün biraz daha iyi."</Text>
        <Text style={styles.quoteSub}>Küçük adımlar, büyük dönüşümler.</Text>
      </View>
      <View style={styles.graphContainer}>
        {/* Simple visual representation of a line graph like in image */}
        <View style={styles.graphPath} />
        <View style={[styles.graphDot, { right: 0, top: 0 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.outer,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.text.primary,
    opacity: 0.8,
  },
  showAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  showAllText: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  // Rec Cards
  recCard: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  recLeft: {
    flex: 1,
  },
  cardTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardTagText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  recTitle: {
    fontFamily: Typography.header,
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  recMeta: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  recContext: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.muted,
    opacity: 0.7,
  },
  cardActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.iconCircle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Daily Focus
  focusCard: {
    padding: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  focusMainTitle: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Colors.text.primary,
  },
  focusSubtitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: 17,
    color: Colors.text.secondary,
  },
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.surface.iconCircle,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  whyButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
    color: Colors.text.muted,
  },
  focusStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  focusStatItem: {
    alignItems: 'center',
  },
  focusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface.iconCircle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusStatValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.text.primary,
  },
  focusStatLabel: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  // Progress Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallStatCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 110,
    overflow: 'hidden',
  },
  smallStatContent: {
    marginTop: 12,
  },
  smallStatValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.text.primary,
  },
  smallStatLabel: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  smallStatSub: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.text.muted,
    marginTop: 2,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: Colors.surface.iconCircle,
    borderRadius: 2,
    marginTop: 10,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.indigo,
    borderRadius: 2,
  },
  // Activity Strip
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 4,
  },
  barWrapper: {
    width: (width - Spacing.outer * 2) / 14 - 6,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: Colors.chart.flame,
    opacity: 0.6,
  },
  barMuted: {
    backgroundColor: Colors.chart.barMuted,
  },
  barCurrent: {
    backgroundColor: Colors.chart.flame,
    borderWidth: 1,
    borderColor: Colors.text.primary,
  },
  // Inspiration
  inspireCard: {
    marginHorizontal: Spacing.outer,
    backgroundColor: Colors.secondarySurface,
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  quote: {
    fontFamily: Typography.header,
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  quoteSub: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    opacity: 0.8,
  },
  graphContainer: {
    width: 100,
    height: 60,
    position: 'relative',
    justifyContent: 'center',
  },
  graphPath: {
    height: 2,
    backgroundColor: Colors.chart.flame,
    opacity: 0.3,
    width: '100%',
    transform: [{ rotate: '-15deg' }],
  },
  graphDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.chart.flame,
  }
});
