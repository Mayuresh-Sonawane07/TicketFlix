# TicketFlix — Frontend

> Next.js 14 frontend for the TicketFlix online event booking platform.

**Live Site:** https://ticketflix-ten.vercel.app  
**Backend API:** https://web-production-cf420.up.railway.app/api  
**Backend Repo:** https://github.com/Mayuresh-Sonawane07/TicketFlix-Backend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| HTTP Client | Axios |
| PDF Generation | jsPDF |
| QR Generation | qrcode (npm) |
| Charts | Recharts |
| Icons | Lucide React |
| Auth (Google) | @react-oauth/google |
| Hosting | Vercel |

---

## Project Structure

```
app/
├── page.tsx                        # Homepage — event listing, search, filter
├── layout.tsx                      # Root layout — Navigation + ThemeProvider
├── login/page.tsx                  # Email + Google login
├── register/page.tsx               # OTP registration (2 steps)
├── forgot-password/page.tsx        # Password reset flow
├── events/[id]/page.tsx            # Event detail + shows + reviews
├── events/[id]/select-seats/       # Seat map with tier pricing + 5-min timer
├── checkout/page.tsx               # Price breakdown + Razorpay payment
├── bookings/page.tsx               # My bookings + PDF ticket download
├── verify/[id]/page.tsx            # QR ticket verification page
├── scan-ticket/page.tsx            # Camera QR scanner (Venue Owner only)
├── wishlist/page.tsx               # Saved events (localStorage)
└── venue-dashboard/
    ├── page.tsx                    # Dashboard home + stats
    ├── events/page.tsx             # Manage events
    ├── events/create/page.tsx      # Create new event
    ├── events/[id]/shows/page.tsx  # Manage shows
    ├── venues/page.tsx             # Theaters + screens
    ├── analytics/page.tsx          # Revenue + booking charts
    └── profile/page.tsx            # Edit profile

components/
├── Navigation.tsx                  # Sticky navbar (role-based links)
├── EventCard.tsx                   # Reusable event card with wishlist
└── ThemeProvider.tsx               # Dark/light mode context

hooks/
└── useWishlist.ts                  # localStorage wishlist hook

lib/
└── api.ts                          # Axios client + all API functions
```

---

## Features

- Email OTP registration (2-step flow)
- Google OAuth login with one click
- Browse and search events by title, city, and type
- Color-coded seat map — Silver / Gold / Platinum tiers
- 5-minute seat reservation timer
- Razorpay payment integration
- PDF ticket download with real scannable QR code
- QR ticket verification page — Valid / Already Used / Invalid states
- Camera-based QR scanner for venue staff at entry
- Booking cancellation (24-hour rule)
- Star ratings and reviews
- Venue owner dashboard with analytics charts (Recharts)
- Show management — edit time, cancel shows
- Wishlist (localStorage — no backend needed)
- Dark / Light mode toggle (saved to localStorage)
- Fully responsive — works on mobile and desktop

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Backend running locally or use the Railway URL

### Steps

```bash
# Clone the repo
git clone https://github.com/Mayuresh-Sonawane07/TicketFlix.git
cd TicketFlix

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://web-production-cf420.up.railway.app/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth2 client ID for login button |

---

## Deployment (Vercel)

The frontend auto-deploys from the `main` branch on Vercel. For manual deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
npx vercel --prod
```

Make sure `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are set in Vercel's Environment Variables settings.

---

## API Client

All API calls go through `lib/api.ts`. The Axios instance automatically attaches the auth token from `localStorage` to every request:

```typescript
// Authorization header added automatically on every request
Authorization: Basic <base64(email:password)>
```

Available API modules: `authAPI`, `eventAPI`, `showAPI`, `theaterAPI`, `screenAPI`, `bookingAPI`, `paymentAPI`, `profileAPI`

---

## localStorage Keys

| Key | Contents |
|-----|----------|
| `authToken` | Base64 encoded `email:password` auth token |
| `user` | JSON object with `id`, `email`, `role`, `name` |
| `tf-theme` | `dark` or `light` — theme preference |
| `tf-wishlist` | JSON array of wishlisted event objects |

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Homepage — all events |
| `/login` | Public | Login page |
| `/register` | Public | OTP registration |
| `/forgot-password` | Public | Password reset |
| `/events/[id]` | Public | Event detail |
| `/events/[id]/select-seats` | Customer | Seat selection |
| `/checkout` | Customer | Payment page |
| `/bookings` | Customer | My bookings |
| `/verify/[id]` | Public | QR verification |
| `/scan-ticket` | VENUE_OWNER | Camera scanner |
| `/wishlist` | Customer | Saved events |
| `/venue-dashboard` | VENUE_OWNER | Dashboard |
| `/venue-dashboard/events` | VENUE_OWNER | Manage events |
| `/venue-dashboard/analytics` | VENUE_OWNER | Analytics |

---

## Team

| Name | Role |
|------|------|
| Mayuresh Sonawane | Team Lead & Full Stack Developer |
| Krish Shripat | Backend Developer |
| Rohitkumar Prajapati | Frontend Developer |
| Bhavya Varma | UI/UX & Testing |

**Guide:** Prof. Rujuta Chaudhari  
**Institution:** A.P. Shah Institute of Technology, Thane

---

## License

This project is developed for academic purposes at A.P. Shah Institute of Technology.
