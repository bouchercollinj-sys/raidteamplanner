import { createServerFn } from '@tanstack/react-start'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { readSessionUser } = await import('#/lib/session.server')
  return readSessionUser()
})

export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSessionUser } = await import('#/lib/session.server')
    return requireSessionUser()
  },
)
