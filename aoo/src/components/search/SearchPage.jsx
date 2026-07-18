import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, BookMarked, MessageSquare, PenTool,
  SpellCheck, FileText, X, ArrowRight, Clock, Filter
} from 'lucide-react';
import * as searchApi from '../../api/search';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const typeConfig = {
  words: { icon: BookMarked, label: 'Words', color: '#c084fc', bg: 'rgba(192,132,252,0.1)', path: '/vocabulary' },
  stories: { icon: BookOpen, label: 'Stories', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/stories' },
  notes: { icon: FileText, label: 'Notes', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', path: '/vault' },
  grammar: { icon: SpellCheck, label: 'Grammar', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', path: '/grammar' },
  writing: { icon: PenTool, label: 'Writing', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', path: '/writing' },
  chat: { icon: MessageSquare, label: 'Chat', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', path: '/chat' },
};

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

function renderTypeIcon(type) {
  const entry = typeConfig[type];
  if (!entry) return null;
  const Icon = entry.icon;
  return <Icon size={18} style={{ color: entry.color }} />;
}

function SearchResult({ result, type, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      onClick={() => onSelect(result, type)}
      className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: typeConfig[type]?.bg || 'rgba(192,132,252,0.1)' }}>
        {typeConfig[type] && renderTypeIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{result.title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{result.snippet}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="badge" style={{ background: `${typeConfig[type]?.color || '#c084fc'}20`, color: typeConfig[type]?.color || '#c084fc' }}>
          {typeConfig[type]?.label || type}
        </span>
        <ArrowRight size={14} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
      </div>
    </motion.button>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults(null);
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const [searchResults, sugg] = await Promise.all([
        searchApi.globalSearch(q, { types: activeFilters.length ? activeFilters : undefined }),
        searchApi.searchSuggestions(q),
      ]);
      setResults(searchResults);
      setSuggestions(sugg?.suggestions || []);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  const handleInputChange = (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSelectResult = (result, type) => {
    const config = typeConfig[type];
    if (config?.path && result?.path) {
      navigate(config.path + (result.path || ''));
    } else if (config?.path) {
      navigate(config.path);
    }
  };

  const groupedResults = useMemo(() => {
    if (!results?.groups) return {};
    return results.groups;
  }, [results]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Search Input */}
      <motion.div variants={itemVariants} className="relative">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="input-premium pl-12 pr-4 py-4 text-lg"
            placeholder="Search words, stories, notes, grammar, writing, chat..."
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults(null); setSuggestions([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && !results && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card absolute top-full left-0 right-0 mt-2 p-2 z-50"
            >
              <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 py-1">Suggestions</p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); handleInputChange(s); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all text-left"
                >
                  <Clock size={14} className="text-gray-600" />
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter Chips */}
      {query && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilters([])}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilters.length === 0
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Filter size={12} />
            All
          </button>
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeFilters.includes(key);
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveFilters(prev =>
                    prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? 'border-purple-500/30 bg-purple-500/15 text-purple-300'
                    : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={12} />
                {config.label}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {!query ? (
          <motion.div key="empty" variants={itemVariants}>
            <EmptyState icon={Search} title="Search everything" desc="Search words, stories, notes, grammar rules, writing, and chat history" />
          </motion.div>
        ) : loading ? (
          <motion.div key="loading" variants={itemVariants} className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl w-full" />)}
          </motion.div>
        ) : !results || Object.keys(groupedResults).length === 0 ? (
          <motion.div key="no-results" variants={itemVariants}>
            <EmptyState icon={Search} title="No results found" desc={`No results for "${query}". Try a different search term.`} />
          </motion.div>
        ) : (
          <motion.div key="results" variants={itemVariants} className="space-y-6">
            {Object.entries(groupedResults).map(([type, items]) => {
              const config = typeConfig[type];
              if (!config || !items?.length) return null;
              const Icon = config.icon;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.bg }}>
                      <Icon size={16} style={{ color: config.color }} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                    <span className="text-xs text-gray-500">({items.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <SearchResult key={item.id || i} result={item} type={type} onSelect={handleSelectResult} />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
