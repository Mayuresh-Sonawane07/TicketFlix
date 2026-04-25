'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { eventAPI } from '@/lib/api'
import { Upload, ArrowLeft, Sparkles, Film, Music, Trophy, PartyPopper, Check, Youtube, X } from 'lucide-react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') ||
  'https://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev'

const EVENT_TYPES = [
  { value: 'MOVIE', label: 'Movie', icon: Film, grad: 'from-red-600 to-orange-500' },
  { value: 'CONCERT', label: 'Concert', icon: Music, grad: 'from-violet-600 to-purple-500' },
  { value: 'SPORTS', label: 'Sports', icon: Trophy, grad: 'from-emerald-600 to-teal-500' },
  { value: 'OTHER', label: 'Other', icon: PartyPopper, grad: 'from-amber-500 to-yellow-400' },
]

const inputCls = "w-full px-4 py-3.5 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/4 transition-all duration-200"

export default function EditEventPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_type: 'MOVIE', duration: '', language: '', genre: '', release_date: '', trailer_url: '' })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getAll()
        const events = Array.isArray(res.data) ? res.data : (res.data as any).results ?? []
        const event = events.find((e: any) => e.id === Number(id))
        if (event) {
          setForm({ title: event.title || '', description: event.description || '', event_type: event.event_type || 'MOVIE', duration: event.duration?.toString() || '', language: event.language || '', genre: event.genre || '', release_date: event.release_date || '', trailer_url: event.trailer_url || '' })
          if (event.image) setImagePreview(event.image.startsWith('http') ? event.image : `${API_BASE}/media/${event.image}`)
        }
      } catch { setError('Failed to load event') } finally { setLoading(false) }
    }
    fetchEvent()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleImageFile = (file: File) => { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) handleImageFile(f) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => { if (value) formData.append(key, value) })
      if (imageFile) formData.append('image', imageFile)
      await eventAPI.update(Number(id), formData)
      router.push('/venue-dashboard/events')
    } catch (err: any) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Failed to update event.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  )

  const selectedType = EVENT_TYPES.find(t => t.value === form.event_type)!

  return (
    <div className="min-h-screen bg-[#080808] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className={`absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] transition-colors duration-700 ${form.event_type === 'MOVIE' ? 'bg-red-900/12' : form.event_type === 'CONCERT' ? 'bg-violet-900/12' : form.event_type === 'SPORTS' ? 'bg-emerald-900/12' : 'bg-amber-900/10'}`} />
        <div className="absolute inset-0 opacity-[0.013]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/venue-dashboard/events">
              <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={16} />
              </motion.div>
            </Link>
            <div className="flex items-center gap-2"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Edit Event</span></div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Edit Event</h1>
          <p className="text-gray-600 text-sm mt-1">Update your event details</p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Event Poster</label>
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
              onClick={() => document.getElementById('img-upload')?.click()}
              className={`relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-300 ${dragOver ? 'border-red-500/60 bg-red-500/5' : imagePreview ? 'border-white/10' : 'border-white/10 hover:border-white/20'}`}>
              <AnimatePresence mode="wait">
                {imagePreview ? (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-52 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={11} className="text-white" /></div>
                      <span className="text-white text-xs font-semibold">Poster uploaded</span>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null) }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-red-600/80 transition-colors">
                      <X size={12} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-44 flex flex-col items-center justify-center gap-3">
                    <motion.div animate={{ y: dragOver ? -4 : [0, -4, 0] }} transition={{ duration: dragOver ? 0.1 : 2, repeat: dragOver ? 0 : Infinity }}>
                      <Upload size={26} className="text-gray-700" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm font-medium">Drop image here or click to browse</p>
                      <p className="text-gray-700 text-xs mt-1">JPG, PNG, WEBP · Recommended 2:3 ratio</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <input id="img-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
          </motion.div>

          {/* Event Type */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Event Type</label>
            <div className="grid grid-cols-4 gap-3">
              {EVENT_TYPES.map(type => {
                const isSelected = form.event_type === type.value
                return (
                  <motion.button key={type.value} type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setForm({ ...form, event_type: type.value })}
                    className={`relative flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${isSelected ? 'border-transparent' : 'border-white/6 bg-white/2 hover:border-white/12'}`}>
                    {isSelected && <div className={`absolute inset-0 bg-gradient-to-br ${type.grad} opacity-15`} />}
                    <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? `bg-gradient-to-br ${type.grad}` : 'bg-white/6'}`}>
                      <type.icon size={14} className={isSelected ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <span className={`relative text-[11px] font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>{type.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Trailer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">YouTube Trailer</label>
            <div className="relative">
              <Youtube size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input name="trailer_url" type="url" value={form.trailer_url} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." className={inputCls + ' pl-10'} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Title *</label>
            <input name="title" type="text" required value={form.title} onChange={handleChange} placeholder="Event title" className={inputCls} />
          </motion.div>

          {/* Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Description *</label>
            <textarea name="description" required value={form.description} onChange={handleChange} rows={4} placeholder="Describe your event..." className={inputCls + ' resize-none'} />
          </motion.div>

          {/* Duration + Language */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Duration (min)</label>
              <input name="duration" type="number" value={form.duration} onChange={handleChange} placeholder="e.g. 120" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Language</label>
              <input name="language" type="text" value={form.language} onChange={handleChange} placeholder="Hindi, English..." className={inputCls} />
            </div>
          </motion.div>

          {/* Genre + Date */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Genre</label>
              <input name="genre" type="text" value={form.genre} onChange={handleChange} placeholder="Action, Drama..." className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Release Date</label>
              <input name="release_date" type="date" value={form.release_date} onChange={handleChange} className={inputCls} />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-4 pt-2">
            <Link href="/venue-dashboard/events" className="flex-1 py-4 border border-white/8 text-gray-500 rounded-2xl hover:border-white/15 hover:text-gray-300 transition-all text-center text-sm font-semibold">Cancel</Link>
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={saving}
              className={`flex-1 py-4 font-bold rounded-2xl text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r ${selectedType.grad}`}>
              {saving ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><selectedType.icon size={14} /><span>Save Changes</span></>}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}