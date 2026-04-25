'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Trash2, ArrowLeft, Sparkles, Film } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWishlist } from '@/hooks/useWishlist'
import EventCard from '@/components/EventCard'

function HeartParticle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-red-500/20"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, y: 0 }}
      animate={{ opacity: [0, 0.3, 0], scale: [0, 1, 0.5], y: -80 }}
      transition={{ duration: 4, delay, repeat: Infinity, repeatDelay: 3 + delay }}
    >
      ♥
    </motion.div>
  )
}

const HEARTS = Array.from({ length: 12 }, (_, i) => ({
  x: 5 + (i * 9) % 90, y: 10 + (i * 13) % 80, delay: i * 0.6
}))

export default function WishlistPage() {
  const router = useRouter()
  const { wishlist, removeFromWishlist } = useWishlist()
  const [mounted, setMounted] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const handleClearAll = async () => {
    if (!confirm('Clear your entire wishlist?')) return
    setClearing(true)
    for (const e of wishlist) {
      await new Promise(r => setTimeout(r, 60))
      removeFromWishlist(e.id)
    }
    setClearing(false)
  }

  return (
    <div className="min-h-screen bg-[#080808] overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }} transition={{ duration: 16, repeat: Infinity }}
          className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-red-900/10 blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.08, 1], x: [0, -15, 0] }} transition={{ duration: 20, repeat: Infinity, delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        {HEARTS.map((h, i) => <HeartParticle key={i} {...h} />)}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => router.back()}
                  className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </motion.button>
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Saved Events</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Heart size={28} className="text-red-500 fill-red-500" />
                </motion.div>
                <h1 className="text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                  My Wishlist
                </h1>
              </div>
              <p className="text-gray-600 text-sm mt-2 ml-1">
                {wishlist.length === 0 ? 'Nothing saved yet' : `${wishlist.length} event${wishlist.length !== 1 ? 's' : ''} saved`}
              </p>
            </div>

            {wishlist.length > 0 && (
              <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClearAll} disabled={clearing}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/8 transition-all text-sm font-semibold disabled:opacity-50">
                <Trash2 size={14} />{clearing ? 'Clearing...' : 'Clear all'}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {wishlist.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-32 relative">
              {/* Large decorative heart */}
              <motion.div animate={{ scale: [1, 1.05, 1], rotate: [-3, 3, -3] }} transition={{ duration: 4, repeat: Infinity }}
                className="text-[120px] mb-6 select-none opacity-10">♥</motion.div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Heart size={56} className="text-red-500/30 fill-red-500/10 mb-5" />
                </motion.div>
                <p className="text-white text-xl font-bold mb-2">Your wishlist is empty</p>
                <p className="text-gray-600 text-sm mb-8 max-w-xs">Tap the heart on any event to save it here for later</p>
                <Link href="/">
                  <motion.div whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }} whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm cursor-pointer">
                    <Film size={16} />Browse Events
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section divider */}
        {wishlist.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-red-600/30 via-white/5 to-transparent" />
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{wishlist.length} saved</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
          </motion.div>
        )}

        {/* Grid */}
        {wishlist.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            <AnimatePresence mode="popLayout">
              {wishlist.map((event, index) => (
                <motion.div key={event.id} layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <EventCard event={event} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}