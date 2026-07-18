import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Lock, Zap, Coins, Target, Flame,
  Gamepad2, Puzzle, Crosshair, Search, Keyboard, Brain,
  Gift, Sparkles, CheckCircle2, Medal,
  Award, Crown, Dice5
} from 'lucide-react';
import * as gamesApi from '../../api/games';
import { useApp } from '../../context/AppContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const wheelSections = [
  { label: '50 XP', color: '#c084fc', xp: 50 },
  { label: '100 XP', color: '#a855f7', xp: 100 },
  { label: '20 XP', color: '#7c3aed', xp: 20 },
  { label: '200 XP', color: '#6d28d9', xp: 200 },
  { label: '10 XP', color: '#5b21b6', xp: 10 },
  { label: '500 XP', color: '#4c1d95', xp: 500 },
  { label: '30 XP', color: '#3b0764', xp: 30 },
  { label: '150 XP', color: '#2e1065', xp: 150 },
];

const games = [
  { icon: Puzzle, name: 'Word Puzzle', desc: 'Unscramble letters', path: '/games/word-puzzle', color: '#c084fc' },
  { icon: Crosshair, name: 'Crossword', desc: 'Solve clues', path: '/games/crossword', color: '#3b82f6' },
  { icon: Search, name: 'Word Search', desc: 'Find hidden words', path: '/games/word-search', color: '#22c55e' },
  { icon: Keyboard, name: 'Typing Challenge', desc: 'Type fast & accurate', path: '/games/typing', color: '#f59e0b' },
  { icon: Brain, name: 'Memory Cards', desc: 'Match & remember', path: '/games/memory', color: '#ec4899' },
];

const defaultAchievements = [
  { id: 1, title: 'First Steps', desc: 'Complete your first lesson', icon: Trophy, unlocked: true, rarity: 'common' },
  { id: 2, title: 'Word Master', desc: 'Learn 100 words', icon: Trophy, unlocked: true, rarity: 'common' },
  { id: 3, title: 'Streak King', desc: '7-day streak', icon: Flame, unlocked: true, rarity: 'rare' },
  { id: 4, title: 'Polyglot', desc: 'Complete all skills', icon: Award, unlocked: false, rarity: 'epic' },
  { id: 5, title: 'Speed Demon', desc: 'Type 60 WPM', icon: Zap, unlocked: false, rarity: 'rare' },
  { id: 6, title: 'Treasure Hunter', desc: 'Open 10 treasure boxes', icon: Gift, unlocked: false, rarity: 'epic' },
  { id: 7, title: 'Perfect Score', desc: 'Get 100% on any quiz', icon: Medal, unlocked: false, rarity: 'rare' },
  { id: 8, title: 'Champion', desc: 'Reach level 50', icon: Crown, unlocked: false, rarity: 'legendary' },
];

const rarityBadge = {
  common: 'badge',
  rare: 'badge-blue',
  epic: 'badge-purple',
  legendary: 'badge-amber',
};

const rarityColors = {
  common: { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', text: '#9ca3af', glow: 'rgba(107,114,128,0.2)' },
  rare: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', glow: 'rgba(59,130,246,0.2)' },
  epic: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: '#c084fc', glow: 'rgba(168,85,247,0.2)' },
  legendary: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
};

