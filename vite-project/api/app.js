import express from 'express'
import cors from 'cors'
import wordsRouter from './routes/words.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/words', wordsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/translate', async (req, res) => {
  try {
    const word = req.query.q
    if (!word) return res.status(400).json({ error: 'q required' })
    const resp = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(word)}`
    )
    const data = await resp.json()
    res.json({ translation: data?.[0]?.[0]?.[0] || word })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
