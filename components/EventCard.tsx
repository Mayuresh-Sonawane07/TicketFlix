'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev'

function getImageUrl(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `${API_BASE}/media/${image}`
}

function parseGenres(genre?: string): string[] {
  if (!genre) return []
  return genre
    .split(/\s*[|,،]\s*/)
    .map(g => g.trim())
    .filter(Boolean)
    .slice(0, 3)
}

const GENRE_COLORS: Record<string, string> = {
  action: 'bg-red-600/20 text-red-400 border-red-600/30',
  drama: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  comedy: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  thriller: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  horror: 'bg-red-900/30 text-red-300 border-red-900/40',
  romance: 'bg-pink-600/20 text-pink-400 border-pink-600/30',
  scifi: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30',
  fantasy: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
  adventure: 'bg-green-600/20 text-green-400 border-green-600/30',
  anime: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  default: 'bg-gray-700/40 text-gray-300 border-gray-600/30',
}

function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre.toLowerCase()] || GENRE_COLORS.default
}

export default function EventCard({ event }: { event: Event }) {
  const imageUrl = getImageUrl(event.image)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const wishlisted = isWishlisted(event.id)
  const genres = parseGenres(event.genre)

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.03 }}
      transition={{ duration: 0.25 }}
      className="group relative break-inside-avoid"
    >
      {/* ❤️ Wishlist */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleWishlist(event)
        }}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/10 hover:border-red-500/50"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={wishlisted ? '1' : '0'}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
          >
            <Heart
              size={16}
              className={wishlisted ? 'text-red-500 fill-red-500' : 'text-white'}
            />
          </motion.div>
        </AnimatePresence>
      </button>

      <Link href={`/events/${event.id}`}>
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 hover:border-red-500/40 transition shadow-lg hover:shadow-2xl">

          {/* 🎬 IMAGE */}
          <div className="relative w-full aspect-[2/3] overflow-hidden">
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />

                {/* 🔥 PREMIUM OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">🎬</div>
            )}

            {(event as any).avg_rating && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 px-2 py-1 rounded">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white text-xs font-bold">
                  {Number((event as any).avg_rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* 📄 CONTENT */}
          <div className="p-4 flex flex-col">
            <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">
              {event.title}
            </h3>

            <div className="text-xs text-gray-400 mb-2">
              {event.duration} min • {event.language}
            </div>

            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {event.description}
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-[48px] overflow-hidden">
              {genres.map((g) => (
                <span
                  key={g}
                  className={`text-xs px-2 py-0.5 rounded-full border ${getGenreColor(g)}`}
                >
                  {g}
                </span>
              ))}
            </div>

            <span className="mt-3 text-sm font-semibold text-red-500">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}