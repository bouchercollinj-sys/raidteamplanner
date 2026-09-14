import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthField, AuthForm, AuthPage } from '#/components/auth-forms'
import { requestPasswordResetForEmail } from '#/lib/auth-client'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <AuthPage eyebrow="Account recovery" title="Reset your password.">
      <p className="auth-lead">
        Enter the email on your profile. If it matches an account, we will send a
        reset link.
      </p>
      <AuthForm
        pending={pending}
        error={error}
        submitLabel="Send reset link"
        onSubmit={(event) => {
          event.preventDefault()
          void (async () => {
            setPending(true)
            setError(null)
            setNotice(null)

            const result = await requestPasswordResetForEmail(email)

            if (result.error) {
              setError(
                result.error.message || 'A reset link could not be sent.',
              )
              setPending(false)
              return
            }

            setNotice('If that email is on a profile, a reset link is on its way.')
            setPending(false)
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
      </AuthForm>
      {notice ? (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      ) : null}
      <p className="auth-switch">
        Remembered it? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthPage>
  )
}
