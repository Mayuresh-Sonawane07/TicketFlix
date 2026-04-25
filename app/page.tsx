'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEvents } from '@/hooks/useEvents'
import EventCard from '@/components/EventCard'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Search, SlidersHorizontal, X, Sparkles, Flame, Clapperboard, Music, Trophy, Layers } from 'lucide-react'

const EVENT_TYPES = ['All', 'MOVIE', 'CONCERT', 'SPORTS', 'OTHER']
const SORT_OPTIONS = [
  { label: 'Default',    value: 'default' },
  { label: 'Title A–Z',  value: 'title_asc' },
  { label: 'Title Z–A',  value: 'title_desc' },
  { label: 'Date ↑',     value: 'date_asc' },
  { label: 'Date ↓',     value: 'date_desc' },
]
const TYPE_META: Record<string, { icon: React.ReactNode; label: string; activeClass: string }> = {
  All:     { icon: <Layers size={14} />,      label: 'All',     activeClass: 'bg-white text-black' },
  MOVIE:   { icon: <Clapperboard size={14} />, label: 'Movies', activeClass: 'bg-red-600 text-white' },
  CONCERT: { icon: <Music size={14} />,        label: 'Concerts',activeClass: 'bg-violet-600 text-white' },
  SPORTS:  { icon: <Trophy size={14} />,       label: 'Sports',  activeClass: 'bg-emerald-600 text-white' },
  OTHER:   { icon: <Sparkles size={14} />,     label: 'Other',   activeClass: 'bg-amber-500 text-black' },
}

const capitalize = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase())

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

