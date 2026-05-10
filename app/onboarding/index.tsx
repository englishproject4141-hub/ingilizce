import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  BackHandler, 
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withRepeat,
  ZoomIn,
  FadeIn,
} from 'react-native-reanimated';
import { StepIndicator } from '../../components/Onboarding/StepIndicator';
import { Check, ChevronRight, GraduationCap, Target, User } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { userService } from '../../services/userService';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  { id: 'name', title: 'Seni Tanıyalım', description: 'Adını girelim.' },
  { id: 'level', title: 'Seviye Seçimi', description: 'İngilizce seviyenizi belirleyelim.' },
  { id: 'interests', title: 'İlgi Alanları', description: 'Sevdiğiniz konuları seçin.' },
  { id: 'goals', title: 'Hedef Belirleme', description: 'Günlük hedefinizi koyun.' },
  { id: 'result', title: 'Sonuç', description: 'Hazırsınız!' },
];

const LEVELS = [
  { id: 'A1', label: 'A1 - Başlangıç', desc: 'Temel ifadeler ve basit cümleler.' },
  { id: 'A2', label: 'A2 - Temel', desc: 'Günlük konular ve basit iletişim.' },
  { id: 'B1', label: 'B1 - Orta', desc: 'Tanıdık konularda ana fikirleri anlama.' },
  { id: 'B2', label: 'B2 - Üst Orta', desc: 'Karmaşık metinlerin ana fikirlerini anlama.' },
  { id: 'C1', label: 'C1 - İleri', desc: 'Uzun ve zorlu metinleri anlama.' },
];

