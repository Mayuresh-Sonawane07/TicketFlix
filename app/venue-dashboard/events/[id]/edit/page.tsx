'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { eventAPI } from '@/lib/api'
import { Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev'

const EVENT_TYPES = ['MOVIE', 'CONCERT', 'SPORTS', 'OTHER']

export default function EditEventPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'MOVIE',
    duration: '',
    language: '',
    genre: '',
    release_date: '',
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getAll()
        const events = Array.isArray(res.data) ? res.data : (res.data as any).results ?? []
        const event = events.find((e: any) => e.id === Number(id))
        if (event) {
          setForm({
            title: event.title || '',
            description: event.description || '',
            event_type: event.event_type || 'MOVIE',
            duration: event.duration?.toString() || '',
            language: event.language || '',
            genre: event.genre || '',
            release_date: event.release_date || '',
          })
          if (event.image) {
            setImagePreview(
              event.image.startsWith('http')
                ? event.image
                : `${API_BASE}/media/${event.image}`
            )
          }
        }
      } catch {
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })
      if (imageFile) formData.append('image', imageFile)
      await eventAPI.update(Number(id), formData)
      router.push('/venue-dashboard/events')
    } catch (err: any) {
      const data = err.response?.data
      if (data) {
        const messages = Object.values(data).flat()
        setError(messages.join(' '))
      } else {
        setError('Failed to update event.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Loading event...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center gap-4 mb-8">
          <Link href="/venue-dashboard/events" className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Event</h1>
            <p className="text-gray-400 text-sm mt-1">Update your event details</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Image</label>
            <div
              className="relative border-2 border-dashed border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-red-600/50 transition"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Upload size={32} />
                  <p className="text-sm">Click to upload image</p>
                </div>
              )}
              <input id="image-upload" type="file" accept="image/*"
                onChange={handleImageChange} className="hidden" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input name="title" type="text" required value={form.title}
              onChange={handleChange} placeholder="Event title"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea name="description" required value={form.description}
              onChange={handleChange} rows={4} placeholder="Describe your event..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
            <div className="grid grid-cols-4 gap-3">
              {EVENT_TYPES.map((type) => (
                <button key={type} type="button"
                  onClick={() => setForm({ ...form, event_type: type })}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${form.event_type === type
                      ? 'border-red-600 bg-red-600/10 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                >
                  {type === 'MOVIE' ? '🎬' : type === 'CONCERT' ? '🎵' : type === 'SPORTS' ? '⚽' : '🎪'}
                  <span className="ml-1">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (min)</label>
              <input name="duration" type="number" value={form.duration}
                onChange={handleChange} placeholder="e.g. 120"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <input name="language" type="text" value={form.language}
                onChange={handleChange} placeholder="e.g. Hindi"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Genre + Release Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
              <input name="genre" type="text" value={form.genre}
                onChange={handleChange} placeholder="e.g. Action"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Release Date</label>
              <input name="release_date" type="date" value={form.release_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Link href="/venue-dashboard/events"
              className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-center"
            >
              Cancel
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={saving}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>

        </form>
      </div>
    </div>
  )
}