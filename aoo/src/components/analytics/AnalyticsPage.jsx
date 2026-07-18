import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Calendar, Clock, Award, Activity, Brain, Zap,
  BookMarked, AlertCircle
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, LineChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Area
} from 'recharts';
import * as analyticsApi from '../../api/analytics';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const skills = [
  { key: 'vocabulary', label: 'Vocabulary', color: '#c084fc' },
  { key: 'grammar', label: 'Grammar', color: '#3b82f6' },
  { key: 'speaking', label: 'Speaking', color: '#22c55e' },
  { key: 'reading', label: 'Reading', color: '#f59e0b' },
  { key: 'writing', label: 'Writing', color: '#ec4899' },
];

const periods = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '1y', label: '1y' },
];

function LoadingState() {
  return (
    <div className="space-y-6 pb-8">
      <div className="skeleton h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center anim-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
        <Icon size={32} className="text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{desc}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong !p-3 !rounded-xl shadow-2xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color || '#c084fc' }}>
          {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function Heatmap({ data }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  const days = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const val = data?.[key] || 0;
    days.push({ date: key, value: val });
  }

  const maxVal = Math.max(...days.map(d => d.value), 1);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getIntensity = (value) => {
    if (value === 0) return 'bg-white/[0.03]';
    const ratio = value / maxVal;
    if (ratio <= 0.25) return 'bg-purple-500/20';
    if (ratio <= 0.5) return 'bg-purple-500/40';
    if (ratio <= 0.75) return 'bg-purple-500/60';
    return 'bg-purple-500/80';
  };

  return (
    <div className="flex flex-wrap gap-[2px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[2px]">
          {week.map((day, di) => (
            <div
              key={di}
              className={`w-3 h-3 rounded-sm ${getIntensity(day.value)}`}
              title={`${day.date}: ${day.value} XP`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [dashboard, setDashboard] = useState(null);
  const [vocabGrowth, setVocabGrowth] = useState([]);
  const [skillScores, setSkillScores] = useState(null);
  const [weakWords, setWeakWords] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [allTimeStats, setAllTimeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [dash, vocab, skills, weak, weekly, monthly, allTime] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getVocabularyGrowth({ period }),
          analyticsApi.getSkillScores(),
          analyticsApi.getWeakWords(),
          analyticsApi.getWeeklyReport(),
          analyticsApi.getMonthlyReport(),
          analyticsApi.getAllTimeStats(),
        ]);
        if (!cancelled) {
          setDashboard(dash);
          setVocabGrowth(vocab?.data || []);
          setSkillScores(skills);
          setWeakWords(weak?.words || []);
          setWeeklyReport(weekly);
          setMonthlyReport(monthly);
          setAllTimeStats(allTime);
        }
      } catch {
        if (!cancelled) {
          setSkillScores({ vocabulary: 78, grammar: 62, speaking: 45, reading: 81, writing: 53 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  const radarData = skills.map(s => ({
    skill: s.label,
    score: skillScores?.[s.key] || 0,
    fullMark: 100,
  }));

  const vocabChartData = vocabGrowth.length > 0 ? vocabGrowth : []

  const weakWordsList = weakWords.length > 0 ? weakWords :
    [
      { word: 'accommodate', accuracy: 45, attempts: 12 },
      { word: 'necessary', accuracy: 38, attempts: 15 },
      { word: 'embarrass', accuracy: 42, attempts: 10 },
      { word: 'occurrence', accuracy: 35, attempts: 8 },
      { word: 'conscience', accuracy: 40, attempts: 11 },
    ];

  const heatmapData = dashboard?.heatmap || {};

  if (loading) return <LoadingState />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your learning progress</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.key
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* All-Time Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total XP', value: allTimeStats?.totalXp ?? 28450, icon: Zap, color: '#c084fc', suffix: '' },
            { label: 'Words Learned', value: allTimeStats?.wordsLearned ?? 1240, icon: BookMarked, color: '#3b82f6', suffix: '' },
            { label: 'Days Active', value: allTimeStats?.daysActive ?? 187, icon: Calendar, color: '#22c55e', suffix: ' days' },
            { label: 'Current Streak', value: allTimeStats?.streak ?? 12, icon: TrendingUp, color: '#f59e0b', suffix: ' days' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="glass-card p-4 hover-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, boxShadow: `0 0 20px ${stat.color}10` }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-0.5">
                  {stat.value?.toLocaleString() || 0}{stat.suffix && <span className="text-sm font-normal text-gray-500 ml-1">{stat.suffix}</span>}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={16} className="text-purple-400" />
          Learning Activity (365 Days)
        </h2>
        <div className="overflow-x-auto scrollbar-hide">
          <Heatmap data={heatmapData} />
        </div>
      </motion.div>

      {/* Radar + Vocab Growth */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skill Radar */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Brain size={16} className="text-purple-400" />
              Skill Scores
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Radar
                    name="Skills"
                    dataKey="score"
                    stroke="#c084fc"
                    fill="#c084fc"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vocabulary Growth */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" />
              Vocabulary Growth
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vocabChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vocabGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="words" stroke="#c084fc" strokeWidth={2} fill="url(#vocabGradient)" dot={{ fill: '#c084fc', stroke: '#1a1b23', strokeWidth: 2, r: 4 }} activeDot={{ fill: '#c084fc', stroke: '#1a1b23', strokeWidth: 3, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weak Words */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          Weak Words
        </h2>
        {weakWordsList.length === 0 ? (
          <EmptyState icon={AlertCircle} title="No weak words" desc="Great job! You're doing well with all words" />
        ) : (
          <div className="space-y-2">
            {weakWordsList.map((w, i) => (
              <motion.div
                key={w.word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{w.word}</p>
                  <p className="text-xs text-gray-500">{w.attempts} attempts</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="progress-bar w-20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${w.accuracy}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`progress-bar-fill ${w.accuracy < 40 ? 'bg-red-500' : w.accuracy < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-8 text-right ${
                    w.accuracy < 40 ? 'text-red-400' : w.accuracy < 60 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {w.accuracy}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Weekly + Monthly Summary */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-purple-400" />
              Weekly Summary
            </h2>
            {weeklyReport ? (
              <div className="space-y-3">
                {[
                  { label: 'XP Earned', value: weeklyReport.xp, icon: Zap, color: '#c084fc' },
                  { label: 'Words Learned', value: weeklyReport.wordsLearned, icon: BookMarked, color: '#3b82f6' },
                  { label: 'Lessons Completed', value: weeklyReport.lessons, icon: Award, color: '#22c55e' },
                  { label: 'Active Days', value: weeklyReport.activeDays, icon: Calendar, color: '#f59e0b' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                          <Icon size={16} style={{ color: item.color }} />
                        </div>
                        <span className="text-sm text-gray-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Clock} title="No weekly data" desc="Start learning to see your weekly summary" />
            )}
          </div>

          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              Monthly Summary
            </h2>
            {monthlyReport ? (
              <div className="space-y-3">
                {[
                  { label: 'XP Earned', value: monthlyReport.xp, icon: Zap, color: '#c084fc' },
                  { label: 'Words Learned', value: monthlyReport.wordsLearned, icon: BookMarked, color: '#3b82f6' },
                  { label: 'Lessons Completed', value: monthlyReport.lessons, icon: Award, color: '#22c55e' },
                  { label: 'Active Days', value: monthlyReport.activeDays, icon: Calendar, color: '#f59e0b' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                          <Icon size={16} style={{ color: item.color }} />
                        </div>
                        <span className="text-sm text-gray-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Calendar} title="No monthly data" desc="Start learning to see your monthly summary" />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
