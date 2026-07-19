import { useState, useEffect, useRef } from 'react'
import { ModelSelector } from '../components/VocabShared'
import Pagination from '../components/Pagination'

const C = { title: 'Real Life Sentences', color: '#059669', desc: 'Daily life conversations — shopping, travel, family, friends, health, hobbies' }

export default function RealLifeSentencesPage() {
  const [saved, setSaved] = useState([])
  const [generated, setGenerated] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [model, setModel] = useState('deepseek-v4-flash-free')
  const [manual, setManual] = useState('')
  const [manualMr, setManualMr] = useState('')
  const timerRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [translated, setTranslated] = useState(new Set())
  const [savedTr, setSavedTr] = useState(new Set())
  const [favOpen, setFavOpen] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const favCount = saved.filter(s => s.is_important).length

  useEffect(() => { fetchSaved() }, [page])

  function fetchSaved() {
    fetch('/api/sentences?category=reallife&page=' + page + '&limit=10')
      .then(r => r.json()).then(res => {
        const list = Array.isArray(res) ? res : (res.data || [])
        setSaved(list)
        setTotalPages(Array.isArray(res) ? 1 : (res.totalPages || 1))
      }).catch(() => {})
  }

  function handleManualWord(e) {
    const val = e.target.value
    setManual(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!val.trim()) { setManualMr(''); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/translate?q=' + encodeURIComponent(val.trim()))
        const data = await res.json()
        if (data.translation) setManualMr(data.translation)
      } catch {}
    }, 500)
  }

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sentences/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reallife', model })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); setGenerated([]); return }
      setGenerated(Array.isArray(data) ? data : [])
      if (!Array.isArray(data)) setError('Invalid response')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  async function addSentence(sentence, translation) {
    setSaving(true)
    try {
      const res = await fetch('/api/sentences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'reallife', sentence, translation })
      })
      if (res.ok) {
        setGenerated(prev => prev.filter(s => s.sentence !== sentence))
        setPage(1); fetchSaved()
      }
    } catch {} finally { setSaving(false) }
  }

  async function addManual(e) {
    e.preventDefault()
    if (!manual.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/sentences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'reallife', sentence: manual.trim(), translation: manualMr || null })
      })
      if (res.ok) {
        setManual(''); setManualMr('')
        setPage(1); fetchSaved()
      }
    } catch {} finally { setSaving(false) }
  }

  async function deleteSentence(id) {
    await fetch('/api/sentences/' + id, { method: 'DELETE' })
    fetchSaved()
  }

  async function toggleImportant(id, important) {
    const res = await fetch('/api/sentences/' + id + '/important', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ important: !important })
    })
    if (res.ok) {
      const updated = await res.json()
      setSaved(prev => prev.map(s => s.id === id ? updated : s))
    }
  }

  const SENT = { color: '#166534' }
  const TRANSL = { color: '#16a34a', fontSize: '12px', marginTop: '2px' }

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px', color: C.color }}> {C.title}</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>{C.desc}</p>

      <div style={{ background: '#fefce8', border: '1px solid #facc15', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <div onClick={() => setFavOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: favOpen ? '12px' : 0, cursor: 'pointer', userSelect: 'none' }}>
          <strong style={{ fontSize: '15px', color: '#92400e' }}>
            {favOpen ? '\u25BE' : '\u25B8'} My Favourite Real Life Sentences {favCount > 0 ? ' (' + favCount + ' starred)' : ''}
          </strong>
          <span style={{ fontSize: '13px', color: '#92400e' }}>{saved.length} saved</span>
        </div>
        {favOpen
          ? (saved.length === 0
            ? <p style={{ color: '#999', fontSize: '13px' }}>No favourite sentences yet. Generate or add manually below, then click star</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {saved.map(s => (
                  <div key={s.id} style={{
                    padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                    background: s.is_important ? '#fef9c3' : '#fff',
                    border: s.is_important ? '1px solid #facc15' : '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px'
                  }}>
                    <div onClick={() => setSavedTr(prev => { const n = new Set(prev); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n })} style={{ flex: 1, cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{s.sentence}</div>
                      {savedTr.has(s.id) && s.translation ? <div style={TRANSL}>{s.translation}</div> : null}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button onClick={() => toggleImportant(s.id, s.is_important)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '2px' }}>{s.is_important ? '\u2B50' : '\u2606'}</button>
                      <button onClick={() => deleteSentence(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '15px', padding: '2px' }}>x</button>
                    </div>
                  </div>
                ))}
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
          )
          : null
        }
      </div>

      <form onSubmit={addManual} style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={manual} onChange={handleManualWord} placeholder="Type a real-life sentence..." required
          style={{ flex: '2', minWidth: '250px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
        <input value={manualMr} onChange={e => setManualMr(e.target.value)} placeholder="Auto-translates..."
          style={{ flex: '1', minWidth: '160px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', color: '#16a34a' }} />
        <button type="submit" disabled={saving || !manual.trim()} style={{ padding: '10px 20px', background: C.color, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : '+ Save'}
        </button>
      </form>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <ModelSelector model={model} onChange={setModel} />
        <button onClick={generate} disabled={loading}
          style={{ padding: '10px 20px', background: C.color, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Generating 40 sentences...' : 'Generate 40 Real Life Sentences'}
        </button>
      </div>

      {loading ? <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>AI is generating 40 real-life sentences...</p> : null}
      {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>{error}</p>}

      {generated.length > 0
        ? <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: C.color, marginBottom: '8px' }}>Generated - click sentence to translate, click + to save</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {generated.map((s, i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                  <div onClick={() => setTranslated(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n })} style={{ flex: 1, cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, color: SENT.color }}>{i + 1}. {s.sentence}</div>
                    {translated.has(i) && s.translation ? <div style={TRANSL}>{s.translation}</div> : null}
                  </div>
                  <button onClick={() => addSentence(s.sentence, s.translation)} disabled={saving}
                    style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '5px', border: 'none', background: '#166534', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>+</button>
                </div>
              ))}
            </div>
          </div>
        : null
      }
    </div>
  )
}
