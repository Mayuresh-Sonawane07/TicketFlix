'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Film, Shield, ChevronRight } from 'lucide-react'

const sections = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Personal Information',
        text: 'When you register for a TicketFlix account, we collect your full name, email address, phone number (10-digit Indian mobile number), and password. For venue owners, we additionally collect business name, address, city, state, GST number, PAN number, and website URL.',
      },
      {
        subtitle: 'Transaction Data',
        text: 'When you book tickets, we collect booking details including selected seats, show times, payment transaction IDs processed via Razorpay, and total amounts. We do not store your full card details — all payment processing is handled by Razorpay under their PCI-DSS compliance.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We automatically collect information about how you interact with our platform — pages visited, features used, device type, browser, IP address, and approximate location (city-level) for filtering events relevant to you.',
      },
      {
        subtitle: 'Support Communications',
        text: 'Messages you send through our support chat system are stored to help us resolve your issues and improve our service quality.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: 'Service Delivery',
        text: 'We use your information to process bookings, send OTP verification emails, deliver e-tickets with QR codes, manage your account, and provide customer support.',
      },
      {
        subtitle: 'Venue Owner Approvals',
        text: 'Business information provided by venue owners is used by our admin team to verify legitimacy and approve accounts. This information is not shared with customers.',
      },
      {
        subtitle: 'Communications',
        text: 'We send transactional emails (booking confirmations, OTPs, account notifications). With your consent, we may also send promotional updates about new events. You can opt out of marketing emails at any time.',
      },
      {
        subtitle: 'Platform Improvement',
        text: 'Aggregated, anonymized usage data helps us understand how our platform is used, fix bugs, and build better features.',
      },
    ],
  },
  {
    id: 'phone-number',
    title: '3. Phone Number Policy',
    content: [
      {
        subtitle: 'Uniqueness Requirement',
        text: 'Each Indian mobile number (10 digits, starting with 6–9) can only be registered once on TicketFlix. If you attempt to register with a phone number already associated with an account, registration will be blocked.',
      },
      {
        subtitle: 'Validation',
        text: 'We validate that phone numbers are properly formatted 10-digit Indian mobile numbers. While we perform format validation, you are responsible for providing your actual, active phone number.',
      },
      {
        subtitle: 'Use of Phone Number',
        text: 'Your phone number is stored securely and used only for account identification. We do not send unsolicited SMS marketing messages.',
      },
    ],
  },
  {
    id: 'data-sharing',
    title: '4. Data Sharing & Third Parties',
    content: [
      {
        subtitle: 'Venue Owners',
        text: 'When you book tickets for an event, the venue owner can see your name and booking details for the purpose of checking you in at the event. They cannot see your password, full phone number, or financial information.',
      },
      {
        subtitle: 'Payment Processors',
        text: 'Payments are processed by Razorpay. Your payment information is governed by Razorpay\'s Privacy Policy. We receive only transaction confirmation, order IDs, and payment status.',
      },
      {
        subtitle: 'Analytics',
        text: 'We use Google Analytics to understand platform usage. This data is aggregated and anonymized. You can opt out via browser extensions or cookie settings.',
      },
      {
        subtitle: 'No Sale of Data',
        text: 'We do not sell, trade, or rent your personal information to third parties for their marketing purposes.',
      },
    ],
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    content: [
      {
        subtitle: 'Encryption',
        text: 'All data transmitted between your browser and our servers is encrypted using HTTPS/TLS. Passwords are hashed using industry-standard algorithms and are never stored in plain text.',
      },
      {
        subtitle: 'Access Controls',
        text: 'Access to user data is restricted to TicketFlix employees and systems that need it to provide the service. Admin actions are logged for accountability.',
      },
      {
        subtitle: 'Data Breach Response',
        text: 'In the unlikely event of a data breach affecting your personal information, we will notify affected users within 72 hours via email and take immediate steps to contain the breach.',
      },
    ],
  },
  {
    id: 'your-rights',
    title: '6. Your Rights',
    content: [
      {
        subtitle: 'Access & Correction',
        text: 'You can view and update your personal information at any time through your account profile settings.',
      },
      {
        subtitle: 'Account Deletion',
        text: 'You can delete your account from the profile settings page. This will permanently remove your account data, though we may retain booking records for financial and legal compliance for up to 7 years as required by Indian law.',
      },
      {
        subtitle: 'Data Portability',
        text: 'You may request a copy of your personal data by contacting us at privacy@ticketflix.in. We will respond within 30 days.',
      },
      {
        subtitle: 'Opt-out of Marketing',
        text: 'You can unsubscribe from marketing communications at any time using the unsubscribe link in any marketing email.',
      },
    ],
  },
  {
    id: 'cookies',
    title: '7. Cookies & Local Storage',
    content: [
      {
        subtitle: 'Authentication Cookies',
        text: 'We use HTTP-only, secure cookies to store your authentication tokens (JWT). These are essential for keeping you logged in and cannot be accessed by JavaScript.',
      },
      {
        subtitle: 'Preference Storage',
        text: 'Your selected city and UI preferences are stored in browser local storage to provide a personalized experience across sessions.',
      },
      {
        subtitle: 'Analytics Cookies',
        text: 'Google Analytics uses cookies to track usage patterns. You can disable these via your browser settings or a cookie opt-out tool.',
      },
    ],
  },
  {
    id: 'children',
    title: '8. Children\'s Privacy',
    content: [
      {
        subtitle: 'Age Requirement',
        text: 'TicketFlix is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us and we will delete it promptly.',
      },
    ],
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    content: [
      {
        subtitle: 'Updates',
        text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the platform. Continued use of TicketFlix after changes take effect constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    content: [
      {
        subtitle: 'Privacy Inquiries',
        text: 'For privacy-related questions, data requests, or concerns, contact us at privacy@ticketflix.in. For general support, use the support chat on our platform or email support@ticketflix.in.',
      },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute top-0 right-1/3 w-[600px] h-[600px] rounded-full bg-red-900/8 blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, delay: 8 }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-900/6 blur-[120px]"
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link href="/" className="inline-flex items-center gap-3 group mb-8 block">
            <div className="flex items-center gap-2.5">
              <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                <Film size={16} className="relative text-white" />
              </motion.div>
              <span className="text-lg font-black text-white">Ticket<span className="text-red-500">Flix</span></span>
            </div>
          </Link>

          {/* Hero */}
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Shield size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Legal</p>
                <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                  Privacy Policy
                </h1>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
              This Privacy Policy explains how TicketFlix collects, uses, and protects your personal information when you use our platform. By using TicketFlix, you agree to the practices described below.
            </p>
            <div className="flex items-center gap-6 mt-5">
              <span className="text-gray-700 text-xs">Last updated: January 2025</span>
              <span className="text-gray-800 text-xs">|</span>
              <span className="text-gray-700 text-xs">Effective: January 2025</span>
            </div>
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.02] border border-white/6 rounded-2xl p-6 mb-10"
        >
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs transition-colors group py-1"
              >
                <ChevronRight size={11} className="text-gray-700 group-hover:text-red-500 shrink-0" />
                {s.title}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              className="scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/5" />
                <h2 className="text-white font-black text-base whitespace-nowrap">{section.title}</h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="space-y-5">
                {section.content.map((item, j) => (
                  <div key={j} className="bg-white/[0.018] border border-white/5 rounded-2xl p-5">
                    <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">{item.subtitle}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-gray-700 text-xs">© 2025 TicketFlix. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-gray-600 hover:text-red-400 text-xs transition-colors">Terms & Conditions</Link>
            <Link href="/" className="text-gray-600 hover:text-red-400 text-xs transition-colors">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}