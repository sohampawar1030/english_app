import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Header({ onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const { xp, streak, coins } = useApp();

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        if (!searchQuery) setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  return (
    <header className="relative z-30 flex items-center justify-between h-16 px-3 sm:px-4 lg:px-6 border-b border-white/[0.04]">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 glass" />

      <div className="relative flex items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="w-9 h-9 rounded-xl flex md:hidden items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all"
        >
          <Icons.Menu size={18} />
        </button>

        <div ref={searchRef} className="relative">
          <motion.div
            animate={{ width: searchOpen ? 200 : 140 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative sm:w-auto"
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="input-premium !py-2 !pl-9 !pr-3 text-xs sm:text-sm w-full"
            />
            <Icons.Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </motion.div>
          <AnimatePresence>
            {searchOpen && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 w-full min-w-[200px] sm:min-w-[280px] glass-strong rounded-xl p-2 shadow-2xl border border-white/[0.08]"
              >
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Start typing to search...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative flex items-center gap-1.5 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/[0.07] border border-orange-500/10">
            <Icons.Flame size={12} className="text-orange-400" />
            <span className="text-[11px] font-semibold text-orange-300">{streak || 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/[0.07] border border-purple-500/10">
            <Icons.Sparkles size={12} className="text-purple-400" />
            <span className="text-[11px] font-semibold text-purple-300">{(xp || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/[0.07] border border-amber-500/10">
            <Icons.Coins size={12} className="text-amber-400" />
            <span className="text-[11px] font-semibold text-amber-300">{(coins || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
          >
            <Icons.Bell size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-[#07070A] shadow-lg shadow-purple-500/30">
              3
            </span>
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-72 sm:w-80 glass-strong rounded-2xl p-2 shadow-2xl border border-white/[0.08]"
              >
                <div className="px-3 py-2.5 border-b border-white/[0.04]">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                </div>
                {[
                  { icon: Icons.Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'New achievement unlocked!', sub: 'Vocabulary Master - 2 hours ago' },
                  { icon: Icons.MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', text: 'New AI chat response', sub: 'Grammar check completed - 5 hours ago' },
                  { icon: Icons.Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', text: '7-day streak!', sub: 'Keep it going! - 1 day ago' },
                ].map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <button
                      key={i}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all duration-200 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={15} className={n.color} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">{n.text}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{n.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all shadow-lg shadow-purple-500/10">
            U
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white leading-tight">User</p>
            <p className="text-[10px] text-gray-500 leading-tight">Level 7</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
