'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  CalendarPlus, List, TrendingUp, Ticket, MapPin,
  ArrowRight, Activity, Sparkles, ChevronRight,
  BarChart3, Users, Star,
} from 'lucide-react'

// Animated number counter
function AnimatedCount({ to, duration = 1.5 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = to / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= to) { setCount(to); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [to])
  return <>{count}</>
}

// 3D tilt card
function TiltCard({ children, className = '', glowColor = 'rgba(220,38,38,0.15)' }: {
  children: React.ReactNode
  className?: string
  glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { x.set(0); y.set(0); setHovered(false) }}
      className={className}
    >
      {/* Glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        className="absolute inset-0 rounded-2xl pointer-events-none z-0 blur-xl transition-opacity duration-300"
        style={{ background: glowColor, margin: '-4px' }}
      />
      {children}
    </motion.div>
  )
}

const CARDS = [
  {
    icon: CalendarPlus,
    label: 'Create Event',
    desc: 'Launch a new event or show',
    href: '/venue-dashboard/events/create',
    accent: 'from-red-600 to-orange-500',
    glow: 'rgba(220,38,38,0.2)',
    tag: 'NEW',
    tagColor: 'bg-red-500/20 text-red-400',
    stat: null,
  },
  {
    icon: List,
    label: 'My Events',
    desc: 'View and manage your events',
    href: '/venue-dashboard/events',
    accent: 'from-violet-600 to-purple-500',
    glow: 'rgba(124,58,237,0.2)',
    tag: null,
    tagColor: '',
    stat: null,
  },
  {
    icon: Ticket,
    label: 'Bookings',
    desc: 'See who booked your events',
    href: '/venue-dashboard/bookings',
    accent: 'from-emerald-600 to-teal-500',
    glow: 'rgba(16,185,129,0.2)',
    tag: null,
    tagColor: '',
    stat: null,
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    desc: 'Track your event performance',
    href: '/venue-dashboard/analytics',
    accent: 'from-amber-500 to-yellow-400',
    glow: 'rgba(245,158,11,0.2)',
    tag: 'LIVE',
    tagColor: 'bg-amber-500/20 text-amber-400',
    stat: null,
  },
  {
    icon: MapPin,
    label: 'My Venues',
    desc: 'Manage your venues and screens',
    href: '/venue-dashboard/venues',
    accent: 'from-cyan-600 to-blue-500',
    glow: 'rgba(6,182,212,0.2)',
    tag: null,
    tagColor: '',
    stat: null,
  },
]

const QUICK_STATS = [
  { label: 'Total Revenue',  value: 0,   suffix: '₹', icon: TrendingUp, color: 'text-emerald-400' },
  { label: 'Active Shows',   value: 0,   suffix: '',  icon: Activity,   color: 'text-blue-400' },
  { label: 'Total Bookings', value: 0,   suffix: '',  icon: Users,      color: 'text-violet-400' },
  { label: 'Avg Rating',     value: 0,   suffix: '★', icon: Star,       color: 'text-yellow-400' },
]

export default function VenueDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => { if (!res.ok) { router.push('/login'); return null } return res.json() })
      .then(u => {
        if (!u) return
        if (u.role !== 'VENUE_OWNER') { router.push('/'); return }
        setUser(u)
      })
      .catch(() => router.push('/login'))
  }, [])

  if (!user) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex items-center gap-3 text-gray-600"
      >
        <Activity size={16} className="text-red-600" />
        <span className="text-sm font-medium">Loading command center...</span>
      </motion.div>
    </div>
  )

  const greeting = time.getHours() < 12 ? 'Good morning' : time.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-[#080808] overflow-hidden">

      {/* ── Background atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Orbs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-red-900/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[100px]"
        />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="mb-14 relative"
        >
          {/* Top status bar */}
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5"
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">System Online</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-700 text-xs font-mono"
            >
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </motion.div>
          </div>

          {/* Main welcome */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-gray-600 text-sm font-medium mb-1 tracking-wide"
              >
                {greeting},
              </motion.p>
              <div className="overflow-hidden">
                <motion.h1
                  initial={{ y: 60 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {user.first_name || 'Owner'}
                  <span
                    className="inline-block ml-3 bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)' }}
                  >.</span>
                </motion.h1>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mt-2 text-sm"
              >
                Your command center — manage events, track performance.
              </motion.p>
            </div>

            {/* Quick create CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/venue-dashboard/events/create"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-red-600/25 hover:shadow-red-500/35"
              >
                <CalendarPlus size={16} />
                New Event
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <ArrowRight size={14} />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── QUICK STATS STRIP ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {QUICK_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              className="relative group rounded-2xl border border-white/6 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/10 p-4 overflow-hidden transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <stat.icon size={18} className={stat.color} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${stat.color} opacity-40`}>
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {stat.suffix === '₹' && <span className="text-lg text-gray-600 mr-0.5">₹</span>}
                <AnimatedCount to={stat.value} />
                {stat.suffix !== '₹' && stat.suffix && (
                  <span className="text-xl ml-0.5">{stat.suffix}</span>
                )}
              </div>
              {/* Shimmer on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── SECTION LABEL ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-red-600/40 via-white/5 to-transparent" />
          <span className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
            <Sparkles size={10} className="text-red-600" />
            Quick Access
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
        </motion.div>

        {/* ── MAIN ACTION CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative"
            >
              <TiltCard glowColor={card.glow} className="relative h-full">
                <Link href={card.href} className="block relative z-10 h-full">
                  <div className="relative h-full rounded-2xl border border-white/6 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/12 p-6 overflow-hidden group transition-all duration-300 cursor-pointer">

                    {/* Corner accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] bg-gradient-to-bl ${card.accent} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-300`} />

                    {/* Icon */}
                    <div className="relative mb-5">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center shadow-lg`}>
                        <card.icon size={22} className="text-white" />
                      </div>
                      {card.tag && (
                        <span className={`absolute -top-1.5 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${card.tagColor} tracking-widest`}>
                          {card.tag}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <h3 className="text-white font-bold text-lg mb-1.5 tracking-tight">{card.label}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>

                    {/* Arrow */}
                    <motion.div
                      className="absolute bottom-5 right-5 w-8 h-8 rounded-xl bg-white/4 group-hover:bg-white/8 flex items-center justify-center transition-all duration-200"
                      whileHover={{ x: 2 }}
                    >
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                    </motion.div>

                    {/* Bottom gradient line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${card.accent} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* ── GETTING STARTED BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-white/6"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-[#0f0808] to-[#080808]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDQydjQySDE4YzkuOTQgMCAxOC04LjA2IDE4LTE4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvZz48L3N2Zz4=')] opacity-30" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-red-500" />
                <h2 className="text-white font-black text-xl tracking-tight">Getting Started</h2>
              </div>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                Create your first event, add shows, set ticket prices, and manage seat availability — all from this dashboard.
              </p>
            </div>

            <Link
              href="/venue-dashboard/events/create"
              className="group shrink-0 flex items-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-xl shadow-red-600/30 hover:shadow-red-500/40"
            >
              Create Your First Event
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.3, repeat: Infinity }}
              >
                <ArrowRight size={16} />
              </motion.div>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  )
}