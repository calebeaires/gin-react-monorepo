import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/query'
import { api } from '@/lib/api'
import type { MeData } from '@/lib/types'
import { useAuthStore } from '@/store/auth'
import { useOrgStore } from '@/store/org'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrgGuard } from '@/components/OrgGuard'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import HomePage from '@/pages/HomePage'
import OrgsPage from '@/pages/OrgsPage'
import OrgSettingsPage from '@/pages/OrgSettingsPage'

function AuthLoader({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const setOrganizations = useOrgStore((s) => s.setOrganizations)

  useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: async () => {
      if (!token) {
        setUser(null)
        setOrganizations([])
        return null
      }
      try {
        const data = await api<MeData>('/api/me')
        setUser(data.user)
        setOrganizations(data.organizations ?? [])
        return data
      } catch {
        setUser(null)
        setOrganizations([])
        return null
      }
    },
  })

  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthLoader>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/orgs"
              element={
                <ProtectedRoute>
                  <OrgsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orgs/:slug/settings"
              element={
                <ProtectedRoute>
                  <OrgSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <OrgGuard>
                    <HomePage />
                  </OrgGuard>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthLoader>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
