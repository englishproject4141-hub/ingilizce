import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator,
} from 'react-native';
import { X, Volume2, Plus, BookOpen, Check } from 'lucide-react-native';
import { Colors, Typography, Shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { articleService } from '../../services/articleService';
import { DictionaryEntry } from '../../lib/database.types';

interface WordPopupProps {
  word: string | null;
  onClose: () => void;
  onAddToList?: (word: string) => Promise<void | boolean> | void;
  onResolvedEntry?: (word: string, entry: DictionaryEntry) => void;
  isSaved?: boolean;
  isSaving?: boolean;
  initialEntry?: Partial<DictionaryEntry> | null;
}

export const WordPopup = ({ word, onClose, onAddToList, onResolvedEntry, isSaved = false, isSaving = false, initialEntry }: WordPopupProps) => {
  const [entry, setEntry] = useState<DictionaryEntry | null>(initialEntry as DictionaryEntry || null);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (word) {
      const fetchEntry = async () => {
        // Eğer elimizde zaten bir initialEntry varsa (Reader'dan gelen zenginleştirilmiş veri)
        // loading göstermeden onu set edelim ama yine de DB'den güncelini kontrol edelim.
        if (initialEntry) {
          setEntry(initialEntry as DictionaryEntry);
        } else {
          setLoading(true);
        }

        const data = await articleService.getDictionaryEntry(word);
        
        if (data) {
          setEntry(data);
          onResolvedEntry?.(word, data);
        } else if (initialEntry) {
          // DB'de yok ama elimizde zenginleştirilmiş veri varsa onu kullanmaya devam et
          setEntry(initialEntry as DictionaryEntry);
        }

        setLoading(false);
      };
      fetchEntry();

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [word]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSpeak = () => {
    if (word) {
      Speech.speak(word, { language: 'en-US', rate: 0.8 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddToList = async () => {
    if (word && onAddToList) {
      await onAddToList(word);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (!word) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: fadeAnim },
      ]}
    >
      <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} activeOpacity={1} />
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <View style={styles.wordRow}>
            <Text style={styles.word}>{word}</Text>
            {entry && entry.ipa && (
              <Text style={styles.ipa}>{entry.ipa}</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.speakBtn} onPress={handleSpeak}>
              <Volume2 size={18} color={Colors.accent.indigo} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
          {loading ? (
            <View style={{ padding: 40 }}><ActivityIndicator color={Colors.accent.indigo} /></View>
          ) : entry ? (
            <>
              <View style={styles.posBadge}>
                <Text style={styles.posText}>{entry.pos || 'vocabulary'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>DEFINITION</Text>
                <Text style={styles.definition}>{entry.definition_en}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TÜRKÇE</Text>
                <Text style={styles.turkish}>{entry.definition_tr}</Text>
              </View>

              {entry.example_sentence && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>EXAMPLE</Text>
                  <View style={styles.exampleContainer}>
                    <BookOpen size={14} color={Colors.text.muted} style={{ marginTop: 3 }} />
                    <Text style={styles.example}>{entry.example_sentence}</Text>
                  </View>
                </View>
              )}

              {entry.word_family && entry.word_family.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>WORD FAMILY</Text>
                  <View style={styles.familyRow}>
                    {entry.word_family.map((related: string, idx: number) => (
                      <View key={idx} style={styles.familyPill}>
                        <Text style={styles.familyPillText}>{related}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Listeye Ekle Butonu */}
              <TouchableOpacity
                style={[styles.addButton, isSaved && styles.addButtonSaved]}
                onPress={handleAddToList}
                disabled={isSaved || isSaving}
              >
                {isSaved ? (
                  <Check size={16} color={Colors.surface.white} />
                ) : (
                  <Plus size={16} color={Colors.surface.white} />
                )}
                <Text style={styles.addButtonText}>
                  {isSaved ? "Hazine'de" : (isSaving ? 'Ekleniyor...' : 'Kelime Listeme Ekle')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── Sözlükte bulunamayan kelime */
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundEmoji}>📖</Text>
              <Text style={styles.notFoundTitle}>Kelime bulunamadı</Text>
              <Text style={styles.notFoundDesc}>
                {`"${word}" kelimesi henüz sözlüğümüzde yok. Yakında eklenecek!`}
              </Text>
              <TouchableOpacity style={styles.speakFullBtn} onPress={handleSpeak}>
                <Volume2 size={16} color={Colors.accent.indigo} />
                <Text style={styles.speakFullText}>Telaffuzu Dinle</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 43, 74, 0.3)',
  },
  container: {
    backgroundColor: Colors.surface.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 40,
    maxHeight: '65%',
    ...Shadows.medium,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.text.muted,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  wordRow: {
    flex: 1,
  },
  word: {
    fontFamily: Typography.header,
    fontSize: 32,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  ipa: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.accent.indigo,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  speakBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.accent.indigo}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.iconCircle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  posBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.tag.indigo.bg,
    marginBottom: 20,
  },
  posText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 11,
    color: Colors.tag.indigo.text,
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.text.muted,
    marginBottom: 8,
  },
  definition: {
    fontFamily: Typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text.primary,
  },
  turkish: {
    fontFamily: Typography.bodyMedium,
    fontSize: 16,
    color: Colors.accent.warmGold,
  },
  exampleContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.cardBackground,
    padding: 14,
    borderRadius: 14,
  },
  example: {
    fontFamily: Typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    flex: 1,
  },
  familyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  familyPillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.indigo,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  addButtonSaved: {
    backgroundColor: Colors.accent.green,
  },
  addButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.surface.white,
  },
  // Not found
  notFoundContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  notFoundEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  notFoundTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  notFoundDesc: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  speakFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: `${Colors.accent.indigo}15`,
  },
  speakFullText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.accent.indigo,
  },
});
