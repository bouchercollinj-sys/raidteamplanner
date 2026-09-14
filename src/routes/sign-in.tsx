import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    if (typeof search.redirect === 'string') {
      return { redirect: search.redirect }
    }

    return {}
  },
  component: SignInPage,
})

function SignInPage() {
  const { redirect } = Route.useSearch()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const goNext = () => {
    const next = redirect && redirect.startsWith('/') ? redirect : '/'
    window.location.assign(next)
  }

  return (
    <main className="route-state">
      <div className="route-state-card auth-card">
        <Link to="/" className="brand-lockup" aria-label="justraidplanner">
          <span className="brand-mark" aria-hidden="true">
            WF
          </span>
          <span>justraidplanner</span>
        </Link>
        <p className="eyebrow">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </p>
        <h1>
          {mode === 'signin'
            ? 'Sign in to save raid teams.'
            : 'Save raid teams to your account.'}
        </h1>
        <p>
          Signed-in presets live in the justraidplanner D1 database and can be
          shared with a short link on this site.
        </p>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            setBusy(true)
            setError(null)

            const request =
              mode === 'signup'
                ? authClient.signUp.email({
                    name: name.trim() || email.split('@')[0] || 'Raider',
                    email,
                    password,
                  })
                : authClient.signIn.email({ email, password })

            void request
              .then((result) => {
                if (result.error) {
                  setError(result.error.message || 'Could not sign you in.')
                  return
                }

                goNext()
              })
              .catch((caught: unknown) => {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : 'Could not sign you in.',
                )
              })
              .finally(() => setBusy(false))
          }}
        >
          {mode === 'signup' ? (
            <div className="auth-field">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          ) : null}
          <div className="auth-field">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="auth-field">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className="account-error">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <p className="auth-switch">
          {mode === 'signin' ? (
            <>
              Need an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
