import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpellCheck, RefreshCw, AlertCircle, Loader2, CheckCircle2,
  ArrowRight, TrendingUp, Clock, FileText,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import * as grammarApi from '../../api/grammar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mb-5 glow-purple">
        <SpellCheck className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Check your grammar</h3>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
        Paste or type any English text below and get instant grammar corrections, suggestions, and an improved version.
      </p>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">Check failed</h3>
      <p className="text-gray-500 text-sm mb-5">{message || 'Failed to check grammar.'}</p>
      <button onClick={onRetry} className="btn-secondary flex items-center gap-2 text-sm">
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </motion.div>
  );
}

function ScoreGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score || 0));
  const offset = circumference - (clamped / 100) * circumference;

  const getColor = () => {
    if (clamped >= 80) return '#22c55e';
    if (clamped >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = () => {
    if (clamped >= 80) return 'Great!';
    if (clamped >= 60) return 'Good';
    if (clamped >= 40) return 'Fair';
    return 'Needs work';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="text-3xl font-bold text-white"
          >
            {clamped}
          </motion.span>
          <span className="text-[10px] text-gray-500 mt-0.5">{getLabel()}</span>
        </div>
      </div>
    </div>
  );
}

function MistakesList({ mistakes }) {
  const [open, setOpen] = useState(true);

  if (!mistakes?.length) return null;

  const typeColors = {
    grammar: 'badge-amber',
    spelling: 'badge-red',
    punctuation: 'badge-amber',
    style: 'badge-blue',
    vocabulary: 'badge-purple',
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors"
      >
        <span>Mistakes ({mistakes.length})</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {mistakes.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 hover-lift"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`badge ${typeColors[m.type?.toLowerCase()] || 'badge-amber'}`}>
                    {m.type || 'grammar'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-400 line-through">{m.original || m.wrong || m.error}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="text-green-400 font-medium">{m.corrected || m.correction || m.fix}</span>
                </div>
                {m.explanation && (
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{m.explanation}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionsList({ suggestions }) {
  const [open, setOpen] = useState(true);

  if (!suggestions?.length) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors"
      >
        <span>Suggestions ({suggestions.length})</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 hover-lift"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 leading-relaxed">{s.suggestion || s.text || s}</p>
                    {s.reason && (
                      <p className="text-xs text-gray-500 mt-1">{s.reason}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryList({ history, onSelect }) {
  if (!history?.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Recent Checks
      </h3>
      <div className="space-y-2">
        {history.map((item, i) => {
          const text = item.text || item.original || item.input || '';
          return (
            <motion.button
              key={item._id || item.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(item)}
              className="w-full text-left p-3.5 rounded-xl glass-card hover-lift transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-300 truncate">
                    {text.slice(0, 80)}
                    {text.length > 80 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-500">
                      Score: {item.score ?? item.accuracy ?? '-'}
                    </span>
                    {item.createdAt && (
                      <span className="text-[10px] text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 rotate-[-90deg] shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function GrammarPage() {
  const [text, setText] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await grammarApi.getHistory();
      setHistory(data?.history || data?.data || []);
    } catch {
      // non-critical
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingHistory(true);
      try {
        const data = await grammarApi.getHistory();
        if (mounted) setHistory(data?.history || data?.data || []);
      } catch {
        // non-critical
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCheck = async () => {
    if (!text.trim() || checking) return;

    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const data = await grammarApi.checkGrammar(text);
      const res = data?.result || data?.data || data;
      setResult({
        original: text,
        corrected: res.corrected || res.correctedText || res.fixed || res.correction || '',
        score: res.score ?? res.accuracy ?? res.overallScore ?? 0,
        mistakes: res.mistakes || res.errors || res.corrections || [],
        suggestions: res.suggestions || res.tips || res.recommendations || [],
        advanced: res.advanced || res.advancedVersion || res.improved || '',
        explanation: res.explanation || res.summary || res.feedback || '',
      });
      loadHistory();
    } catch (err) {
      setError(err?.message || 'Failed to check grammar');
    } finally {
      setChecking(false);
    }
  };

  const handleSelectHistory = (item) => {
    setText(item.text || item.original || item.input || '');
    setResult({
      original: item.text || item.original || item.input || '',
      corrected: item.corrected || item.correctedText || item.fixed || '',
      score: item.score ?? item.accuracy ?? 0,
      mistakes: item.mistakes || item.errors || item.corrections || [],
      suggestions: item.suggestions || item.tips || [],
      advanced: item.advanced || item.advancedVersion || '',
      explanation: item.explanation || '',
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center glow-purple">
          <SpellCheck className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gradient">Grammar Checker</h1>
          <p className="text-xs text-gray-500">AI-powered grammar correction & improvement</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Enter your text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your English text here..."
              rows={8}
              className="input-premium resize-none min-h-[200px] leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                {text.split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                onClick={handleCheck}
                disabled={!text.trim() || checking}
                className="btn-premium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SpellCheck className="w-4 h-4" />
                )}
                {checking ? 'Checking...' : 'Check Grammar'}
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {checking && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-8"
              >
                <div className="glass-card px-6 py-4 flex items-center gap-3 text-sm text-purple-300">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your text...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ErrorState message={error} onRetry={handleCheck} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !checking && (
              <motion.div
                key="result"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                {result.explanation && (
                  <motion.div variants={itemVariants} className="glass-card p-5 text-sm text-gray-300 leading-relaxed border-l-4 border-l-purple-500/50">
                    {result.explanation}
                  </motion.div>
                )}

                {result.corrected && (
                  <motion.div variants={itemVariants}>
                    <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      Corrected Version
                    </h4>
                    <div className="glass-card p-5 text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                      {result.corrected}
                    </div>
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="space-y-3">
                  <MistakesList mistakes={result.mistakes} />
                  <SuggestionsList suggestions={result.suggestions} />
                </motion.div>

                {result.advanced && (
                  <motion.div variants={itemVariants}>
                    <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      Advanced Version
                    </h4>
                    <div className="glass-card p-5 text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                      {result.advanced}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !checking && !error && text.trim() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <p className="text-sm text-gray-500">Press <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium">Check Grammar</span> to analyze your text</p>
            </motion.div>
          )}

          {!text.trim() && !result && !checking && !error && (
            <EmptyState />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="glass-card p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 text-center">Grammar Score</h3>

            {result ? (
              <>
                <div className="flex justify-center mb-4">
                  <ScoreGauge score={result.score} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-lg font-bold text-white">{result.mistakes?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Mistakes</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-lg font-bold text-white">{result.suggestions?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Suggestions</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center mb-3">
                  <SpellCheck className="w-7 h-7 text-purple-400/60" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Check your text to see the grammar score and detailed analysis.
                </p>
              </div>
            )}

            {!loadingHistory && history.length > 0 && (
              <HistoryList history={history} onSelect={handleSelectHistory} />
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
