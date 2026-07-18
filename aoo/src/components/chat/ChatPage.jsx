import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Sparkles, ChevronDown, ChevronUp,
  RefreshCw, MessageCircle, Trash2, AlertCircle, Loader2,
  Lightbulb, ArrowRight
} from 'lucide-react';
import * as chatApi from '../../api/chat';

const suggestedTopics = [
  'Introduce yourself',
  'Order food at a restaurant',
  'Talk about your hobby',
  'Describe your daily routine',
  'Ask for directions',
  'Talk about the weather',
];

const quickReplies = [
  'What does this word mean?',
  'Can you correct this sentence?',
  'Give me an example',
  'Explain the grammar rule',
  'How do I pronounce this?',
];

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3"
    >
      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-purple-400" />
      </div>
      <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-purple-400"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const isUser = message.role === 'user' || message.sender === 'user';

  const corrections = message.corrections || message.grammarCorrections || [];
  const suggestions = message.suggestions || message.vocabSuggestions || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-start gap-3 px-4 py-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg glow-purple'
            : 'glass-card'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-purple-400" />
        )}
      </div>

      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="bg-gradient-to-r from-purple-600/80 to-purple-500/80 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white shadow-lg">
            {message.text || message.content || message.message}
          </div>
        ) : (
          <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-200 leading-relaxed">
            {message.text || message.content || message.message || ''}

            {corrections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setCorrectionOpen(!correctionOpen)}
                  className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  {correctionOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  Grammar Corrections ({corrections.length})
                </button>

                <AnimatePresence>
                  {correctionOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 mt-2">
                        {corrections.map((c, i) => (
                          <div key={i} className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-red-400 line-through">{c.original || c.wrong}</span>
                              <ArrowRight className="w-3 h-3 text-gray-500" />
                              <span className="text-green-400">{c.corrected || c.correction || c.fix}</span>
                            </div>
                            {c.explanation && (
                              <p className="text-xs text-gray-500 mt-1">{c.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <span
                    key={i}
                    className="badge badge-purple"
                  >
                    {s.word || s.text || s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {message.timestamp && (
          <p className={`text-[10px] text-gray-600 ${isUser ? 'text-right' : ''}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
          <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
          <div className={`space-y-2 flex-1 ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
            <div className={`skeleton rounded-2xl h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-3/4'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onTopicClick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-6"
    >
      <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
        <MessageCircle className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">Start a conversation</h3>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Practice English with your AI teacher. Pick a topic or type anything to begin.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {suggestedTopics.slice(0, 4).map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicClick(topic)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium glass-card border-white/10 text-gray-400 hover:text-purple-300 hover:border-purple-500/30 transition-all"
          >
            {topic}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-1">Connection error</h3>
      <p className="text-gray-500 text-sm mb-5">{message || 'Failed to load chat history.'}</p>
      <button onClick={onRetry} className="btn-secondary flex items-center gap-2 text-sm">
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopics, setShowTopics] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.getChatHistory();
      const history = data?.messages || data?.history || data?.data || [];
      setMessages(history);
    } catch (err) {
      setError(err?.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await chatApi.getChatHistory();
        if (mounted) setMessages(data?.messages || data?.history || data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to load chat history');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput('');
    setShowTopics(false);

    const userMsg = { role: 'user', sender: 'user', text: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const data = await chatApi.sendMessage(msg);
      const reply = data?.reply || data?.message || data?.response || data?.data;
      const aiMsg = {
        role: 'assistant',
        sender: 'ai',
        text: typeof reply === 'string' ? reply : reply?.text || reply?.content || JSON.stringify(reply),
        corrections: data?.corrections || reply?.corrections || [],
        suggestions: data?.suggestions || reply?.vocabSuggestions || reply?.suggestions || [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          sender: 'ai',
          text: 'Sorry, I encountered an error. Please try again.',
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    try {
      await chatApi.clearChatHistory();
      setMessages([]);
      setShowTopics(true);
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-gradient">AI Chat Teacher</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center"
          >
            <Bot className="w-5 h-5 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-gradient">AI Chat Teacher</h1>
            <p className="text-xs text-gray-500">Practice English conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="btn-secondary flex items-center gap-2 text-xs px-3 py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {error && !messages.length ? (
          <ErrorState message={error} onRetry={loadHistory} />
        ) : messages.length === 0 ? (
          <EmptyState onTopicClick={(topic) => handleSend(topic)} />
        ) : (
          <div className="space-y-1">
            {messages.map((msg, i) => (
              <MessageBubble key={msg._id || msg.id || i} message={msg} />
            ))}
            <AnimatePresence>
              {sending && <TypingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 py-3 space-y-3">
        {showTopics && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
              <Lightbulb className="w-3 h-3" />
              Quick:
            </span>
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => handleSend(qr)}
                className="px-2.5 py-1 rounded-lg text-xs glass-card border-white/10 text-gray-400 hover:text-purple-300 hover:border-purple-500/30 transition-all"
              >
                {qr}
              </button>
            ))}
          </motion.div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="input-premium pr-12"
              disabled={sending}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-all bg-gradient-to-r from-purple-600 to-purple-500 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-lg glow-purple"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showTopics && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-1.5"
          >
            {suggestedTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSend(topic)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium glass-card border-white/10 text-gray-400 hover:text-purple-300 hover:border-purple-500/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                {topic}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
