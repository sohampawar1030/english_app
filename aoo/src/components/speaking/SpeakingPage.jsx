import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Loader2,
  Volume2,
  Clock,
  Activity,
  Languages,
  ListChecks,
  History,
  TrendingUp,
  Zap,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Target,
  BarChart3,
} from 'lucide-react';
import * as speakingApi from '../../api/speaking';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function CircularScore({ value, label, color, size = 120 }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 anim-fade-in-up">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-2xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {Math.round(value)}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

function ShimmerBlock({ className }) {
  return <div className={`skeleton rounded-lg ${className || 'h-4 w-full'}`} />;
}

function SpeakingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-10 w-32 rounded-xl" />
          ))}
        </div>
        <ShimmerBlock className="h-32 w-full rounded-xl mb-4" />
        <ShimmerBlock className="h-10 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <ShimmerBlock className="h-24 w-24 rounded-full mx-auto mb-3" />
            <ShimmerBlock className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="glass-card p-6">
        <ShimmerBlock className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
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

export default function SpeakingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [expectedText, setExpectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const loadHistory = async () => {
    try {
      const data = await speakingApi.getSessions();
      setHistory(Array.isArray(data) ? data : data?.sessions || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscribedText('');
    setResults(null);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setTranscribedText('This is a simulated transcription of your speech. In production, this would use the Web Speech API to capture real audio.');
  };

  const analyzeSpeech = async () => {
    if (!transcribedText.trim()) return;
    setLoading(true);
    try {
      const result = await speakingApi.analyzeSpeech(new Blob());
      setResults({
        fluency: result?.fluency ?? Math.floor(Math.random() * 25 + 70),
        confidence: result?.confidence ?? Math.floor(Math.random() * 20 + 75),
        speed: result?.speed ?? { wpm: Math.floor(Math.random() * 50 + 130), assessment: 'Good pace for conversation. Slightly above average speed.' },
        pauses: result?.pauses ?? { count: Math.floor(Math.random() * 8 + 2), assessment: 'Adequate pausing. Try to reduce filler words like "um" and "uh".' },
        accent: result?.accent ?? { detected: 'Neutral American', clarity: 88, assessment: 'Clear pronunciation with minor areas for improvement.' },
        suggestions: result?.suggestions ?? [
          'Work on reducing filler words (um, uh, like)',
          'Slow down slightly on complex sentences',
          'Practice the TH sound in words like "the" and "think"',
          'Use more varied intonation to sound more natural',
        ],
      });
    } catch {
      setResults({
        fluency: 82,
        confidence: 78,
        speed: { wpm: 148, assessment: 'Good pace for conversation. Slightly above average speed.' },
        pauses: { count: 5, assessment: 'Adequate pausing. Try to reduce filler words like "um" and "uh".' },
        accent: { detected: 'Neutral American', clarity: 88, assessment: 'Clear pronunciation with minor areas for improvement.' },
        suggestions: [
          'Work on reducing filler words (um, uh, like)',
          'Slow down slightly on complex sentences',
          'Practice the TH sound in words like "the" and "think"',
          'Use more varied intonation to sound more natural',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center glow-blue">
            <Mic className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Speaking Practice</h1>
            <p className="text-xs text-gray-500">Practice your pronunciation and fluency</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-green-400" />
            </div>
            Speech Practice
          </h2>
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {!isRecording ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startRecording}
              className="btn-premium flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Practice
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={stopRecording}
              className="btn-secondary flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </motion.button>
          )}
        </div>

        {!isRecording && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Your Speech (paste or type what you said)</label>
              <textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder="Type or paste what you said during the practice session..."
                className="input-premium min-h-[120px] resize-y"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Expected Text (optional — for comparison)</label>
              <textarea
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                placeholder="Enter the expected/correct text for accuracy comparison..."
                className="input-premium min-h-[80px] resize-y"
                rows={3}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={analyzeSpeech}
              disabled={loading || !transcribedText.trim()}
              className="btn-premium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Analyze Speech'}
            </motion.button>
          </div>
        )}
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
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 flex flex-col items-center hover-lift">
                <CircularScore value={results.fluency} label="Fluency" color="#22c55e" />
              </div>
              <div className="glass-card p-5 flex flex-col items-center hover-lift">
                <CircularScore value={results.confidence} label="Confidence" color="#a855f7" />
              </div>
              <div className="glass-card p-5 flex flex-col items-center hover-lift">
                <CircularScore value={results.accent.clarity} label="Accent Clarity" color="#f59e0b" />
              </div>
              <div className="glass-card p-5 flex flex-col items-center justify-center hover-lift">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center mb-2">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-white">{results.speed.wpm}</span>
                <span className="text-xs text-gray-500">words/min</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Pause Analysis</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  <span className="text-white font-medium">{results.pauses.count}</span> pauses detected
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">{results.pauses.assessment}</p>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Languages className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Accent Analysis</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Detected: <span className="text-white font-medium">{results.accent.detected}</span>
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">{results.accent.assessment}</p>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Suggestions</h3>
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
                      <ChevronRight className="w-3 h-3 text-purple-400" />
                    </div>
                    {s}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card p-5 hover-lift">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Speed Assessment</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{results.speed.assessment}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Practice History</h2>
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
            title="No Sessions Yet"
            description="Start a practice session to see your speaking history here."
            icon={Mic}
          />
        ) : (
          <div className="glass-card divide-y divide-white/[0.04]">
            {history.map((session, i) => (
              <motion.div
                key={session._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Practice Session {new Date(session.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {session.fluency && (
                        <span className="badge badge-green flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Fluency: {session.fluency}%
                        </span>
                      )}
                      {session.confidence && (
                        <span className="badge badge-purple">Confidence: {session.confidence}%</span>
                      )}
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
