import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useOrgStore } from '@/store/org'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrgSwitcher } from '@/components/OrgSwitcher'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const { t } = useTranslation()

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api<{ status: string }>('/api/health'),
  })

  const message = useMutation({
    mutationFn: () => api<{ message: string }>('/api/message'),
  })

  const status = health.isLoading ? null : health.data?.status ?? 'offline'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('app.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('home.welcome', { name: user?.name || user?.email })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrgSwitcher />
            <Button variant="outline"  onClick={signOut}>
              {t('auth.signOut')}
            </Button>
          </div>
        </div>

        {currentOrg && (
          <div className="rounded-lg border bg-muted/50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('org.currentOrg')}</p>
              <p className="text-sm font-medium">{currentOrg.name}</p>
            </div>
            <Badge variant="secondary">{t(`org.role.${currentOrg.role}`)}</Badge>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('home.backendStatus')}</CardTitle>
              {status === null ? (
                <Badge variant="secondary">{t('home.checking')}</Badge>
              ) : status === 'ok' ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400">
                  {t('home.online')}
                </Badge>
              ) : (
                <Badge variant="destructive">{t('home.offline')}</Badge>
              )}
            </div>
            <CardDescription>
              {t('home.serverDescription')}
            </CardDescription>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-4">
            <Button
              onClick={() => message.mutate()}
              disabled={message.isPending}
              className="w-full"
            >
              {message.isPending ? t('home.fetching') : t('home.fetchMessage')}
            </Button>

            {message.data && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">{message.data.message}</p>
              </div>
            )}

            {message.isError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{t('home.backendError')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Gin :8081</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Vite :5173</span>
        </div>
      </div>
    </div>
  )
}
