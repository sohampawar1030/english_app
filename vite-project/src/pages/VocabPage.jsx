import { useState, useEffect } from 'react'

export default function VocabPage() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')

  const [todayWords, setTodayWords] = useState([])
  const [todayLoading, setTodayLoading] = useState(true)
  const [addedWords, setAddedWords] = useState(new Set())

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(data => { setWords(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/words/today')
      .then(r => r.json())
      .then(data => {
        setTodayWords(data)
        setTodayLoading(false)
        const myWordSet = new Set()
        fetch('/api/words')
          .then(r => r.json())
          .then(myWords => {
            myWords.forEach(w => myWordSet.add(w.word.toLowerCase()))
            setAddedWords(myWordSet)
          })
          .catch(() => {})
      })
      .catch(() => setTodayLoading(false))
  }, [])

  async function addWord(e) {
    e.preventDefault()
    if (!word || !meaning) return
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, meaning, example })
    })
    if (res.ok) {
      const newWord = await res.json()
      setWords(prev => [newWord, ...prev])
      setWord(''); setMeaning(''); setExample('')
    }
  }

  async function deleteWord(id) {
    await fetch(`/api/words/${id}`, { method: 'DELETE' })
    setWords(prev => prev.filter(w => w.id !== id))
  }

  async function addTodayWord(wordItem) {
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: wordItem.word, meaning: wordItem.meaning })
    })
    if (res.ok) {
      const newWord = await res.json()
      setWords(prev => [newWord, ...prev])
      setAddedWords(prev => new Set([...prev, wordItem.word.toLowerCase()]))
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>My Vocabulary</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>तुझा शब्दसंग्रह</p>

      <section style={{ marginBottom: '40px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '4px', color: '#166534' }}> Today's Words</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>रोज २० नवीन शब्द — आवडले तर तुझ्या Vocab मध्ये Add कर</p>

        {todayLoading ? (
          <p>Loading today's words...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
            {todayWords.map((tw, i) => {
              const alreadyAdded = addedWords.has(tw.word.toLowerCase())
              return (
                <div key={i} style={{
                  padding: '12px', borderRadius: '8px', background: '#fff',
                  border: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#111' }}>{tw.word}</strong>
                    <span style={{ marginLeft: '6px', fontSize: '13px', color: '#16a34a' }}>{tw.meaning}</span>
                  </div>
                  <button onClick={() => addTodayWord(tw)} disabled={alreadyAdded}
                    style={{
                      padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', cursor: alreadyAdded ? 'default' : 'pointer',
                      background: alreadyAdded ? '#e5e7eb' : '#16a34a', color: alreadyAdded ? '#999' : '#fff', fontWeight: 600, whiteSpace: 'nowrap'
                    }}>
                    {alreadyAdded ? 'Added' : '+ Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>My Saved Words</h2>

      <form onSubmit={addWord} style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input value={word} onChange={e => setWord(e.target.value)} placeholder="Word" required
          style={{ flex: '1', minWidth: '140px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <input value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="Meaning (मराठी)" required
          style={{ flex: '1', minWidth: '140px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <input value={example} onChange={e => setExample(e.target.value)} placeholder="Example (optional)"
          style={{ flex: '1', minWidth: '200px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <button type="submit" style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          + Add
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : words.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No words yet. Add from today's words above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {words.map(w => (
            <div key={w.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong style={{ fontSize: '18px', color: '#111' }}>{w.word}</strong>
                  <span style={{ marginLeft: '10px', color: '#7c3aed', fontSize: '15px' }}>{w.meaning}</span>
                </div>
                <button onClick={() => deleteWord(w.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>x</button>
              </div>
              {w.example && <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>"{w.example}"</p>}
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>Added: {new Date(w.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
