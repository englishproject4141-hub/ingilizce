import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Lock, Clock, Briefcase, Heart, Cpu, Map, MessageSquare, Shield, Activity } from 'lucide-react-native';
import { Colors, Typography, Spacing, Shadows } from '../../constants/theme';
import type { Article } from '../../lib/database.types';

const { width } = Dimensions.get('window');

type DiscoverCardProps = {
  article: Article & { progress?: number; isRead?: boolean; newWords?: number };
  variant?: 'vertical' | 'horizontal' | 'small';
  onPress: (article: Article) => void;
};

const getTopicIcon = (topic: string, size = 24, color = Colors.text.primary) => {
  const t = topic.toLowerCase();
  if (t.includes('iş') || t.includes('business')) return <Briefcase size={size} color={color} strokeWidth={1.5} />;
  if (t.includes('teknoloji')) return <Cpu size={size} color={color} strokeWidth={1.5} />;
  if (t.includes('tıp') || t.includes('sağlık')) return <Activity size={size} color={color} strokeWidth={1.5} />;
  if (t.includes('seyahat')) return <Map size={size} color={color} strokeWidth={1.5} />;
  if (t.includes('günlük')) return <MessageSquare size={size} color={color} strokeWidth={1.5} />;
  if (t.includes('hukuk')) return <Shield size={size} color={color} strokeWidth={1.5} />;
  return <Briefcase size={size} color={color} strokeWidth={1.5} />;
};

const getTopicColor = (topic: string) => {
  const t = topic.toLowerCase();
  if (t.includes('iş')) return '#FDF8F1'; // Warm Beige
  if (t.includes('teknoloji')) return '#F5F3FF'; // Muted Lavender
  if (t.includes('tıp')) return '#F0FDF4'; // Sage Green
  if (t.includes('seyahat')) return '#F0F9FF'; // Light Blue
  return '#F9FAFB'; 
};

export const DiscoverCard = ({ article, variant = 'vertical', onPress }: DiscoverCardProps) => {
  const isHorizontal = variant === 'horizontal';
  const isSmall = variant === 'small';
  const topicColor = getTopicColor(article.topic);
  const durationMin = Math.round(article.duration_seconds / 60);

  // Yatay Geniş Kart (Kaldığın Yerden Devam Et)
  if (isHorizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={() => onPress(article)} activeOpacity={0.9}>
        <View style={[styles.hThumbnail, { backgroundColor: topicColor }]}>
          <View style={styles.continueTag}>
            <Text style={styles.continueTagText}>DEVAM ET</Text>
          </View>
          {getTopicIcon(article.topic, 48, 'rgba(184,142,82,0.4)')}
        </View>
        <View style={styles.hContent}>
          <Text style={styles.hTitle} numberOfLines={1}>{article.title}</Text>
          <Text style={styles.hMeta}>
            {article.level}  •  {article.topic}  •  {durationMin} dk
          </Text>
          <View style={styles.hProgressContainer}>
            <View style={styles.hProgressTrack}>
              <View style={[styles.hProgressFill, { width: `${(article.progress || 0.42) * 100}%` }]} />
            </View>
            <Text style={styles.hProgressLabel}>%{Math.round((article.progress || 0.42) * 100)}</Text>
          </View>
          <Text style={styles.hSummary} numberOfLines={2}>
            {article.full_text?.substring(0, 80) || "Remote work is no longer just a trend; it's a fundamental shift in how we approach..."}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Küçük Kart (Kısa ve Öz)
  if (isSmall) {
    return (
      <TouchableOpacity style={styles.smallCard} onPress={() => onPress(article)} activeOpacity={0.9}>
        <View style={[styles.smallThumbnail, { backgroundColor: topicColor }]}>
          <View style={styles.smallTimePill}>
            <Text style={styles.smallTimeText}>{durationMin} dk</Text>
          </View>
          {getTopicIcon(article.topic, 24, 'rgba(30,43,74,0.4)')}
        </View>
        <View style={styles.smallBody}>
          <Text style={styles.smallTitle} numberOfLines={2}>{article.title}</Text>
          <Text style={styles.smallMeta}>{article.level}  •  {article.topic}</Text>
          <Text style={styles.smallWordCount}>{article.word_count} kelime</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Dikey Orta Kart (Sana Önerilenler)
  return (
    <TouchableOpacity style={styles.verticalCard} onPress={() => onPress(article)} activeOpacity={0.9}>
      <View style={[styles.vThumbnail, { backgroundColor: topicColor }]}>
        <View style={styles.vLevelPill}>
          <Text style={styles.vLevelText}>{article.level}</Text>
        </View>
        <View style={styles.vTimePill}>
          <Text style={styles.vTimeText}>{durationMin} dk</Text>
        </View>
        {getTopicIcon(article.topic, 42, 'rgba(30,43,74,0.3)')}
      </View>
      <View style={styles.vBody}>
        <Text style={styles.vTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.vMeta}>{article.level}  •  {article.topic}</Text>
        <Text style={styles.vSummary} numberOfLines={2}>
          {article.full_text?.substring(0, 60) || "Technology is transforming healthcare in amazing ways."}
        </Text>
        <View style={styles.vFooter}>
          <Text style={styles.vWordCount}>{article.word_count} kelime</Text>
          <View style={styles.newWordsBadge}>
            <Text style={styles.newWordsText}>12 yeni kelime</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  horizontalCard: {
    width: width - 64,
    backgroundColor: '#FDFCFB',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(30,43,74,0.04)',
    ...Shadows.subtle,
  },
  hThumbnail: {
    width: 120,
    height: 140,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hTitle: {
    fontFamily: Typography.header,
    fontSize: 24,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  hMeta: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 16,
  },
  hContent: {
    flex: 1,
    paddingLeft: 18,
    justifyContent: 'center',
  },
  hProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  hProgressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(30,43,74,0.05)',
    borderRadius: 2,
  },
  hProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.warmGold,
    borderRadius: 2,
  },
  hProgressLabel: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  hSummary: {
    fontFamily: Typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
  },
  continueTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 2,
  },
  continueTagText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Colors.accent.warmGold,
  },

  // Dikey Kart
  verticalCard: {
    width: 220,
    backgroundColor: '#FDFCFB',
    borderRadius: 24,
    padding: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(30,43,74,0.04)',
  },
  vThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  vBody: {
    paddingHorizontal: 4,
  },
  vTitle: {
    fontFamily: Typography.header,
    fontSize: 22,
    color: Colors.text.primary,
    lineHeight: 26,
    marginBottom: 6,
  },
  vMeta: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 10,
  },
  vSummary: {
    fontFamily: Typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  vFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vWordCount: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  newWordsBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newWordsText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: '#7C3AED',
  },
  vLevelPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vLevelText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: '#059669',
  },
  vTimePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vTimeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
    color: Colors.text.secondary,
  },

  // Küçük Kart (Kısa ve Öz)
  smallCard: {
    width: 140,
    marginRight: 16,
  },
  smallThumbnail: {
    width: 140,
    height: 100,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  smallTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
    marginBottom: 4,
  },
  smallMeta: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 2,
  },
  smallWordCount: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.text.muted,
    opacity: 0.7,
  },
  smallTimePill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallTimeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 9,
    color: Colors.text.secondary,
  },
  smallBody: {
    paddingHorizontal: 2,
  }
});
