import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useOrgStore } from '@/store/org'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateOrgDialog } from '@/components/CreateOrgDialog'

export default function OrgsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const organizations = useOrgStore((s) => s.organizations)
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)

  const handleSelect = (org: (typeof organizations)[0]) => {
    setCurrentOrg(org)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('org.title')}
            </h1>
            {organizations.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('org.createFirst')}
              </p>
            )}
          </div>
          <CreateOrgDialog />
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('org.noOrgs')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => handleSelect(org)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <Badge variant="secondary">{t(`org.role.${org.role}`)}</Badge>
                  </div>
                  <CardDescription>{org.slug}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {organizations.length > 0 && (
          <div className="flex justify-center">
            <Button variant="ghost"  onClick={() => navigate('/')}>
              {t('org.backToHome')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
