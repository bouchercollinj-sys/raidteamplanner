export type AuthUser = {
  id: string
  name: string
  email: string
}

export function toAuthUser(
  session:
    | {
        user: {
          id: string
          name: string
          email: string
        }
      }
    | null
    | undefined,
): AuthUser | null {
  if (!session) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
}
