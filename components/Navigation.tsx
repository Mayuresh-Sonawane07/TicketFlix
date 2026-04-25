'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Film, LogOut, LayoutDashboard, CalendarPlus, List, User,
  MapPin, Heart, ChevronDown, Loader2, Search, Bell, Zap,
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useWishlist } from '@/hooks/useWishlist'
import { apiClient } from '@/lib/api'

interface UserData {
  id: number
  first_name?: string
  role: string
}

interface Notification {
  id: number
  title: string
  message: string
  type: string
  created_at: string
}

function dispatchCityChange(city: string) {
  window.dispatchEvent(new CustomEvent('cityChange', { detail: city }))
}

// Magnetic nav link with underline sweep
function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} className="relative group flex items-center gap-1.5 text-sm font-medium">
      {icon && <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>}
      <span className={`relative transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
        {children}
        <span className={`absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
      </span>
    </Link>
  )
}

export default function Navigation() {
  const router = useRouter()
  const { wishlist } = useWishlist()

  const [authState, setAuthState] = useState<UserData | null | 'loading'>('loading')
  const [selectedCity, setSelectedCity]         = useState('All Cities')
  const [availableCities, setAvailableCities]   = useState<string[]>([])
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [citySearch, setCitySearch]             = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationError, setLocationError]       = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen]         = useState(false)
  const [unreadCount, setUnreadCount]     = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  // Spotlight mouse tracking for navbar
  const navRef = useRef<HTMLElement>(null)
  const mouseX = useMotionValue(-400)
  const mouseY = useMotionValue(-400)
  const springX = useSpring(mouseX, { stiffness: 200, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 30 })

  const handleNavMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = navRef.current?.getBoundingClientRect()
    if (rect) {
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }
  }
  const handleNavMouseLeave = () => { mouseX.set(-400); mouseY.set(-400) }

  // Scroll state for blur intensity
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    apiClient.get<string[]>('/events/cities/')
      .then(r => setAvailableCities(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false); setCitySearch(''); setLocationError('')
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = useCallback(() => {
    apiClient.get<Notification[]>('/users/notifications/')
      .then(r => {
        const data = r.data
        if (Array.isArray(data)) {
          setNotifications(data)
          const dayAgo = Date.now() - 86400000
          setUnreadCount(data.filter(n => new Date(n.created_at).getTime() > dayAgo).length)
        }
      })
      .catch(() => {})
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { setAuthState(null); return }
      const parsed = await res.json()
      if (parsed?.role) {
        setAuthState(parsed)
        if (parsed.role !== 'Admin') fetchNotifications()
      } else {
        setAuthState(null)
      }
    } catch {
      setAuthState(null)
    }
  }, [fetchNotifications])

  useEffect(() => {
    checkAuth()
    window.addEventListener('authChange', checkAuth)
    return () => window.removeEventListener('authChange', checkAuth)
  }, [checkAuth])

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported'); return }
    setDetectingLocation(true); setLocationError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || ''
          if (!detectedCity) { setLocationError('Could not determine your city'); return }
          const matched = availableCities.find(c => c.toLowerCase() === detectedCity.toLowerCase())
          if (matched) selectCity(matched)
          else setLocationError(`No events near "${detectedCity}"`)
        } catch { setLocationError('Failed to detect location') }
        finally { setDetectingLocation(false) }
      },
      () => { setLocationError('Location access denied'); setDetectingLocation(false) },
      { timeout: 8000 }
    )
  }

  const selectCity = (city: string) => {
    setSelectedCity(city); dispatchCityChange(city)
    setCityDropdownOpen(false); setCitySearch(''); setLocationError('')
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthState(null)
    setNotifications([]); setUnreadCount(0)
    router.push('/login')
    window.dispatchEvent(new Event('authChange'))
  }

  const filteredCities = availableCities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  const isLoading    = authState === 'loading'
  const isLoggedIn   = authState !== null && authState !== 'loading'
  const user         = isLoggedIn ? (authState as UserData) : null
  const isVenueOwner = user?.role === 'VENUE_OWNER'
  const isCustomer   = user?.role === 'Customer'

  const notifTypeColor: Record<string, string> = {
    announcement: 'bg-blue-500/15 text-blue-400',
    alert:        'bg-red-500/15 text-red-400',
    maintenance:  'bg-yellow-500/15 text-yellow-400',
    event:        'bg-emerald-500/15 text-emerald-400',
  }

  return (
    <motion.nav
      ref={navRef}
      onMouseMove={handleNavMouseMove}
      onMouseLeave={handleNavMouseLeave}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`sticky top-0 z-50 transition-all duration-500 overflow-hidden ${
        scrolled
          ? 'bg-[#060606]/85 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/50'
          : 'bg-[#060606]/60 backdrop-blur-xl border-b border-white/3'
      }`}
    >
      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(280px circle at ${springX}px ${springY}px, rgba(220,38,38,0.06), transparent 70%)`,
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">

        {/* ── LOGO ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="relative w-8 h-8 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-red-600 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300 opacity-80" />
            <Film size={17} className="relative text-white" />
          </motion.div>
          <span className="text-xl font-black tracking-tight text-white">
            Ticket<span className="text-red-500">Flix</span>
          </span>
        </Link>

        {/* ── CENTER NAV ── */}
        <div className="flex items-center gap-6 flex-1 justify-end">

          {/* City Selector */}
          {!isLoading && (isCustomer || !isLoggedIn) && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-200"
              >
                <MapPin size={13} className="text-red-500" />
                <span className="max-w-[90px] truncate">{selectedCity}</span>
                <motion.div animate={{ rotate: cityDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={13} />
                </motion.div>
              </button>

              <AnimatePresence>
                {cityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-white/8 shadow-2xl shadow-black/60 z-50 overflow-hidden bg-[#0f0f0f]/95 backdrop-blur-2xl"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2.5">Select City</p>
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                          type="text"
                          value={citySearch}
                          onChange={e => setCitySearch(e.target.value)}
                          placeholder="Search city..."
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white/5 border border-white/8 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 transition"
                        />
                      </div>
                    </div>
                    <div className="px-4 py-2 border-b border-white/5">
                      <button
                        onClick={detectLocation}
                        disabled={detectingLocation}
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs font-semibold transition w-full py-1"
                      >
                        {detectingLocation ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                        {detectingLocation ? 'Detecting...' : 'Use my location'}
                      </button>
                      {locationError && <p className="text-[10px] text-red-400 mt-1">{locationError}</p>}
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {['All Cities', ...filteredCities].map(city => (
                        <button
                          key={city}
                          onClick={() => selectCity(city)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${
                            selectedCity === city
                              ? 'text-red-400 bg-red-500/8'
                              : 'text-gray-400 hover:text-white hover:bg-white/4'
                          }`}
                        >
                          {city}
                          {selectedCity === city && (
                            <motion.span
                              layoutId="cityDot"
                              className="w-1.5 h-1.5 rounded-full bg-red-500"
                            />
                          )}
                        </button>
                      ))}
                      {filteredCities.length === 0 && citySearch && (
                        <p className="text-center text-gray-600 text-xs py-5">No cities found</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex items-center gap-3">
              {[60, 72, 56].map((w, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: w }}
                  className="h-7 rounded-lg bg-white/6"
                />
              ))}
            </div>
          )}

          {/* Not logged in */}
          {!isLoading && !isLoggedIn && (
            <div className="flex items-center gap-5">
              <NavLink href="/">Events</NavLink>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-bold text-red-400 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/8 transition-all"
              >
                Register
              </Link>
            </div>
          )}

          {/* Customer links */}
          {!isLoading && isLoggedIn && isCustomer && (
            <div className="flex items-center gap-5">
              <NavLink href="/">Events</NavLink>
              <NavLink href="/bookings">My Bookings</NavLink>
              <NavLink href="/venue-dashboard/profile">Profile</NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-400 transition-colors duration-200"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Venue Owner links */}
          {!isLoading && isLoggedIn && isVenueOwner && (
            <div className="flex items-center gap-4">
              <NavLink href="/venue-dashboard" icon={<LayoutDashboard size={13} />}>Dashboard</NavLink>
              <NavLink href="/venue-dashboard/events" icon={<List size={13} />}>My Events</NavLink>
              <NavLink href="/venue-dashboard/events/create" icon={<CalendarPlus size={13} />}>Create</NavLink>
              <NavLink href="/venue-dashboard/venues" icon={<MapPin size={13} />}>Venues</NavLink>
              <NavLink href="/venue-dashboard/profile" icon={<User size={13} />}>Profile</NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-400 transition-colors duration-200"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* ── ICON CLUSTER ── */}
          <div className="flex items-center gap-1.5 ml-1">

            {/* Wishlist */}
            {!isLoading && isLoggedIn && isCustomer && (
              <Link href="/wishlist">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/12 flex items-center justify-center transition-all duration-200"
                >
                  <Heart size={16} className={wishlist.length > 0 ? 'text-red-400 fill-red-400' : 'text-gray-400'} />
                  <AnimatePresence>
                    {wishlist.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] rounded-full flex items-center justify-center font-black shadow-lg shadow-red-600/40"
                      >
                        {wishlist.length > 9 ? '9+' : wishlist.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            )}

            {/* Notification Bell */}
            {!isLoading && isLoggedIn && (isCustomer || isVenueOwner) && (
              <div className="relative" ref={notifRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setNotifOpen(!notifOpen); setUnreadCount(0) }}
                  className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/12 flex items-center justify-center transition-all duration-200"
                >
                  <motion.div
                    animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <Bell size={16} className="text-gray-400" />
                  </motion.div>
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] rounded-full flex items-center justify-center font-black shadow-lg shadow-red-600/40"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-white/8 shadow-2xl shadow-black/60 z-50 overflow-hidden bg-[#0f0f0f]/95 backdrop-blur-2xl"
                    >
                      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={12} className="text-red-500" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Notifications</p>
                        </div>
                        {notifications.length > 0 && (
                          <span className="text-[10px] text-gray-700">{notifications.length} total</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell size={22} className="mx-auto mb-2 text-gray-700" />
                            <p className="text-gray-600 text-xs">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n, i) => (
                            <motion.div
                              key={n.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="px-4 py-3 border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${notifTypeColor[n.type] || 'bg-gray-500/15 text-gray-400'}`}>{n.type}</span>
                                <span className="text-gray-700 text-[9px]">{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                              <p className="text-sm font-semibold text-white">{n.title}</p>
                              <p className="text-xs mt-0.5 leading-relaxed text-gray-500">{n.message}</p>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.nav>
  )
}