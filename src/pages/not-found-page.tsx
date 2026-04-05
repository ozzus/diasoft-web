import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-8 max-w-lg">
      <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Страница не найдена</p>
      <h1 className="text-6xl font-black tracking-tight text-foreground">404</h1>
      <p className="text-sm text-muted-foreground/60">
        Запрошенный маршрут не является частью текущей оболочки.
      </p>
      <Button asChild>
        <Link to="/">← На главную</Link>
      </Button>
    </div>
  )
}
