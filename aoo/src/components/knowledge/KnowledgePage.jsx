import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked, Plus, Search, Star, Grid3X3, List, FolderOpen,
  Calendar, X, Edit3, Trash2, Save,
  Clock, ArrowLeft
} from 'lucide-react';
import * as knowledgeApi from '../../api/knowledge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const categories = [
  { key: 'all', label: 'All', icon: FolderOpen, color: '#c084fc' },
  { key: 'aws', label: 'AWS', icon: BookMarked, color: '#ff9900' },
  { key: 'react', label: 'React', icon: BookMarked, color: '#61dafb' },
  { key: 'node', label: 'Node', icon: BookMarked, color: '#339933' },
  { key: 'express', label: 'Express', icon: BookMarked, color: '#68a063' },
  { key: 'devops', label: 'DevOps', icon: BookMarked, color: '#f05032' },
  { key: 'docker', label: 'Docker', icon: BookMarked, color: '#2496ed' },
  { key: 'linux', label: 'Linux', icon: BookMarked, color: '#fcc624' },
  { key: 'ai', label: 'AI', icon: BookMarked, color: '#c084fc' },
  { key: 'office', label: 'Office', icon: BookMarked, color: '#d83b01' },
  { key: 'interview', label: 'Interview', icon: BookMarked, color: '#22c55e' },
  { key: 'personal', label: 'Personal', icon: BookMarked, color: '#f59e0b' },
];

const categoryColors = {
  aws: '#ff9900', react: '#61dafb', node: '#339933', express: '#68a063',
  devops: '#f05032', docker: '#2496ed', linux: '#fcc624', ai: '#c084fc',
  office: '#d83b01', interview: '#22c55e', personal: '#f59e0b',
};

function LoadingState() {
  return (
    <div className="space-y-6 pb-8">
      <div className="skeleton h-12 w-full rounded-2xl" />
      <div className="flex gap-2">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-8 w-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
      </div>
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

function NoteCard({ note, onToggleFavorite, onSelect, viewMode }) {
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4 }}
        onClick={() => onSelect(note)}
        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${categoryColors[note.category] || '#c084fc'}15` }}>
          <BookMarked size={18} style={{ color: categoryColors[note.category] || '#c084fc' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white truncate">{note.title}</p>
            <span className="badge shrink-0" style={{ background: `${categoryColors[note.category] || '#c084fc'}20`, color: categoryColors[note.category] || '#c084fc' }}>
              {note.category}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{note.preview}</p>
          <p className="text-[10px] text-gray-600 mt-1">{note.date}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
          className="shrink-0 text-gray-600 hover:text-yellow-400 transition-colors"
        >
          <Star size={14} className={note.favorite ? 'fill-yellow-400 text-yellow-400' : ''} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={() => onSelect(note)}
      className="glass-card p-4 group cursor-pointer hover-lift"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${categoryColors[note.category] || '#c084fc'}15` }}>
          <BookMarked size={18} style={{ color: categoryColors[note.category] || '#c084fc' }} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
          className="text-gray-600 hover:text-yellow-400 transition-colors"
        >
          <Star size={14} className={note.favorite ? 'fill-yellow-400 text-yellow-400' : ''} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="badge" style={{ background: `${categoryColors[note.category] || '#c084fc'}20`, color: categoryColors[note.category] || '#c084fc' }}>
            {note.category}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{note.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{note.preview}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-600 pt-1">
          <Clock size={10} />
          <span>{note.date}</span>
        </div>
      </div>
    </motion.div>
  );
}

function NoteDetail({ note, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await knowledgeApi.updateNote(note.id, { title, content, category });
      onUpdate({ ...note, title, content, category });
      setEditMode(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await knowledgeApi.deleteNote(note.id);
      onDelete(note.id);
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onDelete(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {editMode ? (
        <div className="space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input-premium text-lg font-semibold"
            placeholder="Note title"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="input-premium"
          >
            {categories.filter(c => c.key !== 'all').map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="input-premium min-h-[200px] resize-y"
            placeholder="Write your note..."
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-premium flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => onDelete(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: `${categoryColors[note.category] || '#c084fc'}20`, color: categoryColors[note.category] || '#c084fc' }}>
              {note.category}
            </span>
            {note.tags?.map(tag => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
          <h2 className="text-xl font-bold text-white">{note.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          <div className="flex items-center gap-2 text-xs text-gray-600 pt-4">
            <Calendar size={12} />
            <span>{note.date}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CreateNoteModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('react');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const note = await knowledgeApi.createNote({
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onCreate(note);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-strong w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gradient">Create New Note</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-premium"
              placeholder="Note title..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-premium"
            >
              {categories.filter(c => c.key !== 'all').map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="input-premium"
              placeholder="react, hooks, state"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input-premium min-h-[200px] resize-y"
              placeholder="Write your note..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={!title.trim() || saving} className="btn-premium flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Creating...' : 'Create Note'}
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function KnowledgePage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchNotes() {
      try {
        const data = await knowledgeApi.getNotes();
        if (!cancelled) setNotes(data?.notes || []);
      } catch {
        if (!cancelled) setNotes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchNotes();
    return () => { cancelled = true; };
  }, []);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeCategory !== 'all') {
      result = result.filter(n => n.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = { all: notes.length };
    notes.forEach(n => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });
    return counts;
  }, [notes]);

  const handleToggleFavorite = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      await knowledgeApi.updateNote(id, { favorite: !note.favorite });
      setNotes(prev => prev.map(n => n.id === id ? { ...n, favorite: !n.favorite } : n));
    } catch { /* ignore */ }
  };

  const handleCreateNote = (note) => {
    setNotes(prev => [note, ...prev]);
    setShowCreate(false);
  };

  const handleUpdateNote = (updated) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setSelectedNote(updated);
  };

  const handleDeleteNote = (id) => {
    if (id === null) { setSelectedNote(null); return; }
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedNote(null);
  };

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
          <h1 className="text-2xl font-bold text-gradient">Knowledge Vault</h1>
          <p className="text-sm text-gray-500 mt-1">{notes.length} notes saved</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-premium pl-9 w-full sm:w-56"
              placeholder="Search notes..."
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-premium flex items-center gap-2">
            <Plus size={16} />
            New Note
          </button>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={itemVariants} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-60">({categoryCounts[cat.key] || 0})</span>
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedNote ? (
          <NoteDetail
            key="detail"
            note={selectedNote}
            onBack={() => setSelectedNote(null)}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
          />
        ) : filteredNotes.length === 0 ? (
          <motion.div key="empty" variants={itemVariants}>
            <EmptyState icon={BookMarked} title="No notes found" desc="Create your first note to start building your knowledge vault" />
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div key="grid" variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode="grid"
                onToggleFavorite={handleToggleFavorite}
                onSelect={setSelectedNote}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" variants={itemVariants} className="space-y-2">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode="list"
                onToggleFavorite={handleToggleFavorite}
                onSelect={setSelectedNote}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateNoteModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateNote}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
