import { Router } from 'express'
import db from '../config/database.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const wordsArray = require('an-array-of-english-words')

const router = Router()

const MODELS = {
  'deepseek-v4-flash-free': 'DeepSeek V4 Flash Free',
  'mimo-v2.5-free': 'MiMo-V2.5 Free',
  'hy3-free': 'Hy3 Free',
  'nemotron-3-ultra-free': 'Nemotron 3 Ultra Free',
  'north-mini-code-free': 'North Mini Code Free'
}

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
      console.error('[AI] HTTP', resp.status, await resp.text())
      return { choices: [], error: 'HTTP ' + resp.status }
    }
    return resp.json()
  } catch (err) {
    clearTimeout(timer)
    console.error('[AI] Error:', err?.message || err)
    return { choices: [], error: err?.message || 'unknown' }
  }
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

function generateTenses(word) {
  const w = word.toLowerCase()
  const ing = w.endsWith('e') ? w.slice(0, -1) + 'ing' : w + 'ing'
  const ed = w.endsWith('e') ? w + 'd' : w + 'ed'
  const s = w + 's'

  return [
    { tense: 'Present Simple', sentence: `I ${w} it every day.` },
    { tense: 'Present Continuous', sentence: `I am ${ing} it right now.` },
    { tense: 'Present Perfect', sentence: `I have ${ed} it before.` },
    { tense: 'Present Perfect Continuous', sentence: `I have been ${ing} it for a while.` },
    { tense: 'Past Simple', sentence: `I ${ed} it yesterday.` },
    { tense: 'Past Continuous', sentence: `I was ${ing} it when you arrived.` },
    { tense: 'Past Perfect', sentence: `I had ${ed} it earlier.` },
    { tense: 'Past Perfect Continuous', sentence: `I had been ${ing} it for hours.` },
    { tense: 'Future Simple', sentence: `I will ${w} it tomorrow.` },
    { tense: 'Future Continuous', sentence: `I will be ${ing} it at 5 PM.` },
    { tense: 'Future Perfect', sentence: `I will have ${ed} it by then.` },
    { tense: 'Future Perfect Continuous', sentence: `I will have been ${ing} it for hours.` },
  ]
}

router.post('/tense', async (req, res, next) => {
  try {
    const { word } = req.body
    if (!word) return res.status(400).json({ error: 'Word is required' })

    let meaning = ''
    try {
      const rows = await db.query('SELECT marathi_meaning FROM words WHERE word = ?', [word])
      if (rows.length > 0 && rows[0].marathi_meaning) {
        meaning = rows[0].marathi_meaning
      }
    } catch {}

    if (!meaning) {
      try {
        const tr = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(word)}`
        )
        const td = await tr.json()
        meaning = td?.[0]?.[0]?.[0] || word
      } catch { meaning = word }
    }

    let tenses = generateTenses(word)

    try {
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), 45000)
      const resp = await fetch(AI_ENDPOINT, {
        method: 'POST',
        signal: ac.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash-free',
          messages: [
            { role: 'system', content: 'Output ONLY a JSON array. No other text.' },
            { role: 'user', content: `Generate 12 short example sentences for the word "${word}". One per tense. Return JSON: [{"tense":"Present Simple","sentence":"..."}, ...]` }
          ],
          max_tokens: 2000
        })
      })
      clearTimeout(timer)
      const data = await resp.json()
      const aiTenses = JSON.parse(data.choices?.[0]?.message?.content || '[]')
      if (Array.isArray(aiTenses) && aiTenses.length === 12) {
        tenses = aiTenses
      }
    } catch {}

    const sentences = tenses.map(t => t.sentence)
    let mrSentences = []
    try {
      const tr = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(sentences.join('\n'))}`
      )
      const td = await tr.json()
      if (td?.[0]) {
        mrSentences = td[0].map(s => s[0])
      }
    } catch {}

    tenses = tenses.map((t, i) => ({
      ...t,
      mr: mrSentences[i] || ''
    }))

    res.json({ word, meaning, tenses })
  } catch (err) {
    next(err)
  }
})



