import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SkeletonCard, { SkeletonBlock } from '../components/SkeletonCard'

const SEVERITY_COLORS = {
  'None to little': 'text-emerald-700 bg-emerald-50 border-emerald-200/50',
  'Mild': 'text-amber-700 bg-amber-50 border-amber-200/50',
  'Moderate': 'text-orange-700 bg-orange-50 border-orange-200/50',
  'Severe': 'text-rose-700 bg-rose-50 border-rose-200/50',
}

const TREND_DIRECTIONS = {
  improving: { text: 'Improving', color: 'text-emerald-600', icon: '↓' },
  worsening: { text: 'Worsening', color: 'text-rose-600', icon: '↑' },
  stable: { text: 'Stable', color: 'text-slate-600', icon: '→' },
}

// Custom Pure-React Line Chart Component (React 19 Safe)
function CustomLineChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-accent/40 text-xs">No chart data.</div>
  }

  const width = 500
  const height = 200
  const paddingX = 40
  const paddingY = 20
  
  const maxVal = 44
  
  // Calculate points
  const points = data.map((item, idx) => {
    const x = paddingX + (idx * (width - 2 * paddingX)) / (data.length - 1 || 1)
    const y = height - paddingY - (item.avg_score / maxVal) * (height - 2 * paddingY)
    return { x, y, label: item.week, value: item.avg_score }
  })

  // Create path string
  let pathD = ''
  let areaD = ''
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} `
    areaD = `M ${points[0].x} ${height - paddingY} L ${points[0].x} ${points[0].y} `
    for (let i = 1; i < points.length; i++) {
      pathD += `L ${points[i].x} ${points[i].y} `
      areaD += `L ${points[i].x} ${points[i].y} `
    }
    areaD += `L ${points[points.length - 1].x} ${height - paddingY} Z`
  }

  // Y-axis grid labels (0, 11, 22, 33, 44)
  const gridLines = [0, 11, 22, 33, 44]

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="relative flex-grow h-44">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          {gridLines.map((val) => {
            const y = height - paddingY - (val / maxVal) * (height - 2 * paddingY)
            return (
              <g key={val} className="opacity-15">
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#4A2020" strokeWidth={1} strokeDasharray="3 3" />
                <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] font-sans fill-accent font-semibold">{val}</text>
              </g>
            )
          })}

          {/* Area under the line */}
          {areaD && <path d={areaD} fill="url(#lineGradient)" className="opacity-15" />}

          {/* Sparkline path */}
          {pathD && <path d={pathD} fill="none" stroke="#E85D75" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r={4} fill="#fff" stroke="#E85D75" strokeWidth={2} className="transition-all duration-200 group-hover:r-6" />
              {/* Tooltip trigger on hover */}
              <title>{`${pt.label}: ${pt.value}`}</title>
            </g>
          ))}

          {/* Defs for gradients */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E85D75" />
              <stop offset="100%" stopColor="#FAF0ED" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between px-10 text-[10px] font-bold text-accent/50 uppercase tracking-wider mt-2">
        {data.map((item, idx) => (
          <span key={idx} className="truncate max-w-[80px] text-center">
            {item.week.split(',')[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

// Custom Pure-React Bar Chart Component (React 19 Safe)
function CustomBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-accent/40 text-xs">No chart data.</div>
  }

  const SEVERITY_TEXT = {
    0: 'None',
    1: 'Mild',
    2: 'Moderate',
    3: 'Severe',
    4: 'V. Severe'
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex items-end justify-between gap-2 md:gap-3 flex-grow h-44 px-2">
        {data.map((item, idx) => {
          const heightPct = `${(item.severity / 4) * 100}%`
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 bg-accent text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30 shadow-md">
                {item.name}: {SEVERITY_TEXT[item.severity]}
              </div>

              {/* Bar track */}
              <div className="w-2.5 sm:w-3.5 bg-[#FAF0ED] h-32 rounded-full overflow-hidden flex items-end border border-primary/5 cursor-pointer">
                {/* Bar fill */}
                <div 
                  className={`w-full rounded-full transition-all duration-500 ease-out ${
                    item.severity >= 3 ? 'bg-primary' : 'bg-accent/80'
                  }`}
                  style={{ height: heightPct }}
                ></div>
              </div>

            </div>
          )
        })}
      </div>
      
      {/* Category Labels */}
      <div className="flex justify-between gap-2 md:gap-3 mt-3 text-[8px] sm:text-[9px] font-bold text-accent/50 uppercase tracking-wider overflow-x-auto select-none">
        {data.map((item, idx) => (
          <span key={idx} className="flex-1 text-center truncate max-w-[45px]" title={item.name}>
            {item.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Trends() {
  const { token } = useAuth()
  const [scoreData, setScoreData] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTrendsAndScores = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token?.access}` }
        
        // 1. Fetch latest score and trend
        const scoreRes = await fetch(`${import.meta.env.VITE_API_URL}/symptoms/mrs-score/`, { headers })
        let scoreJson = null
        if (scoreRes.ok) {
          scoreJson = await scoreRes.json()
          setScoreData(scoreJson)
        } else if (scoreRes.status !== 404) {
          throw new Error('Failed to retrieve daily symptom score.')
        }

        // 2. Fetch weekly trend data
        const trendsRes = await fetch(`${import.meta.env.VITE_API_URL}/symptoms/trends/`, { headers })
        if (trendsRes.ok) {
          const trendsJson = await trendsRes.json()
          setTrends(trendsJson.trends || [])
        } else {
          throw new Error('Failed to retrieve symptoms weekly trends.')
        }

        if (!scoreRes.ok && scoreRes.status === 404) {
          setError('No logs recorded yet. Add logs to see your scoring trends.')
        }
      } catch (err) {
        console.error('Failed to load trends:', err)
        setError('Could not retrieve trend analytics. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (token?.access) {
      fetchTrendsAndScores()
    }
  }, [token])

  // Map symptom severity properties from latest log for bar chart
  const latestLog = scoreData?.latest_log
  const barData = latestLog ? [
    { name: 'Hot Flashes', severity: latestLog.hot_flashes_severity },
    { name: 'Heart', severity: latestLog.heart_discomfort_severity },
    { name: 'Sleep', severity: latestLog.sleep_problems_severity },
    { name: 'Mood', severity: latestLog.mood_severity },
    { name: 'Irritability', severity: latestLog.irritability_severity },
    { name: 'Anxiety', severity: latestLog.anxiety_severity },
    { name: 'Fatigue', severity: latestLog.physical_exhaustion_severity },
    { name: 'Joints', severity: latestLog.joint_muscle_pain_severity },
    { name: 'Bladder', severity: latestLog.bladder_problems_severity },
    { name: 'Dryness', severity: latestLog.dryness_severity },
    { name: 'Sexual', severity: latestLog.sexual_problems_severity },
  ] : []

  return (
    <div className="min-h-full py-8 px-5 md:px-10 max-w-6xl mx-auto">

      {/* Welcome Section */}
      <div className="mb-8 text-left">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-accent mb-3">
            My Health Trends
          </h2>
          <p className="text-accent/70 text-md max-w-xl">
            Track weekly progress and monitor Menopause Rating Scale (MRS) developments over time.
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SkeletonBlock className="h-32 w-full rounded-3xl" />
              <SkeletonBlock className="h-32 w-full rounded-3xl" />
            </div>
            <SkeletonBlock className="h-64 w-full rounded-3xl" />
            <SkeletonBlock className="h-64 w-full rounded-3xl" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-primary/5 shadow-md max-w-lg mx-auto">
            <span className="text-3xl mb-4 block">📊</span>
            <h4 className="font-serif text-lg font-bold text-accent mb-2">No Symptom History Found</h4>
            <p className="text-xs text-accent/50 mb-6 leading-relaxed">
              Log daily symptom checks to compute your Menopause Rating Scale (MRS) health scores and generate weekly charts.
            </p>
            <Link
              to="/log-symptoms"
              className="bg-primary hover:bg-opacity-95 text-white font-bold px-6 py-3 rounded-full shadow-md text-sm transition-colors cursor-pointer inline-block"
            >
              Log Your First Entry
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              
              {/* MRS score summary card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-primary/5 shadow-md flex items-center justify-between gap-6">
                <div>
                  <h3 className="text-xs font-bold text-accent/50 uppercase tracking-wider mb-2">Current MRS Score</h3>
                  <h2 className="font-serif text-5xl md:text-6xl font-bold text-accent mb-3">{scoreData?.latest_score}</h2>
                  <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${SEVERITY_COLORS[scoreData?.classification || 'None to little']}`}>
                    {scoreData?.classification} Severity
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#FAF0ED] flex items-center justify-center text-2xl">
                  📈
                </div>
              </div>

              {/* Trend summary card */}
              {scoreData?.trend && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-primary/5 shadow-md flex items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-accent/50 uppercase tracking-wider mb-2">Trend Comparison</h3>
                    <h2 className={`text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 ${TREND_DIRECTIONS[scoreData.trend.direction].color}`}>
                      <span>{TREND_DIRECTIONS[scoreData.trend.direction].icon}</span>
                      <span>{TREND_DIRECTIONS[scoreData.trend.direction].text}</span>
                    </h2>
                    <p className="text-xs text-accent/60 leading-relaxed">
                      {scoreData.trend.message}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-[#FAF0ED] flex items-center justify-center text-2xl">
                    📊
                  </div>
                </div>
              )}

            </div>

            {/* Charts Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Line Chart Card */}
              <div className="bg-white rounded-3xl p-6 border border-primary/5 shadow-md text-left flex flex-col justify-between">
                <div className="mb-6">
                  <h3 className="font-serif text-lg font-bold text-accent">MRS Score Over Time</h3>
                  <p className="text-xs text-accent/50">Weekly average progress chart</p>
                </div>
                <div className="h-[240px] w-full text-xs">
                  <CustomLineChart data={trends} />
                </div>
              </div>

              {/* Bar Chart Card */}
              <div className="bg-white rounded-3xl p-6 border border-primary/5 shadow-md text-left flex flex-col justify-between">
                <div className="mb-6">
                  <h3 className="font-serif text-lg font-bold text-accent">Current Symptom Breakdown</h3>
                  <p className="text-xs text-accent/50">Severity across MRS categories (latest log)</p>
                </div>
                <div className="h-[240px] w-full text-[10px]">
                  <CustomBarChart data={barData} />
                </div>
              </div>

            </div>

          </div>
        )}

    </div>
  )
}
