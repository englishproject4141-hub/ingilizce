import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { Clock, BookOpen, Zap, Bookmark, ChevronRight, ThumbsDown, Minus, ThumbsUp, Plus, Check } from 'lucide-react-native';
import { Colors, Typography, Shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { DictionaryEntry } from '../../lib/database.types';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  sessionDurationMs: number;
  wordCount: number;
  sentencesRead: number;
  totalSentences: number;
  bookmarkedCount: number;
  wordsLookedUp: number;
  suggestedWords?: DictionaryEntry[];
  onAddSuggestedWords?: (words: string[]) => Promise<void> | void;
  onDifficultyFeedback: (level: 'easy' | 'right' | 'hard') => void;
  onContinue: () => void;
  onClose: () => void;
}

export const SessionSummary = (props: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [suggestionsAdded, setSuggestionsAdded] = useState(false);

  useEffect(() => {
    if (props.visible) {
      setSuggestionsAdded(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
      ]).start();
    }
  }, [props.visible]);

  if (!props.visible) return null;

  const durationMinutes = props.sessionDurationMs / 60000;
  const wpm = durationMinutes > 0 ? Math.round(props.wordCount / durationMinutes) : 0;
  const minutes = Math.floor(props.sessionDurationMs / 60000);
  const seconds = Math.floor((props.sessionDurationMs % 60000) / 1000);
  const timeStr = minutes > 0 ? `${minutes} dk ${seconds} sn` : `${seconds} sn`;
  const progressPercent = Math.round((props.sentencesRead / props.totalSentences) * 100);
  const suggestedWords = props.suggestedWords || [];

  const handleDifficulty = (level: 'easy' | 'right' | 'hard') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    props.onDifficultyFeedback(level);
  };

  const handleAddSuggestions = async () => {
    if (suggestedWords.length === 0 || !props.onAddSuggestedWords) return;
    await props.onAddSuggestedWords(suggestedWords.map(entry => entry.word));
    setSuggestionsAdded(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerSection}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.title}>Seans Tamamlandı</Text>
          <Text style={styles.subtitle}>Harika bir okuma seansı geçirdin!</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Clock size={18} color={Colors.accent.indigo} />
            </View>
            <Text style={styles.statValue}>{timeStr}</Text>
            <Text style={styles.statLabel}>Süre</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
              <Zap size={18} color={Colors.accent.warmGold} />
            </View>
            <Text style={styles.statValue}>{wpm}</Text>
            <Text style={styles.statLabel}>WPM</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <BookOpen size={18} color={Colors.accent.green} />
            </View>
            <Text style={styles.statValue}>{props.wordsLookedUp}</Text>
            <Text style={styles.statLabel}>Kelime</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
              <Bookmark size={18} color={Colors.chart.flame} fill={Colors.chart.flame} />
            </View>
            <Text style={styles.statValue}>{props.bookmarkedCount}</Text>
            <Text style={styles.statLabel}>Bookmark</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>İlerleme</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressDetail}>{props.sentencesRead} / {props.totalSentences} cümle okundu</Text>
        </View>

        {suggestedWords.length > 0 && (
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Seans Hediyesi</Text>
            <Text style={styles.suggestionSubtitle}>Makaleden secilen 3 kelime</Text>
            <View style={styles.suggestionList}>
              {suggestedWords.map(entry => (
                <View key={entry.id} style={styles.suggestionPill}>
                  <Text style={styles.suggestionWord}>{entry.word}</Text>
                  <Text style={styles.suggestionMeaning} numberOfLines={1}>{entry.definition_tr}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.suggestionButton, suggestionsAdded && styles.suggestionButtonAdded]}
              onPress={handleAddSuggestions}
              disabled={suggestionsAdded}
            >
              {suggestionsAdded ? (
                <Check size={15} color={Colors.surface.white} />
              ) : (
                <Plus size={15} color={Colors.surface.white} />
              )}
              <Text style={styles.suggestionButtonText}>
                {suggestionsAdded ? "Hazine'ye eklendi" : "Hazine'ye ekle"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.difficultySection}>
          <Text style={styles.difficultyTitle}>Bu metin nasıldı?</Text>
          <Text style={styles.difficultySubtitle}>Geri bildirimin, sana daha uygun içerikler önermemize yardımcı olur.</Text>
          <View style={styles.difficultyRow}>
            <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }]} onPress={() => handleDifficulty('easy')}>
              <ThumbsUp size={20} color="#065F46" />
              <Text style={[styles.diffText, { color: '#065F46' }]}>Kolay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]} onPress={() => handleDifficulty('right')}>
              <Minus size={20} color={Colors.accent.indigo} />
              <Text style={[styles.diffText, { color: Colors.accent.indigo }]}>Uygun</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]} onPress={() => handleDifficulty('hard')}>
              <ThumbsDown size={20} color="#991B1B" />
              <Text style={[styles.diffText, { color: '#991B1B' }]}>Zor</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.continueBtn} onPress={props.onContinue}>
          <Text style={styles.continueText}>Ana Sayfaya Dön</Text>
          <ChevronRight size={18} color={Colors.surface.white} />
        </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,43,74,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: 24 },
  container: { width: '100%', maxWidth: 380, maxHeight: '90%', backgroundColor: Colors.surface.white, borderRadius: 28, padding: 28, ...Shadows.medium },
  headerSection: { alignItems: 'center', marginBottom: 28 },
  bodyContent: { paddingBottom: 2 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontFamily: Typography.header, fontSize: 28, color: Colors.text.primary, marginBottom: 6 },
  subtitle: { fontFamily: Typography.body, fontSize: 14, color: Colors.text.secondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: (width - 120) / 2 - 6, backgroundColor: Colors.cardBackground, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontFamily: Typography.bodySemiBold, fontSize: 18, color: Colors.text.primary, marginBottom: 2 },
  statLabel: { fontFamily: Typography.body, fontSize: 11, color: Colors.text.muted },
  progressSection: { marginBottom: 24, backgroundColor: Colors.cardBackground, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.text.primary },
  progressPercent: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.accent.indigo },
  progressTrack: { height: 6, backgroundColor: Colors.surface.iconCircle, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.accent.warmGold, borderRadius: 3 },
  progressDetail: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.muted },
  suggestionSection: { marginBottom: 24, backgroundColor: '#FFFBEB', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A' },
  suggestionTitle: { fontFamily: Typography.bodySemiBold, fontSize: 14, color: Colors.text.primary, textAlign: 'center', marginBottom: 2 },
  suggestionSubtitle: { fontFamily: Typography.body, fontSize: 11, color: Colors.text.muted, textAlign: 'center', marginBottom: 12 },
  suggestionList: { gap: 8, marginBottom: 12 },
  suggestionPill: { backgroundColor: Colors.surface.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#FDE68A' },
  suggestionWord: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.text.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  suggestionMeaning: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  suggestionButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: Colors.accent.warmGold, borderRadius: 12, paddingVertical: 11 },
  suggestionButtonAdded: { backgroundColor: Colors.accent.green },
  suggestionButtonText: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.surface.white },
  difficultySection: { marginBottom: 24 },
  difficultyTitle: { fontFamily: Typography.bodySemiBold, fontSize: 15, color: Colors.text.primary, marginBottom: 4, textAlign: 'center' },
  difficultySubtitle: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.muted, textAlign: 'center', marginBottom: 14, lineHeight: 18 },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 6, borderWidth: 1 },
  diffText: { fontFamily: Typography.bodySemiBold, fontSize: 12 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.text.primary, paddingVertical: 16, borderRadius: 16 },
  continueText: { fontFamily: Typography.bodySemiBold, fontSize: 15, color: Colors.surface.white },
});
