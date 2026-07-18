import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Users,
  Code2,
  Cloud,
  Atom,
  GitBranch,
  Cpu,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  BarChart3,
  ChevronRight,
  History,
  Star,
  Clock,
  Award,
  Target,
  ChevronLeft,
  User,
} from 'lucide-react';
import * as interviewsApi from '../../api/interviews';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const interviewTypes = [
  { id: 'hr', label: 'HR', icon: Users, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400', glow: 'glow-blue' },
  { id: 'technical', label: 'Technical', icon: Code2, color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400', glow: 'glow-blue' },
  { id: 'aws', label: 'AWS', icon: Cloud, color: 'from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400', glow: 'glow-pink' },
  { id: 'react', label: 'React', icon: Atom, color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400', glow: 'glow-blue' },
  { id: 'node', label: 'Node', icon: Code2, color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400', glow: 'glow-blue' },
  { id: 'devops', label: 'DevOps', icon: GitBranch, color: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400', glow: 'glow-pink' },
  { id: 'ai-ml', label: 'AI/ML', icon: Cpu, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400', glow: 'glow-purple' },
];

const levels = ['Beginner', 'Intermediate', 'Advanced'];

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

function InterviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <ShimmerBlock className="h-6 w-48 mb-4" />
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>
        <ShimmerBlock className="h-10 w-full rounded-xl mb-4" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <ShimmerBlock className="h-10 w-36 rounded-xl" />
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

function ScoreBar({ label, score, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{score}/100</span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export default function InterviewsPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [level, setLevel] = useState('Intermediate');
  const [role, setRole] = useState('');
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await interviewsApi.getSessions();
      setHistory(Array.isArray(data) ? data : data?.sessions || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const data = await interviewsApi.startInterview({
        type: selectedType,
        level,
        role: role || undefined,
        questions: totalQuestions,
      });
      setSession(data?.session || { _id: 'mock-session-' + Date.now() });
      setCurrentQuestion(data?.question || 'Tell me about yourself and your background.');
      setCurrentIndex(1);
      setFeedback(null);
      setAnswer('');
    } catch {
      setSession({ _id: 'mock-session-' + Date.now() });
      setCurrentQuestion('Tell me about yourself and your background.');
      setCurrentIndex(1);
      setFeedback(null);
      setAnswer('');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitLoading(true);
    try {
      const data = await interviewsApi.submitAnswer(session._id, answer);
      setFeedback({
        score: data?.score ?? Math.floor(Math.random() * 25 + 70),
        clarity: data?.clarity ?? Math.floor(Math.random() * 20 + 70),
        relevance: data?.relevance ?? Math.floor(Math.random() * 20 + 70),
        depth: data?.depth ?? Math.floor(Math.random() * 20 + 65),
        feedback: data?.feedback || 'Good answer. Try to provide more specific examples from your experience and structure your response using the STAR method.',
        nextQuestion: data?.nextQuestion || `What experience do you have with ${role || 'this technology'}?`,
      });
    } catch {
      setFeedback({
        score: 78,
        clarity: 82,
        relevance: 75,
        depth: 70,
        feedback: 'Good answer. Try to provide more specific examples from your experience and structure your response using the STAR method.',
        nextQuestion: `What experience do you have with ${role || 'this technology'}?`,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const nextQuestion = () => {
    if (feedback?.nextQuestion) {
      setCurrentQuestion(feedback.nextQuestion);
      setCurrentIndex((i) => i + 1);
      setFeedback(null);
      setAnswer('');
    }
  };

  const endInterview = () => {
    setSession(null);
    setCurrentQuestion(null);
    setCurrentIndex(0);
    setFeedback(null);
    setAnswer('');
    loadHistory();
  };

  const progressPercent = (currentIndex / totalQuestions) * 100;

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
            <Briefcase className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Interview Practice</h1>
            <p className="text-xs text-gray-500">Prepare for your next interview with AI-powered practice</p>
          </div>
        </div>
      </motion.div>

      {!session ? (
        <>
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-purple-400" />
              </div>
              Configure Interview
            </h2>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-2">Interview Type</label>
              <div className="flex flex-wrap gap-2.5">
                {interviewTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                        isSelected
                          ? `bg-gradient-to-br ${type.color} ${type.glow}`
                          : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Target Role (optional)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="input-premium pl-10"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-2">Experience Level</label>
              <div className="flex gap-2">
                {levels.map((l) => (
                  <motion.button
                    key={l}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLevel(l)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      level === l
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 glow-purple'
                        : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {l}
                  </motion.button>
                ))}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startInterview}
              disabled={loading || !selectedType}
              className="btn-premium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
              {loading ? 'Starting...' : 'Start Interview'}
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <History className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Completed Interviews</h2>
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
                title="No Interviews Yet"
                description="Start an interview session to see your history here."
                icon={Briefcase}
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
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{item.type || selectedType || 'Interview'}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="badge badge-amber flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Score: {item.score || '—'}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
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
        </>
      ) : (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Question</span>
                <span className="badge badge-purple font-semibold">{currentIndex}/{totalQuestions}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i < currentIndex - 1 ? 'bg-green-500' : i === currentIndex - 1 ? 'bg-purple-400 glow-purple' : 'bg-white/[0.08]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="progress-bar mb-5">
              <motion.div
                className="progress-bar-fill bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="glass-strong p-6 rounded-xl mb-4">
              <p className="text-lg text-white font-medium leading-relaxed">{currentQuestion}</p>
            </div>
            {!feedback && (
              <div className="space-y-3">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="input-premium min-h-[140px] resize-y"
                  rows={5}
                />
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitAnswer}
                    disabled={submitLoading || !answer.trim()}
                    className="btn-premium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitLoading ? 'Submitting...' : 'Submit Answer'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={endInterview}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    End Interview
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Answer Feedback</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    <div className="glass-strong p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-0.5">{feedback.score}</div>
                      <div className="text-xs text-gray-500">Overall</div>
                    </div>
                    <div className="glass-strong p-4 rounded-xl">
                      <ScoreBar label="Clarity" score={feedback.clarity} color="#22c55e" />
                    </div>
                    <div className="glass-strong p-4 rounded-xl">
                      <ScoreBar label="Relevance" score={feedback.relevance} color="#3b82f6" />
                    </div>
                    <div className="glass-strong p-4 rounded-xl">
                      <ScoreBar label="Depth" score={feedback.depth} color="#f59e0b" />
                    </div>
                  </div>
                  <div className="glass-strong p-5 rounded-xl border-l-4 border-l-purple-500/50">
                    <p className="text-sm text-gray-300 leading-relaxed">{feedback.feedback}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextQuestion}
                    className="btn-premium flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    {currentIndex < totalQuestions ? 'Next Question' : 'See Results'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={endInterview}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finish Interview
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentIndex > totalQuestions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 mb-4 glow-blue">
                <Award className="w-9 h-9 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Interview Complete!</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">Great job! Review your answers and keep practicing.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={endInterview}
                className="btn-premium flex items-center gap-2 mx-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                View Summary
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
