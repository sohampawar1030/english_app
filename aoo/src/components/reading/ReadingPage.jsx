import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked,
  Newspaper,
  Cpu,
  Globe,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  BookmarkPlus,
  Lightbulb,
  HelpCircle,
  ChevronRight,
  History,
  TrendingUp,
  Timer,
  X,
  Search,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as readingApi from '../../api/reading';
import * as wordsApi from '../../api/words';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const readingTypes = [
  { id: 'story', label: 'Daily Story', icon: BookMarked, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400', glow: 'glow-purple' },
  { id: 'article', label: 'AI Article', icon: Cpu, color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400', glow: 'glow-blue' },
  { id: 'technical', label: 'Technical Article', icon: Globe, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400', glow: 'glow-blue' },
  { id: 'news', label: 'News', icon: Newspaper, color: 'from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400', glow: 'glow-pink' },
];

function ShimmerBlock({ className }) {
  return <div className={`skeleton rounded-lg ${className || 'h-4 w-full'}`} />;
}

function EmptyState({ title, description, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-12 text-center"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 mb-4">
        <Icon className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ReadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <ShimmerBlock className="h-6 w-48 mb-4" />
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <ShimmerBlock className="h-10 w-36 rounded-xl" />
      </div>
      <div className="glass-card p-8">
        <ShimmerBlock className="h-6 w-3/4 mb-4" />
        <ShimmerBlock className="h-4 w-1/4 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShimmerBlock key={i} className={`h-4 ${i % 3 === 0 ? 'w-5/6' : i % 3 === 1 ? 'w-full' : 'w-4/6'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WordPopup({ word, data, loading, onClose, onAddVocab, onSpeak }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900/95 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl w-72"
      >
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-purple-400" />
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gray-900/95 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl w-72"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{word}</span>
            {data.part_of_speech && (
              <span className="badge badge-purple text-[10px] italic">{data.part_of_speech}</span>
            )}
          </div>
          {data.ipa_pronunciation && (
            <p className="text-xs text-gray-500 font-mono mt-0.5">{data.ipa_pronunciation}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onSpeak}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
          >
            <Volume2 size={13} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {data.marathi_meaning && (
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Marathi</p>
          <p className="text-purple-300 font-medium text-sm">{data.marathi_meaning}</p>
        </div>
      )}

      {data.english_meaning && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{data.english_meaning}</p>
      )}

      <button
        onClick={onAddVocab}
        disabled={data.in_vocabulary}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-200 w-full justify-center ${
          data.in_vocabulary
            ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer'
        }`}
      >
        {data.in_vocabulary ? (
          <><CheckCircle2 size={13} /> In Vocabulary</>
        ) : (
          <><BookmarkPlus size={13} /> Add to Vocabulary</>
        )}
      </button>
    </motion.div>
  );
}

export default function ReadingPage() {
  const [readingType, setReadingType] = useState('story');
  const [loading, setLoading] = useState(false);
  const [readingContent, setReadingContent] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordLookupLoading, setWordLookupLoading] = useState(false);
  const [savedWords, setSavedWords] = useState(new Set());
  const [readingTime, setReadingTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let interval;
    if (isReading) {
      interval = setInterval(() => setReadingTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isReading]);

  const loadHistory = async () => {
    try {
      const data = await readingApi.getReadings();
      setHistory(Array.isArray(data) ? data : data?.readings || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateReading = async () => {
    setLoading(true);
    setIsReading(true);
    setCompleted(false);
    setSelectedWord(null);
    setReadingTime(0);
    try {
      const data = await readingApi.generateReading({ type: readingType });
      setReadingContent({
        _id: data?._id || 'mock-' + Date.now(),
        title: data?.title || sampleTitles[readingType],
        content: data?.content || sampleContents[readingType],
        author: data?.author || 'English OS',
        date: data?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        questions: data?.questions || sampleQuestions,
      });
    } catch {
      setReadingContent({
        _id: 'mock-' + Date.now(),
        title: sampleTitles[readingType],
        content: sampleContents[readingType],
        author: 'English OS',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        questions: sampleQuestions,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = useCallback(async (word) => {
    const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!clean || clean.length < 2) return;

    if (selectedWord?.word === clean) {
      setSelectedWord(null);
      return;
    }

    setSelectedWord({ word: clean, data: null });
    setWordLookupLoading(true);

    try {
      const data = await wordsApi.lookupWord(clean);
      setSelectedWord({ word: clean, data });
    } catch {
      setSelectedWord({ word: clean, data: null });
    } finally {
      setWordLookupLoading(false);
    }
  }, [selectedWord]);

  const handleAddVocab = useCallback(async () => {
    if (!selectedWord?.data) return;
    const { word_id, word } = selectedWord.data;
    try {
      if (word_id) {
        await wordsApi.addToLearning(word_id);
      } else {
        await wordsApi.analyzeWord(word);
      }
      toast.success(`"${word}" added to vocabulary`);
      setSavedWords((prev) => new Set([...prev, word]));
      setSelectedWord((prev) => prev ? { ...prev, data: { ...prev.data, in_vocabulary: true } } : prev);
    } catch (err) {
      toast.error(err?.error || 'Failed to add word');
    }
  }, [selectedWord]);

  const handleSelectHistory = useCallback(async (item) => {
    setReadingContent({
      _id: item.id,
      title: item.title || 'Reading',
      content: item.content,
      type: item.reading_type,
      readingTime: item.reading_time_seconds || 0,
      completed: item.is_completed || false,
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
    });
    setCompleted(item.is_completed || false);
    setIsReading(true);
    setSelectedWord(null);
    setReadingTime(item.reading_time_seconds || 0);

    try {
      const data = await readingApi.getReading(item.id);
      if (data?.content) {
        setReadingContent((prev) => ({ ...prev, content: data.content }));
      }
    } catch {
      // use existing data
    }
  }, []);

  const markComplete = async () => {
    if (!readingContent) return;
    try {
      await readingApi.markComplete(readingContent._id);
    } catch {
      // silently handle
    }
    setIsReading(false);
    setCompleted(true);
    setReadingContent((prev) => prev ? { ...prev, completed: true } : prev);
    loadHistory();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderContent = (text) => {
    return text.split(' ').map((word, i) => {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      const isWordSelected = selectedWord?.word === clean.toLowerCase();
      const isSaved = savedWords.has(clean.toLowerCase());
      return (
        <span key={i} className="relative inline">
          <button
            onClick={() => handleWordClick(word)}
            className={`inline transition-all duration-150 rounded px-0.5 -mx-0.5 ${
              isWordSelected
                ? 'text-purple-400 bg-purple-500/20 glow-purple'
                : isSaved
                ? 'text-green-400 bg-green-500/10'
                : 'text-gray-300 hover:text-purple-400 hover:bg-purple-500/10'
            }`}
          >
            {word}
          </button>{' '}
        </span>
      );
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center glow-purple">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Reading Practice</h1>
            <p className="text-xs text-gray-500">Improve your reading comprehension with curated content</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-400 mb-2">Reading Type</label>
          <div className="flex flex-wrap gap-2.5">
            {readingTypes.map((rt) => {
              const Icon = rt.icon;
              const isSelected = readingType === rt.id;
              return (
                <motion.button
                  key={rt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setReadingType(rt.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                    isSelected
                      ? `bg-gradient-to-br ${rt.color} ${rt.glow}`
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {rt.label}
                </motion.button>
              );
            })}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateReading}
          disabled={loading}
          className="btn-premium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Reading'}
        </motion.button>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReadingSkeleton />
          </motion.div>
        )}

        {!loading && readingContent && (
          <motion.div
            key="reading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="glass-card p-8 md:p-10 relative">
              {isReading && (
                <div className="absolute top-5 right-5 flex items-center gap-2 text-xs text-gray-500 glass-strong px-3 py-1.5 rounded-full">
                  <Timer className="w-3 h-3 text-purple-400" />
                  {formatTime(readingTime)}
                </div>
              )}

              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <p className="badge badge-purple text-xs font-medium mb-3 capitalize">{readingType}</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                    {readingContent.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>By {readingContent.author}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{readingContent.date}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none leading-relaxed text-base text-gray-300 space-y-4">
                  {renderContent(readingContent.content)}
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Search className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <span>Click any word to see its definition</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={markComplete}
                    disabled={completed}
                    className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${
                      completed
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'btn-premium'
                    }`}
                  >
                    {completed ? (
                      <><CheckCircle2 className="w-4 h-4" /> Completed</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Mark as Complete</>
                    )}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {selectedWord && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedWord(null)}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <WordPopup
                        word={selectedWord.word}
                        data={selectedWord.data}
                        loading={wordLookupLoading}
                        onClose={() => setSelectedWord(null)}
                        onAddVocab={handleAddVocab}
                        onSpeak={() => {
                          if ('speechSynthesis' in window) {
                            const u = new SpeechSynthesisUtterance(selectedWord.word);
                            u.lang = 'en-US';
                            speechSynthesis.cancel();
                            speechSynthesis.speak(u);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {readingContent.questions && readingContent.questions.length > 0 && (
              <motion.div variants={itemVariants} className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Comprehension Questions</h3>
                </div>
                <div className="space-y-4">
                  {readingContent.questions.map((q, i) => (
                    <div key={i} className="glass-strong p-5 rounded-xl">
                      <p className="text-sm text-white font-medium mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mr-2">
                          {i + 1}
                        </span>
                        {q.question}
                      </p>
                      {q.options && (
                        <div className="space-y-2 ml-10">
                          {q.options.map((opt, oi) => (
                            <label
                              key={oi}
                              className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white/[0.02]"
                            >
                              <div className="w-4 h-4 rounded-full border border-white/[0.12] flex items-center justify-center">
                                <input
                                  type="radio"
                                  name={`q-${i}`}
                                  className="appearance-none w-2.5 h-2.5 rounded-full checked:bg-purple-500 checked:border-purple-500"
                                />
                              </div>
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Reading History</h2>
        </div>
        {historyLoading ? (
          <div className="glass-card p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ShimmerBlock key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            title="No Reading Yet"
            description="Generate your first reading to see your history here."
            icon={BookOpen}
          />
        ) : (
          <div className="glass-card divide-y divide-white/[0.04]">
            {history.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelectHistory(item)}
                className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.is_completed
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20'
                      : 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20'
                  }`}>
                    {item.is_completed
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <BookOpen className="w-4 h-4 text-purple-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title || 'Reading'}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="badge badge-purple text-[10px] capitalize">{item.reading_type || readingType}</span>
                      {item.reading_time_seconds ? (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.reading_time_seconds)}
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const sampleTitles = {
  story: 'The Garden of Forgotten Dreams',
  article: 'How Artificial Intelligence is Reshaping Education in 2026',
  technical: 'Understanding Serverless Architecture: A Comprehensive Guide',
  news: 'Global Climate Summit Reaches Historic Agreement on Emissions',
};

const sampleContents = {
  story: 'In a small village nestled between rolling green hills, there was a garden that no one remembered planting. The villagers walked past it every day on their way to the market, but not a single soul could recall when the first flower had bloomed there. It was as if the garden had simply decided to exist one morning, choosing to paint itself into the landscape like a quiet afterthought of nature itself.\n\nElena, a young botanist who had recently returned to her hometown, was the first to truly notice it. She stopped one afternoon, her arms full of groceries, and stared at the burst of colors that seemed almost impossible for the region\'s climate. There were roses in deep crimson, lilies pale as moonlight, and flowers she couldn\'t name—petals that shifted between blue and violet depending on how the light touched them.\n\n"Extraordinary," she whispered, setting down her bags and stepping closer. The air around the garden felt different—warmer, somehow, and filled with a fragrance that reminded her of her grandmother\'s kitchen. She reached out to touch a petal, and for just a moment, she could have sworn she heard someone laugh.\n\nThat evening, Elena began researching the history of the land. She dug through old records at the town hall, sifted through yellowed newspapers, and interviewed the eldest residents. What she discovered was a story that had been buried for generations—a story of love, loss, and a promise made under a sky full of stars.\n\nThe garden, she learned, had been planted by a woman named Clara Moreau in 1923. Clara had been a painter, and after her husband passed away in the war, she had channeled her grief into the earth. "I will grow something beautiful from this pain," she had told her neighbor. "Something that will outlast me."\n\nAnd she had. For sixty years, Clara tended to the garden, adding new species every spring, until her hands could no longer hold a trowel. When she passed, the town expected the garden to wither. But it didn... (line truncated to 2000 chars)',
  article: 'Artificial intelligence is no longer a futuristic concept confined to research laboratories. In 2026, it has become an integral part of how students learn, how teachers teach, and how educational institutions operate. From personalized tutoring systems to automated grading, AI is reshaping the educational landscape in profound and lasting ways.\n\nOne of the most significant developments has been the rise of adaptive learning platforms. These systems use machine learning algorithms to analyze a student\'s performance in real time, identifying strengths and weaknesses with remarkable accuracy. Unlike traditional one-size-fits-all approaches, adaptive platforms can tailor content to each individual learner, adjusting the difficulty level and presentation style to maximize comprehension and retention.\n\nConsider the case of Sophia, a high school student struggling with calculus. A year ago, she might have fallen further behind as her class moved on to new topics. Today, her AI tutor identifies the exact concepts she finds challenging—limits, derivatives, and integrals—and provides targeted practice exercises, video explanations, and interactive simulations. Sophia\'s confidence has grown alongside her understanding, and her test scores have improved by 40 percent.\n\nBut AI\'s impact extends beyond the classroom. Language learning applications now feature natural language processing capabilities that allow for real-time conversation practice with virtual partners. These systems can detect subtle errors in pronunciation, grammar, and word choice, providing instant feedback that was once only available from human tutors.\n\nCritics argue that increased reliance on AI could diminish the role of teachers and reduce human interaction in education. However, proponents counter that AI is not designed to replace educators but to augment their capabilities. By automating routine tasks such as grading and lesson planning, AI frees teachers to focus on what matters m... (line truncated to 2000 chars)',
  technical: 'Serverless architecture has emerged as one of the most transformative paradigms in cloud computing. By abstracting away infrastructure management, it allows developers to focus entirely on writing code that delivers business value. This comprehensive guide explores the core concepts, benefits, and trade-offs of serverless computing.\n\nAt its heart, serverless computing is an execution model where the cloud provider dynamically manages the allocation and provisioning of servers. Despite the name, servers are still involved—but developers no longer need to think about them. Functions are executed in stateless containers that are triggered by events, and billing is based solely on actual consumption rather than pre-provisioned capacity.\n\nThe primary building block of serverless applications is the Function-as-a-Service (FaaS) model. AWS Lambda, Azure Functions, and Google Cloud Functions are the most prominent examples. These services allow you to deploy individual functions that respond to HTTP requests, database changes, file uploads, or scheduled events.\n\nOne of the most compelling advantages of serverless is auto-scaling. Traditional architectures require careful capacity planning to handle traffic spikes. With serverless, scaling is handled automatically by the provider. Your function can run once or a million times in parallel—the infrastructure adapts instantly.\n\nHowever, serverless is not without its challenges. Cold starts—the latency incurred when a function is invoked after being idle—can impact performance for latency-sensitive applications. Various mitigation strategies exist, including provisioned concurrency, keeping functions warm, and optimizing dependency sizes.\n\nAnother important consideration is state management. Since serverless functions are stateless by design, persistent state must be stored externally using services like DynamoDB, Redis, or traditional databases. This architectural shift requires developers to rethink how... (line truncated to 2000 chars)',
  news: 'In a landmark development that environmental leaders are calling "the most significant climate agreement in a decade," delegates from 195 nations have unanimously adopted a comprehensive framework to accelerate the global transition to renewable energy and achieve net-zero emissions by 2050.\n\nThe agreement, reached after two weeks of intensive negotiations at the Global Climate Summit in Geneva, establishes legally binding targets for reducing greenhouse gas emissions, with intermediate milestones set for 2030 and 2040. Developed nations have committed to providing $500 billion annually in climate finance to support developing countries in their transition efforts.\n\n"This is not just a piece of paper," declared United Nations Secretary-General Amara Osei in her closing address. "This is a contract between generations. Our children and grandchildren will judge us not by our words, but by our actions in the years ahead."\n\nThe key provisions of the agreement include a 60 percent reduction in global carbon emissions by 2035 relative to 2025 levels, a phased elimination of fossil fuel subsidies by 2028, and mandatory carbon pricing mechanisms in all signatory countries by 2030.\n\nPerhaps most notably, the agreement includes a groundbreaking "Loss and Damage" fund that will provide financial assistance to nations most vulnerable to climate change impacts. The fund, initially capitalized at $200 billion, will support infrastructure adaptation, disaster response, and community relocation efforts.\n\nReaction from the business community has been cautiously optimistic. The Global Business Coalition for Climate issued a statement supporting the agreement while urging governments to provide clear regulatory frameworks to guide private sector investment.\n\n"We stand ready to invest trillions in clean energy infrastructure," said coalition director James Chen. "What we need is policy certainty, and this agreement provides exactly that."\n\nCritics, however, argue... (line truncated to 2000 chars)',
};

const sampleQuestions = [
  { question: 'What is the main theme of this passage?', options: ['Environmental conservation', 'Personal growth through discovery', 'Technological innovation', 'Historical preservation'] },
  { question: 'Which of the following best describes the author\'s tone?', options: ['Critical and skeptical', 'Informative and reflective', 'Humorous and lighthearted', 'Formal and academic'] },
  { question: 'What can be inferred from the third paragraph?', options: ['The main character regrets her decision', 'The setting has significant emotional meaning', 'Technology plays a central role', 'The story takes place in the future'] },
];
