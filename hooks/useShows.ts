import { useState, useEffect } from 'react'
import { showAPI, Show } from '@/lib/api'

// 🔥 Hook to get ALL shows + manual refetch
export function useAllShows() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShows = async () => {
    try {
      setLoading(true)
      const { data } = await showAPI.getAll()
      setShows(data)
      setError(null)
    } catch (err) {
      console.error('[v0] Error fetching shows:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch shows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShows()
  }, [])

  return { shows, loading, error, fetchShows, setShows } 
  // 🔥 exposed setShows also for instant UI updates if needed
}


// 🔥 Hook to get SINGLE show (optimized)
export function useShow(showId: number) {
  const [show, setShow] = useState<Show | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShow = async () => {
      try {
        setLoading(true)
        const { data } = await showAPI.getById(showId) // 🔥 optimized API call
        setShow(data)
        setError(null)
      } catch (err) {
        console.error('[v0] Error fetching show:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch show')
      } finally {
        setLoading(false)
      }
    }

    if (showId) {
      fetchShow()
    }
  }, [showId])

  return { show, loading, error }
}