import { Navigate } from 'react-router'
import { useIsFetching } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useOrgStore } from '@/store/org'

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const organizations = useOrgStore((s) => s.organizations)
  const isFetchingAuth = useIsFetching({ queryKey: ['auth', 'me'] })
  const { t } = useTranslation()

  if (isFetchingAuth > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('app.loading')}</p>
      </div>
    )
  }

  if (organizations.length === 0 || !currentOrg) {
    return <Navigate to="/orgs" replace />
  }

  return children
}
