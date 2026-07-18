import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shuffle, CheckCircle2, XCircle, Loader2,
  BookmarkPlus, CheckCircle, Trophy
} from 'lucide-react';
import useGameWords from './useGameWords';

function shuffle(str) {
  const a = str.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('');
}

export default function WordPuzzle() {
  const navigate = useNavigate();
  const { words, loading, savedSet, score, setScore, addToVocab } = useGameWords(10);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentWord = words[currentIdx];
  const scrambled = useMemo(() => currentWord ? shuffle(currentWord.word) : '', [currentWord]);

  useEffect(() => {
    setInput('');
    setResult(null);
    setShowAnswer(false);
  }, [currentIdx]);

  const check = () => {
    if (!input.trim()) return;
    const correct = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setResult(correct);
    if (correct) setScore((s) => s + 10);
  };

  const next = () => {
    if (currentIdx + 1 >= words.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-2">Game Over!</h2>
          <p className="text-gray-400 mb-2">Score: <span className="text-purple-300 font-bold text-xl">{score}</span></p>
          <p className="text-xs text-gray-500 mb-6">Words learned: {savedSet.size}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setCurrentIdx(0); setFinished(false); setScore(0); }} className="btn-premium">Play Again</button>
            <button onClick={() => navigate('/games')} className="btn-secondary">Back to Games</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/games')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gradient">Word Puzzle</h2>
          <span className="text-sm text-gray-500">{currentIdx + 1} / {words.length} &middot; Score: {score}</span>
        </div>

        <p className="text-xs text-gray-500 mb-4">Unscramble the letters to form a word</p>

        <motion.div
          key={scrambled}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center gap-2 sm:gap-3 mb-6 flex-wrap"
        >
          {scrambled.split('').map((ch, i) => (
            <span key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-lg font-bold text-purple-300 uppercase">
              {ch}
            </span>
          ))}
        </motion.div>

        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !result && check()}
            placeholder="Type the word..."
            className="input-premium flex-1 text-center text-lg tracking-wider"
            disabled={!!result}
          />
          {!result && (
            <button onClick={check} disabled={!input.trim()} className="btn-premium px-6">Check</button>
          )}
        </div>

        <AnimatePresence>
          {result !== null && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`p-3 rounded-xl flex items-center gap-2 text-sm ${result ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {result ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {result ? `Correct! +10 points` : `Wrong! The word was "${currentWord.word}"`}
            </motion.div>
          )}
        </AnimatePresence>

        {result !== null && !savedSet.has(currentWord.word) && (
          <motion.button initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => addToVocab(currentWord)} className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all">
            <BookmarkPlus size={13} /> Add "{currentWord.word}" to Vocabulary
          </motion.button>
        )}

        {result !== null && savedSet.has(currentWord.word) && (
          <p className="mt-3 text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> In vocabulary</p>
        )}

        {result !== null && (
          <div className="mt-4 flex gap-2">
            <button onClick={next} className="btn-premium flex-1">{currentIdx + 1 >= words.length ? 'Finish' : 'Next Word'}</button>
            {!showAnswer && result === false && (
              <button onClick={() => setShowAnswer(true)} className="btn-secondary">Show Meaning</button>
            )}
          </div>
        )}

        {showAnswer && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-xs text-purple-300"><span className="font-medium">{currentWord.word}</span> — {currentWord.marathi_meaning || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{currentWord.english_meaning}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
