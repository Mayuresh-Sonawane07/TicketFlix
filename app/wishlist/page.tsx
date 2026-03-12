'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWishlist } from '@/hooks/useWishlist'
import EventCard from '@/components/EventCard'

export default function WishlistPage() {
  const router = useRouter()
  const { wishlist, removeFromWishlist } = useWishlist()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-red-500 fill-red-500" />
                <h1 className="text-3xl font-bold text-white">My Wishlist</h1>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {wishlist.length} {wishlist.length === 1 ? 'event' : 'events'} saved
              </p>
            </div>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear your entire wishlist?')) {
                  wishlist.forEach(e => removeFromWishlist(e.id))
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-red-600/30 text-red-500 rounded-lg hover:bg-red-600/10 transition text-sm"
            >
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>

        {/* Empty State */}
        {wishlist.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
            <Heart size={56} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg mb-2">Your wishlist is empty</p>
            <p className="text-gray-500 text-sm mb-6">Tap the heart on any event to save it here</p>
            <Link href="/"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
              Browse Events →
            </Link>
          </motion.div>
        )}

        {/* Grid */}
        {wishlist.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {wishlist.map((event) => (
                <motion.div key={event.id} layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}