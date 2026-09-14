import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthField, AuthForm, AuthPage } from '#/components/auth-forms'
import { authClient } from '#/lib/auth-client'
import { DISPLAY_NAME_MAX_LENGTH, parseDisplayName } from '#/lib/presets'

export const Route = createFileRoute('/sign-up')({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: '/' })
    }
  },
  component: SignUpPage,
})

function SignUpPage() {
  const router = useRouter()
  const navigate = Route.useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <AuthPage eyebrow="Create a profile" title="Keep your raid presets.">
      <AuthForm
        pending={pending}
        error={error}
        submitLabel="Create profile"
        onSubmit={(event) => {
          event.preventDefault()
          void (async () => {
            setPending(true)
            setError(null)

            try {
              parseDisplayName(name)
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Enter the name you want on your profile.',
              )
              setPending(false)
              return
            }

            if (password.length < 8) {
              setError('Use a password with at least 8 characters.')
              setPending(false)
              return
            }

            const result = await authClient.signUp.email({
              email,
              password,
              name: name.trim(),
            })

            if (result.error) {
              setError(
                result.error.message || 'This profile could not be created.',
              )
              setPending(false)
              return
            }

            await router.invalidate()
            await navigate({ to: '/' })
          })()
        }}
      >
        <AuthField
          id="name"
          label="Display name"
          type="text"
          value={name}
          autoComplete="name"
          onChange={(value) => setName(value.slice(0, DISPLAY_NAME_MAX_LENGTH))}
        />
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
          autoComplete="new-password"
          onChange={setPassword}
        />
      </AuthForm>
      <p className="auth-switch">
        Already have a profile? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthPage>
  )
}
