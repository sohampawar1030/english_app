import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as wordsApi from '../../api/words';

export default function useGameWords(count = 10) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedSet, setSavedSet] = useState(new Set());
  const [score, setScore] = useState(0);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wordsApi.getWords({ limit: count });
      const list = data?.words || [];
      setWords(list);
    } catch {
      const fallback = [
        { word: 'beautiful', english_meaning: 'pleasing the senses', marathi_meaning: 'सुंदर' },
        { word: 'important', english_meaning: 'of great significance', marathi_meaning: 'महत्वाचे' },
        { word: 'different', english_meaning: 'not the same', marathi_meaning: 'वेगळे' },
        { word: 'necessary', english_meaning: 'required', marathi_meaning: 'आवश्यक' },
        { word: 'possible', english_meaning: 'able to be done', marathi_meaning: 'शक्य' },
      ];
      setWords(fallback);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const addToVocab = useCallback(async (word) => {
    if (savedSet.has(word)) return;
    try {
      if (word.id) {
        await wordsApi.addToLearning(word.id);
      } else {
        await wordsApi.analyzeWord(word.word || word);
      }
      setSavedSet((prev) => new Set([...prev, word.word || word]));
      toast.success(`"${word.word || word}" added to vocabulary`);
    } catch (err) {
      toast.error(err?.error || 'Failed to add word');
    }
  }, [savedSet]);

  return { words, loading, savedSet, score, setScore, addToVocab, fetchWords };
}
