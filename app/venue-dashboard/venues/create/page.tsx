'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { theaterAPI } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

export default function CreateVenuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone_number: '',
    google_maps_link: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await theaterAPI.create(form)
      router.push(`/venue-dashboard/venues/${res.data.id}/screens`)
    } catch (err: any) {
      const data = err.response?.data
      if (data) {
        setError(Object.values(data).flat().join(' '))
      } else {
        setError('Failed to create venue.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center gap-4 mb-8">
          <Link href="/venue-dashboard/venues" className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Add Venue</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in your venue details</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6">

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Venue Name *</label>
            <input name="name" type="text" required value={form.name}
              onChange={handleChange} placeholder="e.g. Grand Cinema Hall"
              className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address *</label>
            <textarea name="address" required value={form.address}
              onChange={handleChange} rows={2}
              placeholder="Street address, landmark..."
              className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
              <input name="city" type="text" required value={form.city}
                onChange={handleChange} placeholder="e.g. Mumbai"
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
              <input name="state" type="text" required value={form.state}
                onChange={handleChange} placeholder="e.g. Maharashtra"
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pincode *</label>
              <input name="pincode" type="text" required maxLength={6}
                value={form.pincode} onChange={handleChange}
                placeholder="e.g. 421301" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <input name="phone_number" type="tel" value={form.phone_number}
                onChange={handleChange} placeholder="e.g. 9876543210"
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Maps Link <span className="text-gray-500">(optional)</span>
            </label>
            <input name="google_maps_link" type="url" value={form.google_maps_link}
              onChange={handleChange} placeholder="https://maps.google.com/..."
              className={inputClass} />
          </div>

          <div className="flex gap-4 pt-4">
            <Link href="/venue-dashboard/venues"
              className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-center">
              Cancel
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save & Add Screens →'}
            </motion.button>
          </div>

        </form>
      </div>
    </div>
  )
}