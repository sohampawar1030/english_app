import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { message, messageType = 'general' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const [weaknesses] = await pool.execute(
      `SELECT metadata FROM learning_activity 
       WHERE user_id = ? AND activity_type = 'grammar_mistake'
       ORDER BY created_at DESC LIMIT 10`,
      [req.userId]
    );

    const weaknessMap = {};
    weaknesses.forEach(w => {
      if (w.metadata) {
        const data = typeof w.metadata === 'string' ? JSON.parse(w.metadata) : w.metadata;
        Object.assign(weaknessMap, data);
      }
    });

    const [history] = await pool.execute(
      `SELECT role, content FROM chat_history 
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [req.userId]
    );

    const chatHistory = history.reverse().map(h => ({
      role: h.role,
      content: h.content
    }));

    await pool.execute(
      `INSERT INTO chat_history (id, user_id, role, content, message_type)
       VALUES (?, ?, 'user', ?, ?)`,
      [generateId(), req.userId, message, messageType]
    );

    const response = await aiService.chatWithTeacher(message, chatHistory, weaknessMap);

    const replyId = generateId();
    await pool.execute(
      `INSERT INTO chat_history (id, user_id, role, content, grammar_corrections, 
        vocabulary_suggestions, message_type, metadata)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)`,
      [replyId, req.userId, response.reply,
       JSON.stringify(response.grammarCorrections),
       JSON.stringify(response.suggestions),
       messageType, JSON.stringify({ corrections: response.grammarCorrections })]
    );

    if (response.grammarCorrections?.length > 0) {
      await memoryEngine.logActivity(req.userId, 'grammar_mistake', 'Grammar corrected in chat', 5, 2,
        response.grammarCorrections);
    }

    await memoryEngine.logActivity(req.userId, 'chat_message', 'Chat with AI teacher', 5, 2);

    res.json({
      reply: response.reply,
      grammarCorrections: response.grammarCorrections,
      suggestions: response.suggestions,
      messageId: replyId
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const { limit = 50, before } = req.query;
    let query = `SELECT * FROM chat_history WHERE user_id = ?`;
    const params = [req.userId];

    if (before) {
      query += ' AND created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.execute(query, params);
    res.json({ messages: rows.reverse() });
  } catch (error) {
    next(error);
  }
};

export const clearChatHistory = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM chat_history WHERE user_id = ?', [req.userId]);
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    next(error);
  }
};
