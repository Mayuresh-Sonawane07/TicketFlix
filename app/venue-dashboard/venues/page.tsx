'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { theaterAPI, Theater } from '@/lib/api'
import { Plus, MapPin, Phone, Pencil, Trash2, ArrowLeft, ChevronRight } from 'lucide-react'

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
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this venue? All screens and shows will be removed.')) return
    setDeletingId(id)
    try {
      await theaterAPI.delete(id)
      setVenues(venues.filter(v => v.id !== id))
    } catch {
      alert('Failed to delete venue')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/venue-dashboard" className="text-gray-400 hover:text-white transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">My Venues</h1>
              <p className="text-gray-400 text-sm mt-1">{venues.length} venue{venues.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link
            href="/venue-dashboard/venues/create"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            <Plus size={18} />
            Add Venue
          </Link>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-16">Loading venues...</div>
        )}

        {!loading && venues.length === 0 && (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
            <MapPin className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg mb-2">No venues yet</p>
            <p className="text-gray-500 text-sm mb-6">Add your first venue to start hosting events</p>
            <Link
              href="/venue-dashboard/venues/create"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Add Venue →
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {venues.map((venue) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl mb-1">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-1">
                    <MapPin size={14} />
                    <span>{venue.address}, {venue.city}, {venue.state} - {venue.pincode}</span>
                  </div>
                  {venue.phone_number && (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Phone size={14} />
                      <span>{venue.phone_number}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/venue-dashboard/venues/${venue.id}/screens`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    Screens
                    <ChevronRight size={14} />
                  </Link>
                  <Link
                    href={`/venue-dashboard/venues/${venue.id}/edit`}
                    className="p-2 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(venue.id)}
                    disabled={deletingId === venue.id}
                    className="p-2 border border-red-600/30 text-red-500 rounded-lg hover:bg-red-600/10 transition disabled:opacity-50"
                  >
                    <Trash2 size={16} />
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