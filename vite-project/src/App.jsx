import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import TodayWordsPage from './pages/TodayWordsPage'
import AiWordsPage from './pages/AiWordsPage'
import VerbFormsPage from './pages/VerbFormsPage'
import SavedVerbFormsPage from './pages/SavedVerbFormsPage'
import MyVocabPage from './pages/MyVocabPage'

export default function App() {
  const [myWordSet, setMyWordSet] = useState(new Set())
  const [myVerbSet, setMyVerbSet] = useState(new Set())

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(data => setMyWordSet(new Set(data.map(w => w.word.toLowerCase()))))
      .catch(() => {})
    fetch('/api/words/verb-forms')
      .then(r => r.json())
      .then(data => setMyVerbSet(new Set(data.map(v => v.verb.toLowerCase()))))
      .catch(() => {})
  }, [])

  function handleWordAdded(wordLower) {
    setMyWordSet(prev => new Set([...prev, wordLower]))
  }

  function handleVerbAdded(verbLower) {
    setMyVerbSet(prev => new Set([...prev, verbLower]))
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<TodayWordsPage myWordSet={myWordSet} onAdded={handleWordAdded} />} />
        <Route path="/ai-words" element={<AiWordsPage myWordSet={myWordSet} onAdded={handleWordAdded} />} />
        <Route path="/verb-forms" element={<VerbFormsPage myVerbSet={myVerbSet} onVerbAdded={handleVerbAdded} />} />
        <Route path="/saved-verb-forms" element={<SavedVerbFormsPage />} />
        <Route path="/my-vocab" element={<MyVocabPage myWordSet={myWordSet} onAdded={handleWordAdded} />} />
      </Routes>
    </BrowserRouter>
  )
}
