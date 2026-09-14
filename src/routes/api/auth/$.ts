import { createFileRoute } from '@tanstack/react-router'

import { ensureSchema, getAuth } from '#/lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureSchema()
        return getAuth().handler(request)
      },
      POST: async ({ request }) => {
        await ensureSchema()
        return getAuth().handler(request)
      },
    },
  },
})
