import { useState } from 'react'
import { ModelSelector, TenseCard } from '../components/VocabShared'

export default function AiWordsPage({ myWordSet, onAdded }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('deepseek-v4-flash-free')

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/words/ai-today', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      })
      const data = await res.json()
      setWords(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px', color: '#6d28d9' }}> AI Generated Words</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>AI generates 20 random English words with tenses & Marathi meanings — click to explore</p>
      <ModelSelector model={model} onChange={setModel} />
      <button onClick={generate} disabled={loading}
        style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginBottom: '16px' }}>
        {loading ? 'Generating...' : 'Generate AI Words'}
      </button>
      {loading && <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>AI is generating 20 words...</p>}
      {!loading && words.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {words.map((w, i) => <TenseCard key={i} word={w} myWordSet={myWordSet} onAdded={onAdded} />)}
        </div>
      )}
    </div>
  )
}
