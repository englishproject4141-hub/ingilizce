import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  BackHandler, 
  Dimensions 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withRepeat,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { StepIndicator } from '../../components/Onboarding/StepIndicator';
import PlacementTest from '../../components/Onboarding/PlacementTest';
import { Check, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  { id: 'level', title: 'Seviye Testi', description: 'Dil seviyenizi belirleyelim.' },
  { id: 'interests', title: 'İlgi Alanları', description: 'Sevdiğiniz konuları seçin.' },
  { id: 'goals', title: 'Hedef Belirleme', description: 'Günlük hedefinizi koyun.' },
  { id: 'result', title: 'Sonuç', description: 'Hazırsınız!' },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [userLevel, setUserLevel] = useState<string>('A1');
  const router = useRouter();

  const translateX = useSharedValue(0);
  const shakeTranslateX = useSharedValue(0);

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const nextStep = () => {
    if (currentStep === 1 && selectedInterests.length === 0) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      translateX.value = withTiming(-(currentStep + 1) * width, { duration: 400 });
      setCurrentStep(prev => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (currentStep === 2) {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Auto progress logic as per supplement.js
        }, 1000);
      }
    } else {
      router.replace('/(tabs)');
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <StepIndicator totalSteps={4} currentStep={currentStep} />
      </View>

      <Animated.View style={[styles.stepsContainer, animatedContainerStyle]}>
        {/* Step 1: Level Test */}
        <View style={styles.step}>
          <PlacementTest onComplete={(level) => {
            setUserLevel(level);
            nextStep();
          }} />
        </View>

        {/* Step 2: Interests */}
        <View style={styles.step}>
          <Text style={styles.title}>İlgi Alanlarınızı Seçin</Text>
          <Text style={styles.description}>Size özel içerikler önermemiz için en az 1 konu seçin.</Text>
          <View style={styles.interestsGrid}>
            {['Teknoloji', 'Spor', 'Müzik', 'Bilim', 'Sanat', 'Ekonomi'].map((item) => (
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
          <Text style={styles.description}>Günde kaç kelime öğrenmek istersiniz?</Text>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>[Hedef Seçici]</Text>
          </View>
        </View>

        {/* Step 4: Result */}
        <View style={styles.step}>
          <View style={styles.resultContainer}>
            <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
              <Check size={48} color={Colors.accent.green} strokeWidth={2.5} />
            </Animated.View>
            <Text style={styles.title}>{userLevel} Seviyesindesin!</Text>
            <Text style={styles.description}>Profilin hazırlandı. Harika bir yolculuğa hazır ol.</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        {currentStep === 1 && selectedInterests.length === 0 && (
          <Text style={styles.errorText}>En az 1 konu seçin</Text>
        )}
        {currentStep !== 0 && (
          <Animated.View style={shakeStyle}>
            <TouchableOpacity 
              style={[
                styles.button,
                currentStep === 3 && { backgroundColor: Colors.text.primary }
              ]} 
              onPress={nextStep}
            >
              <Text style={styles.buttonText}>
                {currentStep === 3 ? 'Başlayalım' : 'Devam Et'}
              </Text>
              <ChevronRight color="#FFF" size={20} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
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
    width: width * 4,
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
    marginBottom: 48,
  },
  placeholderCard: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.secondarySurface,
    borderRadius: Spacing.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: Typography.bodyMedium,
    color: Colors.text.muted,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  interestItem: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
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
    fontSize: 15,
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
