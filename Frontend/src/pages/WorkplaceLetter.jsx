import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SkeletonCard, { SkeletonBlock } from '../components/SkeletonCard'
import API_URL from '../config/api'

export default function WorkplaceLetter() {
  const { token } = useAuth()
  const [jobRole, setJobRole] = useState('')
  const [concerns, setConcerns] = useState('')
  const [letter, setLetter] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedLetterId, setSelectedLetterId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [generated, setGenerated] = useState(false)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`${API_URL}/workplace/history/`, {
        headers: {
          'Authorization': `Bearer ${token?.access}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (err) {
      console.error('Fetch history error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (token?.access) {
      fetchHistory()
    }
  }, [token])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLetter('')
    setGenerated(false)
    setSelectedLetterId(null)

    try {
      const response = await fetch(`${API_URL}/workplace/generate-letter/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.access}`,
        },
        body: JSON.stringify({
          job_role: jobRole,
          specific_concerns: concerns,
        }),
      })

      let data = {}
      try {
        data = await response.json()
      } catch (e) {
        throw new Error('Failed to parse response data. Please try again.')
      }

      if (!response.ok) {
        throw new Error(data.message || data.detail || 'Failed to generate workplace letter.')
      }

      setLetter(data.letter)
      setGenerated(true)
      setSelectedLetterId(data.id)
      fetchHistory()
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectLetter = (histItem) => {
    setSelectedLetterId(histItem.id)
    setJobRole(histItem.job_role || '')
    setConcerns(histItem.concerns || '')
    setLetter(histItem.content)
    setGenerated(true)
  }

  const handleCopy = () => {
    if (!letter) return
    navigator.clipboard.writeText(letter)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
  }

  return (
    <div className="min-h-full py-6 px-4 md:px-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100svh-8.5rem)] md:h-[calc(100vh-2rem)]">
      
      {/* ── SIDEBAR HISTORY ── */}
      <div className="hidden md:flex flex-col w-64 shrink-0 bg-white rounded-3xl border border-primary/5 shadow-md overflow-hidden h-full">
        <div className="p-4 border-b border-primary/5 flex items-center justify-between">
          <span className="text-xs font-bold text-accent/50 uppercase tracking-wider">Past Letters</span>
          <button
            onClick={() => {
              setLetter('')
              setJobRole('')
              setConcerns('')
              setGenerated(false)
              setSelectedLetterId(null)
              setError('')
            }}
            className="text-xs font-bold text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all cursor-pointer"
          >
            + Draft New
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-2 space-y-1 sidebar-scroll">
          {loadingHistory ? (
            <div className="p-4 space-y-2 animate-pulse">
              <div className="h-10 bg-cream rounded-xl"></div>
              <div className="h-10 bg-cream rounded-xl"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-xs text-accent/40">No letters generated yet.</div>
          ) : (
            history.map((hist) => (
              <button
                key={hist.id}
                onClick={() => selectLetter(hist)}
                className={`w-full text-left p-3 rounded-2xl transition-all text-xs font-semibold cursor-pointer block ${
                  selectedLetterId === hist.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-accent/70 hover:bg-accent/5 hover:text-accent'
                }`}
              >
                <div className="truncate font-bold mb-0.5">{formatDate(hist.created_at)}</div>
                <div className="text-[10px] text-accent/40 truncate">{hist.job_role || 'General Support'}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-grow bg-white rounded-3xl border border-primary/5 shadow-md flex flex-col overflow-hidden h-full text-left">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-accent">Workplace Support Letter</h2>
            <p className="text-xs text-accent/60 leading-relaxed max-w-xl">
              Request reasonable accommodations based on your logged symptom history.
            </p>
          </div>
          <button
            onClick={() => {
              setLetter('')
              setJobRole('')
              setConcerns('')
              setGenerated(false)
              setSelectedLetterId(null)
              setError('')
            }}
            className="md:hidden text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/5"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="bg-[#FAF0ED] border border-primary/20 text-primary text-sm rounded-2xl p-4 mb-6">
              {error}
            </div>
          )}

          {!letter && !loading && (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-accent/50 uppercase tracking-wider mb-2">
                  Your Job Role <span className="text-accent/30 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Senior Marketing Manager, Software Engineer, Teacher..."
                  maxLength={100}
                  className="w-full px-5 py-3.5 rounded-2xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-[#FAF0ED]/20 placeholder-accent/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-accent/50 uppercase tracking-wider mb-2">
                  Specific Concerns or Requests <span className="text-accent/30 font-normal">(optional)</span>
                </label>
                <textarea
                  rows="4"
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  placeholder="e.g. I need flexibility to work from home 2 days a week, access to a cool/quiet space, or adjusted meeting hours..."
                  maxLength={1000}
                  className="w-full px-5 py-4 rounded-2xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-[#FAF0ED]/20 resize-none placeholder-accent/30"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-opacity-95 text-white font-bold py-4 rounded-full shadow-md active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Draft Support Letter
              </button>
            </form>
          )}

          {loading && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-pulse">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-8 w-24 rounded-full" />
              </div>
              <SkeletonBlock className="h-64 w-full rounded-2xl" />
            </div>
          )}

          {letter && !loading && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-accent/50 uppercase tracking-wider">Letter Draft</h4>
                  <p className="text-[11px] text-accent/40 mt-0.5">Edit directly in the text area below before copying</p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full border transition-all duration-200 cursor-pointer active:scale-95 ${
                    copySuccess
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'border-primary/30 text-primary hover:bg-primary/5'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Copy Letter
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows="16"
                className="w-full px-6 py-5 rounded-2xl border border-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-accent/90 leading-7 bg-[#FAF0ED]/20 resize-y font-sans"
                spellCheck={true}
              ></textarea>

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-2 items-center">
                <p className="text-[10px] text-accent/40 leading-relaxed text-left flex-grow">
                  💡 Review and personalise this letter before sending. Remove or adjust any sections that do not apply to your situation.
                </p>
                <button
                  onClick={() => {
                    setLetter('')
                    setGenerated(false)
                  }}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer flex-shrink-0"
                >
                  Modify parameters
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
