import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Shadows, Spacing } from '../../constants/theme';
import { useAudioStore } from '../../store/useAudioStore';

const { width } = Dimensions.get('window');

export const MiniPlayer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    currentArticle, 
    isPlaying, 
    togglePlayback, 
    positionMillis, 
    durationMillis,
    sound
  } = useAudioStore();

  // Okuyucu ekranında değilsek ve makale varsa göster
  const isReaderScreen = pathname.includes('reader');
  const isVisible = !!currentArticle && !isReaderScreen;

  if (!isVisible) return null;

  const progress = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

  const handlePress = () => {
    const articleIdentifier = currentArticle.slug || currentArticle.id;
    // replace yerine push kullanma — aynı makaleyi yeniden yükler!
    // Mevcut sesi koruyarak Reader'a geri dön
    router.push({ pathname: '/reader/[id]', params: { id: articleIdentifier, resuming: 'true' } } as any);
  };

  const skipForward = async () => {
    if (sound) {
      await sound.setPositionAsync(Math.min(positionMillis + 15000, durationMillis));
    }
  };

  const skipBackward = async () => {
    if (sound) {
      await sound.setPositionAsync(Math.max(positionMillis - 15000, 0));
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handlePress}
      style={styles.container}
    >
      <BlurView intensity={90} tint="light" style={styles.blurContainer}>
        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.content}>
          {/* Article Info */}
          <View style={styles.info}>
            <View style={styles.thumbnailPlaceholder}>
               <Text style={styles.thumbnailText}>{currentArticle.level}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {currentArticle.title}
              </Text>
              <Text style={styles.topic} numberOfLines={1}>
                {currentArticle.topic}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={skipBackward} style={styles.controlBtn}>
              <RotateCcw size={20} color={Colors.text.primary} strokeWidth={1.5} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={togglePlayback} 
              style={styles.playBtn}
            >
              {isPlaying ? (
                <Pause size={20} color={Colors.surface.white} fill={Colors.surface.white} />
              ) : (
                <Play size={20} color={Colors.surface.white} fill={Colors.surface.white} style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={skipForward} style={styles.controlBtn}>
              <RotateCw size={20} color={Colors.text.primary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - (Spacing.outer * 2),
    height: 76,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 8,
    zIndex: 10,
    ...Shadows.medium,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(30, 43, 74, 0.05)',
  },
  blurContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(30, 43, 74, 0.05)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.indigo,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: Colors.accent.indigo,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.text.primary,
  },
  topic: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    padding: 8,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
});
