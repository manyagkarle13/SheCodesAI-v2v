import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SkeletonCard, { SkeletonBlock } from '../components/SkeletonCard'

export default function WorkplaceLetter() {
  const { token } = useAuth()
  const [jobRole, setJobRole] = useState('')
  const [concerns, setConcerns] = useState('')
  const [letter, setLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLetter('')
    setGenerated(false)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workplace/generate-letter/`, {
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
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!letter) return
    navigator.clipboard.writeText(letter)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div className="min-h-full py-8 px-5 md:px-10 max-w-3xl mx-auto">

      <div className="bg-white rounded-3xl p-6 md:p-10 border border-primary/5 shadow-md text-left">

          {/* Header */}
          <div className="pb-6 border-b border-slate-100 mb-8">
            <h2 className="font-serif text-3xl font-bold text-accent mb-2">Workplace Support Letter</h2>
            <p className="text-sm text-accent/60 leading-relaxed max-w-xl">
              Generate a respectful, professional email requesting reasonable workplace accommodations based on your logged symptoms. You can edit the letter before sending.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-6 mb-8">
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
                rows="3"
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="e.g. I need flexibility to work from home 2 days a week, access to a cool/quiet space, or adjusted meeting hours..."
                maxLength={1000}
                className="w-full px-5 py-4 rounded-2xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-[#FAF0ED]/20 resize-none placeholder-accent/30"
              ></textarea>
            </div>

            {error && (
              <div className="bg-[#FAF0ED] border border-primary/20 text-primary text-sm rounded-2xl p-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-opacity-95 text-white font-bold py-4 rounded-full shadow-md active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"></span>
                  <span>Drafting your letter...</span>
                </span>
              ) : generated ? 'Re-generate Letter' : 'Generate Letter'}
            </button>
          </form>

          {loading && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-pulse">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-8 w-24 rounded-full" />
              </div>
              <SkeletonBlock className="h-64 w-full rounded-2xl" />
            </div>
          )}

          {/* Generated Letter */}
          {letter && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-accent/50 uppercase tracking-wider">Generated Letter</h4>
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
                rows="18"
                className="w-full px-6 py-5 rounded-2xl border border-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-accent/90 leading-7 bg-[#FAF0ED]/20 resize-y font-sans"
                spellCheck={true}
              ></textarea>

              <p className="text-[10px] text-accent/40 leading-relaxed">
                💡 Review and personalise this letter before sending. Remove or adjust any sections that do not apply to your situation.
              </p>
            </div>
          )}

        </div>
    </div>
  )
}
