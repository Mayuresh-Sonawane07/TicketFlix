import { useEffect, useState } from "react"
import { eventAPI, Event } from "@/lib/api"

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventAPI.getAll()
        const data = response.data
        setEvents(Array.isArray(data) ? data : (data as any).results ?? [])
      } catch (err) {
        setError("Failed to load events")
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  return { events, loading, error }
}