import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronDown, Maximize2, Minimize2, Languages, Check,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, Shadows } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// ── Ayrıştırılmış Bileşenler
import { WordPopup } from '../../components/Reader/WordPopup';
import { AudioPlayer } from '../../components/Reader/AudioPlayer';
import { SessionSummary } from '../../components/Reader/SessionSummary';
import { ReaderSkeleton } from '../../components/Reader/ReaderSkeleton';
import { articleService } from '../../services/articleService';
import { userService } from '../../services/userService';
import { supabase } from '../../lib/supabase';
import { Article, ArticleSentence } from '../../lib/database.types';

const { width, height } = Dimensions.get('window');

// ── DOKUNULABILIR KELİME BİLEŞENİ ──────────────────────────
const TappableWord = ({
  word,
  onPress,
}: {
  word: string;
  onPress: (word: string) => void;
}) => {
  const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');

  return (
    <Text
      style={styles.wordToken}
      onPress={() => {
        if (cleanWord.length > 0) {
          Haptics.selectionAsync();
          onPress(cleanWord.toLowerCase());
        }
      }}
    >
      {word}{' '}
    </Text>
  );
};

// ── ANA EKRAN ──────────────────────────────────────────────
export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── State
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [sentences, setSentences] = useState<ArticleSentence[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'reading' | 'focus'>('reading');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [bookmarkedSentences, setBookmarkedSentences] = useState<Set<number>>(new Set());
  const [sessionStartTime] = useState(Date.now());
  const [showTranslation, setShowTranslation] = useState(false);
  const [wordsLookedUp, setWordsLookedUp] = useState(0);
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sentenceLayouts = useRef<{ [key: number]: number }>({});
  const lookedUpWordsRef = useRef<Set<string>>(new Set());
  const isDraggingSlider = useRef(false);
  const totalAudioDuration = useRef(0);

  // ── CUSTOM SMOOTH SCROLL ─────────────────────────────────
  const currentScrollY = useRef(0);
  const scrollAnimationRef = useRef<number | null>(null);

  const smoothScrollTo = (targetY: number, duration: number = 450) => {
    if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);

    const startY = currentScrollY.current;
    const distance = targetY - startY;
    const startTime = Date.now();

    console.log(`[SmoothScroll] Başlıyor: StartY: ${startY}, TargetY: ${targetY}, Mesafe: ${distance}`);

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const nextY = startY + distance * ease;
      scrollViewRef.current?.scrollTo({ y: nextY, animated: false });

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animate);
      } else {
        currentScrollY.current = targetY;
        console.log('[SmoothScroll] Tamamlandı');
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);
  };

  // ── AUTO-SCROLL (Living Text Mode) ─────────────────────────
  useEffect(() => {
    if (viewMode === 'reading' && sentences.length > 0) {
      const yPos = sentenceLayouts.current[activeSentenceIndex];
      if (yPos !== undefined) {
        const targetY = Math.max(0, yPos - height * 0.3);
        smoothScrollTo(targetY, 450);
      } else {
        console.log(`[AutoScroll] Y pozisyonu henüz hazır değil: ${activeSentenceIndex}`);
      }
    }
  }, [activeSentenceIndex, viewMode, sentences]);

  // ── VERİ ÇEKME (SUPABASE) ────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Kullanıcı oturumunu al
        const { data: { session } } = await supabase.auth.getSession();
        const curUserId = session?.user?.id || '00000000-0000-0000-0000-000000000000';
        setUserId(curUserId);

        // 2. Makale ve cümleleri çek (ID yoksa SQL'deki makaleyi zorla aç)
        console.log('--- DEBUG START ---');
        console.log('Gelen Orijinal ID:', id);
        
        // Eğer ID gelmediyse, undefined ise, veya 'null' stringi ise fallback yap
        const isInvalidId = !id || id === 'undefined' || id === 'null' || id === 'text_101';
        const targetId = isInvalidId ? 'the-art-of-remote-work' : (id as string);
        
        console.log('Veritabanında Aranan ID/Slug:', targetId);

        const data = await articleService.getFullArticle(targetId);
        
        if (!data || !data.article) {
          console.error('HATA: Makale Supabase\'den dönmedi!');
          return;
        }

        console.log('Makale Başarıyla Bulundu:', data.article.title);
        console.log('Çekilen Cümle Sayısı:', data.sentences?.length);
        if (data.sentences && data.sentences.length > 0) {
          console.log('İlk 3 cümlenin start_ms değerleri:', data.sentences.slice(0, 3).map(s => s.start_ms));
        }
        console.log('--- DEBUG END ---');

        setArticle(data.article);
        setSentences(data.sentences);

        // 3. Mevcut bookmark'ları çek
        const { data: bookmarks } = await supabase
          .from('sentence_bookmarks')
          .select('sentence_index')
          .eq('user_id', curUserId)
          .eq('article_id', data.article.id);

        const typedBookmarks = bookmarks as { sentence_index: number }[] | null;

        if (typedBookmarks) {
          setBookmarkedSentences(new Set(typedBookmarks.map(b => b.sentence_index)));
        }

        // 4. Dinamik Hız Ayarı (Bölüm 2.2)
        const reps = await articleService.getRepetitionCount(curUserId, data.article.id);
        const autoSpeed = Math.min(1.0 + (Math.floor(reps / 2) * 0.05), 1.5);
        setPlaybackSpeed(autoSpeed);

        // 5. Ses dosyasını yükle (ZORUNLU OLARAK SENİN LOCAL MP3'ÜNÜ KULLANACAK)
        const localAudio = require('../../assets/audio/remote_work.mp3');
        await loadAudio(localAudio, autoSpeed, data.sentences);
      } catch (e) {
        console.error('Veri yükleme hatası:', e);
      } finally {
        // Shimmer etkisini hissetmek için kısa bir gecikme
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchData();
  }, [id]);

  const loadAudio = async (source: any, speed: number, currentSentences: ArticleSentence[]) => {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      const audioSource = typeof source === 'string' ? { uri: source } : source;
      const { sound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: false, rate: speed, shouldCorrectPitch: true }
      );
      soundRef.current = sound;

      let workingSentences = currentSentences;
      const hasTimestamps = currentSentences.some(s => s.start_ms != null && s.start_ms > 0);
      
      const initialStatus = await sound.getStatusAsync();
      
      // Eğer ses süreleri veritabanında yoksa, karakter uzunluğuna göre paylaştırıp bir kez kaydet
      if (!hasTimestamps && initialStatus.isLoaded && initialStatus.durationMillis) {
        const totalDurationMs = initialStatus.durationMillis;
        const totalChars = currentSentences.reduce((acc, s) => acc + (s.text_en?.length || 0), 0);
        let currentMs = 0;
        workingSentences = currentSentences.map(s => {
          const ratio = (s.text_en?.length || 0) / (totalChars || 1);
          const durationMs = totalDurationMs * ratio;
          const newS = { ...s, start_ms: currentMs, end_ms: currentMs + durationMs };
          currentMs += durationMs;
          return newS;
        });
        // Güncel milisaniyeli cümleleri state'e kaydet ki tıklayınca gidebilelim
        setSentences(workingSentences);
      }

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.durationMillis && totalAudioDuration.current === 0) {
            totalAudioDuration.current = status.durationMillis;
          }

          if (status.didJustFinish) {
            setIsPlaying(false);
            setAudioProgress(100);
            setShowSessionSummary(true);
          } else if (status.isPlaying) {
            const currentTime = status.positionMillis;
            if (!isDraggingSlider.current && status.durationMillis) {
              setAudioProgress((currentTime / status.durationMillis) * 100);
            }
            
            let newActiveIndex = -1;
            
            for (let i = 0; i < workingSentences.length; i++) {
              const start = workingSentences[i].start_ms || 0;
              const nextStart = i + 1 < workingSentences.length 
                ? (workingSentences[i + 1].start_ms || Number.MAX_SAFE_INTEGER) 
                : Number.MAX_SAFE_INTEGER;
                
              if (currentTime >= start && currentTime < nextStart) {
                newActiveIndex = workingSentences[i].sentence_index;
                break;
              }
            }

            if (newActiveIndex !== -1 && !isDraggingSlider.current) {
              setActiveSentenceIndex((prev) => (prev !== newActiveIndex ? newActiveIndex : prev));
            }
          }
        }
      });
    } catch (e) {
      console.log('Audio load error:', e);
    }
  };

  // ── SES YÖNLENDİRME (SEEK) ──────────────────────────────
  const seekToPosition = async (positionMillis: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(positionMillis);
      if (!isPlaying) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSliderSeeking = (percentage: number) => {
    isDraggingSlider.current = true;
    setAudioProgress(percentage);
    
    if (totalAudioDuration.current > 0 && sentences.length > 0) {
      const targetMillis = (percentage / 100) * totalAudioDuration.current;
      
      let newActiveIndex = 0;
      for (let i = 0; i < sentences.length; i++) {
        const start = sentences[i].start_ms || 0;
        const nextStart = i + 1 < sentences.length 
          ? (sentences[i + 1].start_ms || Number.MAX_SAFE_INTEGER) 
          : Number.MAX_SAFE_INTEGER;
          
        if (targetMillis >= start && targetMillis < nextStart) {
          newActiveIndex = sentences[i].sentence_index;
          break;
        }
      }
      setActiveSentenceIndex(newActiveIndex);
    }
  };

  const handleSliderSeek = async (percentage: number) => {
    isDraggingSlider.current = false;
    if (soundRef.current && totalAudioDuration.current > 0) {
      const targetMillis = (percentage / 100) * totalAudioDuration.current;
      await seekToPosition(targetMillis);
    }
  };


  // ── SES KONTROL ──────────────────────────────────────────
  const togglePlayback = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const skipForward = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      await soundRef.current.setPositionAsync(
        Math.min(status.positionMillis + 15000, status.durationMillis || 0)
      );
    }
    setActiveSentenceIndex(Math.min(sentences.length - 1, activeSentenceIndex + 1));
  };

  const skipBackward = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      await soundRef.current.setPositionAsync(Math.max(status.positionMillis - 15000, 0));
    }
    setActiveSentenceIndex(Math.max(0, activeSentenceIndex - 1));
  };

  const cycleSpeed = async () => {
    const speeds = [0.7, 1.0, 1.3, 1.5];
    const currentIdx = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(nextSpeed, true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── BOOKMARK ──────────────────────────────────────────────
  const toggleBookmark = async () => {
    if (!article || userId === null) return;

    const isCurrentlyBookmarked = bookmarkedSentences.has(activeSentenceIndex);
    const newSet = new Set(bookmarkedSentences);

    if (isCurrentlyBookmarked) {
      newSet.delete(activeSentenceIndex);
    } else {
      newSet.add(activeSentenceIndex);
    }

    setBookmarkedSentences(newSet);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Supabase'e kaydet (Arka planda)
    await articleService.toggleBookmark(
      userId,
      article.id,
      activeSentenceIndex,
      isCurrentlyBookmarked
    );
  };

  // ── KELIME DOKUNMA ────────────────────────────────────────
  const handleWordPress = (word: string) => {
    if (!lookedUpWordsRef.current.has(word)) {
      lookedUpWordsRef.current.add(word);
      setWordsLookedUp(prev => prev + 1);
    }
    setSelectedWord(word === selectedWord ? null : word);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddWord = async (word: string) => {
    if (!userId) return;
    try {
      await userService.saveWord(userId, word, article?.id);
    } catch (e) {
      console.error('Word save error:', e);
    }
  };

  // ── FOCUS MODE ────────────────────────────────────────────
  useEffect(() => {
    if (viewMode === 'focus' && flatListRef.current && sentences.length > 0) {
      flatListRef.current.scrollToIndex({
        index: activeSentenceIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [activeSentenceIndex, viewMode, sentences]);

  const toggleMode = () => {
    setViewMode(viewMode === 'reading' ? 'focus' : 'reading');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ── ÇİFT DİL TOGGLE ────────────────────────────────────
  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── SEANS SONU ────────────────────────────────────────────
  const handleEndSession = () => {
    setShowSessionSummary(true);
    if (isPlaying && soundRef.current) {
      soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const handleDifficultyFeedback = (level: 'easy' | 'right' | 'hard') => {
    if (article && userId) {
      articleService.saveReadingSession({
        user_id: userId,
        article_id: article.id,
        started_at: new Date(sessionStartTime).toISOString(),
        ended_at: new Date().toISOString(), // Seansın bittiği anı ekliyoruz
        duration_seconds: Math.floor((Date.now() - sessionStartTime) / 1000),
        reading_speed_wpm: Math.round(article.word_count / ((Date.now() - sessionStartTime) / 60000)),
        sentences_read: activeSentenceIndex + 1,
        words_looked_up: wordsLookedUp,
        difficulty_feedback: level,
        playback_speed: playbackSpeed,
        completed: (activeSentenceIndex + 1) >= sentences.length,
      });

      // Seansı bitir ve geri dön
      handleSessionContinue();
    }
  };

  const handleSessionContinue = () => {
    setShowSessionSummary(false);
    router.back();
  };

  // ── SENTENCE RENDER (LIVING TEXT MODE) ───────────────────
  const renderSentenceBlock = (sentence: ArticleSentence, index: number) => {
    const isActive = activeSentenceIndex === sentence.sentence_index;
    const distance = Math.abs(sentence.sentence_index - activeSentenceIndex);
    
    // Paragraf değişimi için ekstra boşluk
    const isNewParagraph = index > 0 && sentences[index - 1].paragraph_index !== sentence.paragraph_index;
    
    // Görsel Hiyerarşi (Block Opacity) - View yapısı kullandığımız için opacity Android'de sorunsuz çalışır
    let blockOpacity = 0.25; 
    if (distance === 0) blockOpacity = 1;
    else if (distance === 1) blockOpacity = 0.6;
    else if (distance === 2) blockOpacity = 0.4;

    return (
      <TouchableOpacity 
        key={sentence.id} 
        activeOpacity={0.7}
        onPress={() => seekToPosition(sentence.start_ms || 0)}
        onLayout={(e) => {
          sentenceLayouts.current[sentence.sentence_index] = e.nativeEvent.layout.y;
        }}
        style={[
          styles.sentenceBlock,
          isNewParagraph && { marginTop: 32 },
          { opacity: blockOpacity },
          isActive && styles.activeSentenceBlock
        ]}
      >
        <Text style={[styles.bodyText, isActive && { fontSize: 18, color: '#1E293B' }]}>
          {sentence.text_en.split(' ').map((word, wIdx) => (
            <TappableWord
              key={`${sentence.id}-${wIdx}`}
              word={word}
              onPress={(w) => {
                handleWordPress(w);
                seekToPosition(sentence.start_ms || 0);
              }}
            />
          ))}
        </Text>

        {/* Çift Dil Çeviri */}
        {showTranslation && (
          <View style={styles.translationBlock}>
            <Text style={[styles.translationText, isActive && { color: Colors.accent.indigo, fontWeight: '600' }]}>
              {sentence.text_tr}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── FOCUS MODE ITEM ───────────────────────────────────────
  const renderFocusItem = ({ item, index }: { item: ArticleSentence; index: number }) => {
    const isActive = activeSentenceIndex === index;
    const isPast = index < activeSentenceIndex;
    const isBookmarked = bookmarkedSentences.has(index);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setActiveSentenceIndex(index)}
        style={[
          styles.focusItem,
          isActive && styles.activeFocusItem,
          isBookmarked && styles.bookmarkedFocusItem,
        ]}
      >
        <Text style={[
          styles.focusText,
          isActive && styles.activeFocusText,
          isPast && styles.pastFocusText,
          !isActive && !isPast && styles.futureFocusText,
        ]}>
          {item.text_en}
        </Text>

        {/* ── Çift dil: Focus mode'da çeviri */}
        {showTranslation && isActive && item.text_tr && (
          <Text style={styles.focusTranslation}>{item.text_tr}</Text>
        )}

        {isBookmarked && (
          <View style={styles.bookmarkDot} />
        )}
      </TouchableOpacity>
    );
  };

  // ── LOADING / SKELETON ──────────────────────────────────
  if (loading || !article) {
    return <ReaderSkeleton />;
  }

  // ── İLERLEME YÜZDE ───────────────────────────────────────
  const isCurrentBookmarked = bookmarkedSentences.has(activeSentenceIndex);

  // Paragrafları cümlelerin paragraph_index değerine göre dinamik olarak grupluyoruz
  const paragraphIndices = Array.from(new Set(sentences.map(s => s.paragraph_index))).sort((a, b) => a - b);

  return (
    <View style={[styles.container, viewMode === 'focus' && styles.focusContainer]}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* ── HEADER ──────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ChevronDown size={22} color={Colors.text.primary} strokeWidth={1.2} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {viewMode === 'focus' ? 'FOCUS MODE' : 'READER'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.trToggle, showTranslation && styles.trToggleActive]}
              onPress={toggleTranslation}
            >
              {showTranslation ? (
                <Check size={14} color={Colors.surface.white} strokeWidth={2.5} />
              ) : (
                <Languages size={16} color={Colors.text.secondary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton} onPress={toggleMode}>
              {viewMode === 'focus' ? (
                <Minimize2 size={20} color={Colors.text.primary} strokeWidth={1.2} />
              ) : (
                <Maximize2 size={20} color={Colors.text.primary} strokeWidth={1.2} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── İÇERİK ─────────────────────────────────── */}
        {viewMode === 'reading' ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              currentScrollY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
            }}
          >
            <View style={styles.contentHeader}>
              <Text style={styles.categoryLabel}>
                {article.level}  •  {Math.round(article.duration_seconds / 60)} dk  •  {article.topic}
              </Text>
              <Text style={styles.title}>{article.title}</Text>
              <View style={styles.divider} />
            </View>

            {sentences.map((sentence, index) => renderSentenceBlock(sentence, index))}

            <TouchableOpacity style={styles.endSessionBtn} onPress={handleEndSession}>
              <Text style={styles.endSessionText}>Seansı Bitir</Text>
            </TouchableOpacity>

            <View style={styles.footerSpacer} />
          </ScrollView>
        ) : (
          <View style={styles.focusModeWrapper}>
            <FlatList
              ref={flatListRef}
              data={sentences}
              renderItem={renderFocusItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.focusContentContainer}
              snapToInterval={120}
              decelerationRate="fast"
              onScrollToIndexFailed={() => { }}
            />
          </View>
        )}

        <WordPopup
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onAddToList={handleAddWord}
        />

        <AudioPlayer
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          progress={audioProgress}
          isBookmarked={isCurrentBookmarked}
          isFocusMode={viewMode === 'focus'}
          onTogglePlayback={togglePlayback}
          onSkipForward={skipForward}
          onSkipBackward={skipBackward}
          onCycleSpeed={cycleSpeed}
          onToggleBookmark={toggleBookmark}
          onSeek={handleSliderSeek}
          onSeeking={handleSliderSeeking}
        />

        <SessionSummary
          visible={showSessionSummary}
          sessionDurationMs={Date.now() - sessionStartTime}
          wordCount={article.word_count}
          sentencesRead={activeSentenceIndex + 1}
          totalSentences={sentences.length}
          bookmarkedCount={bookmarkedSentences.size}
          wordsLookedUp={wordsLookedUp}
          onDifficultyFeedback={handleDifficultyFeedback}
          onContinue={handleSessionContinue}
          onClose={() => setShowSessionSummary(false)}
        />
      </SafeAreaView>
    </View>
  );
}

// ── STİLLER ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  focusContainer: {
    backgroundColor: '#F9F7F5',
  },
  safeArea: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 48,
    zIndex: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Colors.text.muted,
    letterSpacing: 3,
    opacity: 0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // TR Toggle (Çift Dil Modu)
  trToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,43,74,0.04)',
  },
  trToggleActive: {
    backgroundColor: Colors.accent.indigo,
  },
  // Reading Mode
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 160,
  },
  contentHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  categoryLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: Colors.accent.indigo,
    marginBottom: 8,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  title: {
    fontFamily: Typography.header,
    fontSize: 30,
    lineHeight: 33,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  divider: {
    width: 28,
    height: 1.2,
    backgroundColor: Colors.accent.warmGold,
    borderRadius: 1,
    opacity: 0.5,
    marginBottom: 24,
  },
  body: {
    marginTop: 0,
  },
  sentenceBlock: {
    marginBottom: 16,
    paddingLeft: 16,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderRadius: 4,
  },
  activeSentenceBlock: {
    borderLeftColor: 'rgba(216,176,122, 0.8)', // Işık süzmesi
    backgroundColor: 'rgba(216,176,122, 0.08)', // Hafif warm glow
  },
  bodyText: {
    fontFamily: Typography.body,
    fontSize: 17,
    lineHeight: 33,
    color: '#2D3A52',
    textAlign: 'left',
  },
  wordToken: {
    // Each word is individually tappable
  },
  // Çift Dil Çeviri Stilleri
  translationBlock: {
    marginTop: 8,
  },
  translationText: {
    fontFamily: Typography.body,
    fontSize: 14,
    lineHeight: 24,
    color: Colors.accent.warmGold,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  footerSpacer: {
    height: 40,
  },
  // Seansı Bitir
  endSessionBtn: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    marginBottom: 20,
  },
  endSessionText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  // Focus Mode
  focusModeWrapper: {
    flex: 1,
  },
  focusContentContainer: {
    paddingTop: height * 0.25,
    paddingBottom: height * 0.4,
    paddingHorizontal: 32,
  },
  focusItem: {
    minHeight: 100,
    justifyContent: 'center',
    marginBottom: 20,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
    position: 'relative',
  },
  activeFocusItem: {
    borderLeftColor: Colors.accent.warmGold,
  },
  bookmarkedFocusItem: {
    borderLeftColor: Colors.accent.lavender,
  },
  focusText: {
    fontFamily: Typography.header,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text.primary,
  },
  activeFocusText: {
    opacity: 1,
  },
  pastFocusText: {
    opacity: 0.35,
  },
  futureFocusText: {
    opacity: 0.45,
  },
  focusTranslation: {
    fontFamily: Typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.accent.warmGold,
    fontStyle: 'italic',
    marginTop: 10,
    opacity: 0.9,
  },
  bookmarkDot: {
    position: 'absolute',
    left: -4,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.warmGold,
  },
});
