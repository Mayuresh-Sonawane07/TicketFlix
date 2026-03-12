'use client'

import Link from 'next/link'
import { Show } from '@/lib/api'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface ShowCardProps {
  show: Show
}

export default function ShowCard({ show }: ShowCardProps) {
  const showDate = new Date(show.show_time)
  const timeString = showDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/seat-selection/${show.id}`}>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-red-600/50 transition-all duration-300 group cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-white group-hover:text-red-600 transition-colors">
                Screen {show.screen}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{showDate.toDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">₹{show.price}</p>
              <p className="text-xs text-gray-400">per seat</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
            <div className="flex items-center gap-1">
              <Clock size={16} className="text-gray-500" />
              <span>{timeString}</span>
            </div>
          </div>

          <button className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors">
            Select Seats
          </button>
        </div>
      </Link>
    </motion.div>
  )
}
