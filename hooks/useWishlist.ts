'use client'

import { useState, useEffect, useCallback } from 'react'
import { Event } from '@/lib/api'

export function useWishlist() {
  const [wishlist, setWishlist] = useState<Event[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('tf-wishlist')
      if (saved) setWishlist(JSON.parse(saved))
    } catch {}
  }, [])

  const addToWishlist = useCallback((event: Event) => {
    setWishlist(prev => {
      if (prev.find(e => e.id === event.id)) return prev
      const next = [...prev, event]
      if (typeof window !== 'undefined')
        localStorage.setItem('tf-wishlist', JSON.stringify(next))
      window.dispatchEvent(new Event('wishlistChange'))
      return next
    })
  }, [])

  const removeFromWishlist = useCallback((eventId: number) => {
    setWishlist(prev => {
      const next = prev.filter(e => e.id !== eventId)
      if (typeof window !== 'undefined')
        localStorage.setItem('tf-wishlist', JSON.stringify(next))
      window.dispatchEvent(new Event('wishlistChange'))
      return next
    })
  }, [])

  const isWishlisted = useCallback((eventId: number) => {
    return wishlist.some(e => e.id === eventId)
  }, [wishlist])

  const toggleWishlist = useCallback((event: Event) => {
    if (wishlist.find(e => e.id === event.id)) {
      removeFromWishlist(event.id)
    } else {
      addToWishlist(event)
    }
  }, [wishlist, addToWishlist, removeFromWishlist])

  return { wishlist, addToWishlist, removeFromWishlist, isWishlisted, toggleWishlist, mounted }
}