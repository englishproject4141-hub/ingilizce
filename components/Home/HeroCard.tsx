import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../constants/theme';
import { Play, Bookmark, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.outer * 2;

export const HeroCard = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push({ pathname: '/reader/[id]', params: { id: 'text_001' } });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <View>
            <View style={styles.tagBadge}>
              <Text style={styles.tag}>DEVAM ET</Text>
            </View>
            <Text style={styles.title}>The Art of{"\n"}Remote Work</Text>
            <Text style={styles.subtitle}>
              Konsantrasyon, rutinler ve denge üzerine etkileyici bir okuma.
            </Text>
          </View>

          <View>
            <View style={styles.metadata}>
              <Text style={styles.metaText}>B1  •  10 dk  •  İş</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '67%' }]} />
              </View>
              <Text style={styles.progressText}>67% tamamlandı</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>Devam Et</Text>
              <ChevronRight size={14} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.right}>
          <Image
            source={require('../../assets/images/scandinavian_desk_hero.png')}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Soft gradient from background color to transparent */}
          <LinearGradient
            colors={[Colors.cardBackground, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.4, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity style={styles.playButton}>
            <Play size={22} color={Colors.text.primary} fill={Colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bookmark}>
            <Bookmark size={20} color={Colors.text.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.outer,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    height: CARD_WIDTH,
  },
  content: {
    flexDirection: 'row',
    flex: 1,
  },
  left: {
    flex: 1.3,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  right: {
    flex: 1.2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    backgroundColor: Colors.tag.green.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tag: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.tag.green.text,
  },
  title: {
    fontFamily: Typography.header,
    fontSize: 32,
    lineHeight: 34,
    color: Colors.text.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  metadata: {
    marginBottom: 14,
  },
  metaText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
    color: Colors.text.muted,
    opacity: 0.8,
  },
  progressContainer: {
    marginBottom: 18,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(30,43,74,0.05)',
    borderRadius: 1.5,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.warmGold,
    borderRadius: 1.5,
  },
  progressText: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  buttonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.text.primary,
  },
  playButton: {
    position: 'absolute',
    bottom: 24,
    left: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bookmark: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
