import { create } from 'zustand'
import type { User } from '@/lib/types'

export type { User }

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Authula responds with { user, session } — not wrapped in ApiResponse envelope.
interface AuthulaResponse {
  user: User
  session: { token: string }
}

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }
  return res.json()
}

const TOKEN_KEY = 'session_token'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    set({ token })
  },

  signIn: async (email, password) => {
    const data = await authFetch<AuthulaResponse>('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(TOKEN_KEY, data.session.token)
    set({ user: data.user, token: data.session.token })
  },

  signUp: async (name, email, password) => {
    const data = await authFetch<AuthulaResponse>('/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    localStorage.setItem(TOKEN_KEY, data.session.token)
    set({ user: data.user, token: data.session.token })
  },

  signOut: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    await fetch('/auth/sign-out', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null })
  },
}))
