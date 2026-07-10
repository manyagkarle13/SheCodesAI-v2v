import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage on app boot
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        setToken(JSON.parse(savedToken))
        setUser(JSON.parse(savedUser))
      } catch (err) {
        // Clear corrupt data
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Login failed. Please check your credentials.')
    }

    const data = await response.json()
    const tokenData = { access: data.access, refresh: data.refresh }
    
    setToken(tokenData)
    setUser(data.user)
    
    // Security note: LocalStorage token handling is used here for simplicity. 
    // In production settings, store tokens in httpOnly cookies to prevent XSS-based theft.
    localStorage.setItem('token', JSON.stringify(tokenData))
    localStorage.setItem('user', JSON.stringify(data.user))
    return data.user
  }

  const register = async (name, email, password, age) => {
    const payload = {
      first_name: name,
      email: email,
      password: password,
    }
    if (age) payload.age = parseInt(age, 10)

    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorKeys = Object.keys(errorData)
      if (errorKeys.length > 0) {
        const firstError = errorData[errorKeys[0]]
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError)
      }
      throw new Error('Registration failed. Please check the form details.')
    }

    const data = await response.json()
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
