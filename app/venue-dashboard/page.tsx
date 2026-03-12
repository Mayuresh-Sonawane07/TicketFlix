'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarPlus, List, TrendingUp, Ticket, MapPin } from 'lucide-react'

export default function VenueDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'VENUE_OWNER') {
      router.push('/')
      return
    }
    setUser(parsed)
  }, [])

  if (!user) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, <span className="text-red-600">{user.first_name || user.email}</span>
          </h1>
          <p className="text-gray-400">Manage your events and track performance.</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: <CalendarPlus size={28} className="text-red-500" />,
              label: 'Create Event',
              desc: 'Add a new event or show',
              href: '/venue-dashboard/events/create',
            },
            {
              icon: <List size={28} className="text-red-500" />,
              label: 'My Events',
              desc: 'View and manage your events',
              href: '/venue-dashboard/events',
            },
            {
              icon: <Ticket size={28} className="text-red-500" />,
              label: 'Bookings',
              desc: 'See who booked your events',
              href: '/venue-dashboard/bookings',
            },
            {
              icon: <TrendingUp size={28} className="text-red-500" />,
              label: 'Analytics',
              desc: 'Track your event performance',
              href: '/venue-dashboard/analytics',
            },
            {
              icon: <MapPin size={28} className="text-red-500" />,
              label: 'My Venues',
              desc: 'Manage your venues and screens',
              href: '/venue-dashboard/venues',
            },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={item.href}>
                <div className="bg-gray-900 border border-gray-800 hover:border-red-600/50 rounded-xl p-6 cursor-pointer transition-all">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-1">{item.label}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-xl mb-2">Getting Started</h2>
          <p className="text-gray-400 text-sm">
            Start by creating your first event. Once created, you can add shows,
            set ticket prices, and manage seat availability from your dashboard.
          </p>
          <Link
            href="/venue-dashboard/events/create"
            className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Create Your First Event →
          </Link>
        </div>

      </div>
    </div>
  )
}