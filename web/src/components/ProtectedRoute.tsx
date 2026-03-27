import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useIsFetching } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isFetchingAuth = useIsFetching({ queryKey: ['auth', 'me'] })
  const { t } = useTranslation()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (isFetchingAuth > 0 && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('app.loading')}</p>
      </div>
    )
  }

  return children
}
