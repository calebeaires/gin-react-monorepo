import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrgStore } from '@/store/org'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreateOrgDialogProps {
  onCreated?: () => void
}

export function CreateOrgDialog({ onCreated }: CreateOrgDialogProps) {
  const { t } = useTranslation()
  const createOrg = useOrgStore((s) => s.createOrg)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createOrg(name, slug)
      setOpen(false)
      setName('')
      setSlug('')
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('org.creating'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        {t('org.create')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('org.create')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('org.nameLabel')}</Label>
            <Input
              id="org-name"
              placeholder={t('org.namePlaceholder')}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">{t('org.slugLabel')}</Label>
            <Input
              id="org-slug"
              placeholder={t('org.slugPlaceholder')}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="^[a-z][a-z0-9-]{1,48}[a-z0-9]$"
            />
            <p className="text-xs text-muted-foreground">{t('org.slugHelp')}</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('org.creating') : t('org.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
