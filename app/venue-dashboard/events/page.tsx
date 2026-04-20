'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { eventAPI, theaterAPI, screenAPI, showAPI, apiClient, Event, Theater, Screen, Show } from '@/lib/api'
import { CalendarPlus, Pencil, Trash2, ArrowLeft, Plus, X, Clock, ChevronDown, ChevronUp, Calendar, MapPin, Edit2, XCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev'

function getImageUrl(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `${API_BASE}/media/${image}`
}

export default function MyEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [expandedShows, setExpandedShows] = useState<Set<number>>(new Set())
  const [eventShows, setEventShows] = useState<Record<number, Show[]>>({})
  const [loadingShows, setLoadingShows] = useState<Set<number>>(new Set())

  // Add Show Modal
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [venues, setVenues] = useState<Theater[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [loadingScreens, setLoadingScreens] = useState(false)
  const [savingShow, setSavingShow] = useState(false)
  const [showError, setShowError] = useState('')
  const [showForm, setShowForm] = useState({ venue_id: '', screen: '', show_time: '' })

  // Edit Show Modal
  const [editShowModal, setEditShowModal] = useState(false)
  const [editingShow, setEditingShow] = useState<any>(null)
  const [editShowTime, setEditShowTime] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Cancel Show
  const [cancellingShow, setCancellingShow] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const user = await res.json()
      if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
      fetchEvents()
      fetchVenues()
    })()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getMyEvents()
      const data = response.data
      setEvents(Array.isArray(data) ? data : (data as any).results ?? [])
    } catch {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
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
    } catch {}
    finally {
      setLoadingShows(prev => { const n = new Set(prev); n.delete(eventId); return n })
    }
  }

  const toggleShows = (eventId: number) => {
    setExpandedShows(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
        if (!eventShows[eventId]) fetchShowsForEvent(eventId)
      }
      return next
    })
  }

  const handleVenueChange = async (venueId: string) => {
    setShowForm({ ...showForm, venue_id: venueId, screen: '' })
    setScreens([])
    if (!venueId) return
    setLoadingScreens(true)
    try {
      const res = await screenAPI.getByTheater(Number(venueId))
      setScreens(Array.isArray(res.data) ? res.data : (res.data as any).results ?? [])
    } catch {
      setShowError('Failed to load screens.')
    } finally {
      setLoadingScreens(false)
    }
  }

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return
    setSavingShow(true)
    setShowError('')
    try {
      await showAPI.create({
        event: selectedEvent.id,
        screen: Number(showForm.screen),
        show_time: showForm.show_time,
        price: screens.find(s => s.id === Number(showForm.screen))?.silver_price || 0,
      })
      setShowModal(false)
      setShowForm({ venue_id: '', screen: '', show_time: '' })
      setScreens([])
      // Refresh shows if expanded
      if (expandedShows.has(selectedEvent.id)) {
        fetchShowsForEvent(selectedEvent.id)
        setExpandedShows(prev => new Set(prev).add(selectedEvent.id))
      }
    } catch (err: any) {
      const data = err.response?.data
      setShowError(data ? Object.values(data).flat().join(' ') : 'Failed to create show.')
    } finally {
      setSavingShow(false)
    }
  }

  const openAddShow = (event: Event) => {
    setSelectedEvent(event)
    setShowForm({ venue_id: '', screen: '', show_time: '' })
    setScreens([])
    setShowError('')
    setShowModal(true)
  }

  const openEditShow = (show: any) => {
    setEditingShow(show)
    // Format for datetime-local input
    const dt = new Date(show.show_time)
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16)
    setEditShowTime(local)
    setEditError('')
    setEditShowModal(true)
  }

  const handleEditShow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShow) return
    setSavingEdit(true)
    setEditError('')
    try {
      await showAPI.update(editingShow.id, { show_time: editShowTime })
      setEditShowModal(false)
      // Refresh shows for the event
      const eventId = editingShow.event
      fetchShowsForEvent(eventId)
    } catch (err: any) {
      setEditError(err?.response?.data?.show_time?.[0] || 'Failed to update show.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCancelShow = async (show: any) => {
    if (!confirm(
      `Cancel show on ${new Date(show.show_time).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })}? This cannot be undone.`
    )) return
    setCancellingShow(show.id)
    const eventId = show.event
    try {
      await showAPI.delete(show.id)
      setEventShows(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter(s => s.id !== show.id)
      }))
      fetchShowsForEvent(eventId) 
    } catch {
      alert('Failed to cancel show. It may have existing bookings.')
    } finally {
      setCancellingShow(null)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event? All associated shows will also be deleted.')) return
    setDeletingId(id)
    try {
      await eventAPI.delete(id)
      setEvents(events.filter(e => e.id !== id))
    } catch {
      alert('Failed to delete event')
    } finally {
      setDeletingId(null)
    }
  }

  const selectedScreen = screens.find(s => s.id === Number(showForm.screen))

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/venue-dashboard" className="text-gray-400 hover:text-white transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">My Events</h1>
              <p className="text-gray-400 text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''} created</p>
            </div>
          </div>
          <Link href="/venue-dashboard/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
            <CalendarPlus size={18} /> Create Event
          </Link>
        </div>

        {loading && <div className="text-center text-gray-400 py-16">Loading your events...</div>}
        {error && <div className="text-center text-red-500 py-16">{error}</div>}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-400 text-lg mb-2">No events yet</p>
            <p className="text-gray-500 text-sm mb-6">Create your first event to get started</p>
            <Link href="/venue-dashboard/events/create"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
              Create Event →
            </Link>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="space-y-6">
            {events.map((event) => {
              const imageUrl = getImageUrl(event.image)
              const isExpanded = expandedShows.has(event.id)
              const shows = eventShows[event.id] || []
              const isLoadingShows = loadingShows.has(event.id)

              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

                  {/* Event Row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={event.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-3xl">
                          {event.event_type === 'MOVIE' ? '🎬' : event.event_type === 'CONCERT' ? '🎵' : event.event_type === 'SPORTS' ? '⚽' : '🎪'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-md">{event.event_type}</span>
                        {event.language && <span className="text-gray-500 text-xs">{event.language}</span>}
                        {event.duration && <span className="text-gray-500 text-xs">{event.duration} min</span>}
                      </div>
                      <h3 className="font-bold text-white text-lg leading-tight truncate">{event.title}</h3>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">{event.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openAddShow(event)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold">
                        <Plus size={14} /> Add Show
                      </button>
                      <Link href={`/venue-dashboard/events/${event.id}/edit`}
                        className="p-2 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-500 hover:text-white transition">
                        <Pencil size={16} />
                      </Link>
                      <button onClick={() => handleDeleteEvent(event.id)} disabled={deletingId === event.id}
                        className="p-2 border border-red-600/30 text-red-500 rounded-lg hover:bg-red-600/10 transition disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => toggleShows(event.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-sm">
                        <Calendar size={14} />
                        Shows
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Shows Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="border-t border-gray-800 overflow-hidden">
                        <div className="p-4">
                          {isLoadingShows ? (
                            <p className="text-gray-500 text-sm text-center py-4">Loading shows...</p>
                          ) : shows.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl">
                              <p className="text-gray-500 text-sm mb-3">No shows scheduled yet</p>
                              <button onClick={() => openAddShow(event)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold mx-auto">
                                <Plus size={14} /> Add First Show
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">
                                {shows.length} show{shows.length > 1 ? 's' : ''} scheduled
                              </p>
                              {shows.map((show: any) => {
                                const isPast = new Date(show.show_time) < new Date()
                                return (
                                  <div key={show.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${isPast ? 'border-gray-800/50 bg-gray-800/20 opacity-60' : 'border-gray-700/50 bg-gray-800/40'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-gray-600' : 'bg-green-500'}`} />
                                      <div>
                                        <p className="text-white text-sm font-medium">
                                          {new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                        <div className="flex items-center gap-3 text-gray-500 text-xs mt-0.5">
                                          <span className="flex items-center gap-1"><MapPin size={10} /> {show.theater_name || `Screen #${show.screen}`}</span>
                                          <span>₹{show.price}</span>
                                          {isPast && <span className="text-yellow-600">Past</span>}
                                        </div>
                                      </div>
                                    </div>
                                    {!isPast && (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => openEditShow(show)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-400 hover:text-white transition text-xs">
                                          <Edit2 size={12} /> Edit Time
                                        </button>
                                        <button onClick={() => handleCancelShow(show)}
                                          disabled={cancellingShow === show.id}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-red-600/30 text-red-500 rounded-lg hover:bg-red-600/10 transition text-xs disabled:opacity-50">
                                          <XCircle size={12} />
                                          {cancellingShow === show.id ? 'Cancelling...' : 'Cancel Show'}
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
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-white font-bold text-xl">Add Show</h2>
                  <p className="text-gray-400 text-sm mt-1">{selectedEvent.title}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              {showError && (
                <div className="mb-4 p-3 bg-red-600/10 border border-red-600/50 rounded-lg">
                  <p className="text-red-400 text-sm">{showError}</p>
                </div>
              )}

              {venues.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-4">You need to create a venue with screens first.</p>
                  <Link href="/venue-dashboard/venues/create" onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold">
                    Create Venue →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleAddShow} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Venue *</label>
                    <select required value={showForm.venue_id} onChange={(e) => handleVenueChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 text-sm">
                      <option value="">Choose a venue...</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>{venue.name} – {venue.city}</option>
                      ))}
                    </select>
                  </div>

                  {showForm.venue_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Select Screen *</label>
                      {loadingScreens ? (
                        <p className="text-gray-500 text-sm">Loading screens...</p>
                      ) : screens.length === 0 ? (
                        <div className="p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                          <p className="text-yellow-400 text-sm">No screens found for this venue.</p>
                        </div>
                      ) : (
                        <select required value={showForm.screen} onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 text-sm">
                          <option value="">Choose a screen...</option>
                          {screens.map((screen) => (
                            <option key={screen.id} value={screen.id}>Screen {screen.screen_number} – {screen.total_seats} seats</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {selectedScreen && (
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">Seat Pricing</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { tier: 'Silver', price: selectedScreen.silver_price, count: selectedScreen.silver_count },
                          { tier: 'Gold', price: selectedScreen.gold_price, count: selectedScreen.gold_count },
                          { tier: 'Platinum', price: selectedScreen.platinum_price, count: selectedScreen.platinum_count },
                        ].map(({ tier, price, count }) => (
                          <div key={tier} className="text-center">
                            <p className="text-gray-400 text-xs">{tier}</p>
                            <p className="text-white font-bold text-sm">₹{price}</p>
                            <p className="text-gray-500 text-xs">{count} seats</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Clock size={14} className="inline mr-1" /> Show Date & Time *
                    </label>
                    <input type="datetime-local" required value={showForm.show_time}
                      onChange={(e) => setShowForm({ ...showForm, show_time: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 text-sm" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-sm">
                      Cancel
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      disabled={savingShow || !showForm.screen || !showForm.show_time}
                      className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm">
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
            onClick={(e) => { if (e.target === e.currentTarget) setEditShowModal(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-white font-bold text-xl">Edit Show Time</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Current: {new Date(editingShow.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <button onClick={() => setEditShowModal(false)} className="text-gray-500 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-600/10 border border-red-600/50 rounded-lg">
                  <p className="text-red-400 text-sm">{editError}</p>
                </div>
              )}

              <form onSubmit={handleEditShow} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock size={14} className="inline mr-1" /> New Show Date & Time *
                  </label>
                  <input type="datetime-local" required value={editShowTime}
                    onChange={(e) => setEditShowTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditShowModal(false)}
                    className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-sm">
                    Cancel
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                    disabled={savingEdit}
                    className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm">
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