function LoadingState() {
  return (
    <div className="space-y-6 pb-8">
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 w-full rounded-2xl" />
      <div className="skeleton h-80 w-full rounded-2xl" />
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

function ProfileCard({ profile }) {
  const xpForNextLevel = profile?.level * 500;
  const progress = profile ? Math.min((profile.xp % 500) / 500 * 100, 100) : 0;

  return (
    <motion.div variants={itemVariants} className="glass-strong relative overflow-hidden rounded-2xl p-6 sm:p-8 hover-lift">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-violet-500/10 to-indigo-600/5 rounded-2xl" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-pink-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl glow-purple">
              L{profile?.level || 1}
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
              {profile?.username || 'Gamer'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-purple-400" />
                <span className="text-sm text-gray-400">
                  <span className="text-purple-300 font-semibold">{profile?.xp?.toLocaleString() || 0}</span> XP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-sm text-gray-400">
                  <span className="text-yellow-300 font-semibold">{profile?.coins || 0}</span> coins
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-orange-400" />
                <span className="text-sm text-gray-400">
                  <span className="text-orange-300 font-semibold">{profile?.streak || 0}</span> day streak
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Level {profile?.level || 1}</span>
            <span className="text-gray-500">{profile?.xp || 0} / {xpForNextLevel} XP</span>
          </div>
          <div className="progress-bar">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="progress-bar-fill bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500"
            />
          </div>
          <p className="text-xs text-gray-500">{Math.round(progress)}% to Level {(profile?.level || 1) + 1}</p>
        </div>
      </div>
    </motion.div>
  );
}

function AchievementsSection({ achievements }) {
  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-purple-400" />
        Achievements
        <span className="ml-auto text-xs text-gray-500 font-normal">
          {achievements.filter(a => a.unlocked).length}/{achievements.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {achievements.map((ach, i) => {
          const Icon = ach.icon;
          const colors = rarityColors[ach.rarity] || rarityColors.common;
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className={`relative group p-3.5 rounded-xl border transition-all duration-300 hover-lift ${
                ach.unlocked
                  ? 'cursor-pointer'
                  : 'cursor-default opacity-60'
              }`}
              style={{
                background: ach.unlocked ? colors.bg : 'rgba(255,255,255,0.02)',
                borderColor: ach.unlocked ? colors.border : 'rgba(255,255,255,0.05)',
              }}
            >
              {ach.unlocked && (
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 30px ${colors.glow}` }}
                />
              )}
              <div className="relative flex flex-col items-center text-center gap-2">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    ach.unlocked ? 'group-hover:scale-110' : ''
                  }`}
                  style={{
                    background: ach.unlocked ? `${colors.bg}` : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {ach.unlocked ? (
                    <Icon size={22} style={{ color: colors.text }} />
                  ) : (
                    <Lock size={18} className="text-gray-600" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>
                    {ach.title}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{ach.desc}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={rarityBadge[ach.rarity]}>{ach.rarity}</span>
                </div>
                {ach.unlocked && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 size={12} style={{ color: colors.text }} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function MissionsSection({ missions, onClaim }) {
  const [tab, setTab] = useState('daily');

  const filtered = missions.filter(m => m.period === tab);

  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Target size={16} className="text-purple-400" />
        Missions
      </h2>

      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5">
        {['daily', 'weekly', 'monthly'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              tab === t
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="No missions" desc="Check back later for new missions" />
      ) : (
        <div className="space-y-3">
          {filtered.map((mission, i) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{mission.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-purple-300">
                      <Zap size={12} />
                      {mission.xpReward} XP
                    </span>
                    {mission.coinReward > 0 && (
                      <span className="flex items-center gap-1 text-xs text-yellow-300">
                        <Coins size={12} />
                        {mission.coinReward} coins
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onClaim(mission.id)}
                  disabled={mission.progress < 100}
                  className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    mission.progress >= 100
                      ? 'btn-premium'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {mission.progress >= 100 ? 'Claim' : `${mission.progress}%`}
                </button>
              </div>
              <div className="progress-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mission.progress}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={`progress-bar-fill ${
                    mission.progress >= 100
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LuckyWheel({ onSpin }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const spins = 5 + Math.random() * 3;
    const targetIndex = Math.floor(Math.random() * wheelSections.length);
    const sectionAngle = 360 / wheelSections.length;
    const targetRotation = rotation + spins * 360 + (360 - (targetIndex * sectionAngle + sectionAngle / 2));

    setRotation(targetRotation);

    setTimeout(async () => {
      try {
        const res = await onSpin();
        setResult(res);
      } catch {
        setResult({ xp: wheelSections[targetIndex].xp });
      }
      setSpinning(false);
    }, 3000);
  };

  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Dice5 size={16} className="text-purple-400" />
        Lucky Wheel
      </h2>

      <div className="flex flex-col items-center gap-4">
        <div className="relative glow-purple rounded-full">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-purple-400 drop-shadow-lg" />
          </div>
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-64 h-64 rounded-full relative overflow-hidden"
            style={{
              background: `conic-gradient(${wheelSections.map((s, i) => {
                const start = (i / wheelSections.length) * 360;
                const end = ((i + 1) / wheelSections.length) * 360;
                return `${s.color} ${start}deg ${end}deg`;
              }).join(', ')})`,
            }}
          >
            {wheelSections.map((section, i) => {
              const angle = (i / wheelSections.length) * 360 + (360 / wheelSections.length) / 2;
              return (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span
                    className="text-[10px] font-bold text-white drop-shadow-lg"
                    style={{ transform: `translateY(-80px)` }}
                  >
                    {section.label}
                  </span>
                </div>
              );
            })}
            <div className="absolute inset-2 rounded-full bg-[#07070A] flex items-center justify-center border border-white/5">
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                {spinning ? '...' : 'SPIN'}
              </button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
              <p className="text-sm text-purple-300 font-semibold">
                You won <span className="text-white">{result.xp} XP</span>!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TreasureBox({ onOpen }) {
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState(null);

  const handleOpen = async () => {
    if (opening || opened) return;
    setOpening(true);
    setTimeout(async () => {
      setOpened(true);
      try {
        const res = await onOpen();
        setReward(res);
      } catch {
        setReward({ xp: Math.floor(Math.random() * 100) + 20, coins: Math.floor(Math.random() * 20) + 5 });
      }
      setOpening(false);
    }, 1500);
  };

  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Gift size={16} className="text-purple-400" />
        Treasure Box
      </h2>

      <div className="flex flex-col items-center gap-4">
        <motion.div
          onClick={handleOpen}
          className="relative cursor-pointer select-none"
          whileHover={!opening && !opened ? { scale: 1.05 } : {}}
          whileTap={!opening && !opened ? { scale: 0.95 } : {}}
        >
          <motion.div
            animate={opening ? {
              rotateX: [0, 0, 90, 90],
              scale: [1, 1.1, 1.1, 1],
            } : opened ? {
              y: [0, -10, 0],
              transition: { repeat: Infinity, duration: 2 },
            } : {
              y: [0, -5, 0],
              transition: { repeat: Infinity, duration: 2 },
            }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl glow-amber"
          >
            {opened ? (
              <Sparkles size={40} className="text-white" />
            ) : (
              <Gift size={40} className="text-white" />
            )}
          </motion.div>
          {!opened && !opening && (
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400"
            />
          )}
        </motion.div>

        <AnimatePresence>
          {opening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reward && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center anim-fade-in-up"
            >
              <p className="text-sm font-semibold text-gradient mb-1">Treasure Unlocked!</p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="badge-purple">+{reward.xp} XP</span>
                {reward.coins > 0 && <span className="badge-amber">+{reward.coins} coins</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function GameCards() {
  const navigate = useNavigate();

  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Gamepad2 size={16} className="text-purple-400" />
        Quick Games
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {games.map((game, i) => {
          const Icon = game.icon;
          return (
            <motion.button
              key={game.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(game.path)}
              className="relative group overflow-hidden rounded-xl p-4 text-center border border-white/5 hover:border-white/10 transition-all bg-white/[0.03] hover:bg-white/[0.06] hover-lift"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                style={{ background: `${game.color}20` }}
              >
                <Icon size={22} style={{ color: game.color }} />
              </div>
              <p className="text-sm font-semibold text-white mb-0.5">{game.name}</p>
              <p className="text-[10px] text-gray-500 mb-3">{game.desc}</p>
              <span
                className="inline-block px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all btn-premium"
              >
                Play
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function GamingPage() {
  const { addXp, addCoins } = useApp();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState(defaultAchievements);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [profileData, achievementsData, missionsData] = await Promise.all([
          gamesApi.getProfile(),
          gamesApi.getAchievements(),
          gamesApi.getMissions(),
        ]);
        if (!cancelled) {
          setProfile(profileData);
          if (achievementsData?.length) setAchievements(achievementsData);
          if (missionsData?.length) setMissions(missionsData);
        }
      } catch {
        if (!cancelled) {
          setProfile({ username: 'Gamer', xp: 0, coins: 0, level: 1, streak: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleClaimMission = async (missionId) => {
    try {
      const res = await gamesApi.claimMission(missionId);
      if (res.xp) addXp(res.xp);
      if (res.coins) addCoins(res.coins);
      setMissions(prev => prev.map(m =>
        m.id === missionId ? { ...m, progress: 100, claimed: true } : m
      ));
    } catch { /* ignore */ }
  };

  const handleSpinWheel = async () => {
    try {
      const res = await gamesApi.spinWheel();
      if (res.xp) addXp(res.xp);
      return res;
    } catch {
      return { xp: 0 };
    }
  };

  const handleOpenTreasure = async () => {
    try {
      const res = await gamesApi.openTreasure();
      if (res.xp) addXp(res.xp);
      if (res.coins) addCoins(res.coins);
      return res;
    } catch {
      return { xp: 0, coins: 0 };
    }
  };

  if (loading) return <LoadingState />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      <ProfileCard profile={profile} />
      <AchievementsSection achievements={achievements} />
      <MissionsSection missions={missions} onClaim={handleClaimMission} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LuckyWheel onSpin={handleSpinWheel} />
        <TreasureBox onOpen={handleOpenTreasure} />
      </div>

      <GameCards />
    </motion.div>
  );
}
