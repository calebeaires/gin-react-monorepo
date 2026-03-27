import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { OrgDetailsData } from '@/lib/types'
import { useOrgStore } from '@/store/org'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

export default function OrgSettingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const deleteOrg = useOrgStore((s) => s.deleteOrg)
  const [deleting, setDeleting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['org', slug],
    queryFn: () => api<OrgDetailsData>(`/api/orgs/${slug}`),
    enabled: !!slug,
  })

  const handleDelete = async () => {
    if (!slug || !confirm(t('org.deleteConfirm'))) return
    setDeleting(true)
    try {
      await deleteOrg(slug)
      navigate('/orgs')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('app.loading')}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    )
  }

  const isOwner = data.your_role === 'owner'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {data.organization.name}
            </h1>
            <p className="text-sm text-muted-foreground">{data.organization.slug}</p>
          </div>
          <Button variant="outline"  onClick={() => navigate('/orgs')}>
            {t('org.backToHome')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('org.members')}</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-3">
              {data.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {member.user_id}
                  </span>
                  <Badge variant="secondary">{t(`org.role.${member.role}`)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? t('org.deleting') : t('org.deleteOrg')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
