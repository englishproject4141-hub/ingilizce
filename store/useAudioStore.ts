import { create } from 'zustand';
import { Audio } from 'expo-av';
import { Article } from '../lib/database.types';

interface AudioState {
  currentArticle: Article | null;
  sound: Audio.Sound | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playbackSpeed: number;
  isMiniPlayerVisible: boolean;

  // Actions
  setArticle: (article: Article) => void;
  setSound: (sound: Audio.Sound | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackStatus: (position: number, duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setMiniPlayerVisible: (visible: boolean) => void;
  
  // Controls
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  seek: (millis: number) => Promise<void>;
  reset: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentArticle: null,
  sound: null,
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  playbackSpeed: 1.0,
  isMiniPlayerVisible: false,

  setArticle: (article) => set({ currentArticle: article }),
  setSound: (sound) => set({ sound }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackStatus: (position, duration) => set({ positionMillis: position, durationMillis: duration }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setMiniPlayerVisible: (visible) => set({ isMiniPlayerVisible: visible }),

  play: async () => {
    const { sound } = get();
    if (sound) {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },

  pause: async () => {
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    }
  },

  togglePlayback: async () => {
    const { sound, isPlaying } = get();
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      set({ isPlaying: !isPlaying });
    }
  },

  seek: async (millis) => {
    const { sound } = get();
    if (sound) {
      await sound.setPositionAsync(millis);
      set({ positionMillis: millis });
    }
  },

  reset: async () => {
    const { sound } = get();
    if (sound) {
      await sound.unloadAsync();
    }
    set({
      currentArticle: null,
      sound: null,
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      isMiniPlayerVisible: false
    });
  }
}));
