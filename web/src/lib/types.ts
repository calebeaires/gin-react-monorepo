// ApiResponse is the standard response envelope from all API endpoints.
// Mirrors the Go handler.ApiResponse struct.
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// User from the auth system.
export interface User {
  id: string
  name: string
  email: string
}

// Organization with the user's role in it.
export interface Organization {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'member'
}

// Response shapes for specific endpoints.

export interface MeData {
  user: User
  organizations: Organization[]
}

export interface OrgData {
  organization: Organization
}

export interface OrgListData {
  organizations: Organization[]
}

export interface OrgDetailsData {
  organization: {
    id: string
    name: string
    slug: string
    created_at: string
  }
  members: {
    id: string
    user_id: string
    role: string
  }[]
  your_role: string
}

export interface TenantStatusData {
  org_id: string
  org_slug: string
  schema: string
  role: string
}
