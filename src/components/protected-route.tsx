import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { UnauthorizedPage } from '@/pages/unauthorized-page'

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles: string[]
}>

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/30 uppercase animate-pulse">
          Инициализация сессии...
        </span>
      </div>
    )
  }

  if (auth.status !== 'authenticated') {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (!auth.hasAnyRole(...allowedRoles)) {
    return <UnauthorizedPage message="Ваша роль не имеет доступа к этому кабинету." />
  }

  return <>{children}</>
}
