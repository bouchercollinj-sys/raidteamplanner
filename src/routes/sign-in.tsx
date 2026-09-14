import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthField, AuthForm, AuthPage } from '#/components/auth-forms'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): { reset?: true } => ({
    reset: search.reset === true || search.reset === '1' ? true : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: '/' })
    }
  },
  component: SignInPage,
})

function SignInPage() {
  const { reset } = Route.useSearch()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <AuthPage eyebrow="Welcome back" title="Sign in to your profile.">
      {reset ? (
        <p className="auth-notice" role="status">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      <AuthForm
        pending={pending}
        error={error}
        submitLabel="Sign in"
        onSubmit={(event) => {
          event.preventDefault()
          void (async () => {
            setPending(true)
            setError(null)
            const result = await authClient.signIn.email({
              email,
              password,
            })

            if (result.error) {
              setError(result.error.message || 'Those details did not match.')
              setPending(false)
              return
            }

            await router.invalidate()
            await navigate({ to: '/' })
          })()
        }}
      >
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={setEmail}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={setPassword}
        />
      </AuthForm>
      <p className="auth-switch">
        Forgot your password? <Link to="/forgot-password">Send a reset link</Link>
      </p>
      <p className="auth-switch">
        New here? <Link to="/sign-up">Create a profile</Link>
      </p>
    </AuthPage>
  )
}
