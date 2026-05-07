import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

const QUESTIONS: Question[] = [
  { id: 1, text: "I ___ a student.", options: ["am", "is", "are", "be"], correctAnswer: 0 },
  { id: 2, text: "She ___ to the gym every day.", options: ["go", "goes", "going", "is go"], correctAnswer: 1 },
  { id: 3, text: "Yesterday, we ___ to the cinema.", options: ["go", "gone", "went", "going"], correctAnswer: 2 },
  { id: 4, text: "Have you ever ___ sushi?", options: ["eat", "ate", "eaten", "eating"], correctAnswer: 2 },
  { id: 5, text: "If it rains, I ___ at home.", options: ["stay", "would stay", "staying", "will stay"], correctAnswer: 3 },
  { id: 6, text: "The book ___ by a famous author.", options: ["wrote", "was written", "is write", "writing"], correctAnswer: 1 },
  { id: 7, text: "I wish I ___ more free time.", options: ["have", "will have", "had", "having"], correctAnswer: 2 },
  { id: 8, text: "She asked me what time ___.", options: ["is it", "it is", "was it", "it was"], correctAnswer: 3 },
  { id: 9, text: "By this time next year, I ___ my degree.", options: ["will finish", "will have finished", "am finishing", "finish"], correctAnswer: 1 },
  { id: 10, text: "Scarcely ___ the door when the phone rang.", options: ["I had opened", "I opened", "had I opened", "did I open"], correctAnswer: 2 },
];

interface PlacementTestProps {
  onComplete: (level: string) => void;
}

export default function PlacementTest({ onComplete }: PlacementTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  const handleOptionSelect = (selectedIndex: number) => {
    const isCorrect = selectedIndex === QUESTIONS[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Test bitti, seviye belirle
      const finalScore = score + (isCorrect ? 1 : 0);
      let level = 'A1';
      if (finalScore >= 9) level = 'C1';
      else if (finalScore >= 7) level = 'B2';
      else if (finalScore >= 5) level = 'B1';
      else if (finalScore >= 3) level = 'A2';
      
      onComplete(level);
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>Soru {currentQuestionIndex + 1} / 10</Text>
      
      <Animated.View 
        key={currentQuestion.id} 
        entering={FadeInRight.duration(400)} 
        exiting={FadeOutLeft.duration(400)}
        style={styles.questionContainer}
      >
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleOptionSelect(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  progressText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  questionContainer: {
    width: '100%',
  },
  questionText: {
    fontFamily: Typography.header,
    fontSize: 28,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: Colors.secondarySurface,
    borderRadius: Spacing.radiusLarge,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 16,
    color: Colors.text.primary,
  },
});
