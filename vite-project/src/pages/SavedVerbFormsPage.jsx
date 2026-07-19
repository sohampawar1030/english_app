import { useState, useEffect } from 'react'
import { MODELS } from '../components/VocabShared'

const cellStyle = { padding: '8px 12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }
const thStyle = { ...cellStyle, fontWeight: 700, color: '#555', background: '#f9fafb', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }

function VCell({ label, verb, form, word }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sentences, setSentences] = useState([])
  const [showMr, setShowMr] = useState(false)
  const [model, setModel] = useState(MODELS[0].id)
  const [myVocabSet, setMyVocabSet] = useState(new Set())

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(data => setMyVocabSet(new Set(data.map(w => w.word.toLowerCase()))))
      .catch(() => {})
  }, [])

  async function generate(e) {
    e.stopPropagation()
    if (open && sentences.length > 0) { setOpen(false); return }
    setOpen(true)
    if (sentences.length > 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/words/generate-sentences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, verb, form, model })
      })
      const data = await res.json()
      setSentences(data.sentences || [])
    } catch {} finally { setLoading(false) }
  }

  async function addToVocab(sentence) {
    const w = sentence.split(' ').slice(0, 3).join(' ') + '...'
    await fetch('/api/words', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: w, meaning: '', example: sentence })
    })
    setMyVocabSet(prev => new Set([...prev, w.toLowerCase()]))
  }

  return (
    <td style={{ ...cellStyle, cursor: 'pointer', position: 'relative' }} onClick={generate}>
      <span style={{ color: '#7c3aed', fontWeight: 600 }}>{word}</span>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '400px' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '14px', color: '#7c3aed' }}>20 sentences — {label}: {verb}</strong>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setShowMr(s => !s)}
                style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid #7c3aed', background: showMr ? '#7c3aed' : '#fff', color: showMr ? '#fff' : '#7c3aed', cursor: 'pointer' }}>
                {showMr ? 'Hide Mr' : 'Translate'}
              </button>
              <button onClick={() => setOpen(false)}
                style={{ padding: '3px 8px', fontSize: '13px', borderRadius: '5px', border: 'none', background: '#f3f4f6', color: '#666', cursor: 'pointer', fontWeight: 700, lineHeight: '1' }}>x</button>
            </div>
          </div>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: '#666' }}>Model:</span>
            <select value={model} onChange={e => setModel(e.target.value)}
              style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={generate} style={{ padding: '3px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
              {loading ? '...' : 'Regenerate'}
            </button>
          </div>
          {loading ? <p style={{ fontSize: '12px', color: '#666' }}>Generating...</p> : (
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sentences.map((s, i) => (
                <div key={i} style={{ padding: '6px 8px', background: '#faf5ff', borderRadius: '4px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#333' }}>{i + 1}. {s.sentence}</span>
                    <button onClick={() => addToVocab(s.sentence)}
                      style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>+</button>
                  </div>
                  {showMr && s.mr && <div style={{ color: '#9333ea', marginTop: '2px', fontSize: '11px' }}>{s.mr}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </td>
  )
}

export default function SavedVerbFormsPage() {
  const [verbs, setVerbs] = useState([])
  const [newVerb, setNewVerb] = useState('')
  const [genModel, setGenModel] = useState(MODELS[0].id)
  const [genLoading, setGenLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/words/verb-forms')
      .then(r => r.json())
      .then(setVerbs)
      .catch(() => {})
  }, [])

  async function handleGenerate(e) {
    e.preventDefault()
    if (!newVerb.trim()) return
    setGenLoading(true)
    setPreview(null)
    try {
      const res = await fetch('/api/words/verb-forms/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verb: newVerb.trim(), model: genModel })
      })
      if (res.ok) setPreview(await res.json())
    } catch {} finally { setGenLoading(false) }
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    try {
      const res = await fetch('/api/words/verb-forms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview)
      })
      if (res.ok) {
        const saved = await res.json()
        setVerbs(prev => [saved, ...prev])
        setPreview(null)
        setNewVerb('')
      }
    } catch {} finally { setSaving(false) }
  }

  async function deleteVerb(id) {
    await fetch(`/api/words/verb-forms/${id}`, { method: 'DELETE' })
    setVerbs(prev => prev.filter(v => v.id !== id))
  }

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px', color: '#9333ea' }}> Saved Verb Forms</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>V1/V2/V3 वर click करून २० sentences पहा — AI generate करते</p>

      <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={newVerb} onChange={e => setNewVerb(e.target.value)} placeholder="Type a verb (e.g. run)" required
          style={{ flex: '1', minWidth: '160px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <select value={genModel} onChange={e => setGenModel(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', background: '#fff' }}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="submit" disabled={genLoading} style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: genLoading ? 0.6 : 1 }}>
          {genLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {preview && (
        <div style={{ background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '15px', color: '#7c3aed' }}>Preview: {preview.verb}</strong>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div style={{ background: '#fff', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>V1 (present)</div>
              <div style={{ fontWeight: 600 }}>{preview.v1}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{preview.sentence_v1}</div>
              {preview.mr_v1 && <div style={{ color: '#9333ea', fontSize: '11px', marginTop: '2px' }}>{preview.mr_v1}</div>}
            </div>
            <div style={{ background: '#fff', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>V2 (past)</div>
              <div style={{ fontWeight: 600 }}>{preview.v2}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{preview.sentence_v2}</div>
              {preview.mr_v2 && <div style={{ color: '#9333ea', fontSize: '11px', marginTop: '2px' }}>{preview.mr_v2}</div>}
            </div>
            <div style={{ background: '#fff', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>V3 (p.participle)</div>
              <div style={{ fontWeight: 600 }}>{preview.v3}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{preview.sentence_v3}</div>
              {preview.mr_v3 && <div style={{ color: '#9333ea', fontSize: '11px', marginTop: '2px' }}>{preview.mr_v3}</div>}
            </div>
          </div>
          {preview.meaning && <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>Meaning: {preview.meaning}</div>}
        </div>
      )}

      {verbs.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No verb forms saved yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Verb</th>
                <th style={thStyle}>Meaning</th>
                <th style={thStyle}>V1 (Present)</th>
                <th style={thStyle}>V2 (Past)</th>
                <th style={thStyle}>V3 (P.Participle)</th>
                <th style={{ ...thStyle, width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {verbs.map(v => (
                <tr key={v.id}>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#111' }}>{v.verb}</td>
                  <td style={cellStyle}>{v.meaning}</td>
                  <VCell label="V1 (present)" verb={v.verb} form="v1" word={v.v1} />
                  <VCell label="V2 (past)" verb={v.verb} form="v2" word={v.v2} />
                  <VCell label="V3 (past participle)" verb={v.verb} form="v3" word={v.v3} />
                  <td style={cellStyle}>
                    <button onClick={() => deleteVerb(v.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
