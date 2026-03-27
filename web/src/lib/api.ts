import { useAuthStore } from '@/store/auth'
import type { ApiResponse } from '@/lib/types'

// api sends an authenticated request and unwraps the ApiResponse envelope.
// Throws on error responses.
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const { token } = useAuthStore.getState()

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const body: ApiResponse = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Request failed')
  }

  const body: ApiResponse<T> = await res.json()
  if (body.error) {
    throw new Error(body.error)
  }
  return body.data as T
}

export async function tenantApi<T>(
  path: string,
  orgSlug: string,
  options?: RequestInit,
): Promise<T> {
  return api<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      'X-Org-Slug': orgSlug,
    },
  })
}
