import { createContext, useContext, useState, useEffect } from 'react'
import { pb } from '../api/pocketbase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.model)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, model) => {
      setUser(model)
    })
    return () => unsub()
  }, [])

  async function signup(email, password, name, phone) {
    setLoading(true)
    try {
      await pb.collection('kk_users').create({
        email,
        password,
        passwordConfirm: password,
        name,
        phone: phone || '',
        emailVisibility: true,
        plan: 'free',
      })
      await pb.collection('kk_users').authWithPassword(email, password)
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    setLoading(true)
    try {
      await pb.collection('kk_users').authWithPassword(email, password)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)