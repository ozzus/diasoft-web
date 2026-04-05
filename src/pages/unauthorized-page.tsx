import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

type Props = { message?: string }

export function UnauthorizedPage({ message }: Props) {
  const auth = useAuth()

  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-8 max-w-lg">
      <div className="flex items-center gap-3">
        <ShieldAlert size={18} className="text-destructive/60" />
        <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Доступ запрещён</p>
      </div>
      <div className="overflow-hidden">
        <h1 className="text-4xl font-black tracking-tight text-foreground">403</h1>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground/60">
        {message ?? 'Для доступа к этому кабинету необходима ролевая сессия платформы.'}
      </p>
      <div className="flex gap-3">
        {auth.authEnabled && (
          <Button onClick={() => void auth.login()} disabled={auth.status === 'loading'}>
            Войти через OIDC
          </Button>
        )}
        {auth.status === 'authenticated' && (
          <Button variant="outline" onClick={() => void auth.logout()}>
            Сменить сессию
          </Button>
        )}
      </div>
    </div>
  )
}
