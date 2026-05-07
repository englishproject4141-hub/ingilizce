import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Sparkles, 
  Clock, 
  Briefcase, 
  ChevronRight,
  Filter
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Shadows } from '../../constants/theme';
import { DiscoverCard } from '../../components/Discover/DiscoverCard';
import { SkeletonCard } from '../../components/Discover/SkeletonCard';
import { discoverService } from '../../services/discoverService';
import type { Article } from '../../lib/database.types';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { FloatingNav } from '../../components/Home/FloatingNav';

const { width, height } = Dimensions.get('window');

const QUICK_MOODS = [
  { id: 'for_you', label: 'For You', icon: Sparkles },
  { id: 'b1', label: 'B1 Level', icon: null },
  { id: 'short', label: 'Short Reads', icon: Clock },
  { id: 'business', label: 'Business', icon: Briefcase },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMood, setActiveMood] = useState('for_you');
  
  const [continueReading, setContinueReading] = useState<(Article & { progress: number })[]>([]);
  const [recommended, setRecommended] = useState<Article[]>([]);
  const [shortReads, setShortReads] = useState<Article[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest-user';
      
      const [cont, rec, short] = await Promise.all([
        discoverService.getContinueReading(userId),
        discoverService.getRecommendedForLevel(userId, 'B1'),
        discoverService.getShortReads(),
      ]);

      // Demo Verisi Fallback
      if (cont.length === 0) {
        setContinueReading([{
          id: 'demo-1',
          title: 'Remote Work Culture',
          level: 'B1',
          topic: 'İş',
          duration_seconds: 600,
          word_count: 420,
          full_text: "Remote work is no longer just a trend; it's a fundamental shift in how we approach professional life...",
          progress: 0.42,
        } as any]);
      } else {
        setContinueReading(cont);
      }

      setRecommended(rec.length > 0 ? rec : []);
      setShortReads(short.length > 0 ? short : []);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
          <ChevronRight size={14} color={Colors.accent.warmGold} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. ULTRA MINIMAL HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kütüphane</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => { /* Arama ekranına git */ }}>
          <Search size={24} color={Colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* 2. SMART QUICK MOODS (Filter as Mood) */}
        <View style={styles.moodRowContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.moodRow}
          >
            {QUICK_MOODS.map((mood) => (
              <TouchableOpacity 
                key={mood.id} 
                onPress={() => setActiveMood(mood.id)}
                style={[styles.moodChip, activeMood === mood.id && styles.moodChipActive]}
              >
                {mood.icon && (
                  <mood.icon 
                    size={16} 
                    color={activeMood === mood.id ? 'white' : Colors.text.secondary} 
                    style={{ marginRight: 6 }} 
                  />
                )}
                <Text style={[styles.moodText, activeMood === mood.id && styles.moodTextActive]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 3. CONTENT-FIRST FEED */}
        {loading ? (
          <View style={{ paddingHorizontal: 32, marginTop: 40 }}>
            {[1, 2].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : (
          <View style={styles.contentFeed}>
            {/* CONTINUE READING */}
            {continueReading.length > 0 && (
              <View style={styles.section}>
                {renderSectionHeader('Kaldığın Yerden')}
                <ScrollView 
                  horizontal 
                  paddingLeft={32}
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={width - 48}
                >
                  {continueReading.map(item => (
                    <View key={item.id} style={{ marginRight: 16 }}>
                      <DiscoverCard 
                        article={item} 
                        variant="horizontal"
                        onPress={(a) => router.push(`/reader/${a.id}`)} 
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* RECOMMENDED */}
            <View style={styles.section}>
              {renderSectionHeader('Sana Özel')}
              <ScrollView 
                horizontal 
                paddingLeft={32}
                showsHorizontalScrollIndicator={false}
              >
                {recommended.map(item => (
                  <DiscoverCard 
                    key={item.id} 
                    article={item} 
                    variant="vertical"
                    onPress={(a) => router.push(`/reader/${a.id}`)} 
                  />
                ))}
              </ScrollView>
            </View>

            {/* SHORT READS */}
            <View style={styles.section}>
              {renderSectionHeader('Kısa ve Öz')}
              <ScrollView 
                horizontal 
                paddingLeft={32}
                showsHorizontalScrollIndicator={false}
              >
                {shortReads.map(item => (
                  <DiscoverCard 
                    key={item.id} 
                    article={item} 
                    variant="small"
                    onPress={(a) => router.push(`/reader/${a.id}`)} 
                  />
                ))}
              </ScrollView>
            </View>

            {/* EXPLORE ALL CTA & ADVANCED FILTERS */}
            <View style={styles.exploreSection}>
              <TouchableOpacity style={styles.exploreCard} onPress={() => setShowFilters(true)}>
                <View>
                  <Text style={styles.exploreTitle}>Tümünü Keşfet</Text>
                  <Text style={styles.exploreSubtitle}>500+ içerik ve detaylı filtreler</Text>
                </View>
                <View style={styles.filterTrigger}>
                  <Filter size={20} color={Colors.text.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 4. ADVANCED FILTERS BOTTOM SHEET (Modal) */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            onPress={() => setShowFilters(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrele ve Sırala</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.filterGroupTitle}>Seviye</Text>
              <View style={styles.filterOptions}>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                  <TouchableOpacity key={lvl} style={styles.filterOptionPill}>
                    <Text style={styles.filterOptionText}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterGroupTitle}>Süre</Text>
              <View style={styles.filterOptions}>
                {['< 5 dk', '5-10 dk', '> 10 dk'].map(dur => (
                  <TouchableOpacity key={dur} style={styles.filterOptionPill}>
                    <Text style={styles.filterOptionText}>{dur}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterGroupTitle}>Konular</Text>
              <View style={styles.filterOptions}>
                {['İş', 'Teknoloji', 'Tıp', 'Seyahat', 'Günlük', 'Kültür'].map(topic => (
                  <TouchableOpacity key={topic} style={styles.filterOptionPill}>
                    <Text style={styles.filterOptionText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyBtnText}>Sonuçları Göster</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FloatingNav activeTab="discover" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: Typography.header,
    fontSize: 34,
    color: Colors.text.primary,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodRowContainer: {
    marginBottom: 24,
  },
  moodRow: {
    paddingLeft: 32,
    paddingRight: 16,
    gap: 12,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(30,43,74,0.03)',
  },
  moodChipActive: {
    backgroundColor: Colors.text.primary,
    borderColor: Colors.text.primary,
  },
  moodText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  moodTextActive: {
    color: 'white',
  },
  contentFeed: {
    marginTop: 8,
  },
  section: {
    marginBottom: 44,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: Typography.header,
    fontSize: 26,
    color: Colors.text.primary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.accent.warmGold,
  },
  exploreSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  exploreCard: {
    backgroundColor: '#FDF8F1',
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184,142,82,0.1)',
  },
  exploreTitle: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  exploreSubtitle: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  filterTrigger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCloseArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 48,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: Typography.header,
    fontSize: 28,
    color: Colors.text.primary,
  },
  modalScroll: {
    marginBottom: 24,
  },
  filterGroupTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.text.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  filterOptionText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  applyBtn: {
    backgroundColor: Colors.text.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: 'white',
  },
});
