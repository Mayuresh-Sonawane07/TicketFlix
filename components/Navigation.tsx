'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Film, LogOut, LayoutDashboard, CalendarPlus, List, User, MapPin, Sun, Moon, Heart, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist } from '@/hooks/useWishlist'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-cf420.up.railway.app/api'

interface UserData {
  id: number
  email: string
  role: string
}

function dispatchCityChange(city: string) {
  window.dispatchEvent(new CustomEvent('cityChange', { detail: city }))
}

export default function Navigation() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { wishlist } = useWishlist()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [mounted, setMounted] = useState(false)

  // ── City state ────────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState<string>('All Cities')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Fetch cities ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/events/cities/`)
      .then(res => res.json())
      .then((cities: string[]) => setAvailableCities(cities))
      .catch(() => {})
  }, [])

  // ── Close dropdown on outside click ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false)
        setCitySearch('')
        setLocationError('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Auto-detect location ──────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }
    setDetectingLocation(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            ''

          if (!detectedCity) {
            setLocationError('Could not determine your city')
            return
          }

          const matched = availableCities.find(
            c => c.toLowerCase() === detectedCity.toLowerCase()
          )

          if (matched) {
            selectCity(matched)
          } else {
            setLocationError(`No events near "${detectedCity}"`)
          }
        } catch {
          setLocationError('Failed to detect location')
        } finally {
          setDetectingLocation(false)
        }
      },
      () => {
        setLocationError('Location access denied')
        setDetectingLocation(false)
      },
      { timeout: 8000 }
    )
  }

  const selectCity = (city: string) => {
    setSelectedCity(city)
    dispatchCityChange(city)
    setCityDropdownOpen(false)
    setCitySearch('')
    setLocationError('')
  }

  const filteredCities = availableCities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  // ── Auth state ────────────────────────────────────────────────
  useEffect(() => {
    const updateNav = () => {
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('user')

      const isTokenExpired = (token: string) => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          return payload.exp * 1000 < Date.now()
        } catch {
          return true
        }
      }

      const validToken = token && 
        token !== 'undefined' && 
        token !== 'null' && 
        token.length > 10 &&
        !isTokenExpired(token)  // ← reject expired tokens

      if (validToken && userData) {
        try {
          const parsed = JSON.parse(userData)
          if (parsed && parsed.role) {
            setIsLoggedIn(true)
            setUser(parsed)
          } else {
            setIsLoggedIn(false)
            setUser(null)
          }
        } catch {
          setIsLoggedIn(false)
          setUser(null)
        }
      } else {
        setIsLoggedIn(false)
        setUser(null)
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    }

    updateNav()
    setMounted(true)
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

        <div className="flex items-center gap-4">

          {/* ── City Selector ── */}
          {!isVenueOwner && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MapPin size={15} className="text-red-500" />
                <span className="max-w-[100px] truncate">{selectedCity}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {cityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-full left-0 mt-2 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-gray-900 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Select City
                      </p>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={citySearch}
                          onChange={e => setCitySearch(e.target.value)}
                          placeholder="Search city..."
                          className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:border-red-500 transition ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button
                        onClick={detectLocation}
                        disabled={detectingLocation}
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-medium transition w-full py-1"
                      >
                        {detectingLocation
                          ? <Loader2 size={14} className="animate-spin" />
                          : <MapPin size={14} />
                        }
                        {detectingLocation ? 'Detecting location...' : 'Use my current location'}
                      </button>
                      {locationError && (
                        <p className="text-xs text-red-400 mt-1">{locationError}</p>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      <button
                        onClick={() => selectCity('All Cities')}
                        className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${
                          selectedCity === 'All Cities'
                            ? 'text-red-500 bg-red-500/10'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-800'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        All Cities
                        {selectedCity === 'All Cities' && (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </button>

                      {filteredCities.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">No cities found</p>
                      ) : (
                        filteredCities.map(city => (
                          <button
                            key={city}
                            onClick={() => selectCity(city)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${
                              selectedCity === city
                                ? 'text-red-500 bg-red-500/10'
                                : theme === 'dark'
                                  ? 'text-gray-300 hover:bg-gray-800'
                                  : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {city}
                            {selectedCity === city && (
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Nav Links — mounted guard prevents localStorage flicker ── */}

          {/* Not logged in */}
          {mounted && !isLoggedIn && (
            <>
              <Link href="/" className={navLinkClass}>Events</Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 border border-red-600 text-red-500 rounded-lg hover:bg-red-600/10 transition-colors font-semibold text-sm"
              >
                Register
              </Link>
            </>
          )}

          {/* Customer */}
          {mounted && isLoggedIn && isCustomer && (
            <>
              <Link href="/" className={navLinkClass}>Events</Link>
              <Link href="/bookings" className={navLinkClass}>My Bookings</Link>
              <Link href="/venue-dashboard/profile" className={navLinkClass}>Profile</Link>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 transition-colors text-sm ${
                  theme === 'dark' ? 'text-gray-300 hover:text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          )}

          {/* Venue Owner */}
          {mounted && isLoggedIn && isVenueOwner && (
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
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 transition-colors text-sm ${
                  theme === 'dark' ? 'text-gray-300 hover:text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          )}

          {/* Wishlist — customers only */}
          {mounted && isLoggedIn && isCustomer && (
            <Link href="/wishlist" className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
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