import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SkeletonCard, { SkeletonBlock } from '../components/SkeletonCard'

// Color palette for MRS classification
const SCORE_STYLES = {
  'None to little': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-400' },
  'Mild':           { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400',   bar: 'bg-amber-400' },
  'Moderate':       { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-500',  bar: 'bg-orange-400' },
  'Severe':         { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',    bar: 'bg-rose-400' },
}

const TREND_META = {
  improving: { icon: '↓', label: 'Improving', color: 'text-emerald-600' },
  worsening: { icon: '↑', label: 'Worsening', color: 'text-rose-600' },
  stable:    { icon: '→', label: 'Stable',    color: 'text-slate-500' },
}

// Minimal inline sparkline chart
function Sparkline({ data }) {
  if (!data || data.length < 2) return (
    <div className="h-full flex items-center justify-center text-accent/30 text-xs">
      Log more entries to see trends
    </div>
  )

  const W = 320, H = 80, padX = 10, padY = 8
  const values = data.map(d => d.avg_mrs_score || 0)
  const maxV = Math.max(...values, 1)
  const minV = Math.min(...values, 0)
  const range = maxV - minV || 1

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (W - 2 * padX)
    const y = padY + (1 - (v - minV) / range) * (H - 2 * padY)
    return `${x},${y}`
  })

  const areaPoints = [
    `${padX},${H - padY}`,
    ...points,
    `${W - padX},${H - padY}`,
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E85D75" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E85D75" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill="url(#sparkGrad)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#E85D75"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = points[i].split(',').map(Number)
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#E85D75" />
        )
      })}
    </svg>
  )
}

