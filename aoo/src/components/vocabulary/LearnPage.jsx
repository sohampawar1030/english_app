import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Sparkles, Volume2, CheckCircle2,
  ChevronDown, ChevronUp, Loader2, Languages, Building2,
  Clock, History, Compass, Briefcase, GraduationCap,
  ChevronRight, MessageSquare, Star, Zap, AlertCircle, X, BookmarkPlus, BookmarkCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as wordsApi from '../../api/words';

function speakWord(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
}

function WordPopup({ word, data, loading, onClose, onAddVocab, added }) {
  if (loading) {
    return (
      <div className="glass-strong p-6 rounded-2xl w-[320px] sm:w-[360px] text-center">
        <Loader2 size={24} className="animate-spin text-purple-400 mx-auto" />
        <p className="text-sm text-gray-400 mt-3">Looking up...</p>
      </div>
    );
  }

  const meaning = data?.marathi_meaning;
  const source = data?.found ? '📖 Dictionary' : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-strong p-5 rounded-2xl w-[320px] sm:w-[360px] shadow-2xl border border-white/[0.08]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{word}</span>
          {data?.ipa_pronunciation && (
            <span className="text-xs text-gray-500 font-mono">{data.ipa_pronunciation}</span>
          )}
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-gray-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {data?.part_of_speech && (
        <span className="badge badge-purple mb-3 inline-block">{data.part_of_speech}</span>
      )}

      {meaning ? (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-3">
          <p className="text-sm text-purple-300 font-medium">{meaning}</p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-gray-500/10 border border-gray-500/20 mb-3">
          <p className="text-sm text-gray-400">No dictionary entry found</p>
        </div>
      )}

      {data?.english_meaning && (
        <p className="text-xs text-gray-500 mb-3">{data.english_meaning}</p>
      )}

      {source && (
        <p className="text-[10px] text-gray-600 mb-3">{source}</p>
      )}

      {data?.word_id && (
        <button
          onClick={() => onAddVocab(data)}
          disabled={added}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            added
              ? 'bg-emerald-500/10 text-emerald-400 cursor-not-allowed'
              : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/20'
          }`}
        >
          {added ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
          {added ? 'Added to Vocabulary' : 'Add to Vocabulary'}
        </button>
      )}
    </motion.div>
  );
}

function SentenceCard({ sentence, index, onWordClick }) {
  const words = sentence.english.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group p-3 sm:p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-purple-500/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm text-white leading-relaxed">
            {words.map((w, i) => {
              const clean = w.replace(/[^a-zA-Z]/g, '');
              if (!clean || clean.length < 2) {
                return <span key={i}>{w} </span>;
              }
              return (
                <span key={i}>
                  <button
                    onClick={() => onWordClick(clean)}
                    className="inline transition-colors duration-150 rounded px-0.5 -mx-0.5 text-white hover:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                    title="Click for meaning"
                  >
                    {w}
                  </button>{' '}
                </span>
              );
            })}
          </p>
          <p className="text-xs text-purple-300/70 leading-relaxed">{sentence.marathi}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TenseSection({ title, icon: Icon, gradient, tenseData, defaultOpen, onWordClick }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!tenseData?.sentences?.length) return null;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
            <Icon size={18} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {tenseData.usageExplanation && (
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{tenseData.usageExplanation}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"
        >
          <ChevronDown size={14} className="text-gray-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
              {tenseData.sentences.map((s, i) => (
                <SentenceCard key={i} sentence={s} index={i} onWordClick={onWordClick} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WordHero({ analysis, wordId }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] via-transparent to-pink-500/[0.04]" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/[0.04] rounded-full blur-3xl" />
      <div className="absolute inset-0 rounded-2xl border border-white/[0.04]" />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="badge badge-purple">{analysis.partOfSpeech || 'Word'}</span>
              {analysis.ipaPronunciation && (
                <span className="text-xs text-gray-500 font-mono">{analysis.ipaPronunciation}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{analysis.word}</h1>
              <button
                onClick={() => speakWord(analysis.word)}
                className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-purple-400 transition-all hover-lift"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <p className="text-base text-purple-300/80 font-medium">{analysis.marathiMeaning}</p>
            <p className="text-sm text-gray-400">{analysis.englishMeaning}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSaved(true);
                toast.success(`"${analysis.word}" added to your vocabulary!`, {
                  icon: <CheckCircle2 className="text-emerald-400" size={20} />,
                });
              }}
              disabled={saved}
              className={`btn-premium flex items-center gap-2 ${saved ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {saved ? (
                <CheckCircle2 size={16} className="text-emerald-300" />
              ) : (
                <Star size={16} />
              )}
              {saved ? 'Saved!' : 'Save to Vocabulary'}
            </button>
          </div>
        </div>

        {analysis.whenToUse && (
          <div className="mt-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-2 mb-2">
              <Compass size={14} className="text-purple-400" />
              <span className="text-xs font-semibold text-white">When to use this word</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{analysis.whenToUse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearnPage() {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [wordId, setWordId] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const [popupWord, setPopupWord] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [addedWords, setAddedWords] = useState(new Set());

  const handleWordClick = useCallback(async (clickedWord) => {
    const clean = clickedWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!clean || clean.length < 2) return;

    if (popupWord === clean) {
      setPopupWord(null);
      setPopupData(null);
      return;
    }

    setPopupWord(clean);
    setPopupData(null);
    setPopupLoading(true);

    try {
      const data = await wordsApi.lookupWordLocal(clean);
      setPopupData(data);
    } catch {
      setPopupData({ word: clean, found: false, marathi_meaning: null });
    } finally {
      setPopupLoading(false);
    }
  }, [popupWord]);

  const handleAddVocab = useCallback(async (data) => {
    if (!data?.word_id) return;
    try {
      await wordsApi.addToLearning(data.word_id);
      setAddedWords((prev) => new Set(prev).add(data.word));
      toast.success(`"${data.word}" added to vocabulary!`);
    } catch {
      toast.error('Failed to add word');
    }
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const trimmed = word.trim();
    if (!trimmed) return;
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setPopupWord(null);
    setPopupData(null);

    try {
      const result = await wordsApi.analyzeWord(trimmed);
      setAnalysis(result.analysis);
      setWordId(result.wordId);
    } catch (err) {
      const msg = err?.error || err?.message || 'Failed to analyze word. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-3">
          <BookOpen size={28} />
          Learn New Words
        </h1>
        <p className="text-sm text-gray-500">Type any English word to get its complete analysis with Marathi translations. Click any word in sentences to see its meaning.</p>
      </motion.div>

      {/* Search Bar */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleSearch}
        className="relative"
      >
        <div className="relative glass-card !p-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={word}
              onChange={(e) => { setWord(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Type any English word (e.g., 'abundance', 'negotiate', 'pivot')..."
              className="w-full bg-transparent border-none outline-none text-white text-sm sm:text-base pl-11 pr-4 py-3.5 placeholder:text-gray-600"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !word.trim()}
            className="btn-premium flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span className="hidden sm:inline">{loading ? 'Analyzing...' : 'Analyze'}</span>
          </button>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-red-400 flex items-center gap-1.5 px-1"
          >
            <AlertCircle size={12} />
            {error}
          </motion.p>
        )}
      </motion.form>

      {/* Loading State */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analyning "{word}"...</h3>
            <p className="text-sm text-gray-500">Generating comprehensive word analysis with tense examples and Marathi translations</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="skeleton h-2 w-32 rounded-full" />
              <div className="skeleton h-2 w-24 rounded-full" />
              <div className="skeleton h-2 w-28 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word Click Popup */}
      <AnimatePresence>
        {popupWord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
            onClick={() => { setPopupWord(null); setPopupData(null); }}
          >
            <WordPopup
              word={popupWord}
              data={popupData}
              loading={popupLoading}
              onClose={() => { setPopupWord(null); setPopupData(null); }}
              onAddVocab={handleAddVocab}
              added={addedWords.has(popupWord)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && !analysis && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 sm:p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg">
            <Search size={36} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Search any English word</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Get instant comprehensive analysis including Marathi translations, real-life and corporate examples, and tense-wise usage sentences.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-sm mx-auto">
            {['abundance', 'negotiate', 'pivot', 'scrutiny', 'leverage', 'diligent'].map((w) => (
              <button
                key={w}
                onClick={() => { setWord(w); setAnalysis(null); setTimeout(() => { handleSearch({ preventDefault: () => {} }); }, 50); }}
                className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-500/20 text-xs text-gray-400 hover:text-purple-300 transition-all"
              >
                {w}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {analysis && !loading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Word Hero */}
            <WordHero analysis={analysis} wordId={wordId} />

            {/* Real Life Sentences */}
            {analysis.realLifeSentences?.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                      <MessageSquare size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Real-Life Sentences</h3>
                      <p className="text-[11px] text-gray-500">Everyday usage examples with Marathi translation. Click any word to see its meaning.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-2">
                  {analysis.realLifeSentences.map((s, i) => (
                    <SentenceCard key={i} sentence={s} index={i} onWordClick={handleWordClick} />
                  ))}
                </div>
              </div>
            )}

            {/* Corporate Sentences */}
            {analysis.corporateSentences?.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                      <Briefcase size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Corporate & Professional Sentences</h3>
                      <p className="text-[11px] text-gray-500">Business and workplace usage with Marathi translation. Click any word to see its meaning.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-2">
                  {analysis.corporateSentences.map((s, i) => (
                    <SentenceCard key={i} sentence={s} index={i} onWordClick={handleWordClick} />
                  ))}
                </div>
              </div>
            )}

            {/* Tense Sections */}
            {analysis.presentTense?.sentences?.length > 0 && (
              <TenseSection
                title="Present Tense Usage"
                icon={Clock}
                gradient="from-amber-500 to-orange-600"
                tenseData={analysis.presentTense}
                defaultOpen={true}
                onWordClick={handleWordClick}
              />
            )}
            {analysis.pastTense?.sentences?.length > 0 && (
              <TenseSection
                title="Past Tense Usage"
                icon={History}
                gradient="from-violet-500 to-purple-600"
                tenseData={analysis.pastTense}
                defaultOpen={false}
                onWordClick={handleWordClick}
              />
            )}
            {analysis.futureTense?.sentences?.length > 0 && (
              <TenseSection
                title="Future Tense Usage"
                icon={Compass}
                gradient="from-rose-500 to-pink-600"
                tenseData={analysis.futureTense}
                defaultOpen={false}
                onWordClick={handleWordClick}
              />
            )}

            {/* Search Again */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-600">
                Want to learn another word? Type above and search again.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}