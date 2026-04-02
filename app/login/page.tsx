'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { authAPI, apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'

declare global {
  interface Window {
    google: any
  }
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getErrorMessage = (err: any): string => {
    if (err?.response?.status === 401)
      return 'Incorrect email or password. Please try again.'
    if (err?.response?.status === 403)
      return err?.response?.data?.error || 'Access denied.'
    if (err?.response?.status === 0 || err?.code === 'ERR_NETWORK')
      return 'Cannot connect to server. Please check your internet.'
    return err?.response?.data?.error || 'Login failed. Please try again.'
  }

  const handleLoginSuccess = (token: string, refresh: string, user: any) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('refreshToken', refresh)
    const safeUser = { id: user.id, first_name: user.first_name, role: user.role }
    localStorage.setItem('user', JSON.stringify(safeUser))
    window.dispatchEvent(new Event('authChange'))
    if (user.role === 'Admin') router.push('/admin-panel')
    else if (user.role === 'VENUE_OWNER') router.push('/venue-dashboard')
    else router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    try {
      setIsLoading(true)
      const { token, refresh, user } = await authAPI.login(email, password)
      if (rememberMe) localStorage.setItem('rememberedEmail', email)
      else localStorage.removeItem('rememberedEmail')
      handleLoginSuccess(token, refresh, user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleResponse = async (response: any) => {
    setError(null)
    setIsGoogleLoading(true)
    try {
      const res = await authAPI.googleLogin(response.credential)
      handleLoginSuccess(res.token, res.refresh, res.user)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Google login failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const initializeGoogle = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleGoogleResponse,
      })
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn')!,
        {
          theme: 'outline',
          size: 'large',
          width: 400,
          text: 'continue_with',
        }
      )
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initializeGoogle}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="inline-block mb-4">
                <LogIn className="text-red-600" size={40} />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-400">Log in to your TicketFlix account</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span className="text-gray-400 text-sm">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-red-500 hover:text-red-400 text-sm transition"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </motion.button>

            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-500 text-xs">or continue with</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Google Button */}
            {isGoogleLoading ? (
              <div className="w-full py-3 border border-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-300 text-sm">Signing in with Google...</span>
              </div>
            ) : (
              <div id="google-btn" className="w-full flex justify-center" />
            )}

            {/* Register link */}
            <p className="text-center text-gray-400 text-sm mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-red-600 hover:text-red-500 font-semibold">
                Create Account
              </Link>
            </p>

          </div>
        </motion.div>
      </div>
    </>
  )
}