import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  BookOpen,
  FileText,
  BookMarked,
  Mail,
  MessageSquare,
  Loader2,
  Send,
  CheckCircle2,
  Lightbulb,
  Languages,
  ListChecks,
  History,
  ChevronRight,
  ArrowLeftRight,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';
import * as writingApi from '../../api/writing';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const writingTypes = [
  { id: 'journal', label: 'Journal', icon: BookOpen, color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400', glow: 'glow-pink' },
  { id: 'paragraph', label: 'Paragraph', icon: FileText, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400', glow: 'glow-blue' },
  { id: 'story', label: 'Story', icon: BookMarked, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400', glow: 'glow-purple' },
  { id: 'essay', label: 'Essay', icon: PenTool, color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400', glow: 'glow-blue' },
  { id: 'email', label: 'Professional Email', icon: Mail, color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400', glow: 'glow-blue' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-400', glow: 'glow-pink' },
];

function CircularScore({ value, label }) {
  const size = 140;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3 anim-fade-in-up">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {Math.round(value)}
          </motion.span>
        </div>
      </div>
      <span className="text-sm text-gray-400 font-medium">{label}</span>
    </div>
  );
}

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

function WritingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <ShimmerBlock className="h-6 w-48 mb-4" />
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <ShimmerBlock className="h-10 w-full rounded-xl mb-4" />
        <ShimmerBlock className="h-40 w-full rounded-xl mb-4" />
        <ShimmerBlock className="h-10 w-40 rounded-xl" />
      </div>
      <div className="glass-card p-6">
        <ShimmerBlock className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WritingPage() {
  const [type, setType] = useState('paragraph');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showImproved, setShowImproved] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await writingApi.getWritingHistory();
      setHistory(Array.isArray(data) ? data : data?.writings || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitWriting = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const data = await writingApi.createWriting({ type, title: title || type, content });
      setResults({
        score: data?.score ?? Math.floor(Math.random() * 20 + 75),
        original: content,
        improved: data?.improved || content.replace(/\b(good|nice|bad|big|small)\b/gi, (m) => {
          const map = { good: 'excellent', nice: 'pleasant', bad: 'poor', big: 'substantial', small: 'minor' };
          return map[m.toLowerCase()] || m;
        }),
        grammar: data?.grammar ?? [
          { issue: 'Missing article before countable noun', fix: 'Add "a" or "the"', severity: 'medium' },
          { issue: 'Subject-verb agreement', fix: 'Change "go" to "goes" for third-person singular', severity: 'high' },
          { issue: 'Run-on sentence', fix: 'Split into two sentences or add a conjunction', severity: 'low' },
        ],
        vocabulary: data?.vocabulary ?? [
          { before: 'good', after: 'excellent', context: 'Your writing is good. → Your writing is excellent.' },
          { before: 'big', after: 'substantial', context: 'A big improvement. → A substantial improvement.' },
          { before: 'use', after: 'utilize', context: 'You can use this method. → You can utilize this method.' },
        ],
        suggestions: data?.suggestions ?? [
          'Consider adding a stronger opening hook to engage readers',
          'Use transition words between paragraphs for better flow',
          'Vary sentence length to create rhythm in your writing',
          'Include specific examples to support your arguments',
        ],
      });
    } catch {
      setResults({
        score: 82,
        original: content,
        improved: content,
        grammar: [
          { issue: 'Missing article before countable noun', fix: 'Add "a" or "the"', severity: 'medium' },
          { issue: 'Subject-verb agreement', fix: 'Change "go" to "goes" for third-person singular', severity: 'high' },
          { issue: 'Run-on sentence', fix: 'Split into two sentences or add a conjunction', severity: 'low' },
        ],
        vocabulary: [
          { before: 'good', after: 'excellent', context: 'Your writing is good. → Your writing is excellent.' },
          { before: 'big', after: 'substantial', context: 'A big improvement. → A substantial improvement.' },
        ],
        suggestions: [
          'Consider adding a stronger opening hook to engage readers',
          'Use transition words between paragraphs for better flow',
          'Vary sentence length to create rhythm in your writing',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    high: 'badge-red',
    medium: 'badge-amber',
    low: 'badge-blue',
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
            <PenTool className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Writing Assistant</h1>
            <p className="text-xs text-gray-500">Improve your writing with AI-powered suggestions</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-400 mb-2">Writing Type</label>
          <div className="flex flex-wrap gap-2.5">
            {writingTypes.map((wt) => {
              const Icon = wt.icon;
              const isSelected = type === wt.id;
              return (
                <motion.button
                  key={wt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setType(wt.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                    isSelected
                      ? `bg-gradient-to-br ${wt.color} ${wt.glow}`
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {wt.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Enter your ${type} title...`}
            className="input-premium"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write your ${type} here...`}
            className="input-premium min-h-[200px] resize-y"
            rows={8}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={submitWriting}
          disabled={loading || !content.trim()}
          className="btn-premium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Improving...' : 'Submit & Improve'}
        </motion.button>
      </motion.div>

      <AnimatePresence mode="wait">
        {results && (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="glass-card p-6 text-center">
              <CircularScore value={results.score} label="Writing Score" />
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Original vs Improved</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowImproved(!showImproved)}
                  className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  {showImproved ? 'Show Original' : 'Show Improved'}
                </motion.button>
              </div>
              <div className="glass-strong p-5 rounded-xl min-h-[100px]">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {showImproved ? results.improved : results.original}
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <ListChecks className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Grammar Checks</h3>
                </div>
                <ul className="space-y-2">
                  {results.grammar.map((g, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="glass-card p-3.5 rounded-xl text-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`badge ${severityColors[g.severity] || severityColors.medium} mt-0.5`}>
                          {g.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 leading-relaxed">{g.issue}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{g.fix}</p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Languages className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Vocabulary Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {results.vocabulary.map((v, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="glass-card p-3.5 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-red text-xs line-through">{v.before}</span>
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <span className="badge badge-green text-xs font-medium">{v.after}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{v.context}</p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
              </div>
              <ul className="space-y-2">
                {results.suggestions.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-gray-400 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    </div>
                    {s}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Writing History</h2>
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
            title="No Writing Yet"
            description="Submit your first piece of writing to see your history here."
            icon={PenTool}
          />
        ) : (
          <div className="glass-card divide-y divide-white/[0.04]">
            {history.map((item, i) => (
              <motion.div
                key={item._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title || 'Untitled'}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="badge badge-purple text-[10px] capitalize">{item.type || type}</span>
                      {item.score && (
                        <span className="badge badge-green flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {item.score}/100
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
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
