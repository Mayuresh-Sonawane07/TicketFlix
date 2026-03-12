'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Film, LogOut, LayoutDashboard, CalendarPlus, List, User, MapPin, Sun, Moon, Heart } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { motion } from 'framer-motion'
import { useWishlist } from '@/hooks/useWishlist'

interface UserData {
  id: number
  email: string
  role: string
}

export default function Navigation() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { wishlist } = useWishlist()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const updateNav = () => {
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('user')
      setIsLoggedIn(!!token)
      if (userData) {
        try { setUser(JSON.parse(userData)) } catch { setUser(null) }
      } else {
        setUser(null)
      }
    }
    updateNav()
    window.addEventListener('storage', updateNav)
    window.addEventListener('authChange', updateNav)
    return () => {
      window.removeEventListener('storage', updateNav)
      window.removeEventListener('authChange', updateNav)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    router.push('/login')
  }

  const isVenueOwner = user?.role === 'VENUE_OWNER'
  const isCustomer = user?.role === 'Customer'

  const navLinkClass = theme === 'dark'
    ? 'text-gray-300 hover:text-white transition-colors'
    : 'text-gray-600 hover:text-gray-900 transition-colors'

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gray-950 border-red-600/20'
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-red-600">
          <Film size={28} />
          <span>TicketFlix</span>
        </Link>

        <div className="flex items-center gap-6">

          {/* Not logged in */}
          {!isLoggedIn && (
            <>
              <Link href="/" className={navLinkClass}>Events</Link>
              <Link href="/login" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Login
              </Link>
            </>
          )}

          {/* Customer nav */}
          {isLoggedIn && isCustomer && (
            <>
              <Link href="/" className={navLinkClass}>Events</Link>
              <Link href="/bookings" className={navLinkClass}>My Bookings</Link>
              <Link href="/venue-dashboard/profile" className={navLinkClass}>Profile</Link>
              <button onClick={handleLogout} className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-red-500' : 'text-gray-600 hover:text-red-500'}`}>
                <LogOut size={18} /> Logout
              </button>
            </>
          )}

          {/* Venue Owner nav */}
          {isLoggedIn && isVenueOwner && (
            <>
              <Link href="/venue-dashboard" className={`flex items-center gap-1.5 ${navLinkClass}`}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link href="/venue-dashboard/events" className={`flex items-center gap-1.5 ${navLinkClass}`}>
                <List size={16} /> My Events
              </Link>
              <Link href="/venue-dashboard/events/create" className={`flex items-center gap-1.5 ${navLinkClass}`}>
                <CalendarPlus size={16} /> Create Event
              </Link>
              <Link href="/venue-dashboard/venues" className={`flex items-center gap-1.5 ${navLinkClass}`}>
                <MapPin size={16} /> My Venues
              </Link>
              <Link href="/venue-dashboard/profile" className={`flex items-center gap-1.5 ${navLinkClass}`}>
                <User size={16} /> Profile
              </Link>
              <button onClick={handleLogout} className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-red-500' : 'text-gray-600 hover:text-red-500'}`}>
                <LogOut size={18} /> Logout
              </button>
            </>
          )}

          {/* Wishlist Button */}
          {isLoggedIn && isCustomer && (
            <Link href="/wishlist" className="relative">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                <Heart size={18} className="text-red-500" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {wishlist.length > 9 ? '9+' : wishlist.length}
                  </span>
                )}
              </motion.div>
            </Link>
          )}

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -30, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
          </motion.button>

        </div>
      </div>
    </nav>
  )
}