import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { 
  Pencil, 
  Book, 
  CheckCircle2, 
  Headphones, 
  ChevronRight, 
  Shield as ShieldIcon, 
  Crown, 
  Bell,
  Target,
  Clock,
  GraduationCap,
  Info,
  LogOut,
  TrendingUp,
  Share2,
  Lock,
  ArrowRight
} from 'lucide-react-native';
import { Colors, Typography, Spacing, FontSizes } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [wpmTrend, setWpmTrend] = useState<{ weekLabel: string; avgWpm: number }[]>([]);

  // Her ekran focus olduğunda otomatik senkronize et (streak dahil)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profData, statData, calData, wpmData] = await Promise.all([
        userService.getUserProfile(user.id),
        userService.getProfileStats(user.id),
        userService.getActivityCalendar(user.id, 30),
        userService.getWeeklyWpmTrend(user.id, 5),
      ]);

      setProfile(profData);
      setStats(statData);
      setCalendar(calData);
      setWpmTrend(wpmData);
    } catch (e) {
      console.error('Profil yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent.warmGold} />
      </View>
    );
  }

  if (!profile) return null;

  // ── Hesaplamalar ──
  const displayName = profile.display_name || 'Misafir';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const LEVEL_WORD_THRESHOLDS: Record<string, number> = {
    'A1': 500, 'A2': 1000, 'B1': 2000, 'B2': 4000, 'C1': 8000, 'C2': 16000,
  };
  const currentLevel = profile.current_level || 'B1';
  const targetLevel = profile.target_level || 'B2';
  
  const currentThreshold = LEVEL_WORD_THRESHOLDS[currentLevel] || 0;
  const targetThreshold = LEVEL_WORD_THRESHOLDS[targetLevel] || 1000;
  
  const totalLearned = stats?.learnedWords || 0;
  const progressToNext = Math.max(0, totalLearned - currentThreshold);
  const requiredForNext = Math.max(1, targetThreshold - currentThreshold);
  const journeyPercentage = Math.min(100, Math.round((progressToNext / requiredForNext) * 100));
  const wordsRemaining = Math.max(0, targetThreshold - totalLearned);

  // Takvim yoğunlukları (0-4)
  const getIntensity = (mins: number) => {
    if (mins === 0) return 0;
    if (mins <= 10) return 1;
    if (mins <= 20) return 2;
    if (mins <= 30) return 3;
    return 4;
  };

  const past30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dStr = d.toISOString().split('T')[0];
    const cData = calendar.find(c => c.date === dStr);
    return getIntensity(cData ? cData.totalMinutes : 0);
  });

  // Dinamik Tarih (Örn: Kasım 2026)
  const currentMonthYear = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. KİMLİK */}
        <View style={styles.identitySection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.levelPill}>
              <Text style={styles.levelText}>{currentLevel}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Pencil size={14} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. STATS (3 Kart) */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FDF7F0' }]}>
              <Book size={20} color="#D8B07A" />
            </View>
            <Text style={styles.statValue}>{stats?.totalWords || 0}</Text>
            <Text style={styles.statLabel}>TOPLAM KELİME</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F0F9F4' }]}>
              <CheckCircle2 size={20} color="#88B091" />
            </View>
            <Text style={styles.statValue}>{stats?.learnedWords || 0}</Text>
            <Text style={styles.statLabel}>ÖĞRENİLDİ</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F5F3FF' }]}>
              <Headphones size={20} color="#5B4FF0" />
            </View>
            <Text style={styles.statValue}>
              {(() => {
                const mins = stats?.totalListeningMinutes || 0;
                if (mins < 60) return `${mins} dk`;
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
              })()}
            </Text>
            <Text style={styles.statLabel}>DİNLEME</Text>
          </Card>
        </View>

        {/* 3. B1 → B2 JOURNEY */}
        <Card style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <Text style={styles.journeyTitle}>{currentLevel} → {targetLevel} Yolculuğu</Text>
            <Text style={styles.journeyPercentage}>%{journeyPercentage}</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${journeyPercentage}%` }]} />
          </View>
          <Text style={styles.journeySubtext}>~{wordsRemaining} kelime daha öğren</Text>
        </Card>

        {/* 4. OKUMA HIZI GRAFİĞİ */}
        <WpmChart wpmTrend={wpmTrend} />

        {/* 5. STREAK & ZİNCİR SİGORTASI */}
        <View style={styles.streakSection}>
          <Card style={styles.calendarCard}>
            <Text style={styles.smallCapsTitle}>SON 30 GÜN</Text>
            <View style={styles.calendarGrid}>
              {past30Days.map((intensity, i) => {
                let dayStyle = {};
                if (intensity === 0) dayStyle = styles.intensity0;
                else if (intensity === 1) dayStyle = styles.intensity1;
                else if (intensity === 2) dayStyle = styles.intensity2;
                else if (intensity === 3) dayStyle = styles.intensity3;
                else if (intensity === 4) dayStyle = styles.intensity4;

                return (
                  <View key={i} style={[styles.calendarDay, dayStyle]} />
                );
              })}
            </View>
            <View style={styles.streakFooter}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakInfoLabel}>Mevcut seri</Text>
                <Text style={styles.streakInfoValue}>{profile.streak_count || 0} gün</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.streakInfo}>
                <Text style={styles.streakInfoLabel}>En uzun seri</Text>
                <Text style={styles.streakInfoValue}>{profile.longest_streak || 0} gün</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.shieldCard}>
            <View style={styles.shieldIconLarge}>
              <ShieldIcon size={32} color="#B7B2FF" />
            </View>
            <Text style={styles.shieldTitle}>Zincir Sigortası</Text>
            <Text style={styles.shieldSubtitle}>
              {(profile.streak_freeze_available ?? 0) > 0
                ? `${profile.streak_freeze_available} hakkın var`
                : 'Hak kalmadı'}
            </Text>
            <Text style={styles.shieldDescription}>Bir günü atlarsan zincirin kırılmaz.</Text>
            <TouchableOpacity
              style={[
                styles.shieldButton,
                (profile.streak_freeze_available ?? 0) === 0 && styles.shieldButtonDisabled
              ]}
              disabled={(profile.streak_freeze_available ?? 0) === 0}
            >
              <Text style={styles.shieldButtonText}>Bugün Kullan</Text>
            </TouchableOpacity>
            <Text style={styles.shieldHint}>
              {(profile.streak_freeze_available ?? 0) > 0
                ? 'Seri kırılma riskini önlemek için kullan.'
                : 'Hakları artırmak için Premium\'a geç.'}
            </Text>
          </Card>
        </View>

        {/* 6. MARUZ KALDILAN KELİME */}
        <Card style={styles.exposureCard}>
          <View style={styles.exposureIconContainer}>
            <Book size={24} color="#D8B07A" />
          </View>
          <View style={styles.exposureContent}>
            <Text style={styles.exposureLabel}>Bugüne kadar</Text>
            <Text style={styles.exposureValue}>{stats?.totalWords || 0} eşsiz kelimeyle karşılaştın</Text>
          </View>
        </Card>

        {/* 7. ÜCRETSİZ PLAN (PREMIUM) */}
        <Card style={styles.premiumCard}>
          <View style={styles.premiumLeft}>
            <View style={styles.premiumIconContainer}>
              <Crown size={28} color="#D8B07A" />
            </View>
          </View>
          <View style={styles.premiumCenter}>
            <Text style={styles.cardTitle}>Ücretsiz Plan</Text>
            <View style={styles.premiumFeature}>
              <CheckCircle2 size={12} color="#D8B07A" />
              <Text style={styles.premiumFeatureText}>Günde 1 içerik → Sınırsız</Text>
            </View>
            <View style={styles.premiumFeature}>
              <CheckCircle2 size={12} color="#D8B07A" />
              <Text style={styles.premiumFeatureText}>Günde 20 tekrar kartı → Sınırsız</Text>
            </View>
            <View style={styles.premiumFeature}>
              <CheckCircle2 size={12} color="#D8B07A" />
              <Text style={styles.premiumFeatureText}>Zincir sigortası 1 → 2 hak</Text>
            </View>
          </View>
          <View style={styles.premiumRight}>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Premium'a Geç</Text>
              <Text style={styles.premiumPrice}>₺79,99 / ay</Text>
            </TouchableOpacity>
            <Text style={styles.premiumTrialText}>7 günlük ücretsiz deneme</Text>
          </View>
        </Card>

        {/* 8. PAYLAŞ (SHARE CARD - LOCKED) */}
        <LinearGradient
          colors={['#10172A', '#1E2B4A']}
          style={styles.shareCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.lockCircle}>
            <Lock size={20} color="#D8B07A" />
          </View>
          <View style={styles.shareMainContent}>
            <Text style={styles.shareDateLabel}>{currentMonthYear}</Text>
            <View style={styles.shareStatsHorizontal}>
              <View style={styles.shareStatCol}>
                <Text style={styles.shareStatValueText}>{stats?.learnedWords || 0}</Text>
                <Text style={styles.shareStatLabelText}>öğrenilen</Text>
              </View>
              <View style={styles.statSeparator} />
              <View style={styles.shareStatCol}>
                <Text style={styles.shareStatValueText}>{profile?.streak_count || 0}</Text>
                <Text style={styles.shareStatLabelText}>gün seri</Text>
              </View>
              <View style={styles.statSeparator} />
              <View style={styles.shareStatCol}>
                <Text style={styles.shareStatValueText}>{stats?.totalListeningMinutes || 0}</Text>
                <Text style={styles.shareStatLabelText}>dk okuma</Text>
              </View>
            </View>
            <Text style={styles.shareLockedHint}>Bu özelliği kullanmak için Premium'a geç.</Text>
          </View>
          <View style={styles.shareActionWrapper}>
            <TouchableOpacity style={styles.shareOutlineButton}>
              <Text style={styles.shareOutlineButtonText}>Paylaş</Text>
              <ArrowRight size={14} color="#D8B07A" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 9. AYARLAR */}
        <View style={styles.settingsSection}>
          <SettingItem icon={<Bell size={20} color={Colors.text.primary} />} title="Bildirimler" value="Açık · 20:00" />
          <SettingItem icon={<Target size={20} color={Colors.text.primary} />} title="Günlük Hedef" value={`${profile.daily_goal_minutes || 10} dakika`} />
          <SettingItem icon={<Clock size={20} color={Colors.text.primary} />} title="Çalışma Zamanı" value="Akşam" />
          <SettingItem icon={<GraduationCap size={20} color={Colors.text.primary} />} title="Seviyemi Değiştir" value={currentLevel} />
          <SettingItem icon={<Info size={20} color={Colors.text.primary} />} title="Uygulama Hakkında" value="v1.2.3" />
        </View>

        {/* 10. ÇIKIŞ YAP */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={16} color="#E57373" style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: '#E57373' }]}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── WPM Chart (Gerçek Veri) ────────────────────────────────────────────────
function WpmChart({ wpmTrend }: { wpmTrend: { weekLabel: string; avgWpm: number }[] }) {
  const hasData = wpmTrend.length > 0 && wpmTrend.some(w => w.avgWpm > 0);

  // SVG çizgisi için koordinat hesabı
  const chartW = 300;
  const chartH = 100;
  const maxWpm = hasData ? Math.max(...wpmTrend.map(w => w.avgWpm), 1) : 300;
  const minWpm = hasData ? Math.min(...wpmTrend.filter(w => w.avgWpm > 0).map(w => w.avgWpm), maxWpm) : 0;
  const range = Math.max(maxWpm - minWpm, 1);

  const points = wpmTrend.map((w, i) => {
    const x = wpmTrend.length === 1 ? chartW / 2 : (i / (wpmTrend.length - 1)) * (chartW - 30) + 15;
    const y = w.avgWpm === 0 ? chartH - 5 : chartH - ((w.avgWpm - minWpm) / range) * (chartH - 10) - 5;
    return { x, y, wpm: w.avgWpm, label: w.weekLabel };
  });

  const pathD = points.length > 1
    ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
    : `M 15 50 L 285 50`;

  const avgWpm = hasData
    ? Math.round(wpmTrend.filter(w => w.avgWpm > 0).reduce((a, b) => a + b.avgWpm, 0) / wpmTrend.filter(w => w.avgWpm > 0).length)
    : 0;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.cardTitle}>Okuma Hızı</Text>
        {hasData ? (
          <View style={styles.chartTrend}>
            <Text style={styles.chartTrendText}>Ort. {avgWpm} wpm</Text>
            <TrendingUp size={14} color="#88B091" style={{ marginLeft: 4 }} />
          </View>
        ) : (
          <Text style={styles.chartTrendText}>Henüz veri yok</Text>
        )}
      </View>

      <View style={styles.chartBody}>
        <View style={styles.yAxisContainer}>
          <Text style={styles.yAxisLabel}>{Math.round(maxWpm)}</Text>
          <Text style={styles.yAxisLabel}>{Math.round((maxWpm + minWpm) / 2)}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(minWpm)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
        <View style={styles.chartWrapper}>
          <Svg height="100" width="100%" viewBox="0 0 300 100">
            <Path d="M 0 5 L 300 5" stroke="rgba(30,43,74,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <Path d="M 0 35 L 300 35" stroke="rgba(30,43,74,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <Path d="M 0 65 L 300 65" stroke="rgba(30,43,74,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <Path d="M 0 95 L 300 95" stroke="rgba(30,43,74,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            {hasData && (
              <>
                <Path d={pathD} fill="none" stroke="#D8B07A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#FDFCFB" stroke={p.wpm > 0 ? '#D8B07A' : 'rgba(30,43,74,0.12)'} strokeWidth="2" />
                ))}
              </>
            )}
            {!hasData && (
              <Path d="M 15 50 L 285 50" stroke="rgba(30,43,74,0.1)" strokeWidth="1" strokeDasharray="6 4" />
            )}
          </Svg>
        </View>
      </View>

      <View style={styles.chartXAxis}>
        {wpmTrend.length > 0
          ? wpmTrend.map((w, i) => (
              <Text key={i} style={styles.chartXLabel} numberOfLines={1}>{w.weekLabel.replace(' hafta önce', 'h.')}</Text>
            ))
          : ['4h.', '3h.', '2h.', 'Geçen', 'Bu hf.'].map((l, i) => (
              <Text key={i} style={styles.chartXLabel}>{l}</Text>
            ))
        }
      </View>
    </View>
  );
}

function SettingItem({ icon, title, value }: { icon: any, title: string, value: string }) {
  return (
    <TouchableOpacity style={styles.settingItem}>
      <View style={styles.settingLeft}>
        {icon}
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue}>{value}</Text>
        <ChevronRight size={18} color={Colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F1EB',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FBF8F4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,43,74,0.05)',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: '#1E2B4A',
    marginBottom: 12,
  },
  
  // 1. IDENTITY
  identitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE7DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: '#1E2B4A',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
  },
  userName: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: '#1E2B4A',
    marginRight: 10,
  },
  levelPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 999,
    justifyContent: 'center',
  },
  levelText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: '#5B4FF0',
  },
  editButton: {
    marginLeft: 10,
  },

  // 2. STATS
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: (width - 60) / 3,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: '#1E2B4A',
  },
  statLabel: {
    fontFamily: Typography.body,
    fontSize: 9,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 4,
    textAlign: 'center',
  },

  // 3. JOURNEY
  journeyCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FDFCFB',
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  journeyTitle: {
    fontFamily: Typography.header,
    fontSize: 18,
    color: '#1E2B4A',
  },
  journeyPercentage: {
    fontFamily: Typography.header,
    fontSize: 18,
    color: '#5B4FF0',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(30,43,74,0.06)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D8B07A',
    borderRadius: 4,
  },
  journeySubtext: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.muted,
  },

  // 4. CHART
  chartCard: {
    padding: 20,
    backgroundColor: '#FDFCFB',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTrendText: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: '#88B091',
  },
  chartBody: {
    flexDirection: 'row',
    height: 100,
    marginBottom: 12,
  },
  yAxisContainer: {
    justifyContent: 'space-between',
    paddingVertical: 0,
    marginRight: 10,
  },
  yAxisLabel: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.text.muted,
  },
  chartWrapper: {
    flex: 1,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 32, // to align with chart area
  },
  chartXLabel: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.text.muted,
  },

  // 5. STREAK
  streakSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  calendarCard: {
    flex: 1.2,
    marginBottom: 0,
    padding: 16,
    backgroundColor: '#FDFCFB',
  },
  smallCapsTitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  calendarDay: {
    width: (width * 0.45 - 60) / 7,
    height: (width * 0.45 - 60) / 7,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensity0: { borderWidth: 1.5, borderColor: '#F0E8DD', backgroundColor: 'transparent' },
  intensity1: { backgroundColor: '#F5EADC' },
  intensity2: { backgroundColor: '#EAD3B3' },
  intensity3: { backgroundColor: '#D8B07A' },
  intensity4: { backgroundColor: '#B8925D' },
  streakFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,43,74,0.05)',
    paddingTop: 12,
  },
  streakInfo: {
    flex: 1,
    alignItems: 'center',
  },
  streakInfoLabel: {
    fontFamily: Typography.body,
    fontSize: 9,
    color: Colors.text.muted,
  },
  streakInfoValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: '#D8B07A',
  },
  dividerVertical: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(30,43,74,0.05)',
  },

  // SHIELD CARD
  shieldCard: {
    flex: 1,
    marginBottom: 0,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FBF8F4',
    justifyContent: 'center',
  },
  shieldIconLarge: {
    marginBottom: 8,
  },
  shieldTitle: {
    fontFamily: Typography.header,
    fontSize: 18,
    color: '#1E2B4A',
    textAlign: 'center',
  },
  shieldSubtitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: '#1E2B4A',
    marginTop: 4,
  },
  shieldDescription: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.text.muted,
    textAlign: 'center',
    marginVertical: 12,
  },
  shieldButton: {
    backgroundColor: '#D8B07A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  shieldButtonDisabled: {
    backgroundColor: 'rgba(30,43,74,0.08)',
  },
  shieldButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  shieldHint: {
    fontFamily: Typography.body,
    fontSize: 9,
    color: Colors.text.muted,
    textAlign: 'center',
  },

  // 6. EXPOSURE
  exposureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFB',
  },
  exposureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exposureContent: {
    flex: 1,
  },
  exposureLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  exposureValue: {
    fontFamily: Typography.header,
    fontSize: 18,
    color: '#1E2B4A',
    marginTop: 4,
  },
  exposureTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exposureTrendLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },

  // 7. PREMIUM
  premiumCard: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FDFCFB',
  },
  premiumLeft: {
    marginRight: 16,
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF7F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCenter: {
    flex: 1,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  premiumFeatureText: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginLeft: 6,
  },
  premiumRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  premiumButton: {
    backgroundColor: '#D8B07A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  premiumPrice: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: '#FFFFFFCC',
  },
  premiumTrialText: {
    fontFamily: Typography.body,
    fontSize: 9,
    color: Colors.text.muted,
    marginTop: 8,
  },

  // 8. SHARE
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shareMainContent: {
    flex: 1,
  },
  shareDateLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: '#D8B07A',
    marginBottom: 8,
  },
  shareStatsHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareStatCol: {
    alignItems: 'center',
  },
  shareStatValueText: {
    fontFamily: Typography.header,
    fontSize: 20,
    color: '#FFFFFF',
  },
  shareStatLabelText: {
    fontFamily: Typography.body,
    fontSize: 9,
    color: '#FFFFFFCC',
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
  shareLockedHint: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: '#FFFFFF99',
  },
  shareActionWrapper: {
    marginLeft: 10,
  },
  shareOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8B07A',
  },
  shareOutlineButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
    color: '#D8B07A',
  },

  // 9. SETTINGS
  settingsSection: {
    backgroundColor: '#FBF8F4',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30,43,74,0.05)',
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    height: 58,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,43,74,0.03)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: '#1E2B4A',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.text.muted,
    marginRight: 8,
  },

  // 10. LOGOUT
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.text.muted,
  },
});
