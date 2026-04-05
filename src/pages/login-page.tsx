import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import type { LoginRequest } from '@/lib/api'

const roles: Array<{ value: LoginRequest['role']; label: string; placeholder: string }> = [
  { value: 'university', label: 'ВУЗ', placeholder: 'ITMO' },
  { value: 'student', label: 'Студент', placeholder: 'D-2026-0001' },
  { value: 'hr', label: 'HR', placeholder: 'hr@diplomverify.ru' },
]

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState<LoginRequest['role']>('university')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const roleMeta = useMemo(() => roles.find((item) => item.value === role) ?? roles[0], [role])
  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const next = params.get('next')
    return next && next.startsWith('/') ? next : null
  }, [location.search])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await auth.login({ login, password, role })
      if (nextPath) navigate(nextPath)
      else if (role === 'university') navigate('/university')
      else if (role === 'student') navigate('/student')
      else navigate('/hr')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ошибка входа')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-8">
      <div className="border-b border-border/30 pb-6">
        <p className="mb-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Авторизация</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground">ВХОД В СИСТЕМУ</h1>
      </div>

      <form className="flex flex-col gap-6 border border-border/40 p-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-0 border border-border/40">
          {roles.map((item, index) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRole(item.value)}
              className={`px-3 py-3 font-mono text-[10px] tracking-widest uppercase transition-colors ${
                index < roles.length - 1 ? 'border-r border-border/40' : ''
              } ${role === item.value ? 'bg-foreground text-background' : 'text-muted-foreground/60 hover:bg-foreground/5'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">
            {role === 'university' ? 'Код ВУЗа' : role === 'student' ? 'Номер диплома' : 'Логин'}
          </span>
          <Input value={login} onChange={(event) => setLogin(event.target.value)} placeholder={roleMeta.placeholder} required />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">Пароль</span>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="secret" required />
        </label>

        {error && <p className="font-mono text-[10px] text-destructive/80">{error}</p>}

        <Button type="submit" disabled={submitting || !login || !password}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? 'Входим...' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
