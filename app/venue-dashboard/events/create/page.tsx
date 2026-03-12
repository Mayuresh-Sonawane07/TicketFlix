'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { eventAPI } from '@/lib/api'
import { Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const EVENT_TYPES = ['MOVIE', 'CONCERT', 'SPORTS', 'OTHER']

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'MOVIE',
    duration: '',
    language: '',
    genre: '',
    release_date: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)

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
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })
      if (imageFile) formData.append('image', imageFile)

      await eventAPI.create(formData)
      router.push('/venue-dashboard/events')
    } catch (err: any) {
      const data = err.response?.data
      if (data) {
        const messages = Object.values(data).flat()
        setError(messages.join(' '))
      } else {
        setError('Failed to create event. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/venue-dashboard"
            className="text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Event</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in the details for your new event</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg"
          >
            <p className="text-red-500 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Image
            </label>
            <div
              className="relative border-2 border-dashed border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-red-600/50 transition"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Upload size={32} />
                  <p className="text-sm">Click to upload image</p>
                  <p className="text-xs">JPG, PNG, WEBP supported</p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="Enter event title"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your event..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
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

          {/* Row: Duration + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                name="duration"
                type="number"
                value={form.duration}
                onChange={handleChange}
                placeholder="e.g. 120"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language
              </label>
              <input
                name="language"
                type="text"
                value={form.language}
                onChange={handleChange}
                placeholder="e.g. Hindi, English"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Row: Genre + Release Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <input
                name="genre"
                type="text"
                value={form.genre}
                onChange={handleChange}
                placeholder="e.g. Action, Drama"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Release Date
              </label>
              <input
                name="release_date"
                type="date"
                value={form.release_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/venue-dashboard"
              className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-center"
            >
              Cancel
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </motion.button>
          </div>

        </form>
      </div>
    </div>
  )
}