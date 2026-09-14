import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthField, AuthForm, AuthPage } from '#/components/auth-forms'
import { authClient } from '#/lib/auth-client'

const MIN_PASSWORD_LENGTH = 8

type ResetSearch = {
  token?: string
  error?: string
}

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, error: linkError } = Route.useSearch()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const invalidLink = !token || linkError === 'INVALID_TOKEN'

  return (
    <AuthPage eyebrow="Account recovery" title="Choose a new password.">
      {invalidLink ? (
        <>
          <p className="auth-lead">
            This reset link is missing or no longer valid. Request a new one to
            continue.
          </p>
          <p className="auth-switch">
            <Link to="/forgot-password">Send a new reset link</Link>
          </p>
        </>
      ) : (
        <AuthForm
          pending={pending}
          error={error}
          submitLabel="Save new password"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              setPending(true)
              setError(null)

              if (password.length < MIN_PASSWORD_LENGTH) {
                setError(
                  `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`,
                )
                setPending(false)
                return
              }

              if (password !== confirmPassword) {
                setError('New password and confirmation do not match.')
                setPending(false)
                return
              }

              const result = await authClient.resetPassword({
                newPassword: password,
                token,
              })

              if (result.error) {
                setError(
                  result.error.message ||
                    'This reset link could not be used. Request a new one.',
                )
                setPending(false)
                return
              }

              await router.invalidate()
              await navigate({ to: '/sign-in', search: { reset: true } })
            })()
          }}
        >
          <AuthField
            id="new-password"
            label="New password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={setPassword}
          />
          <AuthField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={setConfirmPassword}
          />
        </AuthForm>
      )}
    </AuthPage>
  )
}
