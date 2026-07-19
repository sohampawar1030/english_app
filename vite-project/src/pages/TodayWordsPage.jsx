import { useState, useEffect } from 'react'
import { TenseCard } from '../components/VocabShared'

export default function TodayWordsPage({ myWordSet, onAdded }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/words/today')
      .then(r => r.json())
      .then(data => { setWords(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '4px', color: '#166534' }}> Today's Words</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>रोज २० नवीन शब्द — word वर click करून tense पाहा, Add+ ने Vocab मध्ये टाका</p>
      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {words.map((w, i) => <TenseCard key={i} word={w} myWordSet={myWordSet} onAdded={onAdded} />)}
        </div>
      )}
    </div>
  )
}
