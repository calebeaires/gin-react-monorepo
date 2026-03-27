import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { GalleryVerticalEnd } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const token = useAuthStore((s) => s.token)
  const signUp = useAuthStore((s) => s.signUp)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) {
    return <Navigate to="/orgs" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordMinLength'))
      return
    }

    setLoading(true)
    try {
      await signUp(name, email, password)
      navigate('/orgs')
      return
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signUpFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {t('app.title')}
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t('auth.signUp')}</CardTitle>
            <CardDescription>{t('auth.signUpSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t('form.name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('form.namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('form.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t('form.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('form.passwordMinPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">
                      {t('form.confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('form.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('auth.creatingAccount') : t('auth.signUp')}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  {t('auth.hasAccount')}{' '}
                  <Link
                    to="/login"
                    className="underline underline-offset-4"
                  >
                    {t('auth.signIn')}
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-muted-foreground text-balance text-center text-xs [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
          {t('auth.termsNotice')}{' '}
          <a href="#">{t('auth.termsOfService')}</a>{' '}
          {t('auth.and')}{' '}
          <a href="#">{t('auth.privacyPolicy')}</a>.
        </div>
      </div>
    </div>
  )
}
