import { useEffect, useState } from "react"
import { eventAPI, Event } from "@/lib/api"

export function useEvents(city?: string) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await eventAPI.getAll(city)
        const data = response.data
        setEvents(Array.isArray(data) ? data : (data as any).results ?? [])
      } catch (err) {
        setError("Failed to load events")
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [city]) // ← re-fetches when city changes

  return { events, loading, error }
}