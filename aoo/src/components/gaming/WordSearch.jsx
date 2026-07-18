import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, BookmarkPlus, CheckCircle, Trophy, Search
} from 'lucide-react';
import useGameWords from './useGameWords';

const GRID = 10;

function placeWord(grid, word) {
  const dirs = [[0,1],[1,0],[1,1]];
  for (let attempt = 0; attempt < 50; attempt++) {
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const row = Math.floor(Math.random() * (GRID - (dir[0] ? word.length : 0)));
    const col = Math.floor(Math.random() * (GRID - (dir[1] ? word.length : 0)));
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dir[0], c = col + i * dir[1];
      if (grid[r][c] && grid[r][c] !== word[i].toUpperCase()) { ok = false; break; }
    }
    if (ok) {
      for (let i = 0; i < word.length; i++) {
        grid[row + i * dir[0]][col + i * dir[1]] = word[i].toUpperCase();
      }
      return { word, row, col, dir, found: false };
    }
  }
  return null;
}

export default function WordSearch() {
  const navigate = useNavigate();
  const { words, loading, savedSet, addToVocab, fetchWords } = useGameWords(8);
  const [found, setFound] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [finished, setFinished] = useState(false);

  const { grid, placements } = useMemo(() => {
    if (!words.length) return { grid: [], placements: [] };
    const g = Array.from({ length: GRID }, () => Array(GRID).fill(null));
    const p = [];
    for (const w of words) {
      const placed = placeWord(g, w.word);
      if (placed) p.push(placed);
    }
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (!g[r][c]) g[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    return { grid: g, placements: p };
  }, [words]);

  const handleCellClick = (r, c) => {
    if (finished) return;
    const key = `${r}-${c}`;
    if (selected.some((s) => s[0] === r && s[1] === c)) return;
    const next = [...selected, [r, c]];
    setSelected(next);
    const word = next.map(([rr, cc]) => grid[rr][cc]).join('');
    for (const p of placements) {
      if (found.has(p.word)) continue;
      const dir = p.dir;
      let built = '';
      for (let i = 0; i < p.word.length; i++) {
        built += grid[p.row + i * dir[0]][p.col + i * dir[1]];
      }
      if (built === word || built === word.toUpperCase()) {
        setFound((prev) => {
          const n = new Set([...prev, p.word]);
          if (n.size === placements.length) setTimeout(() => setFinished(true), 500);
          return n;
        });
        setSelected([]);
        return;
      }
    }
    if (next.length > 8) setSelected([]);
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
      <button onClick={() => navigate('/games')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gradient">Word Search</h2>
          <span className="text-sm text-gray-500">{found.size} / {placements.length} found</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {placements.map((p) => (
            <span key={p.word} className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${found.has(p.word) ? 'bg-green-500/15 text-green-400 line-through' : 'bg-white/5 text-gray-500'}`}>
              {p.word}
            </span>
          ))}
        </div>

        <div className="grid gap-0.5 mx-auto" style={{ width: `${GRID * 36}px` }}>
          {grid.map((row, r) => row.map((ch, c) => {
            const isSelected = selected.some(([rr, cc]) => rr === r && cc === c);
            const isFound = placements.some((p) => {
              if (!found.has(p.word)) return false;
              for (let i = 0; i < p.word.length; i++) {
                if (p.row + i * p.dir[0] === r && p.col + i * p.dir[1] === c) return true;
              }
              return false;
            });
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded text-xs font-mono font-bold transition-all ${
                  isFound ? 'bg-green-500/20 text-green-400' :
                  isSelected ? 'bg-purple-500/30 text-purple-300 scale-110' :
                  'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {ch}
              </button>
            );
          }))}
        </div>
      </div>

      {finished && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Trophy size={28} className="text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-gradient mb-3">All Words Found!</h3>
          <div className="space-y-2">
            {placements.map((p) => {
              const w = words.find((x) => x.word === p.word);
              return (
                <div key={p.word} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{p.word}</p>
                    <p className="text-xs text-gray-500">{w?.marathi_meaning || ''}</p>
                  </div>
                  {!savedSet.has(p.word) ? (
                    <button onClick={() => addToVocab(w || p.word)} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                      <BookmarkPlus size={12} /> Save
                    </button>
                  ) : (
                    <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Saved</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => { fetchWords(); setFound(new Set()); setFinished(false); }} className="btn-premium">New Puzzle</button>
            <button onClick={() => navigate('/games')} className="btn-secondary">Back</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
