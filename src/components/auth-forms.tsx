import { Link } from '@tanstack/react-router'
import type { FormEvent, ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export function AuthPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="brand-lockup">
          justraidplanner
        </Link>
        <Button variant="outline" asChild>
          <Link to="/">Back to planner</Link>
        </Button>
      </header>
      <div className="auth-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  )
}

export function AuthField({
  id,
  label,
  type,
  value,
  autoComplete,
  onChange,
}: {
  id: string
  label: string
  type: string
  value: string
  autoComplete: string
  onChange: (value: string) => void
}) {
  return (
    <div className="auth-field">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  )
}

export function AuthForm({
  onSubmit,
  pending,
  error,
  submitLabel,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  error: string | null
  submitLabel: string
  children: ReactNode
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {children}
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Working…' : submitLabel}
      </Button>
    </form>
  )
}
