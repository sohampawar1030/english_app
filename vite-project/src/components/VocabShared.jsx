import { useState } from 'react'

export const MODELS = [
  { id: 'deepseek-v4-flash-free', name: 'DeepSeek V4 Flash Free' },
  { id: 'mimo-v2.5-free', name: 'MiMo-V2.5 Free' },
  { id: 'hy3-free', name: 'Hy3 Free' },
  { id: 'nemotron-3-ultra-free', name: 'Nemotron 3 Ultra Free' },
  { id: 'north-mini-code-free', name: 'North Mini Code Free' },
]

export function ModelSelector({ model, onChange }) {
  return (
    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
      <span style={{ color: '#666' }}>AI Model:</span>
      <select value={model} onChange={e => onChange(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', background: '#fff' }}>
        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </div>
  )
}

export function TenseCard({ word: wordItem, myWordSet, onAdded }) {
  const [expanded, setExpanded] = useState(false)
  const [loadingTenses, setLoadingTenses] = useState(false)
  const [tenses, setTenses] = useState([])
  const [wordMeaning, setWordMeaning] = useState(wordItem.meaning || '')
  const [showTrans, setShowTrans] = useState(false)
  const [showSentMr, setShowSentMr] = useState(false)
  const [adding, setAdding] = useState(false)

  const alreadyAdded = myWordSet.has(wordItem.word?.toLowerCase())

  async function handleExpand() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (tenses.length > 0) return
    setLoadingTenses(true)
    try {
      const res = await fetch('/api/words/tense', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordItem.word })
      })
      const data = await res.json()
      setTenses(data.tenses || [])
      if (data.meaning) setWordMeaning(data.meaning)
    } catch {} finally { setLoadingTenses(false) }
  }

  async function addToVocab() {
    setAdding(true)
    await fetch('/api/words', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: wordItem.word, meaning: wordMeaning })
    })
    onAdded(wordItem.word?.toLowerCase())
    setAdding(false)
  }

  return (
    <div style={{ border: expanded ? '1px solid #86efac' : '1px solid #dcfce7', borderRadius: '10px', background: expanded ? '#f0fdf4' : '#fff' }}>
      <div onClick={handleExpand} style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
        <div>
          <strong style={{ fontSize: '15px', color: '#111' }}>{wordItem.word}</strong>
          {showTrans && wordMeaning && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#16a34a' }}>{wordMeaning}</span>}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!expanded && (
            <button onClick={e => { e.stopPropagation(); setShowTrans(s => !s) }}
              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #16a34a', background: '#fff', color: '#16a34a', cursor: 'pointer' }}>Translate</button>
          )}
          {alreadyAdded ? (
            <span style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', background: '#e5e7eb', color: '#999' }}>Added</span>
          ) : (
            <button onClick={e => { e.stopPropagation(); addToVocab() }} disabled={adding}
              style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              {adding ? '...' : 'Add+'}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid #bbf7d0' }}>
          {loadingTenses ? <p style={{ fontSize: '13px', color: '#666', padding: '8px 0' }}>Loading tenses...</p>
          : tenses.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>मराठी: {wordMeaning}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={e => { e.stopPropagation(); setShowSentMr(s => !s) }}
                    style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #7c3aed', background: showSentMr ? '#7c3aed' : '#fff', color: showSentMr ? '#fff' : '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>
                    {showSentMr ? 'Hide Translation' : 'Translate Sentences'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); addToVocab() }} disabled={alreadyAdded}
                    style={{ padding: '4px 14px', fontSize: '13px', borderRadius: '6px', border: 'none', background: alreadyAdded ? '#e5e7eb' : '#16a34a', color: alreadyAdded ? '#999' : '#fff', cursor: alreadyAdded ? 'default' : 'pointer', fontWeight: 600 }}>
                    {alreadyAdded ? 'Added to Vocab' : '+ Add to My Vocab'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {tenses.map((t, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                    <span style={{ color: '#7c3aed', fontWeight: 600, marginRight: '8px', fontSize: '12px' }}>{t.tense}</span>
                    <span style={{ color: '#333' }}>{t.sentence}</span>
                    {showSentMr && t.mr && <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #e5e7eb', color: '#16a34a', fontSize: '12px' }}>{t.mr}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ fontSize: '13px', color: '#999', padding: '8px 0' }}>Could not generate tenses.</p>}
        </div>
      )}
    </div>
  )
}

export function VerbFormCard({ item, myVerbSet, onAdded }) {
  const [showMr, setShowMr] = useState(false)
  const [adding, setAdding] = useState(false)
  const alreadyAdded = myVerbSet.has(item.verb?.toLowerCase())

  async function addVerb() {
    setAdding(true)
    await fetch('/api/words/verb-forms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    onAdded(item.verb?.toLowerCase())
    setAdding(false)
  }

  return (
    <div style={{ padding: '14px', background: '#fff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <strong style={{ fontSize: '17px', color: '#111' }}>{item.verb}</strong>
          <span style={{ marginLeft: '8px', fontSize: '13px', color: '#9333ea' }}>{item.meaning || ''}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setShowMr(s => !s)}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #9333ea', background: '#fff', color: '#9333ea', cursor: 'pointer' }}>
            {showMr ? 'Hide Mr' : 'Translate'}
          </button>
          {alreadyAdded ? (
            <span style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', background: '#e5e7eb', color: '#999' }}>Saved</span>
          ) : (
            <button onClick={addVerb} disabled={adding}
              style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: '#9333ea', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              {adding ? '...' : '+ Save'}
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
        {[
          { label: 'V1 (Present)', form: item.v1, sentence: item.sentence_v1, mr: item.mr_v1 },
          { label: 'V2 (Past)', form: item.v2, sentence: item.sentence_v2, mr: item.mr_v2 },
          { label: 'V3 (Past Participle)', form: item.v3, sentence: item.sentence_v3, mr: item.mr_v3 },
        ].map((f, i) => (
          <div key={i} style={{ padding: '8px', background: '#faf5ff', borderRadius: '6px', border: '1px solid #f3e8ff' }}>
            <div style={{ color: '#7c3aed', fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}>{f.label}</div>
            <div style={{ color: '#111', fontWeight: 600 }}>{f.form}</div>
            <div style={{ color: '#555', marginTop: '4px', fontSize: '12px' }}>{f.sentence}</div>
            {showMr && f.mr && <div style={{ color: '#9333ea', marginTop: '2px', fontSize: '11px' }}>{f.mr}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
