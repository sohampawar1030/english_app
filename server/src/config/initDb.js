import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const schema = `
-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  theme VARCHAR(50) DEFAULT 'dark',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  total_xp BIGINT DEFAULT 0,
  level INT DEFAULT 1,
  coins BIGINT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  total_words_learned INT DEFAULT 0,
  total_revisions_completed INT DEFAULT 0,
  total_quizzes_completed INT DEFAULT 0,
  grammar_score DECIMAL(5,2) DEFAULT 0,
  speaking_score DECIMAL(5,2) DEFAULT 0,
  reading_score DECIMAL(5,2) DEFAULT 0,
  writing_score DECIMAL(5,2) DEFAULT 0,
  vocabulary_score DECIMAL(5,2) DEFAULT 0,
  overall_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Word Database
CREATE TABLE IF NOT EXISTS words (
  id VARCHAR(36) PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  ipa_pronunciation VARCHAR(500),
  audio_url VARCHAR(500),
  marathi_meaning TEXT,
  hindi_meaning TEXT,
  english_meaning TEXT,
  synonyms TEXT,
  antonyms TEXT,
  root_word VARCHAR(255),
  word_family TEXT,
  difficulty ENUM('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
  frequency INT DEFAULT 1,
  part_of_speech VARCHAR(100),
  category VARCHAR(100),
  technical_category VARCHAR(100),
  examples JSON,
  interview_examples JSON,
  business_examples JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_word (word),
  INDEX idx_difficulty (difficulty),
  INDEX idx_category (category),
  INDEX idx_tech_category (technical_category)
);

-- User Vocabulary Tracking (Memory Engine)
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  status ENUM('new','learning','revision','mastered','long_term') DEFAULT 'new',
  memory_score DECIMAL(5,2) DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  last_seen TIMESTAMP NULL,
  next_revision TIMESTAMP NULL,
  revision_count INT DEFAULT 0,
  difficulty DECIMAL(5,2) DEFAULT 0,
  learning_time_seconds INT DEFAULT 0,
  personal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_word (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_next_revision (user_id, next_revision)
);

-- Spaced Repetition Log
CREATE TABLE IF NOT EXISTS revision_log (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  revision_type ENUM('new','review','quiz','story','game') DEFAULT 'review',
  correct BOOLEAN DEFAULT false,
  response_time_ms INT DEFAULT 0,
  confidence_before DECIMAL(5,2) DEFAULT 0,
  confidence_after DECIMAL(5,2) DEFAULT 0,
  interval_day INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  INDEX idx_user_word (user_id, word_id)
);

-- AI Stories
CREATE TABLE IF NOT EXISTS stories (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  marathi_translation TEXT,
  hindi_translation TEXT,
  grammar_explanation TEXT,
  vocabulary_highlight JSON,
  reading_time INT DEFAULT 0,
  difficulty_level VARCHAR(50) DEFAULT 'intermediate',
  word_frequency INT DEFAULT 0,
  words_used JSON,
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- AI Chat History
CREATE TABLE IF NOT EXISTS chat_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('user','assistant','system') NOT NULL,
  content TEXT NOT NULL,
  grammar_corrections JSON,
  vocabulary_suggestions JSON,
  message_type VARCHAR(50) DEFAULT 'general',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Grammar Exercises
CREATE TABLE IF NOT EXISTS grammar_exercises (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  exercise_type VARCHAR(100) NOT NULL,
  user_input TEXT NOT NULL,
  corrected_text TEXT,
  mistakes JSON,
  score DECIMAL(5,2) DEFAULT 0,
  suggestions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Speaking Sessions
CREATE TABLE IF NOT EXISTS speaking_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_type VARCHAR(100) DEFAULT 'practice',
  transcript TEXT,
  fluency_score DECIMAL(5,2) DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  speed_analysis JSON,
  pause_analysis JSON,
  accent_analysis JSON,
  suggestions JSON,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Interview Sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  interview_type VARCHAR(100) NOT NULL,
  role VARCHAR(255),
  questions JSON,
  answers JSON,
  feedback JSON,
  confidence_analysis JSON,
  vocabulary_analysis JSON,
  grammar_analysis JSON,
  overall_score DECIMAL(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, interview_type)
);

-- Writing Sessions
CREATE TABLE IF NOT EXISTS writing_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  writing_type VARCHAR(100) NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  corrected_content TEXT,
  grammar_check JSON,
  vocabulary_suggestions JSON,
  ai_improvements JSON,
  score DECIMAL(5,2) DEFAULT 0,
  word_count INT DEFAULT 0,
  is_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Reading Sessions
CREATE TABLE IF NOT EXISTS reading_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reading_type VARCHAR(100) NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  source_url VARCHAR(500),
  is_completed BOOLEAN DEFAULT false,
  reading_time_seconds INT DEFAULT 0,
  words_highlighted JSON,
  words_saved JSON,
  comprehension_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Gamification
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  badge_icon VARCHAR(255),
  badge_color VARCHAR(50),
  category VARCHAR(100),
  xp_reward INT DEFAULT 0,
  coin_reward INT DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, category)
);

CREATE TABLE IF NOT EXISTS missions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mission_type ENUM('daily','weekly','monthly') DEFAULT 'daily',
  xp_reward INT DEFAULT 0,
  coin_reward INT DEFAULT 0,
  requirement_type VARCHAR(100),
  requirement_count INT DEFAULT 1,
  progress INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  is_reward_claimed BOOLEAN DEFAULT false,
  starts_at TIMESTAMP NULL,
  ends_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, mission_type)
);

-- Knowledge Vault
CREATE TABLE IF NOT EXISTS knowledge_notes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  tags JSON,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, category),
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Learning Activity Log
CREATE TABLE IF NOT EXISTS learning_activity (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_activity (user_id, activity_type, created_at DESC)
);

-- Daily Progress
CREATE TABLE IF NOT EXISTS daily_progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  words_learned INT DEFAULT 0,
  words_revised INT DEFAULT 0,
  stories_read INT DEFAULT 0,
  quizzes_taken INT DEFAULT 0,
  speaking_practice INT DEFAULT 0,
  writing_done INT DEFAULT 0,
  reading_done INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  minutes_active INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  daily_word_goal INT DEFAULT 10,
  daily_revision_goal INT DEFAULT 20,
  daily_minutes_goal INT DEFAULT 30,
  native_language VARCHAR(50) DEFAULT 'marathi',
  learning_language VARCHAR(50) DEFAULT 'english',
  speaking_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  sound_effects BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
  });

  try {
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        await connection.execute(statement.trim());
      }
    }
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
