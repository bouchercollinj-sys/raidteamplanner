import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth.server'
import { toAuthUser } from '#/lib/session'
import type { AuthUser } from '#/lib/session'

export async function readSessionUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })

  return toAuthUser(session)
}

export async function requireSessionUser(): Promise<AuthUser> {
  const user = await readSessionUser()

  if (!user) {
    throw new Error('Sign in to continue.')
  }

  return user
}
