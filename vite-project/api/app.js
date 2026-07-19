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

export default app
