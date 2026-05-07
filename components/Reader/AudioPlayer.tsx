import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Bookmark, BookmarkCheck } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { Colors, Typography, Shadows } from '../../constants/theme';

interface AudioPlayerProps {
  isPlaying: boolean;
  playbackSpeed: number;
  progress: number;
  isBookmarked: boolean;
  isFocusMode: boolean;
  onTogglePlayback: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onCycleSpeed: () => void;
  onToggleBookmark: () => void;
  onSeek?: (percentage: number) => void;
  onSeeking?: (percentage: number) => void;
}

export const AudioPlayer = ({
  isPlaying, playbackSpeed, progress, isBookmarked, isFocusMode,
  onTogglePlayback, onSkipForward, onSkipBackward, onCycleSpeed, onToggleBookmark, onSeek, onSeeking
}: AudioPlayerProps) => {
  return (
    <View style={[styles.container, isFocusMode && styles.focusContainer]}>
      <View style={styles.content}>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={progress}
            minimumTrackTintColor={Colors.accent.warmGold}
            maximumTrackTintColor="rgba(30,43,74,0.08)"
            thumbTintColor={Colors.accent.warmGold}
            onValueChange={(val) => onSeeking && onSeeking(val)}
            onSlidingComplete={(val) => onSeek && onSeek(val)}
          />
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.speedPill} onPress={onCycleSpeed}>
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>

          <View style={styles.mainControls}>
            <TouchableOpacity style={styles.controlBtn} onPress={onSkipBackward}>
              <SkipBack size={18} color={Colors.text.secondary} fill={Colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={onTogglePlayback}>
              {isPlaying ? (
                <Pause size={20} color={Colors.text.inverse} fill={Colors.text.inverse} />
              ) : (
                <Play size={20} color={Colors.text.inverse} fill={Colors.text.inverse} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={onSkipForward}>
              <SkipForward size={18} color={Colors.text.secondary} fill={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.secondaryControl} onPress={onToggleBookmark}>
            {isBookmarked ? (
              <BookmarkCheck size={16} color={Colors.accent.warmGold} fill={Colors.accent.warmGold} />
            ) : (
              <Bookmark size={16} color={Colors.text.secondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 34, left: 28, right: 28,
    backgroundColor: Colors.secondarySurface, borderRadius: 28,
    padding: 14, paddingTop: 12,
    ...Shadows.medium, borderWidth: 1, borderColor: 'rgba(30,43,74,0.03)',
  },
  focusContainer: {
    backgroundColor: 'rgba(251, 248, 244, 0.95)', bottom: 24,
  },
  content: { width: '100%' },
  sliderContainer: {
    height: 20, 
    justifyContent: 'center',
    marginBottom: 8,
    marginHorizontal: -10, // To align slider thumb with edges better
  },
  slider: {
    width: '100%',
    height: 20,
  },
  controlsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 4,
  },
  speedPill: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10,
    backgroundColor: 'rgba(30,43,74,0.02)', borderWidth: 1, borderColor: 'rgba(30,43,74,0.05)',
  },
  speedText: { fontFamily: Typography.bodySemiBold, fontSize: 10, color: Colors.text.secondary },
  mainControls: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  controlBtn: { opacity: 0.5 },
  playButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#24324D',
    justifyContent: 'center', alignItems: 'center', ...Shadows.subtle,
  },
  secondaryControl: {
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center', opacity: 0.6,
  },
});
