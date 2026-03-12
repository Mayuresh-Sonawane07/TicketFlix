import { useState, useEffect } from 'react'
import { bookingAPI, Booking } from '@/lib/api'

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data } = await bookingAPI.getAll()
      setBookings(data)
      setError(null)
    } catch (err) {
      console.error('[v0] Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const createBooking = async (showId: number, seatIds: number[], totalAmount: number) => {
    try {
      const { data } = await bookingAPI.create({
        show: showId,
        seats: seatIds,
        total_amount: totalAmount
      })
      setBookings([...bookings, data])
      return data
    } catch (err) {
      console.error('[v0] Error creating booking:', err)
      throw err instanceof Error ? err : new Error('Failed to create booking')
    }
  }

  const cancelBooking = async (bookingId: number) => {
    try {
      await bookingAPI.cancel(bookingId)
      setBookings(bookings.filter((b) => b.id !== bookingId))
    } catch (err) {
      console.error('[v0] Error cancelling booking:', err)
      throw err instanceof Error ? err : new Error('Failed to cancel booking')
    }
  }

  return { bookings, loading, error, createBooking, cancelBooking, refetch: fetchBookings }
}
