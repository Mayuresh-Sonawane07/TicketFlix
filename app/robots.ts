import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/venue-dashboard/', '/checkout', '/bookings'],
    },
    sitemap: 'https://ticketflix-ten.vercel.app/sitemap.xml',
  }
}