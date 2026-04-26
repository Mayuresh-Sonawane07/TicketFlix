'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { profileAPI } from '@/lib/api'
import { User, Mail, Phone, Lock, Trash2, ArrowLeft, Camera, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

const inputCls = "w-full pl-10 pr-4 py-3.5 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/4 transition-all duration-200"

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
    fetch('/api/auth/me').then(res => { if (!res.ok) { router.push('/login'); return null } return res.json() })
      .then(user => { if (!user) return; fetchProfile() }).catch(() => router.push('/login'))
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await profileAPI.get()
      setUser(res.data)
      setForm({ first_name: res.data.first_name || '', email: res.data.email || '', phone_number: res.data.phone_number || '' })
    } catch { setError('Failed to load profile') } finally { setLoading(false) }
  }

  const showSuccess = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try { const res = await profileAPI.update(form); setUser(res.data); showSuccess('Profile updated successfully!') }
    catch (err: any) { setError(err.response?.data?.email?.[0] || 'Failed to update profile.') } finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm) { setError("New passwords don't match."); return }
    if (passwords.new_password.length < 6) { setError('New password must be at least 6 characters.'); return }
    setSaving(true); setError('')
    try { await profileAPI.changePassword({ old_password: passwords.old_password, new_password: passwords.new_password }); setPasswords({ old_password: '', new_password: '', confirm: '' }); showSuccess('Password changed successfully!') }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to change password.') } finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    setSaving(true); setError('')
    try {
      await profileAPI.deleteAccount({ password: deletePassword })
      await fetch('/api/auth/logout', { method: 'POST' })
      window.dispatchEvent(new Event('authChange')); router.push('/login')
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to delete account.') } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  )

  const backHref = user?.role === 'VENUE_OWNER' ? '/venue-dashboard' : '/'

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 20, 0] }} transition={{ duration: 16, repeat: Infinity }}
          className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-red-900/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-4 mb-8">
          <Link href={backHref}>
            <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </motion.div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Account</span></div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Profile</h1>
          </div>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative bg-white/[0.02] border border-white/6 rounded-2xl p-6 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
          <div className="flex items-center gap-5">
            <div className="relative">
              <motion.div whileHover={{ scale: 1.05 }} className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-red-600/15 border-2 border-red-600/30 flex items-center justify-center">
                <span className="text-3xl font-black text-red-400">{(user?.first_name || user?.email || 'U')[0].toUpperCase()}</span>
              </motion.div>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-xl flex items-center justify-center hover:bg-red-500 transition shadow-lg">
                <Camera size={11} className="text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl">{user?.first_name || 'User'}</h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-red-600/12 text-red-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-red-500/20">
                {user?.role === 'VENUE_OWNER' ? 'Venue Owner' : 'Customer'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-sm">{success}</p>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl">
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-1 mb-6 bg-white/3 border border-white/6 rounded-2xl p-1">
          {[{ key: 'info', label: 'Personal Info' }, { key: 'password', label: 'Password' }, { key: 'danger', label: 'Danger Zone' }].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${activeTab === tab.key ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-600 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleUpdateProfile}
            className="relative bg-white/[0.02] border border-white/6 rounded-2xl p-6 space-y-4">
            {[
              { label: 'Full Name', key: 'first_name', icon: User, type: 'text', placeholder: 'Your name' },
              { label: 'Email Address', key: 'email', icon: Mail, type: 'email', placeholder: 'your@email.com' },
              { label: 'Phone Number', key: 'phone_number', icon: Phone, type: 'tel', placeholder: '9876543210' },
            ].map(({ label, key, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">{label}</label>
                <div className="relative">
                  <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={inputCls} />
                </div>
              </div>
            ))}
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.2)' }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={saving}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl disabled:opacity-50 transition text-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleChangePassword}
            className="relative bg-white/[0.02] border border-white/6 rounded-2xl p-6 space-y-4">
            {[
              { label: 'Current Password', key: 'old_password', placeholder: 'Enter current password' },
              { label: 'New Password', key: 'new_password', placeholder: 'Min. 6 characters' },
              { label: 'Confirm New Password', key: 'confirm', placeholder: 'Re-enter new password' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">{field.label}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="password" value={passwords[field.key as keyof typeof passwords]} onChange={e => setPasswords({ ...passwords, [field.key]: e.target.value })} placeholder={field.placeholder} className={inputCls} />
                </div>
              </div>
            ))}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={saving}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl disabled:opacity-50 transition text-sm">
              {saving ? 'Changing...' : 'Change Password'}
            </motion.button>
          </motion.form>
        )}

        {/* Danger Tab */}
        {activeTab === 'danger' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/4 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2"><Trash2 size={16} className="text-red-400" /><h3 className="text-red-400 font-black text-lg">Delete Account</h3></div>
            <p className="text-gray-500 text-sm mb-6">This action is permanent and cannot be undone. All your data will be deleted.</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/8 transition font-bold text-sm">Delete My Account</button>
            ) : (
              <div className="space-y-4">
                <p className="text-yellow-400 text-sm font-bold">Enter your password to confirm deletion:</p>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/3 border border-red-500/30 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/60 transition" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }} className="flex-1 py-3 border border-white/8 text-gray-500 rounded-xl hover:border-white/15 transition text-sm font-semibold">Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={saving || !deletePassword} className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 disabled:opacity-50 transition text-sm">
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