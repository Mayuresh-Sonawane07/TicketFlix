import { useState, useEffect } from 'react'
import { seatAPI, Seat } from '@/lib/api'

export function useSeats(showId: number) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true)
        const { data } = await seatAPI.getAvailable(showId)
        setSeats(data)
        setError(null)
      } catch (err) {
        console.error('[v0] Error fetching seats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch seats')
      } finally {
        setLoading(false)
      }
    }

    if (showId) {
      fetchSeats()
    }
  }, [showId])

  return { seats, loading, error }
}
