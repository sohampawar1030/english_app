import express from 'express'
import cors from 'cors'
import wordsRouter from './routes/words.js'
import sentencesRouter from './routes/sentences.js'
import db from './config/database.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/words', wordsRouter)
app.use('/api/sentences', sentencesRouter)

db.query(`
  CREATE TABLE IF NOT EXISTS saved_sentences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(20) NOT NULL,
    sentence TEXT NOT NULL,
    translation TEXT,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Table creation error:', err))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/translate', async (req, res) => {
  try {
    const word = req.query.q
    if (!word) return res.status(400).json({ error: 'q required' })
    const sl = req.query.sl || 'auto'
    const tl = req.query.tl || ( /[\u0900-\u097F]/.test(word) ? 'en' : 'mr' )
    const resp = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(word)}`
    )
    const data = await resp.json()
    res.json({ translation: data?.[0]?.[0]?.[0] || word, detected: data?.[2] || sl })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