router.post('/ai-today', async (req, res, next) => {
  try {
    const { model = 'deepseek-v4-flash-free', type = 'reallife' } = req.body
    const isCorporate = type === 'corporate'
    const count = 30

    const prompt = isCorporate
      ? `Generate ${count} English corporate/business words (verbs, adjectives, adverbs — NO nouns like "company", "manager"). Return: [{"word":"negotiate","meaning":"वाटाघाटी करणे"}, ...]`
      : `Generate ${count} real-life everyday English words (verbs, adjectives, adverbs — NO nouns like "apple", "car"). Return: [{"word":"run","meaning":"धावणे"}, ...]`

    const data = await callAI([
      { role: 'system', content: 'Output ONLY a JSON array of objects with keys "word" and "meaning". No other text.' },
      { role: 'user', content: prompt }
    ], model, 3000)

    const content = data.choices?.[0]?.message?.content || data.error || '[]'
    if (!content || content === '[]') return res.status(500).json({ error: 'AI generation failed: ' + (data.error || 'No response from API') })
    let words = parseJSON(content) || []
    if (!Array.isArray(words) || words.length === 0) return res.status(500).json({ error: 'AI returned invalid data' })
    if (words.length > count) words = words.slice(0, count)

    const result = []
    for (const w of words) {
      if (!w.word) continue
      const meaning = w.meaning || w.word
      const tenses = generateTenses(w.word)
      const sentences = tenses.map(t => t.sentence)
      let mrSentences = []
      try {
        const tr = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(sentences.join('\n'))}`
        )
        const td = await tr.json()
        if (td?.[0]) mrSentences = td[0].map(s => s[0])
      } catch {}
      const tensesWithMr = tenses.map((t, i) => ({ ...t, mr: mrSentences[i] || '' }))
      result.push({ word: w.word, meaning, tenses: tensesWithMr })
    }

    res.json(result)
  } catch (err) { next(err) }
})

router.post('/verb-forms/ai', async (req, res, next) => {
  try {
    const { model = 'deepseek-v4-flash-free' } = req.body

    const data = await callAI([
      { role: 'system', content: 'Output ONLY valid JSON. No other text.' },
      { role: 'user', content: `Generate 20 common English verbs with V1 (present), V2 (past), V3 (past participle) and example sentences. Include Marathi meaning. Return JSON: [{"verb":"go","meaning":"जाणे","v1":"go","v2":"went","v3":"gone","sentence_v1":"I go to school.","sentence_v2":"I went to school.","sentence_v3":"I have gone to school."}, ...]` }
    ], model, 4000)

    const content = data.choices?.[0]?.message?.content || data.error || '[]'
    if (!content || content === '[]') return res.status(500).json({ error: 'AI generation failed: ' + (data.error || 'No response from API') })
    let verbs = parseJSON(content) || []
    if (!Array.isArray(verbs) || verbs.length === 0) return res.status(500).json({ error: 'AI returned invalid data' })
    if (verbs.length > 20) verbs = verbs.slice(0, 20)

    const result = []
    for (const v of verbs) {
      const verb = v.verb || '', v1 = v.v1 || verb || '', v2 = v.v2 || verb + 'ed', v3 = v.v3 || verb + 'ed'
      result.push({
        verb, meaning: v.meaning || verb,
        v1, v2, v3,
        sentence_v1: v.sentence_v1 || '',
        sentence_v2: v.sentence_v2 || '',
        sentence_v3: v.sentence_v3 || '',
        mr_v1: v.mr_v1 || (v.sentence_v1 ? await translateToMarathi(v.sentence_v1) : ''),
        mr_v2: v.mr_v2 || (v.sentence_v2 ? await translateToMarathi(v.sentence_v2) : ''),
        mr_v3: v.mr_v3 || (v.sentence_v3 ? await translateToMarathi(v.sentence_v3) : '')
      })
    }

    res.json(result)
  } catch (err) { next(err) }
})

router.get('/verb-forms', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const offset = (page - 1) * limit
    const totalRows = await db.query('SELECT COUNT(*) as total FROM verb_forms'); const total = totalRows[0].total
    const rows = await db.query('SELECT * FROM verb_forms ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset])
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/verb-forms', async (req, res) => {
  try {
    const { verb, v1, v2, v3, meaning, sentence_v1, sentence_v2, sentence_v3, mr_v1, mr_v2, mr_v3 } = req.body
    if (!verb || !v1 || !v2 || !v3) return res.status(400).json({ error: 'verb, v1, v2, v3 required' })
    const result = await db.query(
      'INSERT INTO verb_forms (verb, v1, v2, v3, meaning, sentence_v1, sentence_v2, sentence_v3, mr_v1, mr_v2, mr_v3) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [verb, v1, v2, v3, meaning || '', sentence_v1 || null, sentence_v2 || null, sentence_v3 || null, mr_v1 || null, mr_v2 || null, mr_v3 || null]
    )
    const rows = await db.query('SELECT * FROM verb_forms WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/verb-forms/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM verb_forms WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/verb-forms/generate', async (req, res, next) => {
  try {
    const { verb, model = 'deepseek-v4-flash-free' } = req.body
    if (!verb) return res.status(400).json({ error: 'verb is required' })

    const data = await callAI([
      { role: 'system', content: 'Output ONLY valid JSON. No other text.' },
      { role: 'user', content: `Generate verb forms for the English verb "${verb}". Return JSON: {"verb":"${verb}","meaning":"(Marathi meaning)","v1":"(present form)","v2":"(past form)","v3":"(past participle)","sentence_v1":"(example sentence)","sentence_v2":"(example sentence)","sentence_v3":"(example sentence)"}` }
    ], model, 2000)

    const content = data.choices?.[0]?.message?.content || data.error || '{}'
    if (!content || content === '{}') return res.status(500).json({ error: 'AI generation failed: ' + (data.error || 'No response from API') })
    let v = parseJSON(content)
    if (!v || !v.v1 || !v.v2 || !v.v3) return res.status(500).json({ error: 'AI returned invalid verb data' })

    v.mr_v1 = v.mr_v1 || await translateToMarathi(v.sentence_v1 || 'I ' + v.v1 + '.')
    v.mr_v2 = v.mr_v2 || await translateToMarathi(v.sentence_v2 || 'I ' + v.v2 + '.')
    v.mr_v3 = v.mr_v3 || await translateToMarathi(v.sentence_v3 || 'I have ' + v.v3 + '.')

    res.json(v)
  } catch (err) { next(err) }
})

router.get('/models', (req, res) => {
  res.json(Object.entries(MODELS).map(([id, name]) => ({ id, name })))
})

router.get('/today', async (req, res) => {
  try {
    const shuffled = [...wordsArray].sort(() => Math.random() - 0.5)
    const words = shuffled.slice(0, 20).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 2)

    const existing = await db.query(
      'SELECT word, marathi_meaning FROM words WHERE word IN (?)',
      [words]
    )
    const meaningMap = {}
    for (const w of existing) {
      if (w.marathi_meaning) meaningMap[w.word] = w.marathi_meaning
    }

    const result = await Promise.all(words.map(async (word) => {
      const meaning = meaningMap[word] || await translateToMarathi(word)
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
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const offset = (page - 1) * limit
    const totalRows = await db.query('SELECT COUNT(*) as total FROM my_words'); const total = totalRows[0].total
    const rows = await db.query('SELECT * FROM my_words ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset])
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
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
    const result = await db.query(
      'INSERT INTO my_words (word, meaning, example) VALUES (?, ?, ?)',
      [word, meaning, example || null]
    )
    const rows = await db.query('SELECT * FROM my_words WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Error adding word:', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/generate-sentences', async (req, res, next) => {
  try {
    const { word, form = 'v1', model = 'deepseek-v4-flash-free', verb } = req.body
    if (!word) return res.status(400).json({ error: 'word is required' })

    const label = { v1: 'V1 (present)', v2: 'V2 (past)', v3: 'V3 (past participle)' }[form] || 'V1'
    const displayWord = verb || word

    const data = await callAI([
      { role: 'system', content: 'Output ONLY a JSON array of strings. No other text.' },
      { role: 'user', content: `Generate 20 short English sentences using the word "${displayWord}" in ${label} form (${word}). Make them simple and natural. Return: ["sentence 1", "sentence 2", ...]` }
    ], model, 3000)

    const content = data.choices?.[0]?.message?.content || data.error || '[]'
    if (!content || content === '[]') return res.status(500).json({ error: 'AI generation failed: ' + (data.error || 'No response from API') })
    let sentences = []
    try { sentences = JSON.parse(content) } catch { return res.status(500).json({ error: 'AI returned invalid JSON' }) }
    if (!Array.isArray(sentences) || sentences.length === 0) return res.status(500).json({ error: 'AI returned empty array' })
    sentences = sentences.slice(0, 20)

    const result = []
    for (const s of sentences) {
      let mr = ''
      try {
        const tr = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(s)}`
        )
        const td = await tr.json()
        mr = td?.[0]?.[0]?.[0] || ''
      } catch {}
      result.push({ sentence: s, mr })
    }

    res.json({ word: displayWord, form: label, sentences: result })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM my_words WHERE id = ?', [req.params.id])
    res.json({ message: 'Word deleted' })
  } catch (err) {
    console.error('Error deleting word:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
