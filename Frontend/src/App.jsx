import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import LogSymptoms from './pages/LogSymptoms'
import Trends from './pages/Trends'
import AskAI from './pages/AskAI'
import DoctorSummary from './pages/DoctorSummary'
import WorkplaceLetter from './pages/WorkplaceLetter'

function LandingPage() {
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('signup') // 'login' or 'signup'
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // JavaScript form validations for Signup
    if (modalTab === 'signup') {
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
    }

    setIsSubmitting(true)
    try {
      if (modalTab === 'signup') {
        await register(name, email, password, age)
        await login(email, password)
      } else {
        await login(email, password)
      }
      setIsModalOpen(false)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setName('')
    setEmail('')
    setPassword('')
    setAge('')
    setError('')
    setShowPassword(false)
  }

  return (
    <div className="min-h-screen bg-cream text-accent font-sans selection:bg-primary/20 selection:text-primary">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full bg-transparent py-4 px-4 md:px-8 transition-all duration-300">
        <nav className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between relative backdrop-blur-md bg-white/70 border border-primary/10 rounded-2xl md:rounded-full shadow-md">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold tracking-tight text-primary">
              Sakhi <span className="font-bold">Pause</span>
            </Link>
          </div>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#why-sakhi" className="text-accent/80 hover:text-primary font-medium text-sm transition-colors duration-200">Why Sakhi</a>
            <a href="#features" className="text-accent/80 hover:text-primary font-medium text-sm transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="text-accent/80 hover:text-primary font-medium text-sm transition-colors duration-200">How it works</a>
          </div>

          {/* Right Side CTA */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm hover:bg-opacity-90 active:scale-95 transition-all duration-200"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-accent/80 hover:text-primary font-semibold text-sm transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm hover:bg-opacity-90 active:scale-95 transition-all duration-200"
                >
                  Join Sakhi
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-accent focus:outline-none p-1.5"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-primary/10 flex flex-col gap-4 text-center md:hidden transition-all duration-300">
              <a
                href="#why-sakhi"
                onClick={() => setMobileMenuOpen(false)}
                className="text-accent hover:text-primary font-medium py-2 border-b border-slate-100"
              >
                Why Sakhi
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-accent hover:text-primary font-medium py-2 border-b border-slate-100"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-accent hover:text-primary font-medium py-2 border-b border-slate-100"
              >
                How it works
              </a>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-full shadow-md mt-2 block"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-accent hover:text-primary font-medium py-2 border-b border-slate-100 block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-primary text-white font-semibold py-3 rounded-full shadow-md mt-2 block"
                  >
                    Join Sakhi
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* HERO SECTION */}
      <div className="relative w-full min-h-[620px] md:min-h-[700px] lg:min-h-[760px] flex items-center bg-cream overflow-hidden">
        {/* Full Screen Background Image */}
        <img
          src="/hero_illustration.jpg"
          alt="Sakhi background illustration"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none z-0 mix-blend-multiply opacity-25 md:opacity-90"
        />

        {/* Content Overlay */}
        <header className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-12">

          {/* LEFT COLUMN: Text and CTAs */}
          <div className="lg:col-span-6 flex flex-col items-start text-left relative z-20 max-w-md md:max-w-lg lg:max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center justify-center border border-primary/40 rounded-full px-4 py-1.5 mb-6 bg-white/60 shadow-xs">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Built for women 40+</span>
            </div>

            {/* Heading */}
            <h2 className="font-serif text-accent text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
              Your AI companion for <br className="hidden md:inline" />
              <span className="text-primary mt-1 inline-block">menopause & perimenopause</span>
            </h2>

            {/* Subheading */}
            <p className="text-accent/70 text-lg md:text-xl leading-relaxed mb-8 font-medium">
              Track symptoms with the same scale doctors use, understand your body in plain language, and get real support — medically and at work.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto text-center bg-primary text-white font-bold px-8 py-4 rounded-full shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="w-full sm:w-auto text-center bg-primary text-white font-bold px-8 py-4 rounded-full shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200"
                >
                  Join Sakhi
                </Link>
              )}
              <a
                href="#how-it-works"
                className="w-full sm:w-auto text-center border border-primary text-primary hover:bg-primary/5 font-bold px-8 py-4 rounded-full transition-all duration-200"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Floating Pill Badges */}
          <div className="lg:col-span-6 hidden lg:block relative h-[550px] w-full pointer-events-none">

            {/* Floating Badge 1 (Top Left) */}
            <div className="absolute top-[18%] left-[-2%] md:left-[2%] bg-white/85 backdrop-blur-xs border border-primary/10 shadow-sm rounded-full py-1.5 px-3.5 flex items-center gap-2 hover:scale-105 transition-all duration-300 pointer-events-auto cursor-pointer z-20">
              <span className="text-primary">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.813zM18 10.5l-.5 3-.5-3-3-.5 3-.5.5-3 .5 3 3 .5-3 .5zM14 3.5l-.25 1.5-.25-1.5-1.5-.25 1.5-.25.25-1.5.25 1.5 1.5.25-1.5.25z" />
                </svg>
              </span>
              <span className="text-[11px] font-bold text-accent tracking-wide whitespace-nowrap">Understand Your Body</span>
            </div>

            {/* Floating Badge 2 (Bottom Left) */}
            <div className="absolute bottom-[16%] left-[-6%] md:left-[0%] bg-white/85 backdrop-blur-xs border border-primary/10 shadow-sm rounded-full py-1.5 px-3.5 flex items-center gap-2 hover:scale-105 transition-all duration-300 pointer-events-auto cursor-pointer z-20">
              <span className="text-primary">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="text-[11px] font-bold text-accent tracking-wide whitespace-nowrap">Track Symptoms</span>
            </div>

            {/* Floating Badge 3 (Top Right) */}
            <div className="absolute top-[1%] right-[-2%] md:right-[4%] bg-white/85 backdrop-blur-xs border border-primary/10 shadow-sm rounded-full py-1.5 px-3.5 flex items-center gap-2 hover:scale-105 transition-all duration-300 pointer-events-auto cursor-pointer z-20">
              <span className="text-primary">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <span className="text-[11px] font-bold text-accent tracking-wide whitespace-nowrap">Real Support, Always</span>
            </div>

            {/* Floating Badge 4 (Bottom Right) */}
            <div className="absolute bottom-[16%] right-[2%] md:right-[6%] bg-white/85 backdrop-blur-xs border border-primary/10 shadow-sm rounded-full py-1.5 px-3.5 flex items-center gap-2 hover:scale-105 transition-all duration-300 pointer-events-auto cursor-pointer z-20">
              <span className="text-primary">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <span className="text-[11px] font-bold text-accent tracking-wide whitespace-nowrap">Feel Like Yourself Again</span>
            </div>

          </div>

        </header>

      </div>

      {/* PROBLEM SECTION ("Why Sakhi") */}
      <section id="why-sakhi" className="bg-[#FAF0ED] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Headers */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h3 className="font-serif text-accent text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Women's health apps weren't built for this chapter
            </h3>
            <p className="text-primary/80 text-md md:text-xl font-medium leading-relaxed max-w-3xl mx-auto">
              Most technology targets younger women and periods. Menopause — something every woman eventually goes through — is barely addressed. Women navigating it struggle to:
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-[#FCEAE6] rounded-3xl p-8 flex flex-col items-start text-left transition-transform duration-300 hover:scale-[1.02]">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mb-6">
                1
              </div>
              <h4 className="font-serif text-xl font-bold text-accent mb-2">
                Explaining symptoms clearly to doctors
              </h4>
              <p className="text-accent/70 text-sm md:text-base leading-relaxed">
                Forgetting details, downplaying how bad it's been, or struggling to convey the collective impact on daily life.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FCEAE6] rounded-3xl p-8 flex flex-col items-start text-left transition-transform duration-300 hover:scale-[1.02]">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mb-6">
                2
              </div>
              <h4 className="font-serif text-xl font-bold text-accent mb-2">
                Understanding medical info safely
              </h4>
              <p className="text-accent/70 text-sm md:text-base leading-relaxed">
                Navigating complex hormones and clinical options without it feeling scary, overwhelming, or confusing.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FCEAE6] rounded-3xl p-8 flex flex-col items-start text-left transition-transform duration-300 hover:scale-[1.02]">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mb-6">
                3
              </div>
              <h4 className="font-serif text-xl font-bold text-accent mb-2">
                Asking your workplace for support
              </h4>
              <p className="text-accent/70 text-sm md:text-base leading-relaxed">
                Finding the right words for reasonable-adjustment requests with your manager without feeling awkward or unsure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION ("What Sakhi Does") */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">

        {/* Label and Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-4">What Sakhi Does</span>
          <h3 className="font-serif text-accent text-3xl md:text-5xl font-bold">
            Three ways Sakhi has your back
          </h3>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-8 border border-primary/10 hover:border-primary/30 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h4 className="font-serif text-2xl font-bold text-accent">
              Symptom tracking that doctors understand
            </h4>
            <p className="text-sm text-accent/70 leading-relaxed">
              Log hot flashes, sleep, mood, and more with validated clinical scales. Bring clear data to appointments instead of guessing.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-8 border border-primary/10 hover:border-primary/30 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-serif text-2xl font-bold text-accent">
              Plain-language answers, not panic
            </h4>
            <p className="text-sm text-accent/70 leading-relaxed">
              Sakhi explains what's happening in your body without medical jargon or fear-mongering. Knowledge that actually helps.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-8 border border-primary/10 hover:border-primary/30 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-serif text-2xl font-bold text-accent">
              Workplace support, made simple
            </h4>
            <p className="text-sm text-accent/70 leading-relaxed">
              Get help drafting reasonable-adjustment requests and conversations with your manager — so you don't have to navigate it alone.
            </p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-[#FAF0ED] py-24 px-6 md:px-12 border-t border-primary/10">
        <div className="max-w-7xl mx-auto">
          {/* Section Headers */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-4">How it works</span>
            <h3 className="font-serif text-accent text-3xl md:text-5xl font-bold">
              Simple support, every step of the way
            </h3>
          </div>

          {/* Steps Display */}
          <div className="relative">
            {/* Horizontal Line connecting steps (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-1/12 right-1/12 h-[2px] bg-dashed bg-primary/20 -z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary text-white font-bold text-2xl flex items-center justify-center border-[6px] border-cream shadow-md mb-6 transform hover:scale-105 transition-transform">
                  1
                </div>
                <h4 className="font-serif text-2xl font-bold text-accent mb-3">Check in daily</h4>
                <p className="text-sm text-accent/70 max-w-xs leading-relaxed">
                  Log symptoms in under a minute — no overwhelm, just the signals that matter.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary text-white font-bold text-2xl flex items-center justify-center border-[6px] border-cream shadow-md mb-6 transform hover:scale-105 transition-transform">
                  2
                </div>
                <h4 className="font-serif text-2xl font-bold text-accent mb-3">Get clarity</h4>
                <p className="text-sm text-accent/70 max-w-xs leading-relaxed">
                  Sakhi turns your data into insights you can understand and share with your doctor.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary text-white font-bold text-2xl flex items-center justify-center border-[6px] border-cream shadow-md mb-6 transform hover:scale-105 transition-transform">
                  3
                </div>
                <h4 className="font-serif text-2xl font-bold text-accent mb-3">Take action</h4>
                <p className="text-sm text-accent/70 max-w-xs leading-relaxed">
                  Access tools, scripts, and guidance for medical visits and workplace conversations.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="bg-accent text-[#FDF2F0] py-24 px-6 md:px-12 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
          <h3 className="font-serif text-3xl md:text-5xl font-bold leading-tight">
            Ready to navigate this chapter with confidence?
          </h3>
          <p className="text-cream/70 max-w-xl text-md md:text-lg">
            Join Sakhi today and get priority access when the Sakhi application becomes available in your region.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-opacity-95 text-white font-bold px-8 py-4 rounded-full shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Join Sakhi
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-accent/95 text-[#FDF2F0]/60 py-12 px-6 md:px-12 text-center text-xs border-t border-white/5">
        <p className="max-w-2xl mx-auto mb-4 leading-relaxed">
          © 2026 Sakhi App. Empowering women with supportive, personalized guidance during perimenopause and menopause.
        </p>
        <p className="max-w-xl mx-auto leading-relaxed">
          Disclaimer: Sakhi is an educational AI companion tool. It does not provide official medical diagnoses, treatments, or clinical consultations. Always speak with your medical advisor before altering treatment plans.
        </p>
      </footer>

      {/* WAITLIST POPUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={handleCloseModal}
            className="absolute inset-0 bg-accent/65 backdrop-blur-sm transition-opacity duration-300"
          ></div>

          {/* Modal Container */}
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-primary/10 transform scale-100 transition-transform duration-300">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-5 right-5 text-accent/60 hover:text-accent focus:outline-none p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <div className="flex justify-center border-b border-primary/10 mb-6 pb-2">
                <button
                  type="button"
                  onClick={() => { setModalTab('signup'); setError(''); }}
                  className={`flex-1 text-center font-bold text-sm pb-2 border-b-2 transition-all cursor-pointer ${
                    modalTab === 'signup' ? 'border-primary text-primary' : 'border-transparent text-accent/50'
                  }`}
                >
                  Join Sakhi
                </button>
                <button
                  type="button"
                  onClick={() => { setModalTab('login'); setError(''); }}
                  className={`flex-1 text-center font-bold text-sm pb-2 border-b-2 transition-all cursor-pointer ${
                    modalTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-accent/50'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {error && (
                <div className="bg-[#FAF0ED] border border-primary/20 text-primary text-xs rounded-xl p-3 mb-4 font-medium text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleModalSubmit} className="space-y-4 text-left">
                {modalTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/40"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={modalTab === 'signup' ? 8 : undefined}
                      className="w-full px-4 pr-10 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-accent/40 hover:text-accent/60 cursor-pointer focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {modalTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-accent/60 uppercase tracking-wider mb-1">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 45"
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/40"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-full shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : modalTab === 'signup' ? 'Join Sakhi' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/log-symptoms" element={
            <ProtectedRoute>
              <AppLayout><LogSymptoms /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/trends" element={
            <ProtectedRoute>
              <AppLayout><Trends /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/ask-ai" element={
            <ProtectedRoute>
              <AppLayout><AskAI /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/doctor-summary" element={
            <ProtectedRoute>
              <AppLayout><DoctorSummary /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/workplace-letter" element={
            <ProtectedRoute>
              <AppLayout><WorkplaceLetter /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
