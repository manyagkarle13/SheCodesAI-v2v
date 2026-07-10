import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { jsPDF } from 'jspdf'
import SkeletonCard, { SkeletonBlock } from '../components/SkeletonCard'

export default function DoctorSummary() {
  const { user, token } = useAuth()
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/summary/history/`, {
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

  const generateReport = async () => {
    setLoading(true)
    setError('')
    setReport(null)
    setSelectedReportId(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/summary/doctor-report/`, {
        headers: {
          'Authorization': `Bearer ${token?.access}`,
        },
      })

      let data = {}
      try {
        data = await response.json()
      } catch (e) {
        throw new Error('Failed to parse report data. Please try again.')
      }

      if (!response.ok) {
        throw new Error(data.message || data.detail || 'Failed to generate visit summary.')
      }

      const newReport = {
        id: data.id,
        created_at: data.created_at,
        avg_score: data.avg_score,
        trend_message: data.trend_message,
        top_symptoms: data.top_symptoms,
        summary: data.summary,
        thyroid_check_triggered: data.thyroid_check_triggered,
        thyroid_warning: data.thyroid_warning
      }

      setReport(newReport)
      setSelectedReportId(data.id)
      fetchHistory()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error occurred while connecting to the server.')
    } finally {
      setLoading(false)
    }
  }

  const selectReport = (histItem) => {
    setSelectedReportId(histItem.id)
    setReport({
      id: histItem.id,
      created_at: histItem.created_at,
      avg_score: histItem.mrs_score,
      summary: histItem.content,
      isHistory: true
    })
  }

  const handleCopy = () => {
    if (!report) return
    navigator.clipboard.writeText(report.summary)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleDownloadPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    
    // Header Style
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(74, 32, 32) // deep maroon accent
    doc.text('Sakhi Clinical Report Summary', 20, 25)
    
    // Metadata lines
    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated on: ${new Date(report.created_at || new Date()).toLocaleDateString()}`, 20, 32)
    doc.text(`Patient Name: ${user?.first_name || 'N/A'}`, 20, 38)
    doc.text(`Age: ${user?.age ? user.age : 'N/A'}`, 20, 44)
    
    // Divider line
    doc.setDrawColor(232, 93, 117) // primary coral line
    doc.setLineWidth(0.5)
    doc.line(20, 48, 190, 48)
    
    // Section 1: Aggregates
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(74, 32, 32)
    doc.text('30-Day Symptom Aggregates', 20, 56)
    
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(`Average Menopause Rating Scale (MRS) Score: ${report.avg_score} / 44`, 20, 64)
    if (report.trend_message) {
      doc.text(`Overall Trend Indicator: ${report.trend_message}`, 20, 70)
    }
    
    let yPos = 78
    // Section 2: Top Symptoms
    if (report.top_symptoms && report.top_symptoms.length > 0) {
      doc.setFont('Helvetica', 'bold')
      doc.setTextColor(74, 32, 32)
      doc.text('Primary Focus Area Symptoms:', 20, yPos)
      
      doc.setFont('Helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      report.top_symptoms.forEach((sym, idx) => {
        doc.text(`- ${sym.name}: Average Severity Level ${sym.avg_severity} / 4.0`, 25, yPos + 6 + idx * 6)
      })
      yPos += 12 + report.top_symptoms.length * 6
    }
    
    // Divider line
    doc.setDrawColor(230, 230, 230)
    doc.line(20, yPos, 190, yPos)
    
    // Section 3: Summary Paragraph
    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(74, 32, 32)
    doc.text('Clinical Summary Report:', 20, yPos + 8)
    
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const splitSummary = doc.splitTextToSize(report.summary, 170)
    doc.text(splitSummary, 20, yPos + 14)
    
    doc.save('SakhiPause_Doctor_Summary.pdf')
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
          <span className="text-xs font-bold text-accent/50 uppercase tracking-wider">Past Reports</span>
          <button
            onClick={() => {
              setReport(null)
              setSelectedReportId(null)
              setError('')
            }}
            className="text-xs font-bold text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all cursor-pointer"
          >
            + Compile New
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-2 space-y-1 sidebar-scroll">
          {loadingHistory ? (
            <div className="p-4 space-y-2 animate-pulse">
              <div className="h-10 bg-cream rounded-xl"></div>
              <div className="h-10 bg-cream rounded-xl"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-xs text-accent/40">No summaries compiled yet.</div>
          ) : (
            history.map((hist) => (
              <button
                key={hist.id}
                onClick={() => selectReport(hist)}
                className={`w-full text-left p-3 rounded-2xl transition-all text-xs font-semibold cursor-pointer block ${
                  selectedReportId === hist.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-accent/70 hover:bg-accent/5 hover:text-accent'
                }`}
              >
                <div className="truncate font-bold mb-0.5">{formatDate(hist.created_at)}</div>
                <div className="text-[10px] text-accent/40 truncate">{hist.content}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-grow bg-white rounded-3xl border border-primary/5 shadow-md flex flex-col overflow-hidden h-full text-left">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-accent">Doctor Visit Summary</h2>
            <p className="text-xs text-accent/60 leading-relaxed">
              Compile symptom metrics into a clean clinical report.
            </p>
          </div>
          <button
            onClick={() => {
              setReport(null)
              setSelectedReportId(null)
              setError('')
            }}
            className="md:hidden text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/5"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="bg-[#FAF0ED] border border-primary/20 text-primary text-sm rounded-2xl p-4 mb-6 shadow-sm">
              {error}
            </div>
          )}

          {!report && !loading && (
            <div className="py-16 text-center max-w-md mx-auto">
              <span className="text-5xl mb-4 block">📋</span>
              <h4 className="font-bold text-accent text-lg mb-2">Ready to compile report</h4>
              <p className="text-xs text-accent/50 mb-6 leading-relaxed">
                Calculate Menopause Rating Scale aggregates and construct a professional LLM physician narrative from the past 30 days of symptom logs.
              </p>
              <button
                onClick={generateReport}
                className="bg-primary hover:bg-opacity-95 text-white font-bold px-8 py-3.5 rounded-full shadow-md active:scale-95 transition-all duration-200 cursor-pointer text-sm"
              >
                Generate Doctor Summary
              </button>
            </div>
          )}

          {loading && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <SkeletonBlock className="h-10 w-24 flex-grow rounded-2xl" />
                <SkeletonBlock className="h-10 w-24 flex-grow rounded-2xl" />
              </div>
              <SkeletonCard lines={4} height="h-4" />
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          )}

          {report && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {report.thyroid_check_triggered && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm leading-relaxed flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h5 className="font-bold mb-1">Overlap Detected</h5>
                    <p className="text-xs text-amber-800/90">{report.thyroid_warning}</p>
                  </div>
                </div>
              )}

              <div className="bg-[#FAF0ED]/40 border border-primary/5 rounded-2xl p-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-accent/40 uppercase tracking-wider mb-1">Patient</span>
                  <span className="font-bold text-accent text-sm">{user?.first_name || 'Sakhi User'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-accent/40 uppercase tracking-wider mb-1">Date Generated</span>
                  <span className="font-bold text-accent text-sm">{formatDate(report.created_at || new Date())}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-accent/40 uppercase tracking-wider mb-1">Average MRS Score</span>
                  <span className="font-bold text-accent text-sm">{report.avg_score} / 44</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-accent/40 uppercase tracking-wider mb-1">Status</span>
                  <span className="font-bold text-accent text-sm">{report.isHistory ? 'Loaded from History' : 'New Report'}</span>
                </div>
              </div>

              {!report.isHistory && report.top_symptoms && (
                <div>
                  <h4 className="text-xs font-bold text-accent/50 uppercase tracking-wider mb-3">Focus Area Symptoms</h4>
                  <div className="space-y-2">
                    {report.top_symptoms.map((sym, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                        <span className="font-semibold text-accent/80">{sym.name}</span>
                        <span className="text-primary font-bold">{sym.avg_severity} / 4.0</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-accent/50 uppercase tracking-wider mb-3">Clinical Narrative Overview</h4>
                <div className="bg-[#FAF0ED]/30 border border-primary/10 rounded-2xl p-5 md:p-6 text-sm text-accent/90 leading-relaxed font-sans italic">
                  "{report.summary}"
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleCopy}
                  className="flex-1 border border-primary/30 text-primary hover:bg-primary/5 font-semibold py-3.5 rounded-full text-sm transition-all active:scale-95 duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-primary text-white font-bold py-3.5 rounded-full text-sm shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
