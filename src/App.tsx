import { useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useKanwichStore } from './store/useKanwichStore'
import Dashboard from './components/Dashboard/Dashboard'
import BoardView from './components/Board/BoardView'

export default function App() {
  const theme = useKanwichStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/board/:boardId" element={<BoardView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
