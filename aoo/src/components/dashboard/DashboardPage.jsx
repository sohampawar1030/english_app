import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, TrendingUp, BookOpen, RefreshCw, Zap, Calendar,
  ChevronRight, Target, MessageSquare, Gamepad2, Mic,
  BookMarked, Sparkles, Clock, CheckCircle2, Circle,
  Trophy, Brain, Quote, ArrowUpRight, Layers,
  BarChart3, Headphones, PenTool, Globe, Award,
  ChevronDown, ChevronUp, SpellCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import * as analyticsApi from '../../api/analytics';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (end === undefined || end === null) return;
    let startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    }
    setCount(0);
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);
  return count;
}

function AnimatedStat({ value, label, icon: Icon, gradient, prefix = '', suffix = '', delay = 0 }) {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-4 sm:p-5 hover-lift group cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
          <Icon size={18} className="text-white" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.3, type: "spring", stiffness: 200, damping: 15 }}
        >
          <TrendingUp size={16} className="text-emerald-400" />
        </motion.div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
          {prefix}{count.toLocaleString()}{suffix}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 font-medium">{label}</div>
      </div>
    </motion.div>
  );
}

function CircularProgress({ value, max = 100, size = 100, strokeWidth = 6, color, label, delay = 0 }) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / max) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-lg font-bold text-white tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay / 1000 + 0.5 }}
          >
            {Math.round((value / max) * 100)}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong !p-3 !rounded-xl shadow-2xl border border-white/[0.08]">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-white">{entry.value} XP</p>
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const skills = [
  { key: 'vocabulary', label: 'Vocabulary', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  { key: 'grammar', label: 'Grammar', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  { key: 'speaking', label: 'Speaking', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'reading', label: 'Reading', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
  { key: 'writing', label: 'Writing', color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
];

const skillIcons = {
  vocabulary: BookOpen,
  grammar: SpellCheck,
  speaking: Mic,
  reading: BookMarked,
  writing: PenTool,
};

const quickActions = [
  { icon: BookOpen, label: 'Learn New Words', path: '/vocabulary/learn', gradient: 'from-violet-500 to-purple-600', desc: 'Expand your vocabulary', color: '#A78BFA' },
  { icon: RefreshCw, label: 'Review Words', path: '/vocabulary/revision', gradient: 'from-blue-500 to-cyan-600', desc: 'Strengthen memory', color: '#60A5FA' },
  { icon: BookMarked, label: 'Read Story', path: '/stories', gradient: 'from-amber-500 to-orange-600', desc: 'Practice with stories', color: '#FCD34D' },
  { icon: MessageSquare, label: 'Chat with AI', path: '/chat', gradient: 'from-pink-500 to-rose-600', desc: 'Conversational practice', color: '#F472B6' },
];

function timeAgo(date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const activityIconMap = {
  new_word: BookOpen, revision_correct: RefreshCw, revision_incorrect: RefreshCw,
  story_generated: BookMarked, story_read: BookMarked,
  ai_chat: MessageSquare, grammar_check: CheckCircle2,
  speaking_practice: Mic, writing: PenTool,
  game_played: Gamepad2, quiz_completed: Trophy,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { xp, streak, syncProfile } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllStats, setShowAllStats] = useState(false);

  const refreshDashboard = useCallback(() => {
    analyticsApi.getDashboard()
      .then(data => {
        setDashboardData(data);
        syncProfile(data?.profile);
      })
      .catch(() => null);
  }, [syncProfile]);

  useEffect(() => {
    setLoading(true);
    refreshDashboard();
    const interval = setInterval(refreshDashboard, 30000);
    const onFocus = () => refreshDashboard();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshDashboard]);

  const quotes = [
    "The beautiful thing about learning is that nobody can take it away from you.",
    "Language is the road map of a culture. It tells you where its people come from and where they are going.",
    "Learning another language is not only learning different words for the same things, but learning another way to think about things.",
    "The limits of my language mean the limits of my world.",
    "To have another language is to possess a second soul.",
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  const profile = dashboardData?.profile || {};
  const vocab = dashboardData?.vocabulary || {};
  const revisionDue = dashboardData?.revisionDue || 0;
  const weeklyStats = dashboardData?.weeklyStats || [];
  const dailyProgress = dashboardData?.dailyProgress || { words_learned: 0, words_revised: 0, xp_earned: 0, minutes_active: 0 };

  const xpToday = dailyProgress.xp_earned || 0;
  const dailyGoal = 100;
  const wordsLearned = profile.total_words_learned || 0;
  const vocabOverview = [
    { name: 'New', value: Number(vocab.new_count) || 0, color: '#6B7280' },
    { name: 'Learning', value: Number(vocab.learning_count) || 0, color: '#60A5FA' },
    { name: 'Revision', value: Number(vocab.revision_count) || 0, color: '#FCD34D' },
    { name: 'Mastered', value: Number(vocab.mastered_count) || 0, color: '#34D399' },
    { name: 'Long Term', value: Number(vocab.long_term_count) || 0, color: '#A78BFA' },
  ];

  const skillScores = [
    { key: 'vocabulary', score: profile.vocabulary_score || 0 },
    { key: 'grammar', score: profile.grammar_score || 0 },
    { key: 'speaking', score: profile.speaking_score || 0 },
    { key: 'reading', score: profile.reading_score || 0 },
    { key: 'writing', score: profile.writing_score || 0 },
  ];

  const chartData = useMemo(() => {
    if (!weeklyStats?.length) {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), xp: 0 };
      });
    }
    return weeklyStats.map(s => ({
      date: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
      xp: Number(s.xp) || 0,
    }));
  }, [weeklyStats]);

  const rawActivity = dashboardData?.recentActivity;
  const recentActivity = rawActivity?.length
    ? rawActivity.map(a => ({
        icon: activityIconMap[a.activity_type] || Brain,
        text: a.description || a.activity_type?.replace(/_/g, ' ') || 'Activity',
        time: a.created_at ? timeAgo(a.created_at) : 'recent',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
      }))
    : [
        { icon: BookOpen, text: 'Learned 15 new words', time: '2 hours ago', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: RefreshCw, text: 'Reviewed 24 words', time: '4 hours ago', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: MessageSquare, text: 'Practiced with AI Chat', time: '6 hours ago', color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { icon: BookMarked, text: 'Read "The Adventure"', time: 'Yesterday', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { icon: Mic, text: 'Speaking practice - 15 min', time: 'Yesterday', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      ];

  const missions = dashboardData?.missions || [
    { title: 'Learn 20 new words', progress: 65, xpReward: 50 },
    { title: 'Review 30 words', progress: 40, xpReward: 30 },
    { title: '5 min speaking practice', progress: 80, xpReward: 40 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] via-transparent to-pink-500/[0.04] rounded-2xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute inset-0 rounded-2xl border border-white/[0.04]" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-wider">
                  {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} Session
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  Welcome back,
                </h1>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">{user?.name || 'Learner'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Quote size={14} className="text-purple-400/60 shrink-0" />
                <span className="italic">{quote}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/[0.08] border border-orange-500/10">
                <Flame size={16} className="text-orange-400" />
                <span className="text-sm font-bold text-orange-300">{streak || 0}</span>
                <span className="text-[11px] text-orange-400/50">day streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/[0.08] border border-purple-500/10">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-purple-300"><AnimatedStatSmall value={xp || 0} /></span>
                <span className="text-[11px] text-purple-400/50">total XP</span>
              </div>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="relative mt-6 p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Target size={14} className="text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white">Today's Goal</span>
                  <p className="text-[11px] text-gray-500">Complete daily target to maintain streak</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">
                <span className="text-purple-300 font-bold">{xpToday}</span>
                <span className="text-gray-600"> / {dailyGoal} XP</span>
              </span>
            </div>
            <div className="relative h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((xpToday / dailyGoal) * 100, 100)}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatedStat value={xpToday} label="XP Today" icon={Zap} gradient="from-purple-500 to-pink-500" delay={0} />
          <AnimatedStat value={streak || 0} label="Current Streak" icon={Flame} gradient="from-orange-500 to-red-500" delay={0.1} suffix=" days" />
          <AnimatedStat value={wordsLearned} label="Words Learned" icon={BookOpen} gradient="from-blue-500 to-cyan-500" delay={0.2} />
          <AnimatedStat value={revisionDue} label="Revision Due" icon={RefreshCw} gradient="from-emerald-500 to-teal-500" delay={0.3} />
        </div>
      </motion.section>

      {/* Main Content Grid */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Skill Scores */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain size={16} className="text-purple-400" />
                Skill Scores
              </h2>
              <button className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">View All</button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {skillScores.map((skill, i) => {
                const skillDef = skills.find(s => s.key === skill.key);
                const SkillIcon = skillIcons[skill.key] || Brain;
                return (
                  <div key={skill.key} className="flex flex-col items-center gap-1.5">
                    <div className="relative w-full aspect-square max-w-[60px] mx-auto">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
                        <motion.circle
                          cx="18" cy="18" r="15.5" fill="none"
                          stroke={skillDef?.color || '#A78BFA'}
                          strokeWidth="2.5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 15.5}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 15.5 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 15.5 * (1 - (skill.score || 0) / 100) }}
                          transition={{ duration: 1.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <SkillIcon size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{skillDef?.label || skill.key}</span>
                    <span className="text-[10px] font-bold text-white">{skill.score || 0}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Chart */}
          <div className="glass-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-purple-400" />
                Weekly Activity
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-white/[0.03] px-2 py-1 rounded-lg">
                <Calendar size={12} />
                Last 7 days
              </div>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-4} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="xp" stroke="#A78BFA" strokeWidth={2} fill="url(#xpGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Bottom Grid */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Vocabulary Overview */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Layers size={16} className="text-purple-400" />
              Vocabulary Overview
            </h2>
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={vocabOverview.filter(v => v.value > 0)}
                      cx="50%" cy="50%" innerRadius={32} outerRadius={52}
                      dataKey="value"
                      stroke="none"
                    >
                      {vocabOverview.filter(v => v.value > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {vocabOverview.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={16} className="text-purple-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.slice(0, showAllStats ? 6 : 4).map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.path}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    className="relative group overflow-hidden rounded-xl p-3 text-left border border-white/[0.04] hover:border-white/[0.08] transition-all bg-white/[0.02] hover:bg-white/[0.04]"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2 shadow-lg`}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <p className="text-xs font-semibold text-white mb-0.5">{action.label}</p>
                    <p className="text-[10px] text-gray-500">{action.desc}</p>
                  </motion.button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAllStats(!showAllStats)}
              className="mt-2 w-full flex items-center justify-center gap-1 py-2 text-[11px] text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/[0.03]"
            >
              {showAllStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAllStats ? 'Show Less' : 'View All Actions'}
            </button>
          </div>

          {/* Missions */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              Daily Missions
            </h2>
            <div className="space-y-3">
              {missions.map((mission, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">{mission.title}</span>
                    <span className="text-[10px] font-medium text-amber-400/80 flex items-center gap-1">
                      <Sparkles size={10} />
                      +{mission.xpReward} XP
                    </span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.progress}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">{mission.progress}% complete</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Recent Activity */}
      <motion.section variants={itemVariants}>
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-purple-400" />
            Recent Activity
          </h2>
          <div className="space-y-1">
            {recentActivity.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors group cursor-default"
                >
                  <div className={`w-9 h-9 rounded-lg ${activity.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={16} className={activity.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{activity.text}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                  <Circle size={5} className="text-gray-700 fill-current shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function AnimatedStatSmall({ value }) {
  const count = useCountUp(value);
  return <span className="tabular-nums">{count.toLocaleString()}</span>;
}
