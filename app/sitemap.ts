import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic' // 🔥 KEY FIX

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ticketflix-ten.vercel.app'

  let eventUrls: MetadataRoute.Sitemap = []

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/?page_size=100`,
      {
        signal: controller.signal,
        cache: 'no-store', // 🔥 avoid build caching
      }
    )

    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()

      eventUrls = (data.results || []).map((event: any) => ({
        url: `${baseUrl}/events/${event.id}`,
        lastModified: new Date(event.created_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
    }
  } catch (err) {
    console.warn('Sitemap fetch failed — returning static fallback')
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...eventUrls,
  ]
}