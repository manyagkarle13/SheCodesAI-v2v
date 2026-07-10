import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AskAI() {
  const { token } = useAuth()
  const location = useLocation()
  const prefill = location.state?.prefill || ''

  // Chat sessions & active session state
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState('')
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false)

  const chatEndRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSubmitting])

  // Fetch all chat sessions on mount
  const fetchSessions = async (selectId = null) => {
    if (!token?.access) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/`, {
        headers: {
          'Authorization': `Bearer ${token.access}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const sortedSessions = data.sessions || []
        setSessions(sortedSessions)
        
        // If there are sessions and no active session, auto-select first one
        if (sortedSessions.length > 0) {
          const idToSelect = selectId || sortedSessions[0].id
          setActiveSessionId(idToSelect)
          fetchMessages(idToSelect)
        } else {
          // If no sessions, create a default one
          handleNewChat()
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Could not load chat history.')
    } finally {
      setLoadingSessions(false)
    }
  }

  // Fetch messages for a specific session
  const fetchMessages = async (sessionId) => {
    if (!token?.access || !sessionId) return
    setLoadingMessages(true)
    setError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/${sessionId}/messages/`, {
        headers: {
          'Authorization': `Bearer ${token.access}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        setError('Failed to load messages.')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Could not load message history.')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [token])

  // Handle prefill message from dashboard
  useEffect(() => {
    if (prefill && activeSessionId && !isSubmitting) {
      setInput(prefill)
    }
  }, [prefill, activeSessionId])

  // Create a new chat session
  const handleNewChat = async () => {
    if (!token?.access) return
    setLoadingMessages(true)
    setError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.access}`,
        },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      if (response.ok) {
        const data = await response.json()
        const newSession = data.session
        setSessions(prev => [newSession, ...prev])
        setActiveSessionId(newSession.id)
        // Since backend pre-creates assistant greeting:
        setMessages([
          {
            role: 'assistant',
            content:
              "Hello! I'm Sakhi, your perimenopause and menopause AI companion. How can I support you today? You can ask me about tracking metrics, managing hot flashes, sleep tips, or workplace communication templates. Remember, I am an educational guide, not a doctor.",
          }
        ])
      } else {
        setError('Failed to start a new chat.')
      }
    } catch (err) {
      console.error('Error creating session:', err)
      setError('Could not create new session.')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting || !activeSessionId) return

    const userText = input.trim()
    setInput('')
    setError('')
    
    // Add user message to history in UI
    const updatedMessages = [...messages, { role: 'user', content: userText }]
    setMessages(updatedMessages)
    setIsSubmitting(true)

    try {
      // Send the last few messages for contextual query processing
      // Filter out greeting so we don't blow up context size if unnecessary
      const apiMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.access}`,
        },
        body: JSON.stringify({
          session_id: activeSessionId,
          messages: apiMessages,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'AI service encountered an issue.')
      }

      const data = await response.json()
      
      // Append AI response to messages list
      setMessages((prev) => [
        ...prev,
        { role: data.role || 'assistant', content: data.message },
      ])

      // Re-fetch sessions to update titles and order
      fetchSessions(activeSessionId)
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Connection failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectSession = (id) => {
    setActiveSessionId(id)
    fetchMessages(id)
    setMobileSessionsOpen(false)
  }

  // Format date helper
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-full py-6 px-4 md:px-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100svh-4.5rem)] md:h-[calc(100vh-2rem)]">

      {/* ── SESSIONS LIST SIDEBAR (Desktop) ── */}
      <div className="hidden md:flex flex-col w-64 bg-white rounded-3xl border border-primary/5 shadow-md overflow-hidden h-full">
        <div className="p-4 border-b border-primary/5 flex items-center justify-between">
          <span className="text-xs font-bold text-accent/50 uppercase tracking-wider">Chat History</span>
          <button
            onClick={handleNewChat}
            className="text-xs font-bold text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all cursor-pointer"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-2 space-y-1 sidebar-scroll">
          {loadingSessions ? (
            <div className="p-4 space-y-2 animate-pulse">
              <div className="h-10 bg-cream rounded-xl"></div>
              <div className="h-10 bg-cream rounded-xl"></div>
              <div className="h-10 bg-cream rounded-xl"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-accent/40">No conversations yet.</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all text-xs font-semibold cursor-pointer block ${
                  activeSessionId === session.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-accent/70 hover:bg-accent/5 hover:text-accent'
                }`}
              >
                <div className="truncate font-bold mb-0.5">{session.title}</div>
                <div className="text-[10px] text-accent/40">{formatDate(session.updated_at)}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── MOBILE SESSIONS TRIGGER & DROPDOWN ── */}
      <div className="md:hidden w-full flex items-center justify-between bg-white rounded-2xl p-3 border border-primary/5 shadow-sm">
        <button
          onClick={() => setMobileSessionsOpen(!mobileSessionsOpen)}
          className="flex items-center gap-2 text-xs font-bold text-accent/70 hover:text-primary transition-all px-3 py-1.5 bg-cream/30 rounded-xl cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>{sessions.find(s => s.id === activeSessionId)?.title || 'Select Chat'}</span>
        </button>

        <button
          onClick={handleNewChat}
          className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 transition-all cursor-pointer"
        >
          + New Chat
        </button>
      </div>

      {/* MOBILE SESSIONS MODAL/OVERLAY */}
      {mobileSessionsOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-accent/20 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-3xl border-t border-primary/5 p-5 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-primary/5 mb-4">
              <span className="text-sm font-bold text-accent">Select Conversation</span>
              <button
                onClick={() => setMobileSessionsOpen(false)}
                className="text-xs font-bold text-accent/50 hover:text-accent cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-1.5 pb-6">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all text-xs font-semibold cursor-pointer block ${
                    activeSessionId === session.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-accent/70 hover:bg-accent/5'
                  }`}
                >
                  <div className="truncate font-bold mb-0.5">{session.title}</div>
                  <div className="text-[10px] text-accent/40">{formatDate(session.updated_at)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CHAT PANEL (Right side on desktop, full-width below menu on mobile) ── */}
      <div className="flex-grow bg-white rounded-3xl border border-primary/5 shadow-md flex flex-col overflow-hidden h-full">
        
        {/* Chat info header */}
        <div className="p-4 border-b border-primary/5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-accent">
              {sessions.find(s => s.id === activeSessionId)?.title || 'Sakhi AI'}
            </h2>
            <p className="text-[10px] text-accent/40 mt-0.5">Supportive menopause & perimenopause guide</p>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-cream scrollbar-track-transparent">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <span className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-accent/30 text-xs">
              Start typing below to chat with Sakhi.
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] text-left ${isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  <span className="text-[9px] font-bold text-accent/35 uppercase tracking-wider mb-1 px-1">
                    {isUser ? 'You' : 'Sakhi'}
                  </span>
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-accent text-white rounded-tr-none'
                        : 'bg-[#FAF0ED] text-accent rounded-tl-none border border-primary/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}

          {/* Thinking animation */}
          {isSubmitting && (
            <div className="flex flex-col max-w-[80%] text-left mr-auto animate-pulse">
              <span className="text-[9px] font-bold text-accent/35 uppercase tracking-wider mb-1 px-1">Sakhi</span>
              <div className="bg-[#FAF0ED] text-accent/60 rounded-2xl rounded-tl-none border border-primary/5 px-4 py-3 text-xs flex items-center gap-2">
                <span>Thinking</span>
                <div className="flex gap-0.5 items-center">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 text-center my-2 font-medium">
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about symptoms, guidelines, or templates..."
            disabled={isSubmitting || loadingMessages}
            className="flex-grow px-5 py-3.5 rounded-full border border-primary/20 text-sm bg-cream/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-accent/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting || loadingMessages}
            className="bg-primary text-white p-3.5 rounded-full shadow-md hover:bg-opacity-95 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

    </div>
  )
}
