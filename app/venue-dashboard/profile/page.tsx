'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { profileAPI } from '@/lib/api'
import { User, Mail, Phone, Lock, Trash2, ArrowLeft, Camera, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'danger'>('info')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({ first_name: '', email: '', phone_number: '' })
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' })
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    // ✅ Fixed: use /api/auth/me instead of localStorage
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(user => {
        if (!user) return
        fetchProfile()
      })
      .catch(() => router.push('/login'))
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await profileAPI.get()
      setUser(res.data)
      setForm({
        first_name: res.data.first_name || '',
        email: res.data.email || '',
        phone_number: res.data.phone_number || '',
      })
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await profileAPI.update(form)
      setUser(res.data)
      // ✅ Fixed: don't write to localStorage — cookies are the source of truth
      // The user cookie is set server-side; local state is enough for UI
      showSuccess('Profile updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm) {
      setError("New passwords don't match.")
      return
    }
    if (passwords.new_password.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await profileAPI.changePassword({
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      })
      setPasswords({ old_password: '', new_password: '', confirm: '' })
      showSuccess('Password changed successfully!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    setError('')
    try {
      await profileAPI.deleteAccount({ password: deletePassword })
      // ✅ Fixed: call proper logout endpoint instead of localStorage.clear()
      await fetch('/api/auth/logout', { method: 'POST' })
      window.dispatchEvent(new Event('authChange'))
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Loading profile...</p>
    </div>
  )

  const backHref = user?.role === 'VENUE_OWNER' ? '/venue-dashboard' : '/'

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center gap-4 mb-8">
          <Link href={backHref} className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-600/50 flex items-center justify-center">
              <span className="text-3xl font-bold text-red-500">
                {(user?.first_name || user?.email || 'U')[0].toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{user?.first_name || 'User'}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full mt-1 inline-block">
              {user?.role === 'VENUE_OWNER' ? 'Venue Owner' : 'Customer'}
            </span>
          </div>
        </div>

        {/* Success / Error */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-green-600/10 border border-green-600/50 rounded-lg flex items-center gap-2"
            >
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-green-400 text-sm">{success}</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-600/10 border border-red-600/50 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {[
            { key: 'info',     label: 'Personal Info' },
            { key: 'password', label: 'Password' },
            { key: 'danger',   label: 'Danger Zone' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                activeTab === tab.key ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Personal Info Tab */}
        {activeTab === 'info' && (
          <motion.form
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onSubmit={handleUpdateProfile}
            className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="text" value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="tel" value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600" />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={saving}
              className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <motion.form
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onSubmit={handleChangePassword}
            className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            {[
              { label: 'Current Password',     key: 'old_password', placeholder: 'Enter current password' },
              { label: 'New Password',          key: 'new_password', placeholder: 'Min. 6 characters' },
              { label: 'Confirm New Password',  key: 'confirm',      placeholder: 'Re-enter new password' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="password"
                    value={passwords[field.key as keyof typeof passwords]}
                    onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600" />
                </div>
              </div>
            ))}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={saving}
              className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Changing...' : 'Change Password'}
            </motion.button>
          </motion.form>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-gray-900 border border-red-600/30 rounded-xl p-6"
          >
            <h3 className="text-red-500 font-bold text-lg mb-2 flex items-center gap-2">
              <Trash2 size={20} /> Delete Account
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2 border border-red-600 text-red-500 rounded-lg hover:bg-red-600/10 transition"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-yellow-400 text-sm font-medium">Enter your password to confirm deletion:</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="password" value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-red-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }}
                    className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving || !deletePassword}
                    className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {saving ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  )
}