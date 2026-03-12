import { useState, useEffect } from 'react'
import { showAPI, Show } from '@/lib/api'

export function useAllShows() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    fetchShows()
  }, [])

  return { shows, loading, error }
}

export function useShow(showId: number) {
  const [show, setShow] = useState<Show | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShow = async () => {
      try {
        setLoading(true)
        const { data } = await showAPI.getAll()
        const foundShow = data.find(s => s.id === showId)
        setShow(foundShow || null)
        setError(foundShow ? null : 'Show not found')
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
