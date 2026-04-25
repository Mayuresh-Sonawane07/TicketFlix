'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@/lib/api'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Heart, Star, Clock, Globe, Play, Ticket } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useRef, useState } from 'react'

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
    .slice(0, 2)
}

const TYPE_CONFIG: Record<string, { emoji: string; color: string; glow: string }> = {
  MOVIE:   { emoji: '🎬', color: 'from-red-600 to-orange-600',    glow: 'shadow-red-600/40' },
  CONCERT: { emoji: '🎵', color: 'from-violet-600 to-pink-600',   glow: 'shadow-violet-600/40' },
  SPORTS:  { emoji: '⚽', color: 'from-emerald-600 to-cyan-600',  glow: 'shadow-emerald-600/40' },
  OTHER:   { emoji: '🎪', color: 'from-amber-600 to-yellow-500',  glow: 'shadow-amber-500/40' },
}

const GENRE_COLORS: Record<string, string> = {
  action:    'bg-red-500/15 text-red-300 border-red-500/25',
  drama:     'bg-violet-500/15 text-violet-300 border-violet-500/25',
  comedy:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  thriller:  'bg-orange-500/15 text-orange-300 border-orange-500/25',
  horror:    'bg-red-900/30 text-red-200 border-red-800/40',
  romance:   'bg-pink-500/15 text-pink-300 border-pink-500/25',
  scifi:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  fantasy:   'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  adventure: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  anime:     'bg-blue-500/15 text-blue-300 border-blue-500/25',
  historical:'bg-amber-500/15 text-amber-300 border-amber-500/25',
  default:   'bg-white/5 text-gray-300 border-white/10',
}

function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre.toLowerCase()] || GENRE_COLORS.default
}

export default function EventCard({ event, index = 0 }: { event: Event; index?: number }) {
  const imageUrl = getImageUrl(event.image)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const wishlisted = isWishlisted(event.id)
  const genres = parseGenres(event.genre)
  const cfg = TYPE_CONFIG[event.event_type] || TYPE_CONFIG.OTHER
  const [hovered, setHovered] = useState(false)

  // 3D tilt effect
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const handleMouseLeave = () => {
    x.set(0); y.set(0); setHovered(false)
  }

  const avgRating = (event as any).avg_rating

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="group relative"
    >
      {/* Wishlist */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(event) }}
        className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-red-400/60 hover:bg-red-950/60 transition-all duration-200"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={wishlisted ? '1' : '0'}
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.4, rotate: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Heart size={15} className={wishlisted ? 'text-red-400 fill-red-400' : 'text-white/70'} />
          </motion.div>
        </AnimatePresence>
      </button>

      <Link href={`/events/${event.id}`}>
        <motion.div
          ref={cardRef}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-2xl overflow-hidden cursor-pointer"
        >
          {/* Glow border on hover */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 rounded-2xl z-0 bg-gradient-to-br ${cfg.color} opacity-0 blur-xl`}
            style={{ margin: '-2px' }}
          />

          {/* Card shell */}
          <div className={`relative z-10 rounded-2xl overflow-hidden border transition-all duration-300 ${
            hovered ? 'border-white/20 shadow-2xl ' + cfg.glow : 'border-white/5 shadow-lg shadow-black/50'
          } bg-[#0d0d0d]`}>

            {/* POSTER — fixed aspect ratio, full coverage */}
            <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#111]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                  priority={index < 4}
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${cfg.color} opacity-20`}>
                  <span className="text-7xl mb-2">{cfg.emoji}</span>
                </div>
              )}

              {/* Cinematic vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/10 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/30 via-transparent to-[#0d0d0d]/20" />

              {/* Event type badge */}
              <div className="absolute top-3 left-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r ${cfg.color} text-white shadow-lg`}>
                  {event.event_type}
                </span>
              </div>

              {/* Rating badge */}
              {avgRating && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-yellow-500/20">
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-300 text-xs font-bold">{Number(avgRating).toFixed(1)}</span>
                </div>
              )}

              {/* Play button overlay on hover */}
              <motion.div
                animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                  <Play size={22} className="text-white fill-white ml-1" />
                </div>
              </motion.div>
            </div>

            {/* Card content */}
            <div className="p-4 space-y-2.5">
              {/* Title */}
              <h3 className="font-bold text-[15px] leading-snug text-white line-clamp-2 tracking-tight">
                {event.title}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                {event.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={10} className="text-gray-600" />
                    {event.duration} min
                  </span>
                )}
                {event.language && (
                  <span className="flex items-center gap-1">
                    <Globe size={10} className="text-gray-600" />
                    {event.language}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                {event.description}
              </p>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span key={g} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getGenreColor(g)}`}>
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <motion.div
                animate={{ x: hovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
                className="pt-1 flex items-center gap-2"
              >
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase bg-gradient-to-r ${cfg.color} bg-clip-text text-transparent`}>
                  <Ticket size={12} className="text-red-500" />
                  Book Now
                </span>
                <motion.span
                  animate={{ x: hovered ? 3 : 0 }}
                  className="text-red-500 text-sm font-bold"
                >→</motion.span>
              </motion.div>
            </div>

            {/* Bottom shimmer on hover */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0, x: hovered ? '100%' : '-100%' }}
              transition={{ duration: 0.6 }}
              className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent`}
            />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}