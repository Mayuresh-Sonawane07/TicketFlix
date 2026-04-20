'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient, Show, Event } from '@/lib/api'
import { ArrowLeft, Clock, Globe, Tag, Calendar, MapPin, Star, Trash2, Send } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://ticketflix-backend-cpyl.onrender.com/api'

function getImageUrl(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `${API_BASE}/media/${image}`
}

interface Review {
  id: number
  user: number
  user_name: string
  rating: number
  comment: string
  created_at: string
}

function StarRating({ value, onChange, readonly = false }: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            size={readonly ? 16 : 24}
            className={`transition ${
              star <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
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

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    // ✅ Fixed: use /api/auth/me instead of localStorage
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => { if (user) setCurrentUser(user) })
      .catch(() => {})

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
    } catch {
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser && reviews.length > 0) {
      const mine = reviews.find(r => r.user === currentUser.id)
      setUserReview(mine || null)
    }
  }, [reviews, currentUser])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError('')
    if (rating === 0) { setReviewError('Please select a rating.'); return }
    setSubmitting(true)
    try {
      await apiClient.post(`/events/${id}/add_review/`, { rating, comment })
      setRating(0)
      setComment('')
      await fetchData()
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!confirm('Delete your review?')) return
    setDeleting(true)
    try {
      await apiClient.delete(`/events/${id}/delete_review/`)
      setUserReview(null)
      await fetchData()
    } catch {
      alert('Failed to delete review.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  if (error || !event) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-500">{error || 'Event not found'}</p>
    </div>
  )

  const imageUrl = getImageUrl(event.image)

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="relative h-96 w-full bg-gray-900">
        {imageUrl ? (
          <Image src={imageUrl} alt={event.title} fill className="object-cover opacity-60" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">
            {event.event_type === 'MOVIE' ? '🎬' :
              event.event_type === 'CONCERT' ? '🎵' :
                event.event_type === 'SPORTS' ? '⚽' : '🎪'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-red-400 transition"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full mb-3 inline-block">
              {event.event_type}
            </span>
            <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm">
              {event.duration && <span className="flex items-center gap-1"><Clock size={14} /> {event.duration} min</span>}
              {event.language && <span className="flex items-center gap-1"><Globe size={14} /> {event.language}</span>}
              {event.genre && <span className="flex items-center gap-1"><Tag size={14} /> {event.genre}</span>}
              {event.release_date && <span className="flex items-center gap-1"><Calendar size={14} /> {event.release_date}</span>}
              {avgRating && (
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Star size={14} className="fill-yellow-400" /> {avgRating} ({reviews.length} reviews)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: About + Reviews */}
          <div className="lg:col-span-2 space-y-10">

            <div>
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              <p className="text-gray-400 leading-relaxed">{event.description}</p>
            </div>

            {reviews.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Ratings & Reviews</h2>
                <div className="flex gap-8 items-center mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white">{avgRating}</p>
                    <StarRating value={Math.round(Number(avgRating))} readonly />
                    <p className="text-gray-500 text-xs mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {ratingCounts.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-3">{star}</span>
                        <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />
                        <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                          <div
                            className="bg-yellow-400 h-1.5 rounded-full transition-all"
                            style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs w-4">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-t border-gray-800 pt-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center text-red-400 text-xs font-bold">
                              {review.user_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-white text-sm font-semibold">{review.user_name}</span>
                            {currentUser?.id === review.user && (
                              <span className="text-xs text-red-400 bg-red-600/10 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                          <StarRating value={review.rating} readonly />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs">
                            {new Date(review.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </span>
                          {currentUser?.id === review.user && (
                            <button
                              onClick={handleDeleteReview}
                              disabled={deleting}
                              className="text-gray-600 hover:text-red-500 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-400 text-sm mt-2 leading-relaxed">{review.comment}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {currentUser && currentUser.role === 'Customer' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {userReview ? (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Your Review</h2>
                    <p className="text-gray-400 text-sm mb-4">You've already reviewed this event.</p>
                    <div className="flex items-center gap-3">
                      <StarRating value={userReview.rating} readonly />
                      <button
                        onClick={handleDeleteReview}
                        disabled={deleting}
                        className="flex items-center gap-1.5 text-red-500 hover:text-red-400 text-sm transition"
                      >
                        <Trash2 size={14} />
                        {deleting ? 'Deleting...' : 'Delete Review'}
                      </button>
                    </div>
                    {userReview.comment && (
                      <p className="text-gray-400 text-sm mt-3">{userReview.comment}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Write a Review</h2>
                    {reviewError && (
                      <p className="text-red-400 text-sm mb-4 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
                        {reviewError}
                      </p>
                    )}
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Your Rating</label>
                        <StarRating value={rating} onChange={setRating} />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Comment (optional)</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share your experience..."
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition resize-none"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
                      >
                        <Send size={16} />
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </motion.button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {reviews.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Ratings & Reviews</h2>
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
              </div>
            )}

          </div>

          {/* Right: Shows */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Available Shows</h2>
            {shows.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">No shows available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shows.map((show) => (
                  <motion.div
                    key={show.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-900 border border-gray-800 hover:border-red-600/50 rounded-xl p-4 transition"
                  >
                    <div className="flex items-center gap-1 text-gray-400 text-sm mb-1">
                      <MapPin size={12} />
                      <span>{(show as any).theater_name || 'Venue'}</span>
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">
                      {new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-red-500 font-bold">₹{show.price}</span>
                      <Link
                        href={`/seat-selection/${show.id}`}
                        className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-semibold"
                      >
                        Book Now
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}