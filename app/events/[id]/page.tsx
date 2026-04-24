'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient, Show, Event } from '@/lib/api'
import {
  ArrowLeft, Clock, Globe, Tag, Calendar,
  MapPin, Star, Trash2, Send, Volume2, VolumeX
} from 'lucide-react'

function getYouTubeEmbed(url?: string) {
  if (!url) return null
  const regExp = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/
  const match = url.match(regExp)
  return match ? match[1] : null
}

interface Review {
  id: number
  user: number
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [shows, setShows] = useState<Show[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [muted, setMuted] = useState(true)
  const [playerKey, setPlayerKey] = useState(0)

  const videoId = getYouTubeEmbed(event?.trailer_url)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [eventRes, showsRes, reviewsRes] = await Promise.all([
        apiClient.get(`/events/${id}/`),
        apiClient.get(`/theaters/shows/?event=${id}`),
        apiClient.get(`/events/${id}/reviews/`)
      ])

      setEvent(eventRes.data)
      setShows(showsRes.data.results || showsRes.data)
      setReviews(reviewsRes.data.results || reviewsRes.data)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      await apiClient.post(`/events/${id}/reviews/`, { rating, comment })
      setRating(0)
      setComment('')
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-white p-10">Loading...</div>
  if (!event) return null

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 🎬 HERO (UPDATED ONLY) */}
      <div className="relative h-[60vh] w-full overflow-hidden bg-black">

        {videoId && (
          <iframe
            key={playerKey}
            className="absolute inset-0 w-full h-full scale-125 pointer-events-none opacity-90"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&loop=1&playlist=${videoId}&playsinline=1`}
            allow="autoplay"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-10 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* 🔊 SOUND FIX */}
        {videoId && (
          <button
            onClick={() => {
              setMuted(prev => !prev)
              setPlayerKey(prev => prev + 1)
            }}
            className="absolute bottom-6 right-6 z-10 bg-black/60 px-3 py-2 rounded flex items-center gap-2"
          >
            {muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}

        {/* TITLE */}
        <div className="absolute bottom-0 p-8 z-10">
          <h1 className="text-4xl font-bold">{event.title}</h1>
          <div className="flex gap-4 text-gray-300 text-sm mt-2 flex-wrap">
            {event.duration && <span><Clock size={14}/> {event.duration} min</span>}
            {event.language && <span><Globe size={14}/> {event.language}</span>}
            {event.genre && <span><Tag size={14}/> {event.genre}</span>}
            {event.release_date && <span><Calendar size={14}/> {event.release_date}</span>}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <p className="text-gray-400">{event.description}</p>

          {/* ⭐ REVIEWS */}
          <div className="bg-gray-900 p-5 rounded-xl">
            <h2 className="font-bold mb-4">Reviews</h2>

            {reviews.map(r => (
              <div key={r.id} className="mb-3">
                <div className="text-yellow-400">{'★'.repeat(r.rating)}</div>
                <p className="text-sm">{r.comment}</p>
              </div>
            ))}

            <div className="mt-4">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write review..."
                className="w-full bg-gray-800 p-2 rounded mb-2"
              />
              <button
                onClick={submitReview}
                disabled={submitting}
                className="bg-red-600 px-4 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT (BOOK NOW) */}
        <div>
          <h2 className="font-bold mb-4">Available Shows</h2>

          {shows.map(show => (
            <div key={show.id} className="bg-gray-900 p-4 rounded-xl mb-3">
              <p>{new Date(show.show_time).toLocaleString()}</p>
              <Link href={`/seat-selection/${show.id}`} className="text-red-500">
                Book Now →
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}