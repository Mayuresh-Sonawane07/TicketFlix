import axios from "axios"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://0e620814-4dfc-4257-903b-9cf2164c942d-00-3fr7449523dij.riker.replit.dev/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Auto-refresh access token when it expires (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          localStorage.removeItem("authToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
          if (typeof window !== "undefined") window.location.href = "/login"
          return Promise.reject(error)
        }
        const res = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        })
        const newAccessToken = res.data.access
        localStorage.setItem("refreshToken", data.refresh)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch {
        localStorage.removeItem("authToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
        if (typeof window !== "undefined") window.location.href = "/login"
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

/* ============================= */
/* ========= TYPES ============= */
/* ============================= */

export interface User {
  id: number
  email: string
  role: string
  phone_number: string
  is_phone_verified: boolean
}

export interface Event {
  id: number
  title: string
  description: string
  event_type: "MOVIE" | "CONCERT" | "SPORTS" | "OTHER"
  duration?: number
  language?: string
  genre?: string
  image?: string
  release_date?: string
  created_by: number
}

export interface Show {
  id: number
  event: number
  event_details?: Event
  screen: number
  show_time: string
  price: number
}

export interface Seat {
  id: number
  seat_number: string
  category: string
}

export interface Booking {
  id: number
  total_amount: number
  status: string
  transaction_id: string
  booking_time: string
  user: number
  show: number
  seats: number[]
}

export interface Theater {
  id: number
  name: string
  address: string
  city: string
  state: string
  pincode: string
  phone_number?: string
  google_maps_link?: string
  manager: number
}

export interface Screen {
  id: number
  theater: number
  screen_number: number
  total_seats: number
  silver_price: number
  gold_price: number
  platinum_price: number
  silver_count: number
  gold_count: number
  platinum_count: number
}

/* ============================= */
/* ========= API CALLS ========= */
/* ============================= */

export const eventAPI = {
  getAll: (city?: string) => apiClient.get<Event[]>("/events/", {
    params: city ? { city } : {}
  }),
  getMyEvents: () => apiClient.get<Event[]>("/events/my_events/"),
  create: (data: FormData) => apiClient.post("/events/", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  update: (id: number, data: FormData) => apiClient.patch(`/events/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (id: number) => apiClient.delete(`/events/${id}/`),
}

export const theaterAPI = {
  getAll: () => apiClient.get<Theater[]>('/theaters/theaters/'),
  getMyVenues: () => apiClient.get<Theater[]>('/theaters/theaters/my_venues/'),
  create: (data: Partial<Theater>) => apiClient.post<Theater>('/theaters/theaters/', data),
  update: (id: number, data: Partial<Theater>) => apiClient.patch<Theater>(`/theaters/theaters/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/theaters/theaters/${id}/`),
}

export const screenAPI = {
  getByTheater: (theaterId: number) =>
    apiClient.get<Screen[]>(`/theaters/screens/?theater=${theaterId}`),
  create: (data: Partial<Screen>) => apiClient.post<Screen>('/theaters/screens/', data),
  update: (id: number, data: Partial<Screen>) =>
    apiClient.patch<Screen>(`/theaters/screens/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/theaters/screens/${id}/`),
}

export const showAPI = {
  getAll: () => apiClient.get<Show[]>('/theaters/shows/'),
  getByEvent: (eventId: number) => apiClient.get<Show[]>(`/theaters/shows/?event=${eventId}`),
  create: (data: Partial<Show>) => apiClient.post<Show>('/theaters/shows/', data),
  update: (id: number, data: Partial<Show>) => apiClient.patch<Show>(`/theaters/shows/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/theaters/shows/${id}/`),
}

export const seatAPI = {
  getAvailable: (showId: number) =>
    apiClient.get<Seat[]>(`/theaters/shows/${showId}/available_seats/`),
}

export const bookingAPI = {
  getAll: () => apiClient.get<Booking[]>("/bookings/"),
  create: (data: {
    show: number
    seats: number[]
    total_amount: number
  }) => apiClient.post<Booking>("/bookings/", data),
  cancel: (bookingId: number) =>
    apiClient.post(`/bookings/${bookingId}/cancel/`, {}),
}

export const authAPI = {
  register: (data: {
    name: string
    email: string
    phone_number: string
    password: string
    role: 'Customer' | 'VENUE_OWNER'
  }) => apiClient.post("/users/register/", data),

  verifyOTP: (data: {
    email: string
    otp: string
  }) => apiClient.post<{ token: string; refresh: string; user: User }>("/users/verify-otp/", data),

  login: async (email: string, password: string): Promise<{ token: string; refresh: string; user: User }> => {
    const response = await apiClient.post<{ token: string; refresh: string; user: User }>(
      "/users/login/",
      { email, password }
    )
    return response.data
  },

  googleLogin: (token: string) =>
    apiClient.post<{ token: string; refresh: string; user: User }>('/users/google-login/', { token }),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string }>('/users/token/refresh/', { refresh }),

  logout: (refresh: string) =>
    apiClient.post('/users/logout/', { refresh }),

  forgotPassword: (email: string) =>
    apiClient.post('/users/forgot-password/', { email }),

  resetPassword: (data: { email: string; otp: string; new_password: string }) =>
    apiClient.post('/users/reset-password/', data),
}

export const profileAPI = {
  get: () => apiClient.get<User>('/users/profile/'),
  update: (data: Partial<User>) => apiClient.patch<User>('/users/profile/', data),
  changePassword: (data: { old_password: string; new_password: string }) =>
    apiClient.post('/users/change-password/', data),
  deleteAccount: (data: { password: string }) =>
    apiClient.delete('/users/delete-account/', { data }),
  resendOTP: (email: string) =>
    apiClient.post('/users/resend-otp/', { email }),
}

export const paymentAPI = {
  createOrder: (data: { show: number; seats: number[] }) =>
    apiClient.post('/payments/create-order/', data),
  verify: (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    // show: number
    // seats: number[]
    // total_amount: number
  }) => apiClient.post('/payments/verify/', data),
}