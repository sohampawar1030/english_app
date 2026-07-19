import { Router } from 'express'
import pool from '../config/database.js'
import { generate } from 'random-words'

const router = Router()

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const words = generate({ exactly: 20, seed: today })

    const [existing] = await pool.query(
      'SELECT word, marathi_meaning, english_meaning FROM words WHERE word IN (?)',
      [words]
    )
    const meaningMap = {}
    for (const w of existing) {
      meaningMap[w.word] = w.marathi_meaning || w.english_meaning || w.word
    }

    const result = await Promise.all(words.map(async (word) => {
      let meaning = meaningMap[word]
      if (!meaning) {
        try {
          const resp = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|mr`
          )
          const data = await resp.json()
          meaning = data?.responseData?.translatedText || word
        } catch {
          meaning = word
        }
      }
      return { word, meaning }
    }))

    res.json(result)
  } catch (err) {
    console.error('Error fetching today words:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM my_words ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    console.error('Error fetching words:', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { word, meaning, example } = req.body
    if (!word || !meaning) {
      return res.status(400).json({ error: 'Word and meaning are required' })
    }
    const [result] = await pool.query(
      'INSERT INTO my_words (word, meaning, example) VALUES (?, ?, ?)',
      [word, meaning, example || null]
    )
    const [rows] = await pool.query('SELECT * FROM my_words WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Error adding word:', err)
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM my_words WHERE id = ?', [req.params.id])
    res.json({ message: 'Word deleted' })
  } catch (err) {
    console.error('Error deleting word:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
