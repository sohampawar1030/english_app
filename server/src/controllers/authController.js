import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { generateId } from '../utils/helpers.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [id, email, passwordHash, name]
    );

    const profileId = generateId();
    await pool.execute(
      'INSERT INTO user_profiles (id, user_id) VALUES (?, ?)',
      [profileId, id]
    );

    const settingsId = generateId();
    await pool.execute(
      'INSERT INTO user_settings (id, user_id) VALUES (?, ?)',
      [settingsId, id]
    );

    const jwtOptions = {};
    if (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN !== 'never') {
      jwtOptions.expiresIn = process.env.JWT_EXPIRES_IN;
    }
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, jwtOptions);

    res.status(201).json({ token, user: { id, email, name } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtOptions = {};
    if (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN !== 'never') {
      jwtOptions.expiresIn = process.env.JWT_EXPIRES_IN;
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, jwtOptions);

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.created_at,
              up.*
       FROM users u
       JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    if (name) {
      await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.userId]);
    }
    if (avatar_url) {
      await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, req.userId]);
    }
    res.json({ message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};
