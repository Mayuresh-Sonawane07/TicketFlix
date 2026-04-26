'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Film, Clock, Mail, CheckCircle2, ArrowRight, Sparkles, Shield, Bell, MessageCircle } from 'lucide-react'

const steps = [
  {
    icon: <CheckCircle2 size={18} />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8 border-emerald-500/20',
    title: 'Account Created',
    desc: 'Your email has been verified and your account is created.',
    done: true,
  },
  {
    icon: <Shield size={18} />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/8 border-amber-500/20',
    title: 'Admin Review',
    desc: 'Our team reviews your business details and venue information.',
    done: false,
    active: true,
  },
  {
    icon: <Bell size={18} />,
    color: 'text-gray-600',
    bg: 'bg-white/4 border-white/8',
    title: 'Approval Notification',
    desc: "You'll receive an email once your account is approved or if we need more info.",
    done: false,
  },
  {
    icon: <ArrowRight size={18} />,
    color: 'text-gray-600',
    bg: 'bg-white/4 border-white/8',
    title: 'Start Listing Events',
    desc: 'Access your venue dashboard, create venues, and start selling tickets.',
    done: false,
  },
]

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-900/10 blur-[120px]" />
        <motion.div animate={{ x: [0, -15, 0], y: [0, 20, 0] }} transition={{ duration: 25, repeat: Infinity, delay: 5 }}
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-red-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
              <Film size={18} className="relative text-white" />
            </motion.div>
            <span className="text-xl font-black text-white">Ticket<span className="text-red-500">Flix</span></span>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="p-8">
            {/* Icon + heading */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                <Clock size={36} className="text-amber-400" />
              </motion.div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={12} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending Review</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-3" style={{ fontFamily: "'Georgia', serif" }}>
                You're almost there!
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                Your venue owner account has been created successfully. Our team will review your details and get back to you shortly.
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-3 mb-8">
              {steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border ${step.bg} ${step.active ? 'ring-1 ring-amber-500/20' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${step.bg} ${step.color}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-bold ${step.done || step.active ? 'text-white' : 'text-gray-600'}`}>
                        {step.title}
                      </p>
                      {step.done && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-widest">
                          Done
                        </span>
                      )}
                      {step.active && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-widest flex items-center gap-1">
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1 h-1 rounded-full bg-amber-400 inline-block" />
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${step.done || step.active ? 'text-gray-500' : 'text-gray-700'}`}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Info box */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="p-4 bg-white/[0.02] border border-white/6 rounded-2xl mb-6 flex gap-3">
              <Mail size={16} className="text-gray-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">Check your email</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  We'll send you an email notification once your account is approved. Typical review time is <strong className="text-gray-400">1–2 business days</strong>.
                </p>
              </div>
            </motion.div>

            {/* Support CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl mb-6 flex gap-3 items-center">
              <MessageCircle size={16} className="text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold mb-0.5">Need help?</p>
                <p className="text-gray-600 text-xs">Use the support chat (bottom right) to contact our team directly.</p>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link href="/login"
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition text-sm text-center">
                Sign in to check status
              </Link>
              <Link href="/"
                className="w-full py-3.5 border border-white/8 text-gray-500 hover:text-white hover:border-white/15 font-semibold rounded-2xl transition text-sm text-center">
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="text-center text-gray-700 text-xs mt-6">
          Questions? Email us at{' '}
          <a href="mailto:support@ticketflix.in" className="text-red-500 hover:text-red-400">
            support@ticketflix.in
          </a>
        </motion.p>
      </div>
    </div>
  )
}