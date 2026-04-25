'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterAPI, Theater } from '@/lib/api'
import { Plus, MapPin, Phone, Pencil, Trash2, ArrowLeft, ChevronRight, Sparkles, Building2 } from 'lucide-react'

export default function MyVenuesPage() {
  const router = useRouter()
  const [venues, setVenues] = useState<Theater[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const user = await res.json()
      if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
      fetchVenues()
    })()
  }, [])

  const fetchVenues = async () => {
    try {
      const res = await theaterAPI.getMyVenues()
      setVenues(Array.isArray(res.data) ? res.data : (res.data as any).results ?? [])
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this venue? All screens and shows will be removed.')) return
    setDeletingId(id)
    try { await theaterAPI.delete(id); setVenues(venues.filter(v => v.id !== id)) }
    catch { alert('Failed to delete venue') } finally { setDeletingId(null) }
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/venue-dashboard">
              <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={16} />
              </motion.div>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">My Venues</span></div>
              <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Venues</h1>
              <p className="text-gray-600 text-sm mt-0.5">{venues.length} venue{venues.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link href="/venue-dashboard/venues/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm shadow-lg shadow-red-600/20">
            <Plus size={15} /> Add Venue
          </Link>
        </motion.div>

        {loading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="h-28 rounded-2xl bg-white/3" />
            ))}
          </div>
        )}

        {!loading && venues.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-white/6 rounded-3xl">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Building2 size={48} className="mx-auto text-gray-800 mb-4" />
            </motion.div>
            <p className="text-white text-xl font-black mb-2">No venues yet</p>
            <p className="text-gray-700 text-sm mb-8">Add your first venue to start hosting events</p>
            <Link href="/venue-dashboard/venues/create" className="px-8 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm">Add Venue →</Link>
          </motion.div>
        )}

        <div className="space-y-4">
          {venues.map((venue, i) => (
            <motion.div key={venue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Building2 size={18} className="text-cyan-400" />
                    </div>
                    <h3 className="text-white font-black text-xl">{venue.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-1 ml-1">
                    <MapPin size={13} className="text-gray-700" />
                    <span>{venue.address}, {venue.city}, {venue.state} - {venue.pincode}</span>
                  </div>
                  {venue.phone_number && (
                    <div className="flex items-center gap-1.5 text-gray-700 text-sm ml-1">
                      <Phone size={13} className="text-gray-700" />
                      <span>{venue.phone_number}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/venue-dashboard/venues/${venue.id}/screens`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/4 border border-white/8 text-gray-400 rounded-xl hover:border-white/15 hover:text-white transition text-xs font-semibold">
                    Screens <ChevronRight size={13} />
                  </Link>
                  <Link href={`/venue-dashboard/venues/${venue.id}/edit`}
                    className="w-9 h-9 rounded-xl border border-white/8 text-gray-500 flex items-center justify-center hover:border-white/20 hover:text-white transition">
                    <Pencil size={14} />
                  </Link>
                  <button onClick={() => handleDelete(venue.id)} disabled={deletingId === venue.id}
                    className="w-9 h-9 rounded-xl border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/8 transition disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}