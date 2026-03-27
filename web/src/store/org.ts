import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Organization, OrgData } from '@/lib/types'

export type { Organization }

const STORAGE_KEY = 'currentOrgSlug'

interface OrgState {
  organizations: Organization[]
  currentOrg: Organization | null
  setOrganizations: (orgs: Organization[]) => void
  setCurrentOrg: (org: Organization | null) => void
  createOrg: (name: string, slug: string) => Promise<Organization>
  deleteOrg: (slug: string) => Promise<void>
}

export const useOrgStore = create<OrgState>((set, get) => ({
  organizations: [],
  currentOrg: null,

  setOrganizations: (orgs) => {
    set({ organizations: orgs })

    const savedSlug = localStorage.getItem(STORAGE_KEY)
    const current = get().currentOrg
    if (!current && orgs.length > 0) {
      const restored = orgs.find((o) => o.slug === savedSlug) ?? orgs[0]
      set({ currentOrg: restored })
      localStorage.setItem(STORAGE_KEY, restored.slug)
    }
  },

  setCurrentOrg: (org) => {
    set({ currentOrg: org })
    if (org) {
      localStorage.setItem(STORAGE_KEY, org.slug)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  createOrg: async (name, slug) => {
    const data = await api<OrgData>('/api/orgs', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    })
    const org: Organization = { ...data.organization, role: 'owner' }
    set((state) => ({
      organizations: [...state.organizations, org],
      currentOrg: org,
    }))
    localStorage.setItem(STORAGE_KEY, org.slug)
    return org
  },

  deleteOrg: async (slug) => {
    await api(`/api/orgs/${slug}`, { method: 'DELETE' })
    set((state) => {
      const remaining = state.organizations.filter((o) => o.slug !== slug)
      const current = state.currentOrg?.slug === slug ? remaining[0] ?? null : state.currentOrg
      if (current) {
        localStorage.setItem(STORAGE_KEY, current.slug)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      return { organizations: remaining, currentOrg: current }
    })
  },
}))
