import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, BookmarkPlus, CheckCircle, Trophy, Timer, Keyboard
} from 'lucide-react';
import useGameWords from './useGameWords';

export default function TypingChallenge() {
  const navigate = useNavigate();
  const { words, loading, savedSet, score, setScore, addToVocab } = useGameWords(15);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);

  const currentWord = words[currentIdx];
  const isCorrect = currentWord && typed.toLowerCase() === currentWord.word.toLowerCase();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentIdx]);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!typed.trim()) return;
      if (isCorrect) {
        setScore((s) => s + 10);
      } else {
        setErrors((e) => e + 1);
      }
      if (currentIdx + 1 >= words.length) {
        setFinished(true);
      } else {
        setCurrentIdx((i) => i + 1);
      }
      setTyped('');
    }
  };

  const handleStart = () => {
    setStartTime(Date.now());
    setElapsed(0);
    if (inputRef.current) inputRef.current.focus();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (!startTime) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('/games')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
            <Keyboard size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gradient mb-2">Typing Challenge</h2>
          <p className="text-sm text-gray-400 mb-6">Type each word as fast as you can. Press Space or Enter to submit.</p>
          <button onClick={handleStart} className="btn-premium">Start Typing</button>
        </motion.div>
      </div>
    );
  }

  if (finished) {
    const wpm = elapsed > 0 ? Math.round((words.length / elapsed) * 60) : 0;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-2">Challenge Complete!</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-card p-3"><p className="text-lg font-bold text-purple-400">{score}</p><p className="text-[10px] text-gray-500">Score</p></div>
            <div className="glass-card p-3"><p className="text-lg font-bold text-green-400">{wpm}</p><p className="text-[10px] text-gray-500">WPM</p></div>
            <div className="glass-card p-3"><p className="text-lg font-bold text-red-400">{errors}</p><p className="text-[10px] text-gray-500">Errors</p></div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Words saved: {savedSet.size}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setCurrentIdx(0); setFinished(false); setStartTime(null); setErrors(0); setScore(0); }} className="btn-premium">Try Again</button>
            <button onClick={() => navigate('/games')} className="btn-secondary">Back</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/games')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Timer size={12} /> {elapsed}s</span>
          <span>{currentIdx + 1}/{words.length}</span>
          <span>Score: <span className="text-purple-300">{score}</span></span>
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8 text-center">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-sm text-gray-500 mb-2">Type this word:</p>
          <p className="text-3xl sm:text-4xl font-bold text-gradient tracking-wide">{currentWord?.word}</p>
          {currentWord?.marathi_meaning && (
            <p className="text-xs text-purple-300/60 mt-2">{currentWord.marathi_meaning}</p>
          )}
        </motion.div>

        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type here & press Space..."
          className="input-premium w-full text-center text-xl tracking-wider mb-4"
          autoComplete="off"
          autoFocus
        />

        {isCorrect && typed.length > 0 && (
          <p className="text-xs text-green-400">Correct! Press Space/Enter for next word</p>
        )}

        {!savedSet.has(currentWord?.word) && isCorrect && (
          <button onClick={() => addToVocab(currentWord)} className="mt-2 flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors mx-auto">
            <BookmarkPlus size={12} /> Add "{currentWord.word}" to Vocabulary
          </button>
        )}

        {savedSet.has(currentWord?.word) && isCorrect && (
          <p className="mt-2 text-xs text-green-400 flex items-center gap-1 justify-center"><CheckCircle size={12} /> In vocabulary</p>
        )}
      </div>
    </div>
  );
}
