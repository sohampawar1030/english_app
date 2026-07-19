import { useState } from 'react'
import { ModelSelector, VerbFormCard } from '../components/VocabShared'

export default function VerbFormsPage({ myVerbSet, onVerbAdded }) {
  const [verbs, setVerbs] = useState([])
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('deepseek-v4-flash-free')

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/words/verb-forms/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      })
      const data = await res.json()
      setVerbs(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px', color: '#9333ea' }}> Forms of Verbs</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>20 common English verbs with V1, V2, V3 forms & example sentences — AI generated</p>
      <ModelSelector model={model} onChange={setModel} />
      <button onClick={generate} disabled={loading}
        style={{ padding: '10px 20px', background: '#9333ea', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginBottom: '16px' }}>
        {loading ? 'Generating...' : 'Generate Verb Forms'}
      </button>
      {loading && <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>AI is generating 20 verbs...</p>}
      {!loading && verbs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {verbs.map((v, i) => <VerbFormCard key={i} item={v} myVerbSet={myVerbSet} onAdded={onVerbAdded} />)}
        </div>
      )}
    </div>
  )
}
