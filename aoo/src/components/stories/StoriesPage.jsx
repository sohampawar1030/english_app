import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Clock, Heart, ChevronLeft, ChevronRight,
  Bookmark, Loader2, AlertCircle, RefreshCw,
  Trash2, MessageSquareText, FileText, X, Volume2, BookmarkPlus, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as storiesApi from '../../api/stories';
import * as wordsApi from '../../api/words';

const difficulties = [
  { label: 'Beginner', color: 'badge-green' },
  { label: 'Intermediate', color: 'badge-amber' },
  { label: 'Advanced', color: 'badge-red' },
];

function getDifficulty(d) {
  const found = difficulties.find((x) => x.label.toLowerCase() === d?.toLowerCase());
  return found || difficulties[0];
}

function ShimmerBlock({ className }) {
  return (
    <div className={`skeleton rounded-xl ${className || ''}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <ShimmerBlock className="h-10 w-40" />
        <ShimmerBlock className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <ShimmerBlock className="h-5 w-3/4" />
            <ShimmerBlock className="h-4 w-1/2" />
            <ShimmerBlock className="h-4 w-1/3" />
            <div className="flex gap-2">
              <ShimmerBlock className="h-6 w-20 rounded-full" />
              <ShimmerBlock className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onGenerate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
        <BookOpen className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">No stories yet</h3>
      <p className="text-gray-500 max-w-sm mb-6">
        Generate your first AI-powered story to practice reading and learn new vocabulary.
      </p>
      <button onClick={onGenerate} className="btn-premium flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Generate Your First Story
      </button>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-1">Something went wrong</h3>
      <p className="text-gray-500 text-sm mb-5 max-w-sm">{message || 'Failed to load stories.'}</p>
      <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </motion.div>
  );
}

function BookOpeningLoader({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <motion.div
        animate={{ rotateY: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5"
      >
        <BookOpen className="w-10 h-10 text-purple-400" />
      </motion.div>
      <p className="text-purple-300 text-sm font-medium">{message || 'Crafting your story...'}</p>
      <div className="flex gap-1 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            className="w-2 h-2 rounded-full bg-purple-400"
          />
        ))}
      </div>
    </motion.div>
  );
}

function WordPopup({ word, data, loading, onClose, onAddVocab, onSpeak }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        className="glass-strong p-5 rounded-2xl border border-purple-500/20 shadow-xl w-72 sm:w-80"
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
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="glass-strong p-5 rounded-2xl border border-purple-500/20 shadow-xl w-72 sm:w-80"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{data.word}</span>
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

function VocabularyWord({ word, meaning, onClick, isHighlighted }) {
  return (
    <span
      onClick={() => onClick?.(word)}
      className={`inline-block cursor-pointer transition-all duration-200 border-b border-dashed mx-0.5 ${
        isHighlighted
          ? 'text-purple-300 border-purple-500 bg-purple-500/10 rounded px-0.5'
          : 'text-purple-300 border-purple-500/40 hover:bg-purple-500/10 hover:rounded hover:px-0.5'
      }`}
      title={meaning}
    >
      {word}
    </span>
  );
}

function highlightText(text, vocabulary, onWordClick) {
  if (!vocabulary?.length) {
    return <span className="text-gray-200 leading-relaxed whitespace-pre-line">{text}</span>;
  }

  const sorted = [...vocabulary].sort((a, b) => b.word.length - a.word.length);
  const parts = [];
  let remaining = text;

  while (remaining.length > 0) {
    let found = null;
    for (const v of sorted) {
      const regex = new RegExp(`\\b${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const match = remaining.match(regex);
      if (match && match.index === 0) {
        found = { word: v.word, meaning: v.meaning || v.definition || '', match: match[0] };
        break;
      }
    }

    if (found) {
      parts.push(
        <VocabularyWord
          key={`vw-${parts.length}`}
          word={found.match}
          meaning={found.meaning}
          onClick={onWordClick}
          isHighlighted
        />
      );
      remaining = remaining.slice(found.match.length);
    } else {
      const spaceIdx = remaining.search(/\s/);
      if (spaceIdx === -1) {
        parts.push(<span key={`t-${parts.length}`}>{remaining}</span>);
        break;
      } else {
        parts.push(<span key={`t-${parts.length}`}>{remaining.slice(0, spaceIdx + 1)}</span>);
        remaining = remaining.slice(spaceIdx + 1);
      }
    }
  }

  return <span className="leading-relaxed whitespace-pre-line">{parts}</span>;
}

function GrammarExplanation({ items }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (!items?.length) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
        <MessageSquareText className="w-4 h-4" />
        Grammar Explanations
      </h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="glass-card rounded-xl overflow-hidden cursor-pointer"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-gray-200 font-medium">{item.title || item.rule}</span>
              <ChevronRight
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  openIdx === i ? 'rotate-90' : ''
                }`}
              />
            </div>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 text-sm text-gray-400 leading-relaxed border-t border-white/10 pt-2">
                    {item.explanation || item.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeTab, setActiveTab] = useState('english');
  const [wordLookup, setWordLookup] = useState(null);
  const [wordLookupLoading, setWordLookupLoading] = useState(false);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storiesApi.getStories();
      setStories(data?.stories || data?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWordClick = useCallback(async (word) => {
    const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!clean || clean.length < 2) return;

    setWordLookup({ word: clean });
    setWordLookupLoading(true);

    try {
      const data = await wordsApi.lookupWord(clean);
      setWordLookup({ word: clean, data });
    } catch {
      setWordLookup({ word: clean, error: true });
    } finally {
      setWordLookupLoading(false);
    }
  }, []);

  const handleAddVocab = useCallback(async () => {
    if (!wordLookup?.data) return;
    const { word_id, word } = wordLookup.data;
    try {
      if (word_id) {
        await wordsApi.addToLearning(word_id);
      } else {
        await wordsApi.analyzeWord(word);
      }
      toast.success(`"${word}" added to vocabulary`);
      setWordLookup((prev) => prev ? { ...prev, data: { ...prev.data, in_vocabulary: true } } : prev);
    } catch (err) {
      toast.error(err?.error || 'Failed to add word');
    }
  }, [wordLookup]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await storiesApi.getStories();
        if (mounted) setStories(data?.stories || data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to load stories');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await storiesApi.generateStory({});
      const story = data?.story || data?.data || data;
      if (story?._id || story?.id) {
        setStories((prev) => [story, ...prev]);
        setSelectedStory(story);
      }
    } catch (err) {
      setError(err?.message || 'Failed to generate story');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      const data = await storiesApi.toggleFavorite(id);
      setStories((prev) =>
        prev.map((s) => {
          if ((s._id || s.id) === id) {
            const updated = data?.story || data?.data || data;
            return { ...s, isFavorite: updated?.isFavorite ?? !s.isFavorite };
          }
          return s;
        })
      );
      if (selectedStory && (selectedStory._id || selectedStory.id) === id) {
        setSelectedStory((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
      }
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await storiesApi.deleteStory(id);
      setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
      if (selectedStory && (selectedStory._id || selectedStory.id) === id) {
        setSelectedStory(null);
      }
    } catch {
      // silently fail
    }
  };

  const handleSelectStory = async (story) => {
    setSelectedStory(story);
    setActiveTab('english');
    setWordLookup(null);
    try {
      const data = await storiesApi.getStory(story._id || story.id);
      if (data?.story || data?.data) {
        setSelectedStory(data.story || data.data);
      }
    } catch {
      // use existing data
    }
  };

  const readingTime = (text) => {
    if (!text) return 1;
    return Math.max(1, Math.ceil(text.split(' ').length / 200));
  };

  const wordCount = (text) => {
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gradient mb-6">AI Stories</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !stories.length && !generating) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gradient mb-6">AI Stories</h1>
        <ErrorState message={error} onRetry={loadStories} />
      </div>
    );
  }

  const storyDetail = selectedStory;
  const vocabulary = storyDetail?.vocabulary || storyDetail?.vocab || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-gradient"
        >
          AI Stories
        </motion.h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={generating}
          className="btn-premium flex items-center gap-2 disabled:opacity-60"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating ? 'Generating...' : 'Generate Story'}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {generating && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BookOpeningLoader message="Crafting your story..." />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`flex-1 min-w-0 ${selectedStory ? 'lg:w-2/5' : ''}`}>
          {!stories.length && !generating ? (
            <EmptyState onGenerate={handleGenerate} />
          ) : (
            <div className={`grid gap-4 ${selectedStory ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {stories.map((story) => {
                const id = story._id || story.id;
                const title = story.title || 'Untitled';
                const diff = getDifficulty(story.difficulty || story.level);
                const text = story.content || story.story || story.text || '';
                const wc = wordCount(text);
                const rt = readingTime(text);
                const isFav = story.isFavorite;

                return (
                  <motion.div
                    key={id}
                    layoutId={`story-${id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleSelectStory(story)}
                    className="glass-card hover-lift p-5 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <h3 className="font-semibold text-gray-200 truncate">{title}</h3>
                      </div>
                      <button
                        onClick={(e) => handleToggleFavorite(e, id)}
                        className="shrink-0 ml-2"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isFav ? 'text-red-400 fill-red-400' : 'text-gray-600 hover:text-red-400'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {text.slice(0, 150)}...
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${diff.color}`}>{diff.label}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {rt} min
                      </span>
                      <span className="text-xs text-gray-500">{wc} words</span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, id)}
                      className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-400" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedStory && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:w-3/5 shrink-0"
            >
              <div className="glass-strong p-6 lg:p-8 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getDifficulty(storyDetail.difficulty || storyDetail.level).color}`}>
                      {storyDetail.difficulty || storyDetail.level || 'Beginner'}
                    </span>
                    <button onClick={(e) => handleToggleFavorite(e, storyDetail._id || storyDetail.id)}>
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          storyDetail.isFavorite ? 'text-red-400 fill-red-400' : 'text-gray-600 hover:text-red-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-gradient mb-4"
                >
                  {storyDetail.title || 'Untitled Story'}
                </motion.h2>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-6">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {wordCount(storyDetail.content || storyDetail.story || storyDetail.text || '')} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {readingTime(storyDetail.content || storyDetail.story || storyDetail.text || '')} min read
                  </span>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                  {['english', 'marathi', 'hindi'].map((tab) => {
                    const labels = { english: 'English', marathi: 'मराठी', hindi: 'हिन्दी' };
                    const hasContent = tab === 'english' || storyDetail[`${tab}Translation`] || storyDetail[`${tab}Content`];
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        disabled={!hasContent}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeTab === tab
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'text-gray-500 border border-transparent hover:text-gray-300'
                        } ${!hasContent ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                <div className="mb-6 leading-relaxed text-gray-200 relative">
                  {activeTab === 'english' ? (
                    highlightText(
                      storyDetail.content || storyDetail.story || storyDetail.text || '',
                      vocabulary,
                      handleWordClick
                    )
                  ) : (
                    <p className="text-gray-200 leading-relaxed whitespace-pre-line">
                      {storyDetail[`${activeTab}Translation`] || storyDetail[`${activeTab}Content`] || ''}
                    </p>
                  )}

                  <AnimatePresence>
                    {wordLookup && (
                      <div className="absolute z-50 mt-2 right-0">
                        <WordPopup
                          word={wordLookup.word}
                          data={wordLookup.data}
                          loading={wordLookupLoading}
                          onClose={() => setWordLookup(null)}
                          onAddVocab={handleAddVocab}
                          onSpeak={() => {
                            if ('speechSynthesis' in window) {
                              const u = new SpeechSynthesisUtterance(wordLookup.word);
                              u.lang = 'en-US';
                              speechSynthesis.cancel();
                              speechSynthesis.speak(u);
                            }
                          }}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {vocabulary.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Vocabulary ({vocabulary.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {vocabulary.map((v, i) => (
                        <div
                          key={i}
                          className="group relative px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all cursor-default"
                        >
                          <span className="font-medium">{v.word}</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg glass-strong text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                            {v.meaning || v.definition || 'No definition'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <GrammarExplanation items={storyDetail.grammarExplanations || storyDetail.grammar || []} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!selectedStory && error && (
        <ErrorState message={error} onRetry={loadStories} />
      )}
    </motion.div>
  );
}
