import pool from '../config/database.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId, paginate } from '../utils/helpers.js';

export const createNote = async (req, res, next) => {
  try {
    const { title, content, category, subCategory, tags } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const id = generateId();
    await pool.execute(
      `INSERT INTO knowledge_notes (id, user_id, title, content, category, sub_category, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, title, content || null, category, subCategory || null,
       tags ? JSON.stringify(tags) : null]
    );

    await memoryEngine.logActivity(req.userId, 'note_created', `Created note: ${title}`, 5, 2);

    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { category, search } = req.query;

    let query = 'SELECT * FROM knowledge_notes WHERE user_id = ?';
    const params = [req.userId];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [countResult] = await pool.execute(
      query.replace('SELECT *', 'SELECT COUNT(*) as total'), params
    );

    query += ' ORDER BY is_favorite DESC, updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    res.json({
      notes: rows,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM knowledge_notes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { title, content, category, subCategory, tags, isFavorite } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (subCategory !== undefined) { updates.push('sub_category = ?'); params.push(subCategory); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
    if (isFavorite !== undefined) { updates.push('is_favorite = ?'); params.push(isFavorite); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.id, req.userId);
    await pool.execute(
      `UPDATE knowledge_notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    res.json({ message: 'Note updated' });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM knowledge_notes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT category, COUNT(*) as count FROM knowledge_notes 
       WHERE user_id = ? GROUP BY category ORDER BY count DESC`,
      [req.userId]
    );
    res.json({ categories: rows });
  } catch (error) {
    next(error);
  }
};
