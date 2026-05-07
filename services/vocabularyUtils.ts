const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'can',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'his',
  'in',
  'is',
  'it',
  'its',
  'just',
  'many',
  'more',
  'not',
  'of',
  'on',
  'or',
  'our',
  'she',
  'so',
  'that',
  'the',
  'their',
  'them',
  'these',
  'they',
  'this',
  'to',
  'was',
  'we',
  'when',
  'which',
  'while',
  'with',
  'you',
  'your',
]);

export const normalizeVocabularyWord = (value: string) => {
  return value
    .replace(/[^a-zA-Z'-]/g, '')
    .replace(/^['-]+|['-]+$/g, '')
    .replace(/'s$/i, '')
    .toLowerCase();
};

export const isVocabularyCandidate = (word: string) => {
  const normalized = normalizeVocabularyWord(word);
  return normalized.length > 2 && !STOP_WORDS.has(normalized);
};

export const uniqueVocabularyWords = (words: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  words.forEach((word) => {
    const normalized = normalizeVocabularyWord(word);
    if (!isVocabularyCandidate(normalized) || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
};

export const extractImportantWordsFromSentences = (sentences: string[], limit = 24) => {
  const stats = new Map<string, { count: number; firstIndex: number; length: number }>();
  let tokenIndex = 0;

  sentences.forEach((sentence) => {
    sentence.split(/\s+/).forEach((token) => {
      const word = normalizeVocabularyWord(token);
      if (!isVocabularyCandidate(word)) {
        tokenIndex += 1;
        return;
      }

      const current = stats.get(word);
      if (current) {
        current.count += 1;
      } else {
        stats.set(word, {
          count: 1,
          firstIndex: tokenIndex,
          length: word.length,
        });
      }
      tokenIndex += 1;
    });
  });

  return Array.from(stats.entries())
    .sort(([, a], [, b]) => {
      const scoreA = a.count * 12 + Math.min(a.length, 12) - a.firstIndex * 0.01;
      const scoreB = b.count * 12 + Math.min(b.length, 12) - b.firstIndex * 0.01;
      return scoreB - scoreA;
    })
    .slice(0, limit)
    .map(([word]) => word);
};
