import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Basic validations
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (age !== '') {
      const numAge = parseInt(age, 10)
      if (isNaN(numAge) || numAge < 1 || numAge > 120) {
        setError('Please enter a realistic age between 1 and 120.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      // 1. Register User
      await register(name, email, password, age)
      // 2. Automatically Log in user
      await login(email, password)
      // 3. Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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

      {/* SIGNUP CARD */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-md w-full shadow-xl border border-primary/10">
          
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-accent mb-2">Create Account</h2>
            <p className="text-sm text-accent/70">
              Start your personalized menopause companion journey
            </p>
          </div>

          {error && (
            <div className="bg-[#FAF0ED] border border-primary/20 text-primary text-xs rounded-xl p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-5 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30"
              />
            </div>

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
                className="w-full px-5 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30"
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
                  placeholder="Min. 8 characters"
                  className="w-full px-5 pr-12 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30"
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

            <div>
              <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-2">
                Age (Optional)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 45"
                min="1"
                max="120"
                className="w-full px-5 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-full shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200 mt-4 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-accent/70 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
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
