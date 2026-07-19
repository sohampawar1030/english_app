import { Router } from 'express'
import db from '../config/database.js'

const router = Router()

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

function parseJSON(str) {
  try { return JSON.parse(str) } catch { return null }
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

const FALLBACK = {
  reallife: [
    "I wake up at 6 AM every day.", "I brush my teeth before breakfast.",
    "I take a shower in the morning.", "I eat lunch at 1 PM.",
    "I go to the market on Sundays.", "I meet my friends every weekend.",
    "I watch TV after dinner.", "I read books before sleeping.",
    "I call my mother every evening.", "I drink coffee in the morning.",
    "I take the bus to work.", "I cook dinner for my family.",
    "I go for a walk in the park.", "I listen to music while working.",
    "I clean my room on Saturdays.", "I water the plants daily.",
    "I play cricket with my neighbours.", "I visit my grandparents every month.",
    "I study English every night.", "I save money for my future.",
    "I help my younger brother with homework.", "I buy vegetables from the street vendor.",
    "I wear a sweater when it is cold.", "I open the window for fresh air.",
    "I charge my phone before sleeping.", "I lock the door before leaving.",
    "I wish my friends on their birthdays.", "I take medicine when I am sick.",
    "I check my email in the morning.", "I feed the stray dogs near my house.",
    "I fold my clothes after washing.", "I turn off the lights to save electricity.",
    "I wait for the train at the station.", "I carry an umbrella when it rains.",
    "I share my food with my sister.", "I learn new things from the internet.",
    "I exercise for 30 minutes daily.", "I write in my diary every night.",
    "I smile at strangers when I walk.", "I thank people who help me."
  ],
  corporate: [
    "Please find the attached report.", "Let me know if you have any questions.",
    "I will follow up on this issue.", "Can we schedule a meeting for tomorrow?",
    "Thank you for your prompt response.", "Please review the document by EOD.",
    "I have cc'd the relevant stakeholders.", "Let's circle back on this later.",
    "We need to align on the strategy.", "I will send you the revised draft.",
    "Could you please provide an update?", "The deadline has been extended by a week.",
    "I appreciate your hard work on this.", "Let me loop in the team for input.",
    "Please prioritize this task.", "I have attached the minutes of the meeting.",
    "We need to discuss the budget allocation.", "Can you brief me on the project status?",
    "Let's take this offline.", "I will revert with my feedback shortly.",
    "The client has approved the proposal.", "We are on track to meet the deadline.",
    "Please ensure all deliverables are submitted.", "I have scheduled a call with the vendor.",
    "Let me know your availability for next week.", "We need to streamline the process.",
    "I have updated the spreadsheet with new data.", "Could you double-check the numbers?",
    "Please acknowledge receipt of this email.", "Let's have a quick stand-up meeting.",
    "I will take ownership of this task.", "We should leverage our strengths.",
    "The quarterly review is scheduled for Friday.", "Please submit your timesheet by 5 PM.",
    "I have forwarded the email to the concerned department.", "Let me escalate this to management.",
    "We need to mitigate the risks involved.", "I will prepare the presentation slides.",
    "The meeting has been rescheduled to 3 PM.", "Thank you for your cooperation."
  ]
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

    const content = data.choices?.[0]?.message?.content || '[]'
    let sentences = parseJSON(content) || []
    if (!Array.isArray(sentences) || sentences.length === 0) {
      sentences = FALLBACK[type] || FALLBACK.reallife
    }
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
