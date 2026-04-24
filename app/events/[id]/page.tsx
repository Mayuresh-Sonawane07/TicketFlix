'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient, Show, Event } from '@/lib/api'
import { ArrowLeft, Clock, Globe, Tag, Calendar, MapPin, Star, Trash2, Send } from 'lucide-react'

function getYouTubeEmbed(url?: string) {
  if (!url) return null
  const regExp = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/
  const match = url.match(regExp)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

interface Review {
  id: number
  user: number
  user_name: string
  rating: number
  comment: string
  created_at: string
}

function StarRating({ value, onChange, readonly = false }: any) {
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
        >
          <Star
            size={readonly ? 16 : 24}
            className={star <= (hovered || value)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-600'}
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

  const trailerEmbed = getYouTubeEmbed(event?.trailer_url)
  const videoId = trailerEmbed?.split('/embed/')[1]

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => { if (user) setCurrentUser(user) })

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
      setShows(Array.isArray(showsRes.data) ? showsRes.data : showsRes.data.results ?? [])
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data.results ?? [])
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Loading...</div>
  if (error || !event) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-black">

      {/* 🎬 HERO VIDEO */}
      <div className="relative h-96 w-full overflow-hidden bg-black">

        {videoId && (
          <iframe
            className="absolute inset-0 w-full h-full scale-125 pointer-events-none"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`}
            allow="autoplay"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 text-white hover:text-red-400 z-10 flex gap-2"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="absolute bottom-0 p-8 z-10 w-full">
          <h1 className="text-4xl font-bold text-white">{event.title}</h1>
          <div className="flex gap-4 text-gray-300 text-sm mt-2 flex-wrap">
            {event.duration && <span className="flex gap-1"><Clock size={14}/> {event.duration} min</span>}
            {event.language && <span className="flex gap-1"><Globe size={14}/> {event.language}</span>}
            {event.genre && <span className="flex gap-1"><Tag size={14}/> {event.genre}</span>}
            {event.release_date && <span className="flex gap-1"><Calendar size={14}/> {event.release_date}</span>}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <p className="text-gray-400">{event.description}</p>
        </div>

        {/* RIGHT */}
        <div>
          <h2 className="text-white font-bold mb-4">Available Shows</h2>

          {shows.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-400">
              No shows available yet
            </div>
          ) : (
            shows.map(show => (
              <div key={show.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-3">
                <p className="text-white text-sm">
                  {new Date(show.show_time).toLocaleString('en-IN')}
                </p>
                <Link href={`/seat-selection/${show.id}`} className="text-red-500 text-sm">
                  Book Now →
                </Link>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}