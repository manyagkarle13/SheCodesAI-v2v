import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream text-accent font-sans flex flex-col justify-between selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-[#FCEAE6] rounded-[50%_60%_30%_70%_/_50%_30%_70%_50%] -z-10 opacity-70 blur-xs"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] bg-[#FCEAE6] rounded-[60%_40%_35%_65%_/_60%_30%_70%_40%] -z-10 opacity-70 blur-xs"></div>

      {/* HEADER / LOGO */}
      <header className="max-w-7xl mx-auto w-full px-6 md:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tight text-primary">Sakhi</Link>
        <Link to="/" className="text-sm font-semibold text-accent/80 hover:text-primary transition-colors">Back to home</Link>
      </header>

      {/* LOGIN CARD */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-md w-full shadow-xl border border-primary/10">
          
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-accent mb-2">Welcome Back</h2>
            <p className="text-sm text-accent/70">
              Sign in to your AI companion dashboard
            </p>
          </div>

          {error && (
            <div className="bg-[#FAF0ED] border border-primary/20 text-primary text-xs rounded-xl p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-5 py-3.5 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 pr-12 py-3.5 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-accent/50 hover:text-accent/80 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-4 rounded-full shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-accent/70 mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-accent/50">
        © 2026 Sakhi. Supporting you through every chapter.
      </footer>
    </div>
  )
}
