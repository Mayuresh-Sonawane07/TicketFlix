'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useEvents } from '@/hooks/useEvents'
import EventCard from '@/components/EventCard'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, MapPin, Loader2 } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-cf420.up.railway.app/api'

const EVENT_TYPES = ['All', 'MOVIE', 'CONCERT', 'SPORTS', 'OTHER']
const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Title A-Z', value: 'title_asc' },
  { label: 'Title Z-A', value: 'title_desc' },
  { label: 'Date ↑', value: 'date_asc' },
  { label: 'Date ↓', value: 'date_desc' },
]

const capitalize = (str: string) =>
  str.replace(/\b\w/g, c => c.toUpperCase())

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TicketFlix',
  url: 'https://ticketflix-ten.vercel.app',
  description: 'Book tickets for movies, concerts, sports and theatre events online.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://ticketflix-ten.vercel.app/?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export default function Home() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  // ── City state ──────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState<string>('All')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')

  // ── Events (pass city to hook) ───────────────────────────
  const { events, loading, error } = useEvents(selectedCity !== 'All' ? selectedCity : undefined)

  // ── Other filters ────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)

  // ── Fetch available cities on mount ─────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/events/cities/`)
      .then(res => res.json())
      .then((cities: string[]) => setAvailableCities(cities))
      .catch(() => {})
  }, [])

  // ── Auto-detect user location ────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      return
    }
    setDetectingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Reverse geocode using free API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            ''

          if (!detectedCity) {
            setLocationError('Could not determine your city')
            return
          }

          // Match against available cities (case-insensitive)
          const matched = availableCities.find(
            c => c.toLowerCase() === detectedCity.toLowerCase()
          )

          if (matched) {
            setSelectedCity(matched)
          } else {
            setLocationError(`No events found near "${detectedCity}"`)
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

  // ── Redirect venue owner ─────────────────────────────────
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role)
        if (user.role === 'VENUE_OWNER') router.push('/venue-dashboard')
      } catch {
        setUserRole(null)
      }
    }
  }, [])

  // ── Derived filter options ───────────────────────────────
  const languages = useMemo(() => {
    const langs = events.flatMap(e =>
      e.language
        ? e.language.split(/\s*[,|،]\s*/).map(l => capitalize(l.trim())).filter(Boolean)
        : []
    )
    return ['All', ...Array.from(new Set(langs)).sort()]
  }, [events])

  const genres = useMemo(() => {
    const gs = events.flatMap(e =>
      e.genre
        ? e.genre.split(/\s*[,|،]\s*/).map(g => capitalize(g.trim())).filter(Boolean)
        : []
    )
    return ['All', ...Array.from(new Set(gs)).sort()]
  }, [events])

  // ── Client-side filtering ────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = [...events]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.genre?.toLowerCase().includes(q)
      )
    }
    if (selectedType !== 'All') result = result.filter(e => e.event_type === selectedType)
    if (selectedLanguage !== 'All') {
      result = result.filter(e =>
        e.language?.split(/\s*[,|،]\s*/).map(l => l.trim().toLowerCase())
          .some(l => l === selectedLanguage.toLowerCase())
      )
    }
    if (selectedGenre !== 'All') {
      result = result.filter(e =>
        e.genre?.split(/\s*[,|،]\s*/).map(g => g.trim().toLowerCase())
          .some(g => g === selectedGenre.toLowerCase())
      )
    }

    switch (sortBy) {
      case 'title_asc': result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title_desc': result.sort((a, b) => b.title.localeCompare(a.title)); break
      case 'date_asc': result.sort((a, b) => new Date(a.release_date || 0).getTime() - new Date(b.release_date || 0).getTime()); break
      case 'date_desc': result.sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime()); break
    }

    return result
  }, [events, search, selectedType, selectedLanguage, selectedGenre, sortBy])

  const hasActiveFilters =
    !!search || selectedType !== 'All' || selectedLanguage !== 'All' ||
    selectedGenre !== 'All' || sortBy !== 'default' || selectedCity !== 'All'

  const clearFilters = () => {
    setSearch('')
    setSelectedType('All')
    setSelectedLanguage('All')
    setSelectedGenre('All')
    setSortBy('default')
    setSelectedCity('All')
    setLocationError('')
  }

  if (userRole === 'VENUE_OWNER') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Discover <span className="text-red-600">Events</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Movies, concerts, sports and more. Book instantly.
            </p>
          </motion.div>

          {/* City Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5 flex flex-wrap items-center gap-3"
          >
            {/* Detect Location Button */}
            <button
              onClick={detectLocation}
              disabled={detectingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 hover:border-red-600 hover:text-white transition text-sm font-medium"
            >
              {detectingLocation
                ? <Loader2 size={15} className="animate-spin" />
                : <MapPin size={15} className="text-red-500" />
              }
              {detectingLocation ? 'Detecting...' : 'Use My Location'}
            </button>

            {/* Divider */}
            <span className="text-gray-700 text-sm">or</span>

            {/* City Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCity('All'); setLocationError('') }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  selectedCity === 'All'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                All Cities
              </button>
              {availableCities.map(city => (
                <button
                  key={city}
                  onClick={() => { setSelectedCity(city); setLocationError('') }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                    selectedCity === city
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  📍 {city}
                </button>
              ))}
            </div>

            {/* Location error */}
            {locationError && (
              <span className="text-red-400 text-xs">{locationError}</span>
            )}
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events, movies, concerts..."
                  className="w-full pl-12 pr-10 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition font-medium ${
                  showFilters || hasActiveFilters
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <SlidersHorizontal size={18} />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-white text-red-600 rounded-full text-xs flex items-center justify-center font-bold">!</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Event Type */}
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Event Type</label>
                      <div className="flex flex-wrap gap-2">
                        {EVENT_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              selectedType === type
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {type === 'MOVIE' ? '🎬 ' : type === 'CONCERT' ? '🎵 ' : type === 'SPORTS' ? '⚽ ' : type === 'OTHER' ? '🎪 ' : '✨ '}
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 transition"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    {/* Genre */}
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Genre</label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 transition"
                      >
                        {genres.map((genre) => (
                          <option key={genre} value={genre}>{genre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 transition"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {hasActiveFilters && (
                    <div className="mt-5 pt-4 border-t border-gray-800 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm transition"
                      >
                        <X size={14} />
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          {!loading && !error && (hasActiveFilters || selectedCity !== 'All') && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 text-sm mb-5">
              {selectedCity !== 'All' && (
                <span className="text-red-400 font-medium">📍 {selectedCity} · </span>
              )}
              Showing <span className="text-white font-semibold">{filteredEvents.length}</span>
              {' '}of <span className="text-white font-semibold">{events.length}</span> events
            </motion.p>
          )}

          {loading && <div className="text-center text-gray-400 py-16">Loading events...</div>}
          {error && <div className="text-center text-red-500 py-16">{error}</div>}

          {!loading && !error && (
            <>
              {filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24 border border-dashed border-gray-800 rounded-xl"
                >
                  <p className="text-4xl mb-4">🔍</p>
                  <p className="text-gray-400 text-lg mb-2">
                    {selectedCity !== 'All'
                      ? `No events found in ${selectedCity}`
                      : hasActiveFilters
                        ? 'No events match your filters'
                        : 'No events available right now'}
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    {hasActiveFilters ? 'Try adjusting or clearing your filters' : 'Please check back later'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                      Clear Filters
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  )
}