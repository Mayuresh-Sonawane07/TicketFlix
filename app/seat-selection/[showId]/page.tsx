'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient, seatAPI, Seat, Show } from '@/lib/api'
import { ArrowLeft, Ticket, Timer } from 'lucide-react'

// ─── Styles ───────────────────────────────────────────────────────────────────

const SEAT_STYLES = {
  Silver: {
    available: 'border-slate-500 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400',
    selected: 'bg-slate-500 text-white border-slate-500 shadow-lg shadow-slate-500/30',
    label: 'text-slate-400',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    dim: 'text-slate-500/40',
  },
  Gold: {
    available: 'border-yellow-500/70 text-yellow-400 hover:bg-yellow-500/15 hover:border-yellow-400',
    selected: 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/30',
    label: 'text-yellow-500',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
    dim: 'text-yellow-500/30',
  },
  Platinum: {
    available: 'border-violet-500/70 text-violet-400 hover:bg-violet-500/15 hover:border-violet-400',
    selected: 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30',
    label: 'text-violet-400',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    dim: 'text-violet-500/30',
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScreenPricing { silver: number; gold: number; platinum: number }
interface SeatWithStatus extends Seat { is_booked: boolean }

// ─── Layout engine ────────────────────────────────────────────────────────────
//
// The key insight from the reference image:
//   • Silver  → ONLY a center block.  total = centerCols × rows
//   • Gold    → LEFT corner block  +  center block  +  RIGHT corner block
//               (corners are INDEPENDENT columns, additive to center)
//               total = (cornerCols + centerCols + cornerCols) × rows
//   • Platinum→ Same as Gold, but last row is one straight continuous line.
//
// We derive centerCols from Silver's total, then keep the same centerCols
// for Gold/Platinum so all three sections visually align on the center grid.
// Corner columns sit outside that shared center width.

const SEAT_W = 36   // w-9 = 36 px
const GAP    = 6    // gap-1.5 = 6 px
const AISLE  = 20   // w-5 = 20 px

function px(cols: number) {
  return cols * SEAT_W + Math.max(0, cols - 1) * GAP
}

/**
 * Given a total seat count, figure out how many columns per row to use
 * so we get a reasonable number of rows (target ~5–7 rows).
 */
function colsForTotal(total: number): number {
  if (total <= 24)  return 4
  if (total <= 40)  return 6
  if (total <= 65)  return 9
  if (total <= 91)  return 13
  if (total <= 120) return 15
  return Math.ceil(total / 7)   // ~7 rows for very large screens
}

/**
 * Corner column count for Gold / Platinum.
 * Always 2–3 cols, scales slightly with center width.
 */
function cornerColsFor(centerCols: number): number {
  return centerCols >= 12 ? 3 : 2
}

/** Chunk seats into rows of `perRow`, padding last row with null */
function buildRows(seats: SeatWithStatus[], perRow: number): (SeatWithStatus | null)[][] {
  const rows: (SeatWithStatus | null)[][] = []
  for (let i = 0; i < seats.length; i += perRow) {
    const row: (SeatWithStatus | null)[] = [...seats.slice(i, i + perRow)]
    while (row.length < perRow) row.push(null)
    rows.push(row)
  }
  return rows
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function SeatBtn({
  seat, selected, styles, onToggle,
}: {
  seat: SeatWithStatus
  selected: boolean
  styles: (typeof SEAT_STYLES)[keyof typeof SEAT_STYLES]
  onToggle: (id: number) => void
}) {
  return (
    <motion.button
      whileHover={{ scale: seat.is_booked ? 1 : 1.08 }}
      whileTap={{ scale: seat.is_booked ? 1 : 0.92 }}
      onClick={() => onToggle(seat.id)}
      disabled={seat.is_booked}
      title={seat.is_booked ? 'Booked' : seat.seat_number}
      className={`
        w-9 h-9 rounded-lg border-2 text-[10px] font-bold transition-all duration-150 shrink-0
        ${seat.is_booked
          ? 'bg-white/[0.03] border-white/[0.07] text-white/10 cursor-not-allowed'
          : selected ? styles.selected : styles.available}
      `}
    >
      {seat.is_booked
        ? <span className="text-white/15 text-xs">×</span>
        : seat.seat_number.replace(/[A-Za-z]+/, '')}
    </motion.button>
  )
}

function EmptySeat() { return <div className="w-9 h-9 shrink-0" /> }

function Aisle() {
  return (
    <div className="w-5 shrink-0 flex items-center justify-center">
      <div className="w-px h-5 bg-white/[0.06] rounded-full" />
    </div>
  )
}

// ─── Silver ───────────────────────────────────────────────────────────────────
// Pure center block, no corners, horizontally centered on the page.

function SilverSection({
  seats, selectedSeats, styles, onToggle,
}: {
  seats: SeatWithStatus[]
  selectedSeats: number[]
  styles: (typeof SEAT_STYLES)['Silver']
  onToggle: (id: number) => void
}) {
  const centerCols = colsForTotal(seats.length)
  const rows = buildRows(seats, centerCols)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* column label */}
      <div style={{ width: px(centerCols) }}
        className={`text-center text-[8px] tracking-widest uppercase mb-1 ${styles.dim}`}>
        Center
      </div>

      {rows.map((row, ri) => {
        const real = row.filter(Boolean) as SeatWithStatus[]
        return (
          <div key={ri} className="flex items-center gap-1.5">
            <span className={`text-[10px] font-mono w-5 mr-1 text-right shrink-0 ${styles.label} opacity-40`}>
              {String.fromCharCode(65 + ri)}
            </span>
            {real.map(s => (
              <SeatBtn key={s.id} seat={s} selected={selectedSeats.includes(s.id)} styles={styles} onToggle={onToggle} />
            ))}
            {Array.from({ length: centerCols - real.length }).map((_, i) => <EmptySeat key={i} />)}
          </div>
        )
      })}
    </div>
  )
}

// ─── Gold / Platinum ──────────────────────────────────────────────────────────
//
// Structure per row (normal):
//   [left corner block]  AISLE  [center block]  AISLE  [right corner block]
//
// Corner blocks sit OUTSIDE the center grid — they are independent columns.
// The center block has the same width as Silver's center, so all three
// sections visually align.
//
// Platinum `noGapLastRow`: last row renders as one straight continuous line
// spanning the full width (no aisles), mimicking a front-row straight bench.

function SplitSection({
  seats, selectedSeats, styles, onToggle,
  centerCols,       // passed in so it matches Silver's center width
  noGapLastRow = false,
}: {
  seats: SeatWithStatus[]
  selectedSeats: number[]
  styles: (typeof SEAT_STYLES)[keyof typeof SEAT_STYLES]
  onToggle: (id: number) => void
  centerCols: number
  noGapLastRow?: boolean
}) {
  const cc = cornerColsFor(centerCols)
  const perRow = cc + centerCols + cc
  const rows = buildRows(seats, perRow)

  const renderSeats = (block: (SeatWithStatus | null)[], prefix: string) =>
    block.map((seat, i) =>
      seat
        ? <SeatBtn key={seat.id} seat={seat} selected={selectedSeats.includes(seat.id)} styles={styles} onToggle={onToggle} />
        : <EmptySeat key={`${prefix}-${i}`} />
    )

  return (
    <div className="flex flex-col items-center gap-2">
      {/* column headers */}
      <div className="flex items-center mb-1">
        <div className="w-6 mr-1 shrink-0" />
        <div style={{ width: px(cc) }}
          className={`text-center text-[8px] tracking-widest uppercase ${styles.dim}`}>
          Left Corner
        </div>
        <div style={{ width: AISLE }} />
        <div style={{ width: px(centerCols) }}
          className={`text-center text-[8px] tracking-widest uppercase ${styles.dim}`}>
          Center
        </div>
        <div style={{ width: AISLE }} />
        <div style={{ width: px(cc) }}
          className={`text-center text-[8px] tracking-widest uppercase ${styles.dim}`}>
          Right Corner
        </div>
      </div>

      {rows.map((row, ri) => {
        const isLast = ri === rows.length - 1
        const rowLabel = (
          <span className={`text-[10px] font-mono w-5 mr-1 text-right shrink-0 ${styles.label} opacity-40`}>
            {String.fromCharCode(65 + ri)}
          </span>
        )

        // ── Platinum last row: straight continuous line ──────────────
        if (noGapLastRow && isLast) {
          const real = row.filter(Boolean) as SeatWithStatus[]
          return (
            <div key={ri} className="flex items-center gap-1.5">
              {rowLabel}
              {real.map(s => (
                <SeatBtn key={s.id} seat={s} selected={selectedSeats.includes(s.id)} styles={styles} onToggle={onToggle} />
              ))}
              {Array.from({ length: perRow - real.length }).map((_, i) => <EmptySeat key={i} />)}
            </div>
          )
        }

        // ── Normal row: left corner | aisle | center | aisle | right corner ──
        const left   = row.slice(0, cc)
        const center = row.slice(cc, cc + centerCols)
        const right  = row.slice(cc + centerCols, perRow)

        return (
          <div key={ri} className="flex items-center">
            {rowLabel}
            <div className="flex gap-1.5">{renderSeats(left,   'l')}</div>
            <Aisle />
            <div className="flex gap-1.5">{renderSeats(center, 'c')}</div>
            <Aisle />
            <div className="flex gap-1.5">{renderSeats(right,  'r')}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeatSelectionPage() {
  const { showId } = useParams()
  const router = useRouter()
  const [show, setShow]               = useState<Show | null>(null)
  const [seats, setSeats]             = useState<SeatWithStatus[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [pricing, setPricing]         = useState<ScreenPricing>({ silver: 0, gold: 0, platinum: 0 })
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [timeLeft, setTimeLeft]       = useState<number | null>(null)
  const [timerExpired, setTimerExpired] = useState(false)

  useEffect(() => {
    (async () => {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) { router.push('/login'); return }
      try {
        const [showRes, seatsRes] = await Promise.all([
          apiClient.get<any>(`/theaters/shows/${showId}/`),
          seatAPI.getAvailable(Number(showId)),
        ])
        setShow(showRes.data)
        if (showRes.data.screen_pricing) setPricing(showRes.data.screen_pricing)
        setSeats(seatsRes.data)
      } catch {
        setError('Failed to load show details')
      } finally {
        setLoading(false)
      }
    })()
  }, [showId])

  useEffect(() => {
    if (selectedSeats.length === 1 && timeLeft === null) setTimeLeft(300)
  }, [selectedSeats])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { setTimerExpired(true); setSelectedSeats([]); setTimeLeft(null); return }
    const t = setTimeout(() => setTimeLeft(x => (x ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const toggleSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId)
    if (!seat || seat.is_booked) return
    setError('')
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    )
  }

  const getPriceForCategory = (cat: string) =>
    pricing[cat.toLowerCase() as keyof ScreenPricing] || 0

  const getTotalAmount = () =>
    selectedSeats.reduce((total, seatId) => {
      const seat = seats.find(s => s.id === seatId)
      return seat ? total + getPriceForCategory(seat.category) : total
    }, 0)

  const getSelectedByCategory = () => {
    const result: Record<string, { count: number; price: number }> = {}
    selectedSeats.forEach(seatId => {
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return
      if (!result[seat.category])
        result[seat.category] = { count: 0, price: getPriceForCategory(seat.category) }
      result[seat.category].count++
    })
    return result
  }

  const handleBooking = () => {
    if (selectedSeats.length === 0) { setError('Please select at least one seat'); return }
    const title = (show as any)?.event_details?.title || 'Event'
    const venue = (show as any)?.theater_name
      ? `${(show as any).theater_name} · Screen ${(show as any).screen_number}`
      : 'Venue'
    const time = show?.show_time
      ? new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : ''
    router.push(`/checkout?${new URLSearchParams({
      showId: showId as string, seats: selectedSeats.join(','), title, time, venue,
    }).toString()}`)
  }

  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.category]) acc[seat.category] = []
    acc[seat.category].push(seat)
    return acc
  }, {} as Record<string, SeatWithStatus[]>)

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading seats…</p>
      </div>
    </div>
  )

  // Derive shared centerCols from Silver's seat count so all sections align
  const silverSeats = groupedSeats['Silver'] ?? []
  const sharedCenterCols = colsForTotal(Math.max(silverSeats.length, 1))

  const selectedBreakdown = getSelectedByCategory()
  const totalAmount = getTotalAmount()

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="mt-1 text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {(show as any)?.event_details?.title || 'Select Seats'}
            </h1>
            {show && (
              <p className="text-gray-500 text-sm mt-0.5">
                {(show as any).theater_name}
                {(show as any).screen_number && ` · Screen ${(show as any).screen_number}`}
                {' · '}
                {new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>

        {/* Screen */}
        <div className="mb-10 text-center">
          <div
            className="relative mx-auto w-2/3 h-1.5 rounded-full overflow-hidden mb-3"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)' }}
          >
            <div className="absolute inset-0 animate-pulse"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.3), transparent)' }} />
          </div>
          <p className="text-gray-600 text-[10px] tracking-[0.2em] uppercase font-medium">Screen this side</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-600/10 border border-red-600/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Tier sections */}
        {(['Silver', 'Gold', 'Platinum'] as const).map(category => {
          const categorySeats = groupedSeats[category]
          if (!categorySeats || categorySeats.length === 0) return null
          const styles = SEAT_STYLES[category]
          const availableCount = categorySeats.filter(s => !s.is_booked).length

          return (
            <div key={category} className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className={`px-3 py-1 rounded-md border text-xs font-semibold tracking-wide ${styles.badge}`}>
                  {category}
                </div>
                <span className="text-gray-400 text-sm">₹{getPriceForCategory(category)} / seat</span>
                <span className="text-gray-600 text-xs ml-auto">{availableCount} available</span>
              </div>

              {category === 'Silver' && (
                <SilverSection
                  seats={categorySeats}
                  selectedSeats={selectedSeats}
                  styles={styles}
                  onToggle={toggleSeat}
                />
              )}

              {category === 'Gold' && (
                <SplitSection
                  seats={categorySeats}
                  selectedSeats={selectedSeats}
                  styles={styles}
                  onToggle={toggleSeat}
                  centerCols={sharedCenterCols}
                  noGapLastRow={false}
                />
              )}

              {category === 'Platinum' && (
                <SplitSection
                  seats={categorySeats}
                  selectedSeats={selectedSeats}
                  styles={styles}
                  onToggle={toggleSeat}
                  centerCols={sharedCenterCols}
                  noGapLastRow={true}
                />
              )}
            </div>
          )
        })}

        {seats.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-600">No seats available for this show</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-5 mt-6 flex-wrap">
          {[
            { label: 'Available', cls: 'border-2 border-gray-600' },
            { label: 'Selected',  cls: 'bg-white/70' },
            { label: 'Booked',    cls: 'bg-white/[0.04] border border-white/10' },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md ${cls}`} />
              <span className="text-gray-600 text-xs">{label}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Booking bar */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-[#111111]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-4">
              <div className="max-w-5xl mx-auto">
                {timeLeft !== null && (
                  <div className={`flex items-center gap-2 text-xs font-medium mb-3 ${timeLeft <= 60 ? 'text-red-400' : 'text-yellow-500/80'}`}>
                    <Timer size={12} />
                    <span>{timeLeft <= 60 ? '⚠ Hurry! ' : ''}Expires in {formatTime(timeLeft)}</span>
                    <div className="flex-1 h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 60 ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${(timeLeft / 300) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1">
                      {Object.entries(selectedBreakdown).map(([cat, { count, price }]) => (
                        <span key={cat} className="text-xs text-gray-500">
                          {count}× {cat} <span className="text-gray-600">@ ₹{price}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
                      <span className="text-xs text-gray-600">+ convenience fee</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBooking}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shrink-0 text-sm"
                  >
                    <Ticket size={16} />
                    Proceed · {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer expired modal */}
      <AnimatePresence>
        {timerExpired && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center max-w-sm w-full"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Timer size={24} className="text-red-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Selection Expired</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your 5-minute seat hold has ended. Please select your seats again.
              </p>
              <button
                onClick={() => { setTimerExpired(false); setTimeLeft(null); setSelectedSeats([]) }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                Select again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}