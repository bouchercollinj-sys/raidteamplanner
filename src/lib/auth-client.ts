import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()

export function requestPasswordResetForEmail(email: string) {
  const redirectTo =
    typeof window === 'undefined'
      ? '/reset-password'
      : `${window.location.origin}/reset-password`

  return authClient.requestPasswordReset({
    email,
    redirectTo,
  })
}
