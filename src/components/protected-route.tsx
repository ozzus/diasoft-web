import type { PropsWithChildren } from 'react'
import { useAuth } from '@/lib/auth'
import { UnauthorizedPage } from '@/pages/unauthorized-page'

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles: string[]
}>

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const auth = useAuth()

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
    return <UnauthorizedPage message={auth.error ?? 'Для доступа к кабинету необходима аутентификация.'} />
  }

  if (!auth.hasAnyRole(...allowedRoles)) {
    return <UnauthorizedPage message="Ваша роль не имеет доступа к этому кабинету." />
  }

  return <>{children}</>
}
