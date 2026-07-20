import { useState, useEffect, useRef } from 'react'
import Pagination from '../components/Pagination'

const cellStyle = { padding: '8px 12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }
const thStyle = { ...cellStyle, fontWeight: 700, color: '#555', background: '#f9fafb', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }

export default function MyVocabPage({ myWordSet, onAdded }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const timerRef = useRef(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchWords() }, [page])

  function fetchWords() {
    setLoading(true)
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

  const isMarathi = (s) => /[\u0900-\u097F]/.test(s)

  function handleWordChange(e) {
    const val = e.target.value
    setWord(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!val.trim()) { setMeaning(''); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/translate?q=${encodeURIComponent(val.trim())}`)
        const data = await res.json()
        if (data.translation) {
          if (isMarathi(val)) {
            setWord(data.translation); setMeaning(val)
          } else {
            setMeaning(data.translation)
          }
        }
      } catch {}
    }, 500)
  }

  async function addWord(e) {
    e.preventDefault()
    if (!word || !meaning) return
    const res = await fetch('/api/words', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, meaning })
    })
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

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px' }}> My Vocabulary</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>तुझे जतन केलेले शब्द — Word टाइप करा, Meaning auto translate होईल</p>

      <form onSubmit={addWord} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={word} onChange={handleWordChange} placeholder="Type a word..." required
          style={{ flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <input value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="Auto-translates..." required
          style={{ flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', color: '#16a34a' }} />
        <button type="submit" style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
      </form>

      {loading ? <p>Loading...</p> : words.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No words yet. Type a word above and Add!</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Word</th>
                <th style={thStyle}>Meaning (मराठी)</th>
                <th style={thStyle}>Added</th>
                <th style={{ ...thStyle, width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {words.map(w => (
                <tr key={w.id}>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#111' }}>{w.word}</td>
                  <td style={cellStyle}>{w.meaning}</td>
                  <td style={cellStyle}>{new Date(w.created_at).toLocaleDateString()}</td>
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
