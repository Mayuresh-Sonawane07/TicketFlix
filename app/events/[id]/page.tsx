'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient, Show, Event } from '@/lib/api'
import { ArrowLeft, Clock, Globe, Tag, Calendar, MapPin, Star, Trash2, Send, Volume2, VolumeX, Sparkles, Ticket } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://ticketflix-backend-cpyl.onrender.com/api'

function getImageUrl(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `${API_BASE}/media/${image}`
}

function getYouTubeEmbed(url?: string) {
  if (!url) return null
  const regExp = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/
  const match = url.match(regExp)
  return match ? match[1] : null
}

interface Review {
  id: number; user: number; user_name: string; rating: number; comment: string; created_at: string
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          <Star size={readonly ? 16 : 22}
            className={`transition ${star <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`} />
        </button>
      ))}
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [shows, setShows] = useState<Show[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [deleting, setDeleting] = useState(false)

  const videoId = getYouTubeEmbed(event?.trailer_url)
  const trailerSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1`
    : null

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.ok ? res.json() : null).then(user => { if (user) setCurrentUser(user) }).catch(() => {})
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [eventRes, showsRes, reviewsRes] = await Promise.all([
        apiClient.get<any>(`/events/${id}/`),
        apiClient.get<any>(`/theaters/shows/?event=${id}`),
        apiClient.get<Review[]>(`/events/${id}/reviews/`),
      ])
      setEvent(eventRes.data)
      const showData = showsRes.data
      setShows(Array.isArray(showData) ? showData : showData.results ?? [])
      const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data.results ?? []
      setReviews(reviewsData)
    } catch { setError('Failed to load event details') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (currentUser && reviews.length > 0) {
      const mine = reviews.find(r => r.user === currentUser.id)
      setUserReview(mine || null)
    }
  }, [reviews, currentUser])

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }))

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault(); setReviewError('')
    if (rating === 0) { setReviewError('Please select a rating.'); return }
    setSubmitting(true)
    try {
      await apiClient.post(`/events/${id}/add_review/`, { rating, comment })
      setRating(0); setComment(''); await fetchData()
    } catch (err: any) { setReviewError(err?.response?.data?.error || 'Failed to submit review.') }
    finally { setSubmitting(false) }
  }

  const handleDeleteReview = async () => {
    if (!confirm('Delete your review?')) return
    setDeleting(true)
    try { await apiClient.delete(`/events/${id}/delete_review/`); setUserReview(null); await fetchData() }
    catch { alert('Failed to delete review.') }
    finally { setDeleting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </motion.div>
    </div>
  )

  if (error || !event) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <p className="text-red-500">{error || 'Event not found'}</p>
    </div>
  )

  const imageUrl = getImageUrl(event.image)

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Hero */}
      <div className="relative h-[560px] w-full overflow-hidden bg-[#0a0a0a]">
        {trailerSrc ? (
          <>
            <iframe key={`yt-${muted}`} ref={iframeRef} src={trailerSrc} title="Trailer background"
              allow="autoplay; encrypted-media" className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scale(1.5)', transformOrigin: 'center center' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-[#080808]/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/70 via-transparent to-transparent pointer-events-none" />
            <button onClick={() => setMuted(v => !v)}
              className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 border border-white/15 text-white text-xs font-medium backdrop-blur-sm hover:bg-black/80 hover:border-white/30 transition-all">
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
          </>
        ) : imageUrl ? (
          <>
            <Image src={imageUrl} alt={event.title} fill className="object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-center h-full text-8xl opacity-20">
              {event.event_type === 'MOVIE' ? '🎬' : event.event_type === 'CONCERT' ? '🎵' : event.event_type === 'SPORTS' ? '⚽' : '🎪'}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
          </>
        )}

        {/* Back */}
        <button onClick={() => router.back()}
          className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white hover:text-red-400 hover:border-red-500/30 transition-all text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Title area */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg tracking-widest uppercase">{event.event_type}</span>
                {avgRating && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-xs font-bold rounded-lg">
                    <Star size={11} className="fill-yellow-400" /> {avgRating}
                    <span className="text-yellow-600 font-normal">({reviews.length})</span>
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-none" style={{ fontFamily: "'Georgia', serif" }}>{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                {event.duration && <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-600" /> {event.duration} min</span>}
                {event.language && <span className="flex items-center gap-1.5"><Globe size={14} className="text-gray-600" /> {event.language}</span>}
                {event.genre && <span className="flex items-center gap-1.5"><Tag size={14} className="text-gray-600" /> {event.genre}</span>}
                {event.release_date && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-600" /> {event.release_date}</span>}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-red-500" />
                <h2 className="text-white font-black text-lg tracking-tight">About</h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-sm">{event.description}</p>
            </motion.div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <h2 className="text-white font-black text-lg tracking-tight">Ratings & Reviews</h2>
                </div>
                <div className="flex gap-8 items-center mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-black text-white">{avgRating}</p>
                    <StarRating value={Math.round(Number(avgRating))} readonly />
                    <p className="text-gray-700 text-xs mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {ratingCounts.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-gray-600 text-xs w-3">{star}</span>
                        <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />
                        <div className="flex-1 bg-white/5 rounded-full h-1.5">
                          <div className="bg-yellow-400 h-1.5 rounded-full transition-all"
                            style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }} />
                        </div>
                        <span className="text-gray-700 text-xs w-4">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="border-t border-white/5 pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-7 h-7 rounded-full bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400 text-xs font-black">
                              {review.user_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-white text-sm font-bold">{review.user_name}</span>
                            {currentUser?.id === review.user && (
                              <span className="text-[10px] text-red-400 bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                          <StarRating value={review.rating} readonly />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 text-xs">{new Date(review.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                          {currentUser?.id === review.user && (
                            <button onClick={handleDeleteReview} disabled={deleting} className="text-gray-700 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{review.comment}</p>}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Write Review */}
            {currentUser && currentUser.role === 'Customer' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
                {userReview ? (
                  <div>
                    <h2 className="text-white font-black text-lg mb-2">Your Review</h2>
                    <p className="text-gray-600 text-sm mb-4">You've already reviewed this event.</p>
                    <div className="flex items-center gap-3">
                      <StarRating value={userReview.rating} readonly />
                      <button onClick={handleDeleteReview} disabled={deleting}
                        className="flex items-center gap-1.5 text-red-500 hover:text-red-400 text-sm transition-colors font-semibold">
                        <Trash2 size={13} />{deleting ? 'Deleting...' : 'Delete Review'}
                      </button>
                    </div>
                    {userReview.comment && <p className="text-gray-500 text-sm mt-3">{userReview.comment}</p>}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <Send size={14} className="text-red-500" />
                      <h2 className="text-white font-black text-lg tracking-tight">Write a Review</h2>
                    </div>
                    {reviewError && (
                      <div className="mb-4 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                        <p className="text-red-300 text-xs">{reviewError}</p>
                      </div>
                    )}
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Your Rating</label>
                        <StarRating value={rating} onChange={setRating} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Comment (optional)</label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)}
                          placeholder="Share your experience..." rows={3}
                          className="w-full px-4 py-3 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 transition resize-none" />
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm disabled:opacity-50">
                        <Send size={14} />{submitting ? 'Submitting...' : 'Submit Review'}
                      </motion.button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {reviews.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
                <h2 className="text-white font-black text-lg mb-2">Ratings & Reviews</h2>
                <p className="text-gray-700 text-sm">No reviews yet. Be the first to review!</p>
              </motion.div>
            )}
          </div>

          {/* Right: Shows */}
          <div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-4">
                <Ticket size={14} className="text-red-500" />
                <h2 className="text-white font-black text-lg tracking-tight">Available Shows</h2>
              </div>
              {shows.length === 0 ? (
                <div className="bg-white/[0.02] border border-dashed border-white/8 rounded-2xl p-6 text-center">
                  <p className="text-gray-700 text-sm">No shows available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shows.map((show) => (
                    <motion.div key={show.id} whileHover={{ scale: 1.02 }}
                      className="relative bg-white/[0.03] border border-white/6 hover:border-red-500/30 rounded-2xl p-4 transition-all duration-200 overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-red-600/3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs mb-1.5">
                          <MapPin size={11} />
                          <span>{(show as any).theater_name || 'Venue'}</span>
                        </div>
                        <p className="text-white font-bold text-sm mb-1">
                          {new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-red-500 font-black text-lg">₹{show.price}</span>
                          <Link href={`/seat-selection/${show.id}`}
                            className="px-4 py-2 bg-red-600 text-white text-xs rounded-xl hover:bg-red-500 transition font-bold">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}