// Top symptom pills from a log object
function TopSymptomPills({ log }) {
  if (!log) return null
  const fields = [
    { key: 'hot_flashes_severity', label: 'Hot Flashes' },
    { key: 'sleep_problems_severity', label: 'Sleep' },
    { key: 'mood_severity', label: 'Mood' },
    { key: 'anxiety_severity', label: 'Anxiety' },
    { key: 'physical_exhaustion_severity', label: 'Fatigue' },
    { key: 'joint_muscle_pain_severity', label: 'Joint Pain' },
    { key: 'irritability_severity', label: 'Irritability' },
    { key: 'heart_discomfort_severity', label: 'Heart' },
  ]
  const sorted = fields
    .map(f => ({ label: f.label, val: log[f.key] || 0 }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3)
    .filter(s => s.val > 0)

  if (sorted.length === 0) return <p className="text-xs text-accent/40">No significant symptoms today.</p>

  const colors = ['bg-rose-100 text-rose-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700']
  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((s, i) => (
        <span key={s.label} className={`text-xs font-bold px-3 py-1 rounded-full ${colors[i]}`}>
          {s.label} · {s.val}/4
        </span>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [scoreData, setScoreData] = useState(null)
  const [trendsData, setTrendsData] = useState([])
  const [latestLog, setLatestLog] = useState(null)
  const [todayLogged, setTodayLogged] = useState(false)
  const [loadingScore, setLoadingScore] = useState(true)
  const [loadingTrends, setLoadingTrends] = useState(true)
  const [quickMessage, setQuickMessage] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!token?.access) return

    // Fetch MRS score
    const fetchScore = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/symptoms/mrs-score/`, {
          headers: { Authorization: `Bearer ${token.access}` },
        })
        if (res.ok) {
          const data = await res.json()
          setScoreData(data)
          if (data.latest_log) {
            setLatestLog(data.latest_log)
            setTodayLogged(data.latest_log.date === today)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingScore(false)
      }
    }

    // Fetch trends for mini sparkline
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/symptoms/trends/`, {
          headers: { Authorization: `Bearer ${token.access}` },
        })
        if (res.ok) {
          const data = await res.json()
          setTrendsData(data.weekly_trends || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingTrends(false)
      }
    }

    fetchScore()
    fetchTrends()
  }, [token, today])

  const scoreStyle = scoreData?.classification
    ? SCORE_STYLES[scoreData.classification] || SCORE_STYLES['Moderate']
    : null

  const trendMeta = scoreData?.trend ? TREND_META[scoreData.trend] : null

  const handleQuickChat = (e) => {
    e.preventDefault()
    if (quickMessage.trim()) {
      navigate('/ask-ai', { state: { prefill: quickMessage.trim() } })
    } else {
      navigate('/ask-ai')
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-cream px-5 md:px-10 py-8 max-w-5xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-accent">
          {greeting()}, {user?.first_name || 'friend'} 👋
        </h1>
        <p className="text-accent/50 text-sm mt-1">Here's your health snapshot for today.</p>
      </div>

      {/* ── ROW 1: MRS Score + Log Today ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

        {/* MRS Score Card */}
        <div className={`bg-white rounded-3xl p-6 border shadow-sm relative overflow-hidden ${scoreStyle ? `${scoreStyle.border}` : 'border-primary/5'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent/40">Current MRS Score</p>
              <p className="text-[10px] text-accent/30 mt-0.5">Menopause Rating Scale</p>
            </div>
            {trendMeta && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 ${trendMeta.color}`}>
                {trendMeta.icon} {trendMeta.label}
              </span>
            )}
          </div>

          {loadingScore ? (
            <div className="space-y-3">
              <SkeletonBlock className="h-14 w-24" />
              <SkeletonCard lines={2} height="h-3" />
            </div>
          ) : scoreData ? (
            <>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-6xl font-black text-accent leading-none">{scoreData.score}</span>
                <span className="text-accent/30 text-sm pb-2 font-semibold">/ 44</span>
              </div>
              {scoreStyle && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${scoreStyle.bg} ${scoreStyle.border} ${scoreStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scoreStyle.dot}`}></span>
                  {scoreData.classification}
                </span>
              )}
              {scoreData.latest_log?.date && (
                <p className="text-[10px] text-accent/30 mt-3">
                  Last logged: {new Date(scoreData.latest_log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </>
          ) : (
            <div className="py-4">
              <p className="text-accent/40 text-sm">No scores yet.</p>
              <p className="text-accent/30 text-xs mt-1">Log your first symptoms to see your MRS score.</p>
            </div>
          )}

          {/* Subtle background decoration */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-primary/5" />
        </div>

        {/* Log Today Card */}
        <div className="bg-white rounded-3xl p-6 border border-primary/5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent/40 mb-3">Daily Check-In</p>
            {todayLogged ? (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-emerald-700">Logged today ✓</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-accent mb-1">Ready to log today?</p>
            )}
            <p className="text-xs text-accent/40 leading-relaxed mb-5">
              {todayLogged
                ? 'You\'ve tracked your symptoms for today. Keep it up!'
                : 'Track your symptoms daily for accurate MRS scoring and better insights.'}
            </p>
          </div>

          {latestLog && todayLogged && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent/40 mb-2">Today's Focus Areas</p>
              <TopSymptomPills log={latestLog} />
            </div>
          )}

          <Link
            to="/log-symptoms"
            className={`w-full text-center text-sm font-bold py-3.5 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer block ${
              todayLogged
                ? 'border border-primary/20 text-primary hover:bg-primary/5'
                : 'bg-primary text-white shadow-md hover:bg-opacity-90'
            }`}
          >
            {todayLogged ? 'Update Today\'s Log' : 'Log Symptoms Now →'}
          </Link>
        </div>
      </div>

      {/* ── ROW 2: Mini Trend Chart + Top Symptoms ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

        {/* Sparkline trend (wider) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent/40">Weekly MRS Score</p>
              <p className="text-sm font-bold text-accent">Trend Overview</p>
            </div>
            <Link
              to="/trends"
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Full Report →
            </Link>
          </div>
          <div className="h-20">
            {loadingTrends ? (
              <SkeletonBlock className="h-full w-full" />
            ) : (
              <Sparkline data={trendsData} />
            )}
          </div>
          {trendsData.length > 0 && (
            <div className="flex justify-between text-[9px] text-accent/30 font-semibold mt-2 px-1">
              {trendsData.slice(-4).map((w, i) => (
                <span key={i}>{w.week_label || `Wk ${i + 1}`}</span>
              ))}
            </div>
          )}
        </div>

        {/* Latest symptom snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-primary/5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent/40 mb-3">Current Focus</p>
          {loadingScore ? (
            <SkeletonCard lines={4} height="h-3" />
          ) : latestLog ? (
            <TopSymptomPills log={latestLog} />
          ) : (
            <p className="text-xs text-accent/40">No symptom data yet.</p>
          )}
          <Link
            to="/trends"
            className="mt-4 block text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            View all categories →
          </Link>
        </div>
      </div>

      {/* ── ROW 3: Ask AI + Quick Links ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

        {/* Ask Sakhi AI quick box */}
        <div className="bg-gradient-to-br from-primary/8 via-white to-white rounded-3xl p-6 border border-primary/10 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-accent">Ask Sakhi AI</p>
              <p className="text-[10px] text-accent/40">Your personal menopause companion</p>
            </div>
          </div>
          <form onSubmit={handleQuickChat}>
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder="Ask anything about your symptoms..."
              className="w-full px-4 py-3 rounded-2xl border border-primary/15 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder-accent/30 mb-3"
            />
            <button
              type="submit"
              className="w-full bg-primary text-white text-sm font-bold py-3 rounded-2xl hover:bg-opacity-90 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Ask Sakhi →
            </button>
          </form>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              to: '/doctor-summary',
              icon: '📋',
              title: 'Doctor Summary',
              desc: 'Generate a clinical report for your next appointment',
              color: 'bg-violet-50 border-violet-100',
            },
            {
              to: '/workplace-letter',
              icon: '💼',
              title: 'Workplace Letter',
              desc: 'Draft an accommodation request for your employer',
              color: 'bg-sky-50 border-sky-100',
            },
            {
              to: '/trends',
              icon: '📈',
              title: 'My Trends',
              desc: 'View MRS score history and weekly charts',
              color: 'bg-emerald-50 border-emerald-100',
            },
            {
              to: '/log-symptoms',
              icon: '✏️',
              title: 'Log Symptoms',
              desc: 'Track today\'s menopause symptoms',
              color: 'bg-amber-50 border-amber-100',
            },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`${card.color} border rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer`}
            >
              <span className="text-xl">{card.icon}</span>
              <p className="text-xs font-bold text-accent leading-tight">{card.title}</p>
              <p className="text-[10px] text-accent/50 leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="text-center text-[10px] text-accent/30 mt-6 pb-2">
        Sakhi is a health companion, not a medical provider. Always consult a doctor for clinical decisions.
      </p>
    </div>
  )
}