// Floating orb component for background atmosphere
function FloatingOrb({ x, y, color, size, delay }: { x: string; y: string; color: string; size: number; delay: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${color}`}
      style={{ left: x, top: y, width: size, height: size }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
        scale: [1, 1.1, 0.95, 1],
        opacity: [0.15, 0.25, 0.12, 0.15],
      }}
      transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

export default function Home() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>('All')
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroY = useTransform(scrollY, [0, 300], [0, -60])

  useEffect(() => {
    const handleCityChange = (e: CustomEvent) => {
      const city = e.detail
      setSelectedCity(city === 'All Cities' ? 'All' : city)
    }
    window.addEventListener('cityChange', handleCityChange as EventListener)
    return () => window.removeEventListener('cityChange', handleCityChange as EventListener)
  }, [])

  const { events, loading, error } = useEvents(selectedCity !== 'All' ? selectedCity : undefined)

  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        if (user?.role) {
          setUserRole(user.role)
          if (user.role === 'VENUE_OWNER') router.push('/venue-dashboard')
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

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
      case 'title_asc':  result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title_desc': result.sort((a, b) => b.title.localeCompare(a.title)); break
      case 'date_asc':   result.sort((a, b) => new Date(a.release_date || 0).getTime() - new Date(b.release_date || 0).getTime()); break
      case 'date_desc':  result.sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime()); break
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
    window.dispatchEvent(new CustomEvent('cityChange', { detail: 'All Cities' }))
  }

  if (authChecked && userRole === 'VENUE_OWNER') {
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

      <div className="min-h-screen bg-[#080808] overflow-x-hidden">

        {/* ── Atmospheric background ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <FloatingOrb x="10%" y="5%"  color="bg-red-700"     size={500} delay={0} />
          <FloatingOrb x="70%" y="0%"  color="bg-violet-800"  size={400} delay={3} />
          <FloatingOrb x="40%" y="50%" color="bg-red-900"     size={600} delay={6} />
          <FloatingOrb x="80%" y="60%" color="bg-indigo-900"  size={350} delay={2} />
          {/* Noise grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '128px 128px',
            }}
          />
          {/* Scanline grid */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── HERO ── */}
          <motion.div
            ref={heroRef}
            style={{ opacity: heroOpacity, y: heroY }}
            className="pt-16 pb-14 text-center relative"
          >
            {/* "NOW SHOWING" label */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 backdrop-blur-sm"
            >
              <Flame size={13} className="text-red-400 animate-pulse" />
              <span className="text-red-400 text-xs font-bold tracking-[0.2em] uppercase">Now Showing</span>
            </motion.div>

            {/* Main headline */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="text-[clamp(2.8rem,8vw,6rem)] font-black text-white leading-none tracking-tight mb-4"
                style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.03em' }}
              >
                Discover
                <span
                  className="block bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #dc2626 100%)' }}
                >
                  Events.
                </span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed"
            >
              Movies, concerts, sports &amp; more.
              <span className="text-gray-400"> Book your seat instantly.</span>
            </motion.p>

            {/* Animated stats */}
            {!loading && events.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-8 mt-8"
              >
                {[
                  { label: 'Events', value: events.length },
                  { label: 'Movies', value: events.filter(e => e.event_type === 'MOVIE').length },
                  { label: 'Concerts', value: events.filter(e => e.event_type === 'CONCERT').length },
                  { label: 'Sports', value: events.filter(e => e.event_type === 'SPORTS').length },
                ].filter(s => s.value > 0).map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── SEARCH & FILTERS ── */}
          <div className="sticky top-4 z-30 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-3"
            >
              {/* Search */}
              <motion.div
                animate={{
                  boxShadow: searchFocused
                    ? '0 0 0 1px rgba(239,68,68,0.5), 0 8px 40px rgba(239,68,68,0.15)'
                    : '0 4px 20px rgba(0,0,0,0.4)',
                }}
                className="relative flex-1 rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#111]/90 backdrop-blur-xl rounded-2xl border border-white/8" />
                <Search
                  className={`absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200 ${searchFocused ? 'text-red-400' : 'text-gray-600'}`}
                  size={18}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search events, movies, concerts..."
                  className="relative z-10 w-full pl-12 pr-12 py-4 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                    >
                      <X size={12} className="text-gray-400" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Filter toggle */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-2 px-5 py-4 rounded-2xl border text-sm font-semibold transition-all duration-200 backdrop-blur-xl overflow-hidden ${
                  showFilters || hasActiveFilters
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                    : 'bg-[#111]/90 border-white/8 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center font-black">!</span>
                )}
              </motion.button>
            </motion.div>

            {/* Type pills — always visible */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide"
            >
              {EVENT_TYPES.map((type) => {
                const meta = TYPE_META[type]
                const active = selectedType === type
                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200 border ${
                      active
                        ? `${meta.activeClass} border-transparent shadow-lg`
                        : 'bg-[#111]/80 backdrop-blur-sm border-white/8 text-gray-500 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {meta.icon}
                    {meta.label}
                  </motion.button>
                )
              })}
            </motion.div>
          </div>

          {/* ── FILTER PANEL ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/8 rounded-2xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Language */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 mb-3 uppercase tracking-[0.15em]">Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition appearance-none cursor-pointer"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang} className="bg-[#111]">{lang}</option>
                        ))}
                      </select>
                    </div>

                    {/* Genre */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 mb-3 uppercase tracking-[0.15em]">Genre</label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition appearance-none cursor-pointer"
                      >
                        {genres.map((genre) => (
                          <option key={genre} value={genre} className="bg-[#111]">{genre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 mb-3 uppercase tracking-[0.15em]">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition appearance-none cursor-pointer"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#111]">{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs font-semibold transition"
                      >
                        <X size={12} /> Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESULTS LABEL ── */}
          <AnimatePresence>
            {!loading && !error && hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-red-600/40 to-transparent" />
                <p className="text-gray-600 text-xs font-medium whitespace-nowrap">
                  {selectedCity !== 'All' && <span className="text-red-500 font-bold">📍 {selectedCity} · </span>}
                  <span className="text-white font-bold">{filteredEvents.length}</span> / {events.length} events
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-red-600/40 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STATES ── */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pb-16">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="rounded-2xl overflow-hidden bg-white/3"
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-white/5 to-transparent" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/5 rounded-lg w-3/4" />
                    <div className="h-3 bg-white/3 rounded-lg w-1/2" />
                    <div className="h-3 bg-white/3 rounded-lg w-full" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-24 text-red-500">{error}</div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 border border-dashed border-white/8 rounded-3xl"
            >
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-white text-xl font-bold mb-2">
                {selectedCity !== 'All' ? `No events in ${selectedCity}` : hasActiveFilters ? 'No matches found' : 'No events yet'}
              </p>
              <p className="text-gray-600 text-sm mb-8">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Please check back later'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold text-sm">
                  Clear Filters
                </button>
              )}
            </motion.div>
          )}

          {/* ── EVENT GRID ── */}
          {!loading && !error && filteredEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pb-20"
            >
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
                  >
                    <EventCard event={event} index={index} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </div>
    </>
  )
}