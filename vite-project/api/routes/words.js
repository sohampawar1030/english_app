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

async function callAI(messages, model = 'deepseek-v4-flash-free', maxTokens = 4000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    })
    clearTimeout(timer)
    return resp.json()
  } catch {
    clearTimeout(timer)
    return { choices: [] }
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
  try { return JSON.parse(str) } catch { return null }
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
      const timer = setTimeout(() => ac.abort(), 20000)
      const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
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

const FALLBACK_VERBS = [
  { verb:'go', meaning:'जाणे', v1:'go', v2:'went', v3:'gone', sentence_v1:'I go to school.', sentence_v2:'I went to school.', sentence_v3:'I have gone to school.' },
  { verb:'eat', meaning:'खाणे', v1:'eat', v2:'ate', v3:'eaten', sentence_v1:'I eat breakfast.', sentence_v2:'I ate breakfast.', sentence_v3:'I have eaten breakfast.' },
  { verb:'run', meaning:'धावणे', v1:'run', v2:'ran', v3:'run', sentence_v1:'I run every day.', sentence_v2:'I ran yesterday.', sentence_v3:'I have run for an hour.' },
  { verb:'speak', meaning:'बोलणे', v1:'speak', v2:'spoke', v3:'spoken', sentence_v1:'I speak English.', sentence_v2:'I spoke to her.', sentence_v3:'I have spoken to him.' },
  { verb:'write', meaning:'लिहिणे', v1:'write', v2:'wrote', v3:'written', sentence_v1:'I write letters.', sentence_v2:'I wrote a book.', sentence_v3:'I have written an essay.' },
  { verb:'read', meaning:'वाचणे', v1:'read', v2:'read', v3:'read', sentence_v1:'I read books.', sentence_v2:'I read that novel.', sentence_v3:'I have read many books.' },
  { verb:'take', meaning:'घेणे', v1:'take', v2:'took', v3:'taken', sentence_v1:'I take the bus.', sentence_v2:'I took a photo.', sentence_v3:'I have taken the test.' },
  { verb:'give', meaning:'देणे', v1:'give', v2:'gave', v3:'given', sentence_v1:'I give gifts.', sentence_v2:'I gave him money.', sentence_v3:'I have given my word.' },
  { verb:'see', meaning:'पाहणे', v1:'see', v2:'saw', v3:'seen', sentence_v1:'I see the stars.', sentence_v2:'I saw a movie.', sentence_v3:'I have seen that film.' },
  { verb:'come', meaning:'येणे', v1:'come', v2:'came', v3:'come', sentence_v1:'I come here daily.', sentence_v2:'I came yesterday.', sentence_v3:'I have come early.' },
  { verb:'know', meaning:'माहित असणे', v1:'know', v2:'knew', v3:'known', sentence_v1:'I know the answer.', sentence_v2:'I knew him well.', sentence_v3:'I have known her for years.' },
  { verb:'make', meaning:'बनवणे', v1:'make', v2:'made', v3:'made', sentence_v1:'I make coffee.', sentence_v2:'I made a cake.', sentence_v3:'I have made dinner.' },
  { verb:'think', meaning:'विचार करणे', v1:'think', v2:'thought', v3:'thought', sentence_v1:'I think it is good.', sentence_v2:'I thought about it.', sentence_v3:'I have thought deeply.' },
  { verb:'buy', meaning:'खरेदी करणे', v1:'buy', v2:'bought', v3:'bought', sentence_v1:'I buy groceries.', sentence_v2:'I bought a car.', sentence_v3:'I have bought a house.' },
  { verb:'bring', meaning:'आणणे', v1:'bring', v2:'brought', v3:'brought', sentence_v1:'I bring lunch.', sentence_v2:'I brought my book.', sentence_v3:'I have brought snacks.' },
  { verb:'teach', meaning:'शिकवणे', v1:'teach', v2:'taught', v3:'taught', sentence_v1:'I teach students.', sentence_v2:'I taught math.', sentence_v3:'I have taught for years.' },
  { verb:'find', meaning:'शोधणे', v1:'find', v2:'found', v3:'found', sentence_v1:'I find keys.', sentence_v2:'I found a wallet.', sentence_v3:'I have found the answer.' },
  { verb:'tell', meaning:'सांगणे', v1:'tell', v2:'told', v3:'told', sentence_v1:'I tell stories.', sentence_v2:'I told the truth.', sentence_v3:'I have told you everything.' },
  { verb:'begin', meaning:'सुरू करणे', v1:'begin', v2:'began', v3:'begun', sentence_v1:'I begin work at 9.', sentence_v2:'I began the project.', sentence_v3:'I have begun my journey.' },
  { verb:'understand', meaning:'समजून घेणे', v1:'understand', v2:'understood', v3:'understood', sentence_v1:'I understand the lesson.', sentence_v2:'I understood the concept.', sentence_v3:'I have understood everything.' }
]

const FALLBACK_AI_WORDS = {
  reallife: [
    { word: 'run', meaning: 'धावणे' }, { word: 'eat', meaning: 'खाणे' }, { word: 'sleep', meaning: 'झोपणे' },
    { word: 'read', meaning: 'वाचणे' }, { word: 'write', meaning: 'लिहिणे' }, { word: 'speak', meaning: 'बोलणे' },
    { word: 'listen', meaning: 'ऐकणे' }, { word: 'walk', meaning: 'चालणे' }, { word: 'think', meaning: 'विचार करणे' },
    { word: 'learn', meaning: 'शिकणे' }, { word: 'teach', meaning: 'शिकवणे' }, { word: 'help', meaning: 'मदत करणे' },
    { word: 'give', meaning: 'देणे' }, { word: 'take', meaning: 'घेणे' }, { word: 'bring', meaning: 'आणणे' },
    { word: 'buy', meaning: 'खरेदी करणे' }, { word: 'sell', meaning: 'विकणे' }, { word: 'find', meaning: 'शोधणे' },
    { word: 'keep', meaning: 'ठेवणे' }, { word: 'start', meaning: 'सुरू करणे' }, { word: 'stop', meaning: 'थांबणे' },
    { word: 'open', meaning: 'उघडणे' }, { word: 'close', meaning: 'बंद करणे' }, { word: 'push', meaning: 'ढकलणे' },
    { word: 'pull', meaning: 'ओढणे' }, { word: 'clean', meaning: 'स्वच्छ करणे' }, { word: 'wash', meaning: 'धुणे' },
    { word: 'cook', meaning: 'शिजवणे' }, { word: 'drink', meaning: 'पिणे' }, { word: 'play', meaning: 'खेळणे' }
  ],
  corporate: [
    { word: 'negotiate', meaning: 'वाटाघाटी करणे' }, { word: 'implement', meaning: 'अंमलबजावणी करणे' },
    { word: 'collaborate', meaning: 'सहकार्य करणे' }, { word: 'prioritize', meaning: 'प्राधान्य देणे' },
    { word: 'delegate', meaning: 'प्रतिनिधीत्व करणे' }, { word: 'optimize', meaning: 'ऑप्टिमाइझ करणे' },
    { word: 'present', meaning: 'सादर करणे' }, { word: 'analyze', meaning: 'विश्लेषण करणे' },
    { word: 'coordinate', meaning: 'समन्वय साधणे' }, { word: 'summarize', meaning: 'सारांश काढणे' },
    { word: 'invest', meaning: 'गुंतवणूक करणे' }, { word: 'forecast', meaning: 'अंदाज करणे' },
    { word: 'approve', meaning: 'मंजूर करणे' }, { word: 'evaluate', meaning: 'मूल्यांकन करणे' },
    { word: 'allocate', meaning: 'वाटप करणे' }, { word: 'consolidate', meaning: 'एकत्र करणे' },
    { word: 'demonstrate', meaning: 'प्रदर्शित करणे' }, { word: 'facilitate', meaning: 'सुलभ करणे' },
    { word: 'integrate', meaning: 'एकत्रित करणे' }, { word: 'monitor', meaning: 'निरीक्षण करणे' },
    { word: 'motivate', meaning: 'प्रेरित करणे' }, { word: 'negotiate', meaning: 'वाटाघाटी करणे' },
    { word: 'organize', meaning: 'आयोजित करणे' }, { word: 'participate', meaning: 'सहभागी होणे' },
    { word: 'quantify', meaning: 'प्रमाण ठरवणे' }, { word: 'recommend', meaning: 'शिफारस करणे' },
    { word: 'schedule', meaning: 'वेळापत्रक ठरवणे' }, { word: 'strategize', meaning: 'रणनीती ठरवणे' },
    { word: 'supervise', meaning: 'देखरेख करणे' }, { word: 'verify', meaning: 'पडताळणी करणे' }
  ]
}

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

    const content = data.choices?.[0]?.message?.content || '[]'
    let words = parseJSON(content) || []
    if (!Array.isArray(words) || words.length === 0) words = FALLBACK_AI_WORDS[type] || FALLBACK_AI_WORDS.reallife
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

    const content = data.choices?.[0]?.message?.content || '[]'
    let verbs = parseJSON(content) || []
    if (!Array.isArray(verbs) || verbs.length === 0) verbs = FALLBACK_VERBS
    if (verbs.length > 20) verbs = verbs.slice(0, 20)

    const result = []
    for (const v of verbs) {
      result.push({
        verb: v.verb || '',
        meaning: v.meaning || '',
        v1: v.v1 || v.verb || '',
        v2: v.v2 || (v.verb || '') + 'ed',
        v3: v.v3 || (v.verb || '') + 'ed',
        sentence_v1: v.sentence_v1 || '',
        sentence_v2: v.sentence_v2 || '',
        sentence_v3: v.sentence_v3 || '',
        mr_v1: v.mr_v1 ? v.mr_v1 : (v.sentence_v1 ? await translateToMarathi(v.sentence_v1) : ''),
        mr_v2: v.mr_v2 ? v.mr_v2 : (v.sentence_v2 ? await translateToMarathi(v.sentence_v2) : ''),
        mr_v3: v.mr_v3 ? v.mr_v3 : (v.sentence_v3 ? await translateToMarathi(v.sentence_v3) : '')
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

    const content = data.choices?.[0]?.message?.content || '{}'
    let v = parseJSON(content)
    if (!v || !v.v1 || !v.v2 || !v.v3) {
      v = { verb, v1: verb, v2: verb === 'go' ? 'went' : verb + 'ed', v3: verb === 'go' ? 'gone' : verb + 'ed', meaning: verb, sentence_v1: 'I ' + verb + ' every day.', sentence_v2: 'I ' + (verb === 'go' ? 'went' : verb + 'ed') + ' yesterday.', sentence_v3: 'I have ' + (verb === 'go' ? 'gone' : verb + 'ed') + ' before.' }
    }

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

const FALLBACK_SENTENCES = [
  'I use this word in my daily life.', 'Can you show me an example?', 'This is a very common word.',
  'I need to practice this more.', 'Please say that again.', 'I understand the meaning now.',
  'Let me try to use this word.', 'That is a good example.', 'I will remember this word.',
  'Can you explain this word?', 'I have seen this before.', 'This word is very useful.',
  'I want to learn more words.', 'Please help me with this.', 'I am learning English step by step.',
  'This sentence is easy to understand.', 'I can read this sentence.', 'I write new words in my notebook.',
  'I listen to English every day.', 'I speak English with my friends.'
]

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

    const content = data.choices?.[0]?.message?.content || '[]'
    let sentences = []
    try { sentences = JSON.parse(content) } catch { sentences = [] }
    if (!Array.isArray(sentences) || sentences.length === 0) sentences = FALLBACK_SENTENCES
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
