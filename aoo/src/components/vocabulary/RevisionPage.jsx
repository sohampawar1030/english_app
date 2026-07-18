import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Flame, Volume2,
  RotateCcw, Loader2, Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as wordsApi from '../../api/words';

function ShimmerBlock({ className }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

function StarRating({ score, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            i < score ? 'bg-purple-400 shadow-sm shadow-purple-400/50' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

function speakWord(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
}

const ratingConfig = {
  again: { label: 'Again', color: 'badge-red', hoverBg: 'hover:bg-red-500/20', multiplier: 0, icon: RotateCcw },
  hard: { label: 'Hard', color: 'badge-amber', hoverBg: 'hover:bg-orange-500/20', multiplier: 1, icon: Target },
  good: { label: 'Good', color: 'badge-green', hoverBg: 'hover:bg-green-500/20', multiplier: 2, icon: Brain },
  easy: { label: 'Easy', color: 'badge-blue', hoverBg: 'hover:bg-blue-500/20', multiplier: 3, icon: Zap },
};

export default function RevisionPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ revised: 0, streak: 0, memoryScore: 0, correctCount: 0, totalReviewed: 0 });
  const [slideDirection, setSlideDirection] = useState(1);

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['revision-words'],
    queryFn: wordsApi.getRevisionWords,
    retry: 1,
    staleTime: 30000,
  });

  const words = Array.isArray(rawData) ? rawData : rawData?.words || [];
  const currentWord = words[currentIndex];
  const totalWords = words.length;
  const queryError = error?.message || '';

  const handleRating = async (rating) => {
    if (!currentWord?._id && !currentWord?.id) return;
    setActionLoading(true);
    const wordId = currentWord._id || currentWord.id;
    const config = ratingConfig[rating];
    const responseTime = 5000 + currentIndex * 500;

    try {
      await wordsApi.reviewWord(wordId, {
        rating,
        confidence: config.multiplier + 1,
        responseTime: Math.round(responseTime),
      });

      setStats((prev) => ({
        ...prev,
        revised: prev.revised + 1,
        streak: rating === 'again' ? 0 : prev.streak + 1,
        correctCount: rating !== 'again' ? prev.correctCount + 1 : prev.correctCount,
        totalReviewed: prev.totalReviewed + 1,
        memoryScore: Math.min(100, prev.memoryScore + (rating === 'easy' ? 8 : rating === 'good' ? 5 : rating === 'hard' ? 2 : -3)),
      }));
    } catch {
      toast.error('Failed to record review');
      return;
    } finally {
      setActionLoading(false);
    }

    setSlideDirection(1);
    setTimeout(() => {
      setShowAnswer(false);
      if (currentIndex + 1 >= totalWords) {
        setSessionComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 250);
  };

  const handleShowAnswer = () => {
    speakWord(currentWord?.word);
    setShowAnswer(true);
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setStats({ revised: 0, streak: 0, memoryScore: 0, correctCount: 0, totalReviewed: 0 });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto anim-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <ShimmerBlock className="h-8 w-44" />
            <ShimmerBlock className="h-4 w-28 mt-2" />
          </div>
          <ShimmerBlock className="h-10 w-32" />
        </div>
        <div className="glass-card p-8">
          <div className="flex flex-col items-center gap-4">
            <ShimmerBlock className="h-6 w-40" />
            <ShimmerBlock className="h-10 w-56" />
            <ShimmerBlock className="h-6 w-32" />
            <ShimmerBlock className="h-12 w-64 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto anim-fade-in-up">
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Brain size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load</h2>
          <p className="text-gray-400 mb-6">{queryError}</p>
          <button onClick={() => refetch()} className="btn-premium">Try Again</button>
        </div>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto anim-fade-in-up">
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Brain size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">All Revised!</h2>
          <p className="text-gray-400 mb-6">No words due for revision. Great job!</p>
          <button onClick={() => refetch()} className="btn-premium">Check Again</button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy = stats.totalReviewed > 0
      ? Math.round((stats.correctCount / stats.totalReviewed) * 100)
      : 0;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl glow-purple"
          >
            <Brain size={40} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Revision Complete!</h2>
          <p className="text-gray-400 mb-6">You revised {stats.revised} words</p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-purple-400">{stats.revised}</p>
              <p className="text-xs text-gray-500 mt-1">Revised</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-yellow-400">{accuracy}%</p>
              <p className="text-xs text-gray-500 mt-1">Accuracy</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-orange-400">{stats.streak}</p>
              <p className="text-xs text-gray-500 mt-1">Streak</p>
            </div>
          </div>
          <button onClick={resetSession} className="btn-premium flex items-center gap-2 mx-auto">
            <RotateCcw size={16} />
            Start New Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Revision</h1>
          <p className="text-sm text-gray-400 mt-1">Spaced repetition review</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{stats.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Target size={16} className="text-purple-400" />
            <span className="text-sm text-gray-300">{stats.revised}/{totalWords}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Brain size={16} className="text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Memory Score</p>
            <p className="text-sm font-bold text-white">{stats.memoryScore}%</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Zap size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-sm font-bold text-white">{stats.revised}/{totalWords}</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Flame size={16} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Streak</p>
            <p className="text-sm font-bold text-white">{stats.streak}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="progress-bar">
          <motion.div
            className="progress-bar-fill"
            animate={{ width: `${totalWords > 0 ? (stats.revised / totalWords) * 100 : 0}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5 text-center">
          {stats.revised}/{totalWords} words revised
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord._id || currentWord.id || currentIndex}
          initial={{ opacity: 0, x: slideDirection * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDirection * -60 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="glass-card hover-lift p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0" />

            {currentWord.difficulty && (
              <div className="mb-4">
                <span className={`badge ${
                  currentWord.difficulty === 'easy' ? 'badge-green' :
                  currentWord.difficulty === 'medium' ? 'badge-amber' :
                  'badge-red'
                }`}>
                  {currentWord.difficulty}
                </span>
              </div>
            )}

            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
              {currentWord.word}
            </h2>
            {currentWord.phonetic && (
              <p className="text-lg text-gray-400 font-mono mb-4">{currentWord.phonetic}</p>
            )}

            <button
              onClick={() => speakWord(currentWord.word)}
              className="btn-ghost inline-flex items-center gap-2 mb-6"
            >
              <Volume2 size={18} />
              <span className="text-sm">Listen</span>
            </button>

            {currentWord.partOfSpeech && (
              <div className="mb-6">
                <span className="badge badge-blue">{currentWord.partOfSpeech}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showAnswer ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-3 max-w-md mx-auto">
                    {currentWord.meanings?.english && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">English</p>
                        <p className="text-white font-medium">{currentWord.meanings.english}</p>
                      </div>
                    )}
                    {currentWord.meanings?.marathi && (
                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Marathi</p>
                        <p className="text-purple-300 font-medium">{currentWord.meanings.marathi}</p>
                      </div>
                    )}
                    {currentWord.meanings?.hindi && (
                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hindi</p>
                        <p className="text-orange-300 font-medium">{currentWord.meanings.hindi}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <p className="text-xs text-gray-500 mb-3">How well did you remember?</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {Object.entries(ratingConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <motion.button
                            key={key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRating(key)}
                            disabled={actionLoading}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${config.color} ${config.hoverBg} disabled:opacity-50`}
                          >
                            {actionLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Icon size={16} />
                            )}
                            {config.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="show-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    onClick={handleShowAnswer}
                    className="btn-premium flex items-center gap-2 mx-auto px-8"
                  >
                    <Brain size={18} />
                    Show Answer
                  </button>
                  <p className="text-xs text-gray-500 mt-4">
                    Try to recall the meaning before revealing
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>Memory: <StarRating score={Math.min(5, Math.ceil((currentWord.confidence || 2) / 2))} /></span>
                {currentWord.revisionCount !== undefined && (
                  <span>Reviews: {currentWord.revisionCount}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
