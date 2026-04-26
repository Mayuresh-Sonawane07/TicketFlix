'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, ChevronDown, CheckCircle2,
  Loader2, Paperclip, Sparkles,
} from 'lucide-react'
import { apiClient } from '@/lib/api'

interface Message {
  id: number
  message: string
  is_from_user: boolean
  created_at: string
  admin_name?: string
}

interface Ticket {
  id: number
  subject: string
  status: string
  created_at: string
  messages: Message[]
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'home' | 'new' | 'ticket'>('home')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [subject, setSubject] = useState('')
  const [messageText, setMessageText] = useState('')
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  // isLoggedIn now covers any authenticated user including unapproved venue owners
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Check auth status — treat any user with an id/email as logged-in,
  // even if their role isn't fully approved yet (e.g. pending venue owners).
  const checkAuth = () => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        // Consider logged in if we get back any user object (has email or id)
        const loggedIn = !!(data?.email || data?.id || data?.role)
        setIsLoggedIn(loggedIn)
        setUserRole(data?.role || null)
      })
      .catch(() => {})
  }

  useEffect(() => {
    checkAuth()
    const handler = () => checkAuth()
    window.addEventListener('authChange', handler)
    return () => window.removeEventListener('authChange', handler)
  }, [])

  // Load tickets when opened (for any logged-in non-admin user)
  useEffect(() => {
    if (open && isLoggedIn && userRole !== 'Admin') {
      loadTickets()
    }
  }, [open, isLoggedIn])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTicket?.messages])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<Ticket[]>('/users/support/tickets/')
      setTickets(res.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !messageText.trim()) return
    setSubmitting(true); setError('')
    try {
      const res = await apiClient.post<Ticket>('/users/support/tickets/', {
        subject: subject.trim(),
        message: messageText.trim(),
      })
      setTickets(prev => [res.data, ...prev])
      setActiveTicket(res.data)
      setView('ticket')
      setSubject(''); setMessageText('')
      setSuccess('Support ticket created! We\'ll respond within 24 hours.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeTicket) return
    setSubmitting(true); setError('')
    try {
      const res = await apiClient.post<Message>(
        `/users/support/tickets/${activeTicket.id}/reply/`,
        { message: replyText.trim() }
      )
      setActiveTicket(prev => prev ? {
        ...prev,
        messages: [...prev.messages, res.data],
      } : null)
      setReplyText('')
    } catch {
      setError('Failed to send reply.')
    } finally {
      setSubmitting(false)
    }
  }

  const openTicket = async (ticket: Ticket) => {
    try {
      const res = await apiClient.get<Ticket>(`/users/support/tickets/${ticket.id}/`)
      setActiveTicket(res.data)
      setView('ticket')
    } catch {
      setActiveTicket(ticket)
      setView('ticket')
    }
  }

  const statusColor: Record<string, string> = {
    open: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    closed: 'text-gray-500 bg-white/5 border-white/10',
  }

  // Don't render for admins (they have full admin panel)
  if (userRole === 'Admin') return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="w-[360px] max-h-[540px] bg-[#0f0f0f]/98 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/70 overflow-hidden flex flex-col"
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            {/* Header */}
            <div className="relative px-5 py-4 border-b border-white/6 shrink-0">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {view !== 'home' && (
                    <button
                      onClick={() => { setView('home'); setActiveTicket(null); setError('') }}
                      className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <ChevronDown size={14} className="text-gray-400 rotate-90" />
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={10} className="text-red-500" />
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Support</span>
                    </div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {view === 'home' ? 'How can we help?' : view === 'new' ? 'New Ticket' : activeTicket?.subject || 'Ticket'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0">

              {/* Success banner */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-3 bg-emerald-500/8 border-b border-emerald-500/15 flex items-center gap-2"
                  >
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <p className="text-emerald-300 text-xs">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-3 bg-red-500/8 border-b border-red-500/15"
                  >
                    <p className="text-red-300 text-xs">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── HOME VIEW ── */}
              {view === 'home' && (
                <div className="p-4 space-y-3">
                  {!isLoggedIn ? (
                    <div className="py-6 text-center">
                      <MessageCircle size={32} className="mx-auto mb-3 text-gray-700" />
                      <p className="text-gray-400 text-sm font-semibold mb-1">Sign in to get support</p>
                      <p className="text-gray-600 text-xs mb-4 leading-relaxed">
                        You need to be logged in to submit a support ticket.
                      </p>
                      <a
                        href="/login"
                        className="inline-block px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Sign In
                      </a>
                    </div>
                  ) : (
                    <>
                      {/* New ticket CTA */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setView('new')}
                        className="w-full p-4 bg-red-600/15 hover:bg-red-600/20 border border-red-500/25 rounded-2xl text-left flex items-center gap-3 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                          <Paperclip size={15} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">New Support Request</p>
                          <p className="text-gray-500 text-xs">Describe your issue to our team</p>
                        </div>
                      </motion.button>

                      {/* Previous tickets */}
                      {loading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 size={18} className="animate-spin text-gray-600" />
                        </div>
                      ) : tickets.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2 px-1">
                            Your Tickets
                          </p>
                          <div className="space-y-2">
                            {tickets.map(ticket => (
                              <button
                                key={ticket.id}
                                onClick={() => openTicket(ticket)}
                                className="w-full p-3.5 bg-white/[0.025] hover:bg-white/[0.04] border border-white/6 rounded-xl text-left transition-all"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-white text-xs font-semibold truncate flex-1">{ticket.subject}</p>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${statusColor[ticket.status] || statusColor.open}`}>
                                    {ticket.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-[10px]">
                                  {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-700 text-xs py-2">No previous tickets</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── NEW TICKET VIEW ── */}
              {view === 'new' && (
                <form onSubmit={handleCreateTicket} className="p-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                      maxLength={120}
                      className="w-full px-3.5 py-3 bg-white/4 border border-white/8 rounded-xl text-white text-sm placeholder-gray-700 focus:outline-none focus:border-red-500/40 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1.5">Message</label>
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Explain your issue in detail..."
                      required
                      rows={5}
                      maxLength={1000}
                      className="w-full px-3.5 py-3 bg-white/4 border border-white/8 rounded-xl text-white text-sm placeholder-gray-700 focus:outline-none focus:border-red-500/40 transition resize-none leading-relaxed"
                    />
                    <p className="text-gray-700 text-[10px] mt-1 text-right">{messageText.length}/1000</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !messageText.trim()}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <Loader2 size={14} className="animate-spin" />
                      : <><Send size={13} /><span>Submit Ticket</span></>
                    }
                  </button>
                </form>
              )}

              {/* ── TICKET DETAIL VIEW ── */}
              {view === 'ticket' && activeTicket && (
                <div className="flex flex-col h-full">
                  {/* Status bar */}
                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border capitalize ${statusColor[activeTicket.status] || statusColor.open}`}>
                      {activeTicket.status.replace('_', ' ')}
                    </span>
                    <span className="text-gray-700 text-[10px]">#{activeTicket.id}</span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '260px' }}>
                    {activeTicket.messages.length === 0 ? (
                      <p className="text-gray-700 text-xs text-center py-4">No messages yet</p>
                    ) : (
                      activeTicket.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                            msg.is_from_user
                              ? 'bg-red-600/20 border border-red-500/20 rounded-br-md'
                              : 'bg-white/[0.04] border border-white/8 rounded-bl-md'
                          }`}>
                            {!msg.is_from_user && msg.admin_name && (
                              <p className="text-[9px] font-black text-red-400 uppercase tracking-wider mb-1">
                                {msg.admin_name} · Support
                              </p>
                            )}
                            <p className="text-white text-xs leading-relaxed">{msg.message}</p>
                            <p className={`text-[9px] mt-1 ${msg.is_from_user ? 'text-red-300/50' : 'text-gray-700'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Reply input */}
                  {activeTicket.status !== 'closed' && (
                    <form onSubmit={handleReply} className="p-3 border-t border-white/6 flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 px-3.5 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs placeholder-gray-700 focus:outline-none focus:border-red-500/40 transition"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !replyText.trim()}
                        className="w-9 h-9 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition shrink-0"
                      >
                        {submitting
                          ? <Loader2 size={13} className="animate-spin text-white" />
                          : <Send size={13} className="text-white" />
                        }
                      </button>
                    </form>
                  )}
                  {activeTicket.status === 'closed' && (
                    <div className="p-3 border-t border-white/6">
                      <p className="text-gray-600 text-xs text-center">This ticket is closed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 shrink-0">
              <p className="text-gray-800 text-[10px] text-center">
                TicketFlix Support · Typically replies within 24h
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 bg-red-600 hover:bg-red-500 rounded-2xl shadow-2xl shadow-red-600/40 flex items-center justify-center transition-colors"
        style={{ boxShadow: '0 8px 32px rgba(220,38,38,0.45)' }}
        aria-label="Support Chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-red-600/30 pointer-events-none" style={{ animationDuration: '2.5s' }} />
        )}
      </motion.button>
    </div>
  )
}