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
    let response
    try {
      response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch (err) {
      throw new Error('Connection failed. Please check your network and try again.')
    }

    if (!response.ok) {
      let errorMessage = 'Login failed. Please check your credentials.'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        // Fallback if response is not JSON
      }
      throw new Error(errorMessage)
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

    let response
    try {
      response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      throw new Error('Connection failed. Please check your network and try again.')
    }

    if (!response.ok) {
      let errorMessage = 'Registration failed. Please check the form details.'
      try {
        const errorData = await response.json()
        const errorKeys = Object.keys(errorData)
        if (errorKeys.length > 0) {
          const firstError = errorData[errorKeys[0]]
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
        }
      } catch (e) {
        // Fallback if response is not JSON
      }
      throw new Error(errorMessage)
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
