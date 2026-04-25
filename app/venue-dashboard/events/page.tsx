'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { eventAPI, theaterAPI, screenAPI, showAPI, apiClient, Event, Theater, Screen, Show } from '@/lib/api'
import { CalendarPlus, Pencil, Trash2, ArrowLeft, Plus, X, Clock, ChevronDown, ChevronUp, Calendar, MapPin, Edit2, XCircle, Sparkles } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev'

function getImageUrl(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `${API_BASE}/media/${image}`
}

function getYouTubeEmbed(url?: string) {
  if (!url) return null
  const regExp = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/
  const match = url.match(regExp)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

const inputCls = "w-full px-4 py-3 bg-white/3 border border-white/8 rounded-2xl text-white text-sm placeholder-gray-700 focus:outline-none focus:border-red-500/50 focus:bg-white/4 transition"

export default function MyEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [expandedShows, setExpandedShows] = useState<Set<number>>(new Set())
  const [eventShows, setEventShows] = useState<Record<number, Show[]>>({})
  const [loadingShows, setLoadingShows] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [venues, setVenues] = useState<Theater[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [loadingScreens, setLoadingScreens] = useState(false)
  const [savingShow, setSavingShow] = useState(false)
  const [showError, setShowError] = useState('')
  const [showForm, setShowForm] = useState({ venue_id: '', screen: '', show_time: '' })
  const [editShowModal, setEditShowModal] = useState(false)
  const [editingShow, setEditingShow] = useState<any>(null)
  const [editShowTime, setEditShowTime] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [cancellingShow, setCancellingShow] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const user = await res.json()
      if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
      fetchEvents(); fetchVenues()
    })()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getMyEvents()
      const data = response.data
      setEvents(Array.isArray(data) ? data : (data as any).results ?? [])
    } catch { setError('Failed to load events') } finally { setLoading(false) }
  }

  const fetchVenues = async () => {
    try {
      const res = await theaterAPI.getMyVenues()
      setVenues(Array.isArray(res.data) ? res.data : (res.data as any).results ?? [])
    } catch {}
  }

  const fetchShowsForEvent = async (eventId: number) => {
    setLoadingShows(prev => new Set(prev).add(eventId))
    try {
      const res = await showAPI.getByEvent(eventId)
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results ?? []
      setEventShows(prev => ({ ...prev, [eventId]: data }))
    } catch {} finally { setLoadingShows(prev => { const n = new Set(prev); n.delete(eventId); return n }) }
  }

  const toggleShows = (eventId: number) => {
    setExpandedShows(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) { next.delete(eventId) } else { next.add(eventId); if (!eventShows[eventId]) fetchShowsForEvent(eventId) }
      return next
    })
  }

  const handleVenueChange = async (venueId: string) => {
    setShowForm({ ...showForm, venue_id: venueId, screen: '' }); setScreens([])
    if (!venueId) return
    setLoadingScreens(true)
    try {
      const res = await screenAPI.getByTheater(Number(venueId))
      setScreens(Array.isArray(res.data) ? res.data : (res.data as any).results ?? [])
    } catch { setShowError('Failed to load screens.') } finally { setLoadingScreens(false) }
  }

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedEvent) return; setSavingShow(true); setShowError('')
    try {
      await showAPI.create({ event: selectedEvent.id, screen: Number(showForm.screen), show_time: showForm.show_time, price: screens.find(s => s.id === Number(showForm.screen))?.silver_price || 0 })
      setShowModal(false); setShowForm({ venue_id: '', screen: '', show_time: '' }); setScreens([])
      if (expandedShows.has(selectedEvent.id)) { fetchShowsForEvent(selectedEvent.id); setExpandedShows(prev => new Set(prev).add(selectedEvent.id)) }
    } catch (err: any) { const data = err.response?.data; setShowError(data ? Object.values(data).flat().join(' ') : 'Failed to create show.') } finally { setSavingShow(false) }
  }

  const openAddShow = (event: Event) => { setSelectedEvent(event); setShowForm({ venue_id: '', screen: '', show_time: '' }); setScreens([]); setShowError(''); setShowModal(true) }

  const openEditShow = (show: any) => {
    setEditingShow(show)
    const dt = new Date(show.show_time)
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setEditShowTime(local); setEditError(''); setEditShowModal(true)
  }

  const handleEditShow = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingShow) return; setSavingEdit(true); setEditError('')
    try {
      await showAPI.update(editingShow.id, { show_time: editShowTime })
      setEditShowModal(false); fetchShowsForEvent(editingShow.event)
    } catch (err: any) { setEditError(err?.response?.data?.show_time?.[0] || 'Failed to update show.') } finally { setSavingEdit(false) }
  }

  const handleCancelShow = async (show: any) => {
    if (!confirm(`Cancel show on ${new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}?`)) return
    setCancellingShow(show.id)
    try { await showAPI.delete(show.id); setEventShows(prev => ({ ...prev, [show.event]: (prev[show.event] || []).filter(s => s.id !== show.id) })); fetchShowsForEvent(show.event) }
    catch { alert('Failed to cancel show.') } finally { setCancellingShow(null) }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete this event? All associated shows will also be deleted.')) return
    setDeletingId(id)
    try { await eventAPI.delete(id); setEvents(events.filter(e => e.id !== id)) }
    catch { alert('Failed to delete event') } finally { setDeletingId(null) }
  }

  const selectedScreen = screens.find(s => s.id === Number(showForm.screen))

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-red-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/venue-dashboard">
              <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={16} />
              </motion.div>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">My Events</span></div>
              <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Events</h1>
              <p className="text-gray-600 text-sm mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''} created</p>
            </div>
          </div>
          <Link href="/venue-dashboard/events/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm shadow-lg shadow-red-600/20">
            <CalendarPlus size={15} /> Create Event
          </Link>
        </motion.div>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="h-24 rounded-2xl bg-white/3" />
            ))}
          </div>
        )}
        {error && <p className="text-center text-red-500 py-16">{error}</p>}

        {!loading && !error && events.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-white/6 rounded-3xl">
            <p className="text-4xl mb-4">🎬</p>
            <p className="text-white text-xl font-black mb-2">No events yet</p>
            <p className="text-gray-700 text-sm mb-8">Create your first event to get started</p>
            <Link href="/venue-dashboard/events/create" className="px-8 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm">Create Event →</Link>
          </motion.div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event, i) => {
              const imageUrl = getImageUrl(event.image)
              const isExpanded = expandedShows.has(event.id)
              const shows = eventShows[event.id] || []
              const isLoadingShows = loadingShows.has(event.id)
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4 p-5">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={event.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-2xl">{event.event_type === 'MOVIE' ? '🎬' : event.event_type === 'CONCERT' ? '🎵' : event.event_type === 'SPORTS' ? '⚽' : '🎪'}</div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-red-600/15 text-red-400 text-[10px] font-black rounded uppercase tracking-widest">{event.event_type}</span>
                        {event.language && <span className="text-gray-700 text-xs">{event.language}</span>}
                        {event.duration && <span className="text-gray-700 text-xs">{event.duration} min</span>}
                      </div>
                      <h3 className="font-black text-white text-base leading-tight truncate">{event.title}</h3>
                      <p className="text-gray-700 text-xs mt-0.5 line-clamp-1">{event.description}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openAddShow(event)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 transition text-xs font-bold">
                        <Plus size={13} /> Add Show
                      </motion.button>
                      <Link href={`/venue-dashboard/events/${event.id}/edit`}
                        className="w-9 h-9 rounded-xl border border-white/8 text-gray-500 flex items-center justify-center hover:border-white/20 hover:text-white transition">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDeleteEvent(event.id)} disabled={deletingId === event.id}
                        className="w-9 h-9 rounded-xl border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/8 transition disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => toggleShows(event.id)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-white/8 text-gray-500 rounded-xl hover:border-white/20 hover:text-white transition text-xs font-semibold">
                        <Calendar size={13} /> Shows
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={13} />
                        </motion.div>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        className="border-t border-white/5 overflow-hidden">
                        <div className="p-5">
                          {isLoadingShows ? (
                            <p className="text-gray-700 text-sm text-center py-4">Loading shows...</p>
                          ) : shows.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-white/6 rounded-xl">
                              <p className="text-gray-700 text-sm mb-3">No shows scheduled yet</p>
                              <button onClick={() => openAddShow(event)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 transition text-xs font-bold mx-auto">
                                <Plus size={13} /> Add First Show
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-gray-700 text-[10px] uppercase tracking-widest mb-3">{shows.length} show{shows.length > 1 ? 's' : ''} scheduled</p>
                              {shows.map((show: any) => {
                                const isPast = new Date(show.show_time) < new Date()
                                return (
                                  <div key={show.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${isPast ? 'border-white/4 bg-white/[0.01] opacity-50' : 'border-white/6 bg-white/[0.02]'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-gray-600' : 'bg-emerald-500'}`} />
                                      <div>
                                        <p className="text-white text-sm font-semibold">{new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        <div className="flex items-center gap-3 text-gray-600 text-xs mt-0.5">
                                          <span className="flex items-center gap-1"><MapPin size={10} /> {show.theater_name || `Screen #${show.screen}`}</span>
                                          <span>₹{show.price}</span>
                                          {isPast && <span className="text-yellow-600">Past</span>}
                                        </div>
                                      </div>
                                    </div>
                                    {!isPast && (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => openEditShow(show)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/8 text-gray-400 rounded-lg hover:border-white/20 hover:text-white transition text-xs">
                                          <Edit2 size={11} /> Edit
                                        </button>
                                        <button onClick={() => handleCancelShow(show)} disabled={cancellingShow === show.id}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/8 transition text-xs disabled:opacity-50">
                                          <XCircle size={11} />{cancellingShow === show.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Show Modal */}
      <AnimatePresence>
        {showModal && selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6 w-full max-w-md">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent rounded-t-2xl" />
              <div className="flex items-start justify-between mb-6">
                <div><h2 className="text-white font-black text-xl">Add Show</h2><p className="text-gray-600 text-sm mt-0.5">{selectedEvent.title}</p></div>
                <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white transition"><X size={18} /></button>
              </div>
              {showError && <div className="mb-4 p-3 bg-red-500/8 border border-red-500/20 rounded-xl"><p className="text-red-300 text-xs">{showError}</p></div>}
              {venues.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 text-sm mb-4">You need to create a venue with screens first.</p>
                  <Link href="/venue-dashboard/venues/create" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition text-sm font-bold">Create Venue →</Link>
                </div>
              ) : (
                <form onSubmit={handleAddShow} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Select Venue *</label>
                    <select required value={showForm.venue_id} onChange={e => handleVenueChange(e.target.value)} className={inputCls + ' bg-[#111]'}>
                      <option value="">Choose a venue...</option>
                      {venues.map(v => <option key={v.id} value={v.id}>{v.name} – {v.city}</option>)}
                    </select>
                  </div>
                  {showForm.venue_id && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Select Screen *</label>
                      {loadingScreens ? <p className="text-gray-600 text-sm">Loading screens...</p> : screens.length === 0 ? (
                        <div className="p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl"><p className="text-yellow-400 text-xs">No screens found for this venue.</p></div>
                      ) : (
                        <select required value={showForm.screen} onChange={e => setShowForm({ ...showForm, screen: e.target.value })} className={inputCls + ' bg-[#111]'}>
                          <option value="">Choose a screen...</option>
                          {screens.map(s => <option key={s.id} value={s.id}>Screen {s.screen_number} – {s.total_seats} seats</option>)}
                        </select>
                      )}
                    </div>
                  )}
                  {selectedScreen && (
                    <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                      <p className="text-gray-700 text-[10px] uppercase tracking-widest mb-3">Seat Pricing</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[{ tier: 'Silver', price: selectedScreen.silver_price, count: selectedScreen.silver_count }, { tier: 'Gold', price: selectedScreen.gold_price, count: selectedScreen.gold_count }, { tier: 'Platinum', price: selectedScreen.platinum_price, count: selectedScreen.platinum_count }].map(({ tier, price, count }) => (
                          <div key={tier}><p className="text-gray-600 text-xs">{tier}</p><p className="text-white font-black text-sm">₹{price}</p><p className="text-gray-700 text-xs">{count} seats</p></div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Show Date & Time *</label>
                    <input type="datetime-local" required value={showForm.show_time} onChange={e => setShowForm({ ...showForm, show_time: e.target.value })} min={new Date().toISOString().slice(0, 16)} className={inputCls} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/8 text-gray-500 rounded-xl hover:border-white/15 transition text-sm">Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={savingShow || !showForm.screen || !showForm.show_time}
                      className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 disabled:opacity-50 transition text-sm">
                      {savingShow ? 'Adding...' : 'Add Show'}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Show Modal */}
      <AnimatePresence>
        {editShowModal && editingShow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={e => { if (e.target === e.currentTarget) setEditShowModal(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-white font-black text-xl">Edit Show Time</h2>
                  <p className="text-gray-600 text-sm mt-0.5">Current: {new Date(editingShow.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <button onClick={() => setEditShowModal(false)} className="text-gray-600 hover:text-white transition"><X size={18} /></button>
              </div>
              {editError && <div className="mb-4 p-3 bg-red-500/8 border border-red-500/20 rounded-xl"><p className="text-red-300 text-xs">{editError}</p></div>}
              <form onSubmit={handleEditShow} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">New Show Date & Time *</label>
                  <input type="datetime-local" required value={editShowTime} onChange={e => setEditShowTime(e.target.value)} min={new Date().toISOString().slice(0, 16)} className={inputCls} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditShowModal(false)} className="flex-1 py-3 border border-white/8 text-gray-500 rounded-xl hover:border-white/15 transition text-sm">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={savingEdit}
                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 disabled:opacity-50 transition text-sm">
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}