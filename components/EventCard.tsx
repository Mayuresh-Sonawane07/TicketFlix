'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev'

function getImageUrl(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `${API_BASE}/media/${image}`
}

export default function EventCard({ event }: { event: Event }) {
  const imageUrl = getImageUrl(event.image)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const wishlisted = isWishlisted(event.id)

  return (
    <motion.div whileHover={{ scale: 1.04, y: -6 }} transition={{ duration: 0.25 }} className="group relative">

      {/* Wishlist Button */}
      <motion.button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(event) }}
        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:border-red-500/50 transition-colors"
        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <AnimatePresence mode="wait">
          <motion.div key={wishlisted ? 'filled' : 'empty'}
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Heart size={16} className={wishlisted ? 'text-red-500 fill-red-500' : 'text-white'} />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <Link href={`/events/${event.id}`}>
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-red-600/50 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl">

          {/* Image */}
          <div className="relative w-full h-80 bg-gray-800 overflow-hidden">
            {imageUrl ? (
              <Image src={imageUrl} alt={event.title} fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.currentTarget.style.display = 'none' }} />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">🎬</div>
            )}
            {(event as any).avg_rating && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white text-xs font-bold">{Number((event as any).avg_rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span>{event.duration ? `${event.duration} min` : 'N/A'}</span>
              <span>•</span>
              <span>{event.language || 'N/A'}</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-4">{event.description || 'No description available'}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-md">{event.genre || 'Unknown'}</span>
              <span className="text-sm font-semibold text-red-500 group-hover:text-red-400 transition">View Details →</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}