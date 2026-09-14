import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthForm, AuthPage } from '#/components/auth-forms'
import { SavedRaidsSection } from '#/components/saved-raids'
import { Button } from '#/components/ui/button'
import { authClient, requestPasswordResetForEmail } from '#/lib/auth-client'

export const Route = createFileRoute('/account')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/sign-in' })
    }

    return { user: context.user }
  },
  component: AccountPage,
})

function AccountPage() {
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const navigate = Route.useNavigate()

  const signOut = async () => {
    await authClient.signOut()
    await router.invalidate()
    await navigate({ to: '/' })
  }

  return (
    <AuthPage eyebrow="Your profile" title="Account.">
      <p className="auth-lead">
        Signed in as <strong>{user.name}</strong>.
      </p>
      <ResetPasswordForm email={user.email} />
      <SavedRaidsSection />
      <div className="account-actions">
        <Button type="button" variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Back to planner</Link>
        </Button>
      </div>
    </AuthPage>
  )
}

function ResetPasswordForm({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <section className="account-password" aria-labelledby="reset-password-title">
      <p className="eyebrow">Security</p>
      <h2 id="reset-password-title">Reset password</h2>
      <p className="auth-lead">
        We will email a link you can use to choose a new password.
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

            setNotice('Check your email for a reset link.')
            setPending(false)
          })()
        }}
      >
        {null}
      </AuthForm>
      {notice ? (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  )
}
