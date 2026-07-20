import { Router } from 'express'
import db from '../config/database.js'

const router = Router()

const AI_ENDPOINT = 'https://opencode.ai/zen/v1/chat/completions'

async function callAI(messages, model = 'deepseek-v4-flash-free', maxTokens = 4000) {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('[AI] DEEPSEEK_API_KEY not set in environment')
    return { choices: [], error: 'API key not configured' }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 50000)
  try {
    console.error('[AI] Sending request to', AI_ENDPOINT, 'model:', model)
    const resp = await fetch(AI_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    })
    clearTimeout(timer)
    if (!resp.ok) {
      const text = await resp.text()
      console.error('[AI] HTTP', resp.status, text)
      return { choices: [], error: 'AI service error (HTTP ' + resp.status + ')' }
    }
    const text = await resp.text()
    try { return JSON.parse(text) } catch {
      return { choices: [], error: 'AI returned invalid response' }
    }
  } catch (err) {
    clearTimeout(timer)
    console.error('[AI] Error:', err?.message || err)
    return { choices: [], error: err?.message || 'unknown' }
  }
}

function parseJSON(str) {
  try { return JSON.parse(str) } catch {}
  try {
    const m = str.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (m) return JSON.parse(m[1].trim())
  } catch {}
  try {
    const start = str.indexOf('[')
    const end = str.lastIndexOf(']')
    if (start !== -1 && end > start) return JSON.parse(str.slice(start, end + 1))
  } catch {}
  try {
    const start = str.indexOf('{')
    const end = str.lastIndexOf('}')
    if (start !== -1 && end > start) return JSON.parse(str.slice(start, end + 1))
  } catch {}
  return null
}

async function translateToMarathi(text) {
  try {
    const resp = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(text)}`
    )
    const data = await resp.json()
    if (Array.isArray(data?.[0])) return data[0].map(s => s[0]).join('\n')
    return data?.[0]?.[0]?.[0] || text
  } catch {
    return text
  }
}

router.post('/generate', async (req, res, next) => {
  try {
    const { type = 'reallife', model = 'deepseek-v4-flash-free' } = req.body
    const isCorporate = type === 'corporate'

    const prompt = isCorporate
      ? `Generate 40 English corporate/office communication sentences. These must be real professional phrases used in meetings, emails, presentations, negotiations, and daily office life. Return ONLY a valid JSON array of 40 strings like: ["sentence 1", "sentence 2", ...]. No other text.`
      : `Generate 40 English real-life everyday sentences. These must be common phrases used in daily life — waking up, eating, shopping, travel, family conversations, friends, weather, health, hobbies, etc. Return ONLY a valid JSON array of 40 strings like: ["sentence 1", "sentence 2", ...]. No other text.`

    const data = await callAI([
      { role: 'system', content: 'Output ONLY a valid JSON array of exactly 40 strings. No other text or formatting.' },
      { role: 'user', content: prompt }
    ], model, 8000)

    const content = data.choices?.[0]?.message?.content || data.error || '[]'
    if (!content || content === '[]') return res.status(500).json({ error: 'AI generation failed: ' + (data.error || 'No response from API') })
    let sentences = parseJSON(content) || []
    if (!Array.isArray(sentences) || sentences.length === 0) return res.status(500).json({ error: 'AI returned invalid data' })
    if (sentences.length > 40) sentences = sentences.slice(0, 40)

    const result = []
    for (const s of sentences) {
      const mr = await translateToMarathi(s)
      result.push({ sentence: s, translation: mr })
    }

    res.json(result)
  } catch (err) { next(err) }
})

router.get('/', async (req, res) => {
  try {
    const { category = 'reallife' } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const offset = (page - 1) * limit
    const totalRows = await db.query('SELECT COUNT(*) as total FROM saved_sentences WHERE category = ?', [category]); const total = totalRows[0].total
    const rows = await db.query('SELECT * FROM saved_sentences WHERE category = ? ORDER BY is_important DESC, created_at DESC LIMIT ? OFFSET ?', [category, limit, offset])
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { category, sentence, translation } = req.body
    if (!category || !sentence) return res.status(400).json({ error: 'category and sentence required' })
    const result = await db.query(
      'INSERT INTO saved_sentences (category, sentence, translation) VALUES (?,?,?)',
      [category, sentence, translation || null]
    )
    const rows = await db.query('SELECT * FROM saved_sentences WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM saved_sentences WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/important', async (req, res) => {
  try {
    const { important } = req.body
    await db.query('UPDATE saved_sentences SET is_important = ? WHERE id = ?', [important ? 1 : 0, req.params.id])
    const rows = await db.query('SELECT * FROM saved_sentences WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
