// lib/auth.ts
export function getUserFromCookie() {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('user='))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1]))
  } catch {
    return null
  }
}

export function getRole(): string | null {
  return getUserFromCookie()?.role ?? null
}

export function isVenueOwner(): boolean {
  return getRole() === 'VENUE_OWNER'
}

export function isAdmin(): boolean {
  return getRole() === 'Admin'
}