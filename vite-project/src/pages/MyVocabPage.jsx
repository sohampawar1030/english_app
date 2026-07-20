import { useState, useEffect, useRef } from 'react'
import Pagination from '../components/Pagination'

const cellStyle = { padding: '8px 12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }
const thStyle = { ...cellStyle, fontWeight: 700, color: '#555', background: '#f9fafb', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }

export default function MyVocabPage({ myWordSet, onAdded }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [mode, setMode] = useState('en-mr')
  const timerRef = useRef(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [translatingId, setTranslatingId] = useState(null)
  const [translations, setTranslations] = useState({})

  useEffect(() => { fetchWords() }, [page])

  function fetchWords() {
    setLoading(true)
    setError('')
    fetch(`/api/words?page=${page}&limit=10`)
      .then(r => r.json())
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || [])
        setWords(list)
        setTotalPages(Array.isArray(res) ? 1 : (res.totalPages || 1))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  function handleInputChange(e) {
    const val = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    setError('')
    if (!val.trim()) { setWord(''); setMeaning(''); return }
    if (mode === 'mr-en') {
      setWord(''); setMeaning(val)
      timerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/translate?q=${encodeURIComponent(val.trim())}&tl=en`)
          const data = await res.json()
          if (data.translation) setWord(data.translation)
        } catch {}
      }, 500)
    } else {
      setWord(val); setMeaning('')
      timerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/translate?q=${encodeURIComponent(val.trim())}`)
          const data = await res.json()
          if (data.translation) setMeaning(data.translation)
        } catch {}
      }, 500)
    }
  }

  async function addWord(e) {
    e.preventDefault()
    setError('')
    if (!word || !meaning) return
    const res = await fetch('/api/words', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, meaning })
    })
    if (res.status === 409) {
      setError(`"${word}" already exists in your vocabulary!`)
      return
    }
    if (res.ok) {
      onAdded(word.toLowerCase())
      setWord(''); setMeaning('')
      setPage(1); fetchWords()
    }
  }

  async function deleteWord(id) {
    await fetch(`/api/words/${id}`, { method: 'DELETE' })
    setWords(prev => prev.filter(w => w.id !== id))
  }

  async function translateWord(w) {
    setTranslatingId(w.id)
    try {
      const res = await fetch(`/api/translate?q=${encodeURIComponent(w.word)}`)
      const data = await res.json()
      setTranslations(prev => ({ ...prev, [w.id]: data.translation }))
    } catch {}
    setTranslatingId(null)
  }

  const tabStyle = (active) => ({
    padding: '8px 18px', fontSize: '14px', borderRadius: '8px 8px 0 0', border: 'none',
    background: active ? '#7c3aed' : '#f3f4f6', color: active ? '#fff' : '#666',
    cursor: 'pointer', fontWeight: 600
  })

  const isMrMode = mode === 'mr-en'

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px' }}> My Vocabulary</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>तुझे जतन केलेले शब्द</p>

      <div style={{ display: 'flex', gap: '0', marginBottom: '0' }}>
        <button onClick={() => { setMode('en-mr'); setWord(''); setMeaning('') }} style={tabStyle(mode === 'en-mr')}>English → मराठी</button>
        <button onClick={() => { setMode('mr-en'); setWord(''); setMeaning('') }} style={tabStyle(mode === 'mr-en')}>मराठी → English</button>
      </div>

      <form onSubmit={addWord} style={{ display: 'flex', gap: '8px', padding: '16px', background: '#f9fafb', borderRadius: '0 8px 8px 8px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <input value={isMrMode ? meaning : word} onChange={handleInputChange}
          placeholder={isMrMode ? 'मराठी शब्द टाइप करा...' : 'Type English word...'} required
          style={{ flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <input value={isMrMode ? word : meaning} onChange={e => isMrMode ? setWord(e.target.value) : setMeaning(e.target.value)}
          placeholder={isMrMode ? 'English auto-translate...' : 'मराठी auto-translate...'} required
          style={{ flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', color: '#16a34a' }} />
        <button type="submit" style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
      </form>
      {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px 0' }}>{error}</p>}

      {loading ? <p>Loading...</p> : words.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No words yet. Type a word above and Add!</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Word</th>
                <th style={thStyle}>Added</th>
                <th style={{ ...thStyle, width: '80px' }}>Translate</th>
                <th style={{ ...thStyle, width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {words.map(w => (
                <tr key={w.id}>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#111' }}>
                    {w.word}
                    {translations[w.id] && (
                      <div style={{ fontSize: '13px', color: '#16a34a', marginTop: '3px', fontWeight: 400 }}>→ {translations[w.id]}</div>
                    )}
                  </td>
                  <td style={cellStyle}>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td style={cellStyle}>
                    <button onClick={() => translateWord(w)} disabled={translatingId === w.id}
                      style={{ background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: '#7c3aed' }}>
                      {translatingId === w.id ? '...' : 'Translate'}
                    </button>
                  </td>
                  <td style={cellStyle}>
                    <button onClick={() => deleteWord(w.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
