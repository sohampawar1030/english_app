import { useState } from 'react'
import { ModelSelector, TenseCard } from '../components/VocabShared'

export default function AiWordsPage({ myWordSet, onAdded }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [genType, setGenType] = useState(null)
  const [model, setModel] = useState('deepseek-v4-flash-free')

  async function generate(type) {
    setLoading(true)
    setError('')
    setGenType(type)
    try {
      const res = await fetch('/api/words/ai-today', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, type })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI generation failed'); setWords([]); return }
      setWords(Array.isArray(data) ? data : [])
      if (!Array.isArray(data)) setError('Invalid response')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px', color: '#6d28d9' }}> AI Generated Words</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>AI generates 30 words with tenses & Marathi meanings — NO nouns, only verbs/adjectives/adverbs</p>
      <ModelSelector model={model} onChange={setModel} />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => generate('reallife')} disabled={loading}
          style={{ padding: '10px 20px', background: loading && genType === 'reallife' ? '#8b5cf6' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          {loading && genType === 'reallife' ? 'Generating...' : '30 Real Life Words'}
        </button>
        <button onClick={() => generate('corporate')} disabled={loading}
          style={{ padding: '10px 20px', background: loading && genType === 'corporate' ? '#8b5cf6' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          {loading && genType === 'corporate' ? 'Generating...' : '30 Corporate Words'}
        </button>
      </div>
      {loading && <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>AI is generating 30 {genType === 'corporate' ? 'corporate' : 'real-life'} words...</p>}
      {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>{error}</p>}
      {!loading && words.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '13px', color: '#9333ea', fontWeight: 600, marginBottom: '4px' }}>{genType === 'corporate' ? 'Corporate' : 'Real Life'} Words — {words.length}</p>
          {words.map((w, i) => <TenseCard key={i} word={w} myWordSet={myWordSet} onAdded={onAdded} />)}
        </div>
      )}
    </div>
  )
}
