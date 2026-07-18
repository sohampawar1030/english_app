import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

const navItems = [
  { icon: Icons.LayoutDashboard, label: 'Dashboard', path: '/' },
  {
    icon: Icons.BookOpen,
    label: 'Vocabulary',
    path: '/vocabulary',
    children: [
      { label: 'Learn', path: '/vocabulary/learn' },
      { label: 'Revision', path: '/vocabulary/revision' },
      { label: 'My Words', path: '/vocabulary/my-words' },
    ],
  },
  { icon: Icons.Feather, label: 'Stories', path: '/stories' },
  { icon: Icons.MessageSquare, label: 'AI Chat', path: '/chat' },
  { icon: Icons.BookMarked, label: 'Reading', path: '/reading' },
];

const bottomItems = [
  { icon: Icons.Settings, label: 'Settings', path: '/settings' },
  { icon: Icons.User, label: 'Profile', path: '/profile' },
];

function NavItem({ item, collapsed, isActive, depth }) {
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const location = useLocation();
  const isChildActive = hasChildren && item.children.some(c => location.pathname === c.path);

  if (collapsed) {
    return (
      <div className="relative group">
        <Link
          to={item.path}
          className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200 ${
            isActive || isChildActive
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 text-purple-400 shadow-lg shadow-purple-500/10'
              : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Icon size={20} />
        </Link>
        <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl glass-strong text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <Icon size={12} className="text-purple-400" />
            {item.label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={item.path}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
          isActive || isChildActive
            ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/5 text-purple-300 shadow-sm shadow-purple-500/5'
            : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="navActive"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-400 shadow-lg shadow-purple-500/30"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <Icon size={20} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <motion.span className="text-sm font-medium" layout>
          {item.label}
        </motion.span>
        {hasChildren && (
          <motion.div
            className="ml-auto"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Icons.ChevronDown size={14} className="text-gray-600" />
          </motion.div>
        )}
      </Link>
      <AnimatePresence>
        {hasChildren && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/[0.04] pl-3">
              {item.children.map((child) => {
                const childActive = location.pathname === child.path;
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      childActive
                        ? 'text-purple-300 bg-purple-500/10'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className={`w-1 h-1 rounded-full transition-all duration-200 ${childActive ? 'bg-purple-400 shadow-lg shadow-purple-500/50' : 'bg-gray-600'}`} />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ mobileSidebar, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isCollapsed = mobileSidebar ? false : collapsed;

  return (
    <motion.aside
      layout
      className="relative z-40 flex flex-col h-screen border-r border-white/[0.04]"
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 glass" />

      <div className="relative flex flex-col h-full">
        <div className="flex items-center h-16 px-4 border-b border-white/[0.04]">
          <motion.div layout className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
              <span className="text-white font-bold text-sm tracking-tight">EO</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-base font-bold whitespace-nowrap">
                    <span className="text-gradient">English OS</span>
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="ml-auto flex items-center gap-1">
            {!mobileSidebar && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-7 h-7 rounded-lg hidden md:flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
              >
                <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <Icons.PanelLeftClose size={15} />
                </motion.div>
              </button>
            )}
            {mobileSidebar && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
              >
                <Icons.X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-2.5 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              collapsed={isCollapsed}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>

        <div className="relative border-t border-white/[0.04] pt-2 pb-3 px-2.5 space-y-0.5">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            if (isCollapsed) {
              return (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    onClick={mobileSidebar ? onClose : undefined}
                    className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 text-purple-400'
                        : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={20} />
                  </Link>
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl glass-strong text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-2xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="text-purple-400" />
                      {item.label}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={mobileSidebar ? onClose : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/5 text-purple-300'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="navActiveBottom"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-400 shadow-lg shadow-purple-500/30"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={20} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative border-t border-white/[0.04] px-3 py-3 hidden md:block"
            >
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/[0.07] to-pink-500/[0.03] border border-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10">
                    L7
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white">Level 7</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icons.Flame size={10} className="text-orange-400" />
                      <span className="text-[10px] text-gray-500">2,450 XP</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/[0.04] px-2 py-1 rounded-lg">
                    <Icons.Zap size={10} className="text-yellow-400" />
                    <span>12</span>
                  </div>
                </div>
                <div className="mt-2.5 progress-bar">
                  <div className="progress-bar-fill" style={{ width: '65%' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
