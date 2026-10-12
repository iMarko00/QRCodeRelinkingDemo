import { Navigate, Route, Routes } from 'react-router-dom'
import ControlPanel from './pages/ControlPanel.jsx'
import Go from './pages/Go.jsx'
import Book from './pages/Book.jsx'
import Event from './pages/Event.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ControlPanel />} />
      <Route path="/go" element={<Go />} />
      <Route path="/book" element={<Book />} />
      <Route path="/event" element={<Event />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