const GOALS = [
  { id: 10, label: 'Hafif', desc: 'Günde 10 dakika' },
  { id: 20, label: 'Düzenli', desc: 'Günde 20 dakika' },
  { id: 30, label: 'Ciddi', desc: 'Günde 30 dakika' },
  { id: 60, label: 'Yoğun', desc: 'Günde 60 dakika' },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('B1');
  const [selectedGoal, setSelectedGoal] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const router = useRouter();

  const translateX = useSharedValue(0);
  const shakeTranslateX = useSharedValue(0);

  // ── Geri tuşunu engelle
  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // ── Google Auth'tan isim pre-fill
  useEffect(() => {
    const prefill = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.full_name) {
          setDisplayName(user.user_metadata.full_name);
        } else if (user?.user_metadata?.name) {
          setDisplayName(user.user_metadata.name);
        }
      } catch (e) {
        // Sessizce devam et — pre-fill opsiyonel
      }
    };
    prefill();
  }, []);

  const getNextLevel = (level: string) => {
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const idx = order.indexOf(level);
    return idx < order.length - 1 ? order[idx + 1] : order[idx];
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      await userService.updateUserProfile(user.id, {
        display_name: displayName.trim(),
        current_level: selectedLevel,
        target_level: getNextLevel(selectedLevel),
        interests: selectedInterests,
        daily_goal_minutes: selectedGoal,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Profil kaydedilemedi:', e);
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    // Adım 0: İsim kontrolü (en az 2 karakter)
    if (currentStep === 0 && displayName.trim().length < 2) {
      setNameError(true);
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Adım 2: İlgi alanı kontrolü (en az 1)
    if (currentStep === 2 && selectedInterests.length === 0) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      translateX.value = withTiming(-(currentStep + 1) * width, { duration: 400 });
      setCurrentStep(prev => prev + 1);
      setNameError(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      saveProfile();
    }
  };

  const shake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 50 }), 5, true),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(prev => prev.filter(i => i !== id));
    } else {
      setSelectedInterests(prev => [...prev, id]);
    }
    Haptics.selectionAsync();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <StepIndicator totalSteps={5} currentStep={currentStep} />
      </View>

      <Animated.View style={[styles.stepsContainer, animatedContainerStyle]}>
        {/* Step 0: İsim Girişi */}
        <View style={styles.step}>
          <Animated.View entering={FadeIn.delay(200)} style={styles.nameIconContainer}>
            <User size={32} color={Colors.accent.warmGold} strokeWidth={1.5} />
          </Animated.View>
          <Text style={styles.title}>Seni Tanıyalım</Text>
          <Text style={styles.description}>Sana nasıl hitap edelim?</Text>
          
          <View style={styles.nameInputWrapper}>
            <TextInput
              style={[
                styles.nameInput,
                nameError && styles.nameInputError,
                displayName.length > 0 && styles.nameInputFilled,
              ]}
              placeholder="Adın ve soyadın"
              placeholderTextColor={Colors.text.muted}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (text.trim().length >= 2) setNameError(false);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={nextStep}
              maxLength={50}
            />
            {nameError && (
              <Text style={styles.nameErrorText}>En az 2 karakter girin</Text>
            )}
          </View>
        </View>

        {/* Step 1: Level Selection */}
        <View style={styles.step}>
          <Text style={styles.title}>Seviyenizi Seçin</Text>
          <Text style={styles.description}>Hangi seviyede olduğunuzu düşünüyorsunuz?</Text>
          <View style={styles.optionsList}>
            {LEVELS.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.optionItem,
                  selectedLevel === item.id && styles.optionItemSelected
                ]}
                onPress={() => {
                  setSelectedLevel(item.id);
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.optionIcon}>
                  <GraduationCap size={20} color={selectedLevel === item.id ? Colors.accent.warmGold : Colors.text.muted} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, selectedLevel === item.id && styles.optionLabelSelected]}>{item.label}</Text>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </View>
                {selectedLevel === item.id && <Check size={20} color={Colors.accent.warmGold} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2: Interests */}
        <View style={styles.step}>
          <Text style={styles.title}>İlgi Alanlarınız</Text>
          <Text style={styles.description}>Size özel içerikler önermemiz için en az 1 konu seçin.</Text>
          <View style={styles.interestsGrid}>
            {['Teknoloji', 'Spor', 'Müzik', 'Bilim', 'Sanat', 'Ekonomi', 'Sinema', 'Seyahat', 'Mutfak', 'Kişisel Gelişim'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[
                  styles.interestItem,
                  selectedInterests.includes(item) && styles.interestItemSelected
                ]}
                onPress={() => toggleInterest(item)}
              >
                <Text style={[
                  styles.interestText,
                  selectedInterests.includes(item) && styles.interestTextSelected
                ]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 3: Goals */}
        <View style={styles.step}>
          <Text style={styles.title}>Günlük Hedef</Text>
          <Text style={styles.description}>Her gün ne kadar vakit ayırabilirsiniz?</Text>
          <View style={styles.optionsList}>
            {GOALS.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.optionItem,
                  selectedGoal === item.id && styles.optionItemSelected
                ]}
                onPress={() => {
                  setSelectedGoal(item.id);
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.optionIcon}>
                  <Target size={20} color={selectedGoal === item.id ? Colors.accent.warmGold : Colors.text.muted} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, selectedGoal === item.id && styles.optionLabelSelected]}>{item.label}</Text>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </View>
                {selectedGoal === item.id && <Check size={20} color={Colors.accent.warmGold} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 4: Result */}
        <View style={styles.step}>
          <View style={styles.resultContainer}>
            <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
              <Check size={48} color={Colors.accent.green} strokeWidth={2.5} />
            </Animated.View>
            <Text style={styles.title}>Hoş geldin, {displayName.split(' ')[0]}!</Text>
            <Text style={styles.description}>
              {selectedLevel} seviyesine uygun içeriklerin hazırlandı.{'\n'}Günde {selectedGoal} dakika ile başlıyoruz.
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        {currentStep === 2 && selectedInterests.length === 0 && (
          <Text style={styles.errorText}>En az 1 konu seçin</Text>
        )}
        <Animated.View style={shakeStyle}>
          <TouchableOpacity 
            style={[
              styles.button,
              currentStep === 4 && { backgroundColor: Colors.text.primary }
            ]} 
            onPress={nextStep}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {currentStep === 4 ? 'Başlayalım' : 'Devam Et'}
                </Text>
                <ChevronRight color="#FFF" size={20} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: Spacing.outer,
  },
  stepsContainer: {
    flexDirection: 'row',
    width: width * 5,
    flex: 1,
  },
  step: {
    width: width,
    paddingHorizontal: Spacing.outer,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.header,
    fontSize: 32,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: Typography.body,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  // ── NAME INPUT
  nameIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nameInputWrapper: {
    width: '100%',
    paddingHorizontal: 8,
  },
  nameInput: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.text.primary,
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  nameInputFilled: {
    borderColor: Colors.accent.warmGold,
    backgroundColor: '#FFFDF9',
  },
  nameInputError: {
    borderColor: '#E57373',
    backgroundColor: '#FFF5F5',
  },
  nameErrorText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: '#E57373',
    textAlign: 'center',
    marginTop: 8,
  },

  // ── OPTIONS
  optionsList: {
    width: '100%',
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  optionItemSelected: {
    borderColor: Colors.accent.warmGold,
    backgroundColor: '#FFFDF9',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.accent.warmGold,
  },
  optionDesc: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.text.muted,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  interestItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  interestItemSelected: {
    backgroundColor: Colors.text.primary,
    borderColor: Colors.text.primary,
  },
  interestText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  interestTextSelected: {
    color: '#FFFFFF',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footer: {
    padding: Spacing.outer,
    paddingBottom: 60,
  },
  button: {
    backgroundColor: Colors.accent.warmGold,
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Typography.bodySemiBold,
  },
  errorText: {
    fontFamily: Typography.bodySemiBold,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
  },
});
