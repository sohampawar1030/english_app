import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, BookmarkPlus, CheckCircle, Trophy, Brain
} from 'lucide-react';
import useGameWords from './useGameWords';

export default function MemoryCards() {
  const navigate = useNavigate();
  const { words, loading, savedSet, addToVocab, fetchWords } = useGameWords(6);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);

  const cards = useMemo(() => {
    if (!words.length) return [];
    const c = [];
    words.forEach((w, i) => {
      c.push({ id: `w${i}`, pairId: i, type: 'word', text: w.word, word: w });
      c.push({ id: `m${i}`, pairId: i, type: 'meaning', text: w.marathi_meaning || w.english_meaning || '?', word: w });
    });
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  }, [words]);

  useEffect(() => {
    if (selected.length === 2) {
      const [a, b] = selected;
      if (a.pairId === b.pairId && a.id !== b.id) {
        setMatched((prev) => new Set([...prev, a.pairId]));
        setSelected([]);
      } else {
        const timer = setTimeout(() => { setSelected([]); setFlipped((prev) => { const n = new Set(prev); n.delete(a.id); n.delete(b.id); return n; }); }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [selected]);

  useEffect(() => {
    if (matched.size > 0 && matched.size === words.length) {
      setTimeout(() => setFinished(true), 500);
    }
  }, [matched, words]);

  const handleFlip = (card) => {
    if (finished) return;
    if (flipped.has(card.id) || matched.has(card.pairId) || selected.length >= 2) return;
    setFlipped((prev) => new Set([...prev, card.id]));
    setSelected((prev) => [...prev, card]);
    setMoves((m) => m + 1);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/games')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-sm text-gray-500">Moves: {moves} &middot; Matched: {matched.size}/{words.length}</span>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-gradient mb-4 text-center">Match Word & Meaning</h2>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto">
          {cards.map((card) => {
            const isFlipped = flipped.has(card.id) || matched.has(card.pairId);
            const isMatched = matched.has(card.pairId);
            return (
              <motion.button
                key={card.id}
                onClick={() => handleFlip(card)}
                whileTap={{ scale: 0.95 }}
                className={`h-20 sm:h-24 rounded-xl text-xs font-medium transition-all border ${
                  isMatched ? 'bg-green-500/15 border-green-500/30 cursor-default' :
                  isFlipped ? 'bg-purple-500/15 border-purple-500/30' :
                  'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isFlipped ? (
                    <motion.div key="front" initial={{ opacity: 0, rotateY: 180 }} animate={{ opacity: 1, rotateY: 0 }} className="flex flex-col items-center justify-center h-full px-1">
                      <span className={`font-bold ${card.type === 'word' ? 'text-sm text-purple-300' : 'text-[10px] text-gray-300'}`}>
                        {card.text}
                      </span>
                      {isMatched && <CheckCircle size={12} className="text-green-400 mt-1" />}
                    </motion.div>
                  ) : (
                    <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full">
                      <Brain size={20} className="text-gray-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {finished && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Trophy size={28} className="text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-gradient mb-3">All Matched!</h3>
            <p className="text-sm text-gray-400 mb-4">Completed in {moves} moves</p>
            <div className="space-y-2 mb-4 max-w-sm mx-auto">
              {words.map((w) => (
                <div key={w.word} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{w.word}</p>
                    <p className="text-xs text-gray-500">{w.marathi_meaning || w.english_meaning}</p>
                  </div>
                  {!savedSet.has(w.word) ? (
                    <button onClick={() => addToVocab(w)} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0">
                      <BookmarkPlus size={12} /> Save
                    </button>
                  ) : (
                    <span className="text-xs text-green-400 flex items-center gap-1 shrink-0"><CheckCircle size={12} /> Saved</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { fetchWords(); setFlipped(new Set()); setMatched(new Set()); setSelected([]); setMoves(0); setFinished(false); }} className="btn-premium">New Game</button>
              <button onClick={() => navigate('/games')} className="btn-secondary">Back</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
