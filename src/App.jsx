import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Signup       from './pages/Signup'
import Dashboard    from './pages/Dashboard'
import CVBuilder    from './pages/CVBuilder'
import Applications from './pages/Applications'
import InterviewPrep from './pages/InterviewPrep'
import CoverLetter  from './pages/CoverLetter'
import Upgrade      from './pages/Upgrade'
import Layout       from './components/Layout'

function Private({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
function Public({ children }) {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'Outfit, sans-serif',
              fontSize: 14,
              background: '#0D0D0B',
              color: '#F5F0E6',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
            },
            success: { iconTheme: { primary: '#1D6A3A', secondary: '#F5F0E6' } },
            error:   { iconTheme: { primary: '#B83232', secondary: '#F5F0E6' } },
          }}
        />
        <Routes>
          <Route path="/"             element={<Public><Landing /></Public>} />
          <Route path="/login"        element={<Public><Login /></Public>} />
          <Route path="/signup"       element={<Public><Signup /></Public>} />
          <Route path="/dashboard"    element={<Private><Layout><Dashboard /></Layout></Private>} />
          <Route path="/cv"           element={<Private><Layout><CVBuilder /></Layout></Private>} />
          <Route path="/cover-letter" element={<Private><Layout><CoverLetter /></Layout></Private>} />
          <Route path="/applications" element={<Private><Layout><Applications /></Layout></Private>} />
          <Route path="/interview"    element={<Private><Layout><InterviewPrep /></Layout></Private>} />
          <Route path="/upgrade"      element={<Private><Layout><Upgrade /></Layout></Private>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}