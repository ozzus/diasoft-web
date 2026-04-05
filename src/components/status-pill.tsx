import { cn } from '@/lib/utils'

type Status = 'valid' | 'active' | 'revoked' | 'expired' | 'processing' | 'pending' | 'ready' | 'partially_failed' | 'failed' | 'not_found'

const config: Record<Status, { dot: string; label: string }> = {
  valid:            { dot: 'bg-green-400',  label: 'Действителен' },
  active:           { dot: 'bg-green-400',  label: 'Действителен' },
  ready:            { dot: 'bg-green-400',  label: 'Загружен' },
  revoked:          { dot: 'bg-red-400',    label: 'Аннулирован' },
  failed:           { dot: 'bg-red-400',    label: 'Ошибка' },
  expired:          { dot: 'bg-amber-400',  label: 'Истёк' },
  partially_failed: { dot: 'bg-amber-400',  label: 'Частично' },
  processing:       { dot: 'bg-blue-400 animate-pulse', label: 'Обработка' },
  pending:          { dot: 'bg-muted-foreground/50 animate-pulse', label: 'Ожидание' },
  not_found:        { dot: 'bg-muted-foreground/40', label: 'Не найден' },
}

export function StatusPill({ status }: { status: Status }) {
  const { dot, label } = config[status] ?? config.not_found
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-muted-foreground">
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dot)} />
      {label}
    </span>
  )
}
