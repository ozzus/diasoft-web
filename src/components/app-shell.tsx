import { NavLink, Outlet } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',           label: 'Главная',  end: true },
  { to: '/university', label: 'ВУЗ' },
  { to: '/student',    label: 'Студент' },
  { to: '/hr',         label: 'HR' },
]

export function AppShell() {
  const auth = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3">
            <span className="font-black tracking-tighter text-foreground">DIPLOMVERIFY</span>
            <span className="hidden font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase sm:block">
              — Team 1
            </span>
          </NavLink>

          {/* Nav */}
          <nav className="flex items-center gap-0">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative h-12 px-4 flex items-center font-mono text-[10px] tracking-widest uppercase transition-colors',
                    isActive
                      ? 'text-foreground after:absolute after:bottom-0 after:inset-x-4 after:h-px after:bg-foreground'
                      : 'text-muted-foreground/50 hover:text-muted-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {auth.status === 'authenticated' && auth.user && (
              <span className="hidden font-mono text-[9px] tracking-[0.14em] text-muted-foreground/40 uppercase sm:block">
                {auth.user.subject}
              </span>
            )}
            {auth.authEnabled ? (
              auth.status === 'authenticated' ? (
                <Button variant="ghost" size="sm" onClick={() => void auth.logout()}>
                  Выйти
                </Button>
              ) : (
                <Button size="sm" onClick={() => void auth.login()} disabled={auth.status === 'loading'}>
                  Войти
                </Button>
              )
            ) : (
              <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/30 uppercase">
                dev mode
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <motion.div
          key="outlet"
          className="mx-auto max-w-7xl px-6 py-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
