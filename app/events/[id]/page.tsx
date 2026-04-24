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
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  const [muted, setMuted] = useState(true)

  const trailerEmbed = getYouTubeEmbed(event?.trailer_url)
  const videoId = trailerEmbed?.split('/embed/')[1]

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [eventRes, showsRes] = await Promise.all([
        apiClient.get<any>(`/events/${id}/`),
        apiClient.get<any>(`/theaters/shows/?event=${id}`),
      ])

      setEvent(eventRes.data)
      setShows(Array.isArray(showsRes.data) ? showsRes.data : showsRes.data.results ?? [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Loading...</div>
  if (!event) return null

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 🎬 HERO (ENHANCED ONLY) */}
      <div className="relative h-[60vh] w-full overflow-hidden bg-black">

        {/* 🎥 VIDEO BACKGROUND */}
        {videoId && (
          <iframe
            className="absolute inset-0 w-full h-full scale-125 pointer-events-none opacity-90"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${videoId}&playsinline=1`}
            allow="autoplay"
          />
        )}

        {/* 🌫️ GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

        {/* 🔙 BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-red-400 transition z-10"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* 🔊 SOUND TOGGLE */}
        {videoId && (
          <button
            onClick={() => setMuted(!muted)}
            className="absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-black/80 transition"
          >
            {muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}

        {/* 🎟️ CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0 p-8 z-10"
        >
          <div className="max-w-7xl mx-auto">

            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm">
              {event.duration && <span className="flex items-center gap-1"><Clock size={14}/> {event.duration} min</span>}
              {event.language && <span className="flex items-center gap-1"><Globe size={14}/> {event.language}</span>}
              {event.genre && <span className="flex items-center gap-1"><Tag size={14}/> {event.genre}</span>}
              {event.release_date && <span className="flex items-center gap-1"><Calendar size={14}/> {event.release_date}</span>}
            </div>

          </div>
        </motion.div>
      </div>

      {/* ⚠️ BELOW THIS — YOUR ORIGINAL UI CONTINUES */}
      {/* DO NOT MODIFY YOUR EXISTING CODE BELOW */}
      {/* Your Book Now section, Reviews, Ratings remain unchanged */}

    </div>
  )
}