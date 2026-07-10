import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SkeletonCard from '../components/SkeletonCard'

const SYMPTOM_CATEGORIES = [
  { key: 'hot_flashes_severity', label: 'Hot Flashes & Sweating', desc: 'Episodes of sudden warmth, sweating, or hot flashes.' },
  { key: 'heart_discomfort_severity', label: 'Heart Discomfort', desc: 'Unusual awareness of heart beat, heart skipping, or racing.' },
  { key: 'sleep_problems_severity', label: 'Sleep Problems', desc: 'Difficulty falling asleep, waking up early, or fitful sleep.' },
  { key: 'mood_severity', label: 'Depressive Mood', desc: 'Feeling down, sad, lacking drive, or experiencing mood swings.' },
  { key: 'irritability_severity', label: 'Irritability', desc: 'Feeling nervous, aggressive, or quick-tempered.' },
  { key: 'anxiety_severity', label: 'Anxiety', desc: 'Inner restlessness, panic, or general feelings of apprehension.' },
  { key: 'physical_exhaustion_severity', label: 'Physical & Mental Exhaustion', desc: 'Decreased performance, fatigue, or memory/concentration issues.' },
  { key: 'sexual_problems_severity', label: 'Sexual Problems', desc: 'Change in sexual desire or satisfaction.' },
  { key: 'bladder_problems_severity', label: 'Bladder Problems', desc: 'Difficulty urinating, increased frequency, or bladder weakness.' },
  { key: 'dryness_severity', label: 'Vaginal Dryness', desc: 'Dryness or burning sensation in the intimate area.' },
  { key: 'joint_muscle_pain_severity', label: 'Joint & Muscular Discomfort', desc: 'Pain in the joints, muscles, or rheum-like complaints.' },
]

const SEVERITY_LEVELS = {
  0: { label: 'None',       color: 'text-slate-400 bg-slate-100' },
  1: { label: 'Mild',       color: 'text-emerald-700 bg-emerald-50' },
  2: { label: 'Moderate',   color: 'text-amber-700 bg-amber-50' },
  3: { label: 'Severe',     color: 'text-orange-700 bg-orange-50' },
  4: { label: 'Very Severe', color: 'text-rose-700 bg-rose-50' },
}

const BLANK_SYMPTOMS = SYMPTOM_CATEGORIES.reduce((acc, cat) => {
  acc[cat.key] = 0
  return acc
}, {})

