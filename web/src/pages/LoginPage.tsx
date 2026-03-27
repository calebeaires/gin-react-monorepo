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

export default function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
      return
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signInFailed'))
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
            <CardTitle className="text-xl">{t('auth.signIn')}</CardTitle>
            <CardDescription>{t('auth.signInSubtitle')}</CardDescription>
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
                    <div className="flex items-center">
                      <Label htmlFor="password">{t('form.password')}</Label>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        {t('auth.forgotPassword')}
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('form.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  {t('auth.noAccount')}{' '}
                  <Link
                    to="/signup"
                    className="underline underline-offset-4"
                  >
                    {t('auth.signUp')}
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
