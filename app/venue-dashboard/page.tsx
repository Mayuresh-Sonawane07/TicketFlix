'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  CalendarPlus, List, TrendingUp, Ticket, MapPin,
  ArrowRight, Activity, Sparkles, ChevronRight,
  BarChart3,
} from 'lucide-react'

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

function TiltCard({ children, className = '', glowColor = 'rgba(220,38,38,0.15)' }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0); const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 300, damping: 30 })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={e => {
        const rect = ref.current?.getBoundingClientRect(); if (!rect) return
        x.set((e.clientX - rect.left) / rect.width - 0.5); y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { x.set(0); y.set(0); setHovered(false) }}
      className={className}
    >
      <motion.div animate={{ opacity: hovered ? 1 : 0 }} className="absolute inset-0 rounded-2xl pointer-events-none z-0 blur-xl transition-opacity duration-300" style={{ background: glowColor, margin: '-4px' }} />
      {children}
    </motion.div>
  )
}

const CARDS = [
  { icon: CalendarPlus, label: 'Create Event',  desc: 'Launch a new event or show',          href: '/venue-dashboard/events/create', grad: 'from-red-600 to-orange-500',    glow: 'rgba(220,38,38,0.18)',    tag: 'NEW',  tagColor: 'text-red-400 bg-red-500/15 border-red-500/25' },
  { icon: List,         label: 'My Events',     desc: 'View and manage all your events',     href: '/venue-dashboard/events',        grad: 'from-violet-600 to-purple-500', glow: 'rgba(124,58,237,0.18)',   tag: null,   tagColor: '' },
  { icon: Ticket,       label: 'Bookings',      desc: 'See who booked your events',          href: '/venue-dashboard/bookings',      grad: 'from-emerald-600 to-teal-500',  glow: 'rgba(16,185,129,0.18)',   tag: null,   tagColor: '' },
  { icon: BarChart3,    label: 'Analytics',     desc: 'Revenue, trends & performance',       href: '/venue-dashboard/analytics',     grad: 'from-amber-500 to-yellow-400',  glow: 'rgba(245,158,11,0.18)',   tag: 'LIVE', tagColor: 'text-amber-400 bg-amber-500/15 border-amber-500/25' },
  { icon: MapPin,       label: 'My Venues',     desc: 'Manage your venues and screens',      href: '/venue-dashboard/venues',        grad: 'from-cyan-600 to-blue-500',     glow: 'rgba(6,182,212,0.18)',    tag: null,   tagColor: '' },
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
      .then(u => { if (!u) return; if (u.role !== 'VENUE_OWNER') { router.push('/'); return }; setUser(u) })
      .catch(() => router.push('/login'))
  }, [])

  if (!user) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex items-center gap-3 text-gray-700">
        <Activity size={14} className="text-red-600" />
        <span className="text-sm">Loading dashboard...</span>
      </motion.div>
    </div>
  )

  const greeting = time.getHours() < 12 ? 'Good morning' : time.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-[#080808] overflow-hidden">
      {/* Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 35, 0], y: [0, -25, 0], scale: [1, 1.12, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-red-900/10 blur-[100px]" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '128px 128px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="mb-14">
          {/* Status + clock */}
          <div className="flex items-center justify-between mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">System Online</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-gray-700 text-xs font-mono">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </motion.div>
          </div>

          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-gray-600 text-sm font-medium mb-1">{greeting},</motion.p>
              <div className="overflow-hidden">
                <motion.h1 initial={{ y: 60 }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none" style={{ fontFamily: "'Georgia', serif" }}>
                  {user.first_name || 'Owner'}
                  <span className="inline-block ml-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)' }}>.</span>
                </motion.h1>
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-600 mt-2 text-sm">Your command center — manage events, track performance.</motion.p>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
              <Link href="/venue-dashboard/events/create"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-red-600/20 hover:shadow-red-500/30">
                <CalendarPlus size={15} />
                New Event
                <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  <ArrowRight size={13} />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Section label */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex items-center gap-4 mb-7">
          <div className="h-px flex-1 bg-gradient-to-r from-red-600/30 via-white/5 to-transparent" />
          <span className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]"><Sparkles size={10} className="text-red-600" />Quick Access</span>
          <div className="h-px w-16 bg-white/5" />
        </motion.div>

        {/* ── ACTION CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {CARDS.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 + i * 0.07, duration: 0.5, ease: [0.23, 1, 0.32, 1] }} className="relative">
              <TiltCard glowColor={card.glow} className="relative h-full">
                <Link href={card.href} className="block relative z-10 h-full">
                  <div className="relative h-full rounded-2xl border border-white/6 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/12 p-6 overflow-hidden group transition-all duration-300 cursor-pointer">
                    {/* Corner accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] bg-gradient-to-bl ${card.grad} opacity-[0.07] group-hover:opacity-[0.14] transition-opacity duration-300`} />
                    {/* Icon */}
                    <div className="relative mb-5 flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.grad} flex items-center justify-center shadow-lg`}>
                        <card.icon size={22} className="text-white" />
                      </div>
                      {card.tag && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${card.tagColor} tracking-widest`}>{card.tag}</span>
                      )}
                    </div>
                    {/* Text */}
                    <h3 className="text-white font-bold text-lg mb-1.5 tracking-tight">{card.label}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                    {/* Arrow */}
                    <motion.div className="absolute bottom-5 right-5 w-8 h-8 rounded-xl bg-white/4 group-hover:bg-white/8 flex items-center justify-center transition-all duration-200" whileHover={{ x: 2 }}>
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                    </motion.div>
                    {/* Bottom line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${card.grad} opacity-0 group-hover:opacity-25 transition-opacity duration-300`} />
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* ── GETTING STARTED BANNER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="relative rounded-2xl overflow-hidden border border-white/6">
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-[#0f0808] to-[#080808]" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8">
            <div>
              <div className="flex items-center gap-2 mb-2"><Sparkles size={13} className="text-red-500" /><h2 className="text-white font-black text-xl tracking-tight">Getting Started</h2></div>
              <p className="text-gray-600 text-sm max-w-md leading-relaxed">Create your first event, add shows, set ticket prices, and manage seat availability — all from this dashboard.</p>
            </div>
            <Link href="/venue-dashboard/events/create"
              className="shrink-0 flex items-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-xl shadow-red-600/25 hover:shadow-red-500/35">
              Create Your First Event
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.3, repeat: Infinity }}><ArrowRight size={15} /></motion.div>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  )
}