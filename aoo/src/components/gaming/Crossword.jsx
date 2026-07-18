import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2,
  BookmarkPlus, CheckCircle, Trophy, Lightbulb
} from 'lucide-react';
import useGameWords from './useGameWords';

export default function Crossword() {
  const navigate = useNavigate();
  const { words, loading, savedSet, score, setScore, addToVocab } = useGameWords(10);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentWord = words[currentIdx];

  useEffect(() => {
    setInput('');
    setResult(null);
    setShowHint(false);
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

  const blanks = currentWord ? currentWord.word.replace(/[a-z]/gi, '_ ').trim() : '';

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
          <h2 className="text-2xl font-bold text-gradient mb-2">Crossword Complete!</h2>
          <p className="text-gray-400 mb-2">Score: <span className="text-purple-300 font-bold text-xl">{score}</span></p>
          <p className="text-xs text-gray-500 mb-6">Words saved: {savedSet.size}</p>
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
          <h2 className="text-lg font-bold text-gradient">Crossword</h2>
          <span className="text-sm text-gray-500">{currentIdx + 1} / {words.length} &middot; Score: {score}</span>
        </div>

        <p className="text-xs text-gray-400 mb-2">Clue:</p>
        <p className="text-sm text-white mb-6 italic">"{currentWord?.english_meaning || 'Guess the word'}"</p>

        <p className="text-xs text-gray-500 mb-3">Word ({currentWord?.word?.length || 0} letters):</p>
        <p className="text-lg font-mono tracking-[0.3em] text-purple-300 mb-6 text-center">{blanks}</p>

        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !result && check()}
            placeholder="Type answer..."
            className="input-premium flex-1 text-center text-lg"
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
              {result ? `Correct! +10 points` : `The answer was "${currentWord.word}"`}
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

        {result === null && (
          <button onClick={() => setShowHint(!showHint)} className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-purple-300 transition-colors">
            <Lightbulb size={12} /> {showHint ? 'Hide' : 'Show'} hint ({currentWord?.marathi_meaning ? 'Marathi: ' + currentWord.marathi_meaning : ''})
          </button>
        )}

        {showHint && currentWord?.marathi_meaning && (
          <p className="mt-1 text-xs text-purple-300/80">Marathi: {currentWord.marathi_meaning}</p>
        )}

        {result !== null && (
          <div className="mt-4">
            <button onClick={next} className="btn-premium w-full">{currentIdx + 1 >= words.length ? 'Finish' : 'Next Word'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
