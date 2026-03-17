import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ticketflix-ten.vercel.app'

  // Fetch events for dynamic routes
  let eventUrls: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/?page_size=100`)
    const data = await res.json()
    eventUrls = (data.results || []).map((event: any) => ({
      url: `${baseUrl}/events/${event.id}`,
      lastModified: new Date(event.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {}

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...eventUrls,
  ]
}