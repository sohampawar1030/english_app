import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '..', '.env') })

async function init() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 3306
    })

    console.log('Connected to MySQL')

    const [tables] = await connection.query('SHOW TABLES')
    console.log('Existing tables:', tables.map(t => Object.values(t)[0]))

    const [existing] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('my_words', 'words', 'user_vocabulary')`,
      [process.env.DB_NAME]
    )
    console.log('Word-related tables found:', existing.map(t => t.TABLE_NAME))

    await connection.query(`
      CREATE TABLE IF NOT EXISTS my_words (
        id INT AUTO_INCREMENT PRIMARY KEY,
        word VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        example TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('my_words table ready')

    const [rows] = await connection.query('SELECT COUNT(*) as count FROM my_words')
    console.log('Words in my_words:', rows[0].count)

    if (rows[0].count === 0) {
      const [wordRows] = await connection.query(`
        SELECT DISTINCT w.word, w.marathi_meaning, w.examples
        FROM words w
        INNER JOIN user_vocabulary uv ON uv.word_id = w.id
        LIMIT 100
      `)
      if (wordRows.length > 0) {
        console.log('Found', wordRows.length, 'words from user vocabulary, copying...')
        for (const w of wordRows) {
          let example = null
          if (w.examples) {
            try {
              const parsed = JSON.parse(w.examples)
              example = Array.isArray(parsed) ? parsed[0] : parsed
            } catch {
              example = w.examples
            }
          }
          await connection.query(
            'INSERT IGNORE INTO my_words (word, meaning, example) VALUES (?, ?, ?)',
            [w.word, w.marathi_meaning || w.word, example]
          )
        }
      } else {
        const [allWords] = await connection.query(
          'SELECT word, marathi_meaning, examples FROM words LIMIT 50'
        )
        console.log('Found', allWords.length, 'words from words table, copying...')
        for (const w of allWords) {
          let example = null
          if (w.examples) {
            try {
              const parsed = JSON.parse(w.examples)
              example = Array.isArray(parsed) ? parsed[0] : parsed
            } catch {
              example = w.examples
            }
          }
          await connection.query(
            'INSERT IGNORE INTO my_words (word, meaning, example) VALUES (?, ?, ?)',
            [w.word, w.marathi_meaning || w.word, example]
          )
        }
      }
      const [newCount] = await connection.query('SELECT COUNT(*) as count FROM my_words')
      console.log('Copied words:', newCount[0].count)
    }

    const [sample] = await connection.query('SELECT * FROM my_words LIMIT 5')
    console.log('Sample words:', sample)

    await connection.end()
    console.log('Done')
  } catch (err) {
    console.error('Error:', err.message)
  }
}

init()
