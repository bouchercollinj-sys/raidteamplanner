import { Link, useNavigate, useRouter } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import type { AuthUser } from '#/lib/session'

export function AuthMenu({ user }: { user: AuthUser | null }) {
  const router = useRouter()
  const navigate = useNavigate()

  const signOut = async () => {
    await authClient.signOut()
    await router.invalidate()
    await navigate({ to: '/' })
  }

  if (!user) {
    return (
      <div className="header-account">
        <Button variant="outline" asChild>
          <Link to="/sign-in">Sign in</Link>
        </Button>
        <Button asChild>
          <Link to="/sign-up">Create profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="header-account">
      <Link to="/account" className="account-chip" title={user.email}>
        {user.name || user.email}
      </Link>
      <Button type="button" variant="outline" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  )
}
