'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Film, ArrowLeft, Shield, Ticket, CreditCard, Ban, RefreshCw, Lock, Mail, AlertTriangle, Scale } from 'lucide-react'

const LAST_UPDATED = 'April 2026'

const sections = [
  {
    icon: <Ticket size={18} />,
    color: 'text-red-400',
    accent: 'bg-red-500/8 border-red-500/15',
    title: 'Ticket Purchases & Bookings',
    content: [
      'All ticket purchases on TicketFlix are final once payment is confirmed via Razorpay. You will receive a booking confirmation email with a QR code immediately after successful payment.',
      'Each booking is tied to a unique QR token. Tickets are non-transferable and must be presented at the venue in digital or printed form.',
      'TicketFlix acts as a platform connecting venue owners and customers. We are not directly responsible for event cancellations or changes made by venue owners.',
      'Seat selection is subject to availability at the time of checkout. Pricing is set by venue owners and may vary by screen tier (Silver, Gold, Platinum).',
    ],
  },
  {
    icon: <RefreshCw size={18} />,
    color: 'text-emerald-400',
    accent: 'bg-emerald-500/8 border-emerald-500/15',
    title: 'Cancellations & Refunds',
    content: [
      'Customers may cancel a booking up to 24 hours before the scheduled show time. Cancellations within 24 hours of showtime are not permitted.',
      'Approved refunds are processed back to the original payment method via Razorpay within 5–7 business days. TicketFlix does not charge additional fees for cancellations made within the eligible window.',
      'In the event of a show being cancelled by the venue owner, customers will be notified by email and a full refund will be initiated automatically.',
      'TicketFlix is not liable for refunds on bookings cancelled outside the permitted window, or for no-shows.',
    ],
  },
  {
    icon: <CreditCard size={18} />,
    color: 'text-blue-400',
    accent: 'bg-blue-500/8 border-blue-500/15',
    title: 'Payments & Pricing',
    content: [
      'All payments are processed securely through Razorpay. TicketFlix does not store your card or banking details.',
      'Prices displayed are inclusive of all applicable taxes unless stated otherwise. Convenience fees, if any, will be shown before checkout.',
      'In case of a payment failure, your account will not be charged. If an amount is deducted but no booking confirmation is received, contact support within 48 hours.',
      'TicketFlix reserves the right to update pricing structures for platform fees. Such changes will be communicated via email and updated in these terms.',
    ],
  },
  {
    icon: <Shield size={18} />,
    color: 'text-violet-400',
    accent: 'bg-violet-500/8 border-violet-500/15',
    title: 'User Accounts & Eligibility',
    content: [
      'You must be at least 18 years of age to create an account and make purchases on TicketFlix. By registering, you confirm that the information provided is accurate and up to date.',
      'Each individual may maintain one customer account. Creating multiple accounts to exploit offers or bypass bans is prohibited and may result in permanent suspension.',
      'Venue owners are responsible for the accuracy of event listings, pricing, show schedules, and venue information. TicketFlix may review and approve or reject listings.',
      'TicketFlix reserves the right to suspend or ban any account found to be engaged in fraudulent activity, abuse of the platform, or violation of these terms.',
    ],
  },
  {
    icon: <Ban size={18} />,
    color: 'text-orange-400',
    accent: 'bg-orange-500/8 border-orange-500/15',
    title: 'Prohibited Conduct',
    content: [
      'You may not use TicketFlix to resell tickets at inflated prices (scalping), engage in fraudulent transactions, or impersonate another user or venue.',
      'Attempting to bypass seat availability systems, exploiting pricing errors, or reverse-engineering any part of the platform is strictly forbidden.',
      'Uploading or sharing false, misleading, or harmful event information as a venue owner may result in immediate account termination and legal action.',
      'Any automated scraping, bot-based ticket purchasing, or interference with platform infrastructure is prohibited and may be subject to legal proceedings.',
    ],
  },
  {
    icon: <Lock size={18} />,
    color: 'text-cyan-400',
    accent: 'bg-cyan-500/8 border-cyan-500/15',
    title: 'Privacy & Data',
    content: [
      'TicketFlix collects your name, email address, and transaction history to facilitate bookings and send notifications. We do not sell your personal data to third parties.',
      'Email communications include booking confirmations, cancellation notices, and platform announcements. You may opt out of marketing emails at any time.',
      'QR codes generated for tickets contain a unique token linked to your booking. Do not share your QR code publicly prior to the event.',
      'We use industry-standard security practices to protect your data. However, no method of electronic transmission is 100% secure and we cannot guarantee absolute security.',
    ],
  },
  {
    icon: <AlertTriangle size={18} />,
    color: 'text-yellow-400',
    accent: 'bg-yellow-500/8 border-yellow-500/15',
    title: 'Limitation of Liability',
    content: [
      'TicketFlix is a technology platform and is not responsible for the quality, safety, or conduct of events listed by venue owners. Disputes regarding event experience should be directed to the venue.',
      'We are not liable for losses arising from force majeure events including natural disasters, strikes, government actions, or other circumstances beyond our control.',
      'Our total liability to you for any claim arising from use of the platform shall not exceed the amount paid by you for the specific booking in question.',
      'TicketFlix disclaims all implied warranties including fitness for a particular purpose, merchantability, and non-infringement to the fullest extent permitted by law.',
    ],
  },
  {
    icon: <Scale size={18} />,
    color: 'text-pink-400',
    accent: 'bg-pink-500/8 border-pink-500/15',
    title: 'Governing Law & Disputes',
    content: [
      'These Terms and Conditions are governed by the laws of India. Any disputes arising from use of the platform shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.',
      'In the event of a dispute, we encourage you to first contact our support team. Most issues can be resolved without formal legal proceedings.',
      'TicketFlix reserves the right to modify these terms at any time. Continued use of the platform after changes are published constitutes acceptance of the revised terms.',
      'If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 25, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-red-900/6 blur-[120px]" />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 15, 0] }} transition={{ duration: 20, repeat: Infinity, delay: 5 }}
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-900/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-white transition text-sm font-medium group">
            <motion.span whileHover={{ x: -3 }} className="w-8 h-8 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
              <ArrowLeft size={14} />
            </motion.span>
            Back to Home
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="mb-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}
              className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-2xl rotate-6 opacity-80" />
              <Film size={24} className="relative text-white" />
            </motion.div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Terms & Conditions
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before using TicketFlix. By accessing or using the platform, you agree to be bound by these terms.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/8 text-gray-600 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Last updated: {LAST_UPDATED}
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300">
              {/* Section header */}
              <div className={`flex items-center gap-3 px-6 py-5 border-b border-white/5`}>
                <div className={`w-9 h-9 rounded-xl ${section.accent} border flex items-center justify-center ${section.color}`}>
                  {section.icon}
                </div>
                <h2 className="text-white font-black text-base">{section.title}</h2>
                <span className="ml-auto text-gray-700 text-xs font-mono">{String(i + 1).padStart(2, '0')}</span>
              </div>
              {/* Section content */}
              <div className="px-6 py-5 space-y-3">
                {section.content.map((para, j) => (
                  <p key={j} className="text-gray-500 text-sm leading-relaxed flex gap-3">
                    <span className={`mt-2 w-1 h-1 rounded-full shrink-0 ${section.color.replace('text-', 'bg-')}`} />
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer contact */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="mt-10 relative bg-white/[0.02] border border-white/6 rounded-2xl p-8 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <Mail size={22} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-white font-black text-xl mb-2">Questions about these terms?</h3>
          <p className="text-gray-600 text-sm mb-5">
            If you have any questions or concerns about these Terms & Conditions, please reach out to our support team.
          </p>
          <a href="mailto:support@ticketflix.in"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition text-sm shadow-lg shadow-red-600/20">
            <Mail size={14} />
            support@ticketflix.in
          </a>
          <p className="text-gray-700 text-xs mt-5">
            © {new Date().getFullYear()} TicketFlix. All rights reserved.
          </p>
        </motion.div>

      </div>
    </div>
  )
}