export default function LogSymptoms() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [symptoms, setSymptoms] = useState(BLANK_SYMPTOMS)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [isUpdateMode, setIsUpdateMode] = useState(false)
  const [existingLogId, setExistingLogId] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  // On mount: check if a log already exists for today and pre-fill sliders
  useEffect(() => {
    if (!token?.access) return
    const checkTodayLog = async () => {
      try {
        setError('')
        const res = await fetch(`${import.meta.env.VITE_API_URL}/symptoms/history/`, {
          headers: { Authorization: `Bearer ${token.access}` },
        })
        if (res.ok) {
          const data = await res.json()
          const todayLog = (data.history || []).find(l => l.date === today)
          if (todayLog) {
            setExistingLogId(todayLog.id)
            setIsUpdateMode(true)
            // Pre-fill sliders with existing values
            const prefilled = {}
            SYMPTOM_CATEGORIES.forEach(cat => {
              prefilled[cat.key] = todayLog[cat.key] ?? 0
            })
            setSymptoms(prefilled)
            setNotes(todayLog.notes || '')
          }
        } else {
          throw new Error('Failed to retrieve logged symptom history.')
        }
      } catch (err) {
        console.error('Could not check existing log:', err)
        setError("Failed to check today's symptom log history. Please check your connection.")
      } finally {
        setLoadingExisting(false)
      }
    }
    checkTodayLog()
  }, [token, today])

  const handleSliderChange = (key, val) => {
    setSymptoms(prev => ({ ...prev, [key]: parseInt(val, 10) }))
    setValidationError('')
  }

  const validate = () => {
    const totalScore = Object.values(symptoms).reduce((s, v) => s + v, 0)
    if (totalScore === 0 && !notes.trim()) {
      setValidationError('Please rate at least one symptom or add a note before saving.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setValidationError('')
    if (!validate()) return

    setIsSubmitting(true)

    const endpoint = isUpdateMode
      ? `${import.meta.env.VITE_API_URL}/symptoms/log/update/`
      : `${import.meta.env.VITE_API_URL}/symptoms/log/`
    const method = isUpdateMode ? 'PATCH' : 'POST'

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token?.access}`,
        },
        body: JSON.stringify({ ...symptoms, notes }),
      })

      let responseData = {}
      try {
        responseData = await response.json()
      } catch (e) {
        // Not JSON
      }

      if (!response.ok) {
        let errorMessage = 'Failed to save symptom log. Please try again.'
        if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.detail) {
          errorMessage = responseData.detail
        } else if (responseData.errors) {
          const errorKeys = Object.keys(responseData.errors)
          if (errorKeys.length > 0) {
            const firstError = responseData.errors[errorKeys[0]]
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
          }
        }
        throw new Error(errorMessage)
      }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.message || 'A network error occurred. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalScore = Object.values(symptoms).reduce((s, v) => s + v, 0)

  return (
    <div className="min-h-full py-8 px-5 md:px-10 max-w-2xl mx-auto">

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl p-6 mb-6 text-center shadow-sm">
          <span className="text-2xl mb-2 block">🎉</span>
          <h4 className="font-serif text-lg font-bold mb-1">
            {isUpdateMode ? 'Log Updated!' : 'Symptoms Logged!'}
          </h4>
          <p className="text-xs text-emerald-700/80">Saving and returning to your dashboard...</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-md border border-primary/5">

        {/* Header */}
        <div className="text-left mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-accent">Daily Symptom Logger</h2>
              <p className="text-sm text-accent/50 mt-1 leading-relaxed">
                Rate each symptom 0–4 using the standard Menopause Rating Scale.
              </p>
            </div>
            {isUpdateMode && !loadingExisting && (
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                ✏️ Updating today's log
              </span>
            )}
          </div>

          {/* Live score preview */}
          {!loadingExisting && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-accent/40 font-semibold uppercase tracking-wider">Current score:</span>
              <span className="text-sm font-black text-primary">{totalScore} / 44</span>
            </div>
          )}
        </div>

        {loadingExisting ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} lines={2} height="h-4" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Error banners */}
            {validationError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4 flex items-center gap-2">
                <span>⚠️</span> {validationError}
              </div>
            )}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl p-4 flex items-start gap-2">
                <span className="mt-0.5">❌</span>
                <span>{error}</span>
              </div>
            )}

            {/* Symptom Sliders */}
            <div className="space-y-5">
              {SYMPTOM_CATEGORIES.map((cat) => {
                const currentVal = symptoms[cat.key]
                const level = SEVERITY_LEVELS[currentVal]
                return (
                  <div key={cat.key} className="pb-5 border-b border-slate-50 text-left last:border-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-accent text-sm">{cat.label}</h4>
                        <p className="text-[11px] text-accent/45 max-w-md leading-relaxed">{cat.desc}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-center whitespace-nowrap ${level.color}`}>
                        {currentVal} — {level.label}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0" max="4" step="1"
                      value={currentVal}
                      onChange={(e) => handleSliderChange(cat.key, e.target.value)}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[9px] text-accent/30 font-semibold mt-1 px-0.5">
                      <span>None</span><span>Mild</span><span>Moderate</span><span>Severe</span><span>Very Severe</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Notes */}
            <div className="text-left pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-accent/50 uppercase tracking-wider mb-2">
                Additional Notes <span className="text-accent/30 font-normal">(optional)</span>
              </label>
              <textarea
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log any details, changes, triggers, or questions for your doctor..."
                className="w-full px-5 py-4 rounded-2xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-cream/30 resize-none placeholder-accent/30"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full bg-primary text-white font-bold py-4 rounded-full shadow-md hover:bg-opacity-90 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : isUpdateMode ? "Update Today's Log" : 'Save Symptom Log'}
            </button>

          </form>
        )}
      </div>
    </div>
  )
}
