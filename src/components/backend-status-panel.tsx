import { useBackendStatus } from '@/hooks/use-backend-status'

export function BackendStatusPanel() {
  const { status, error } = useBackendStatus()

  return (
    <div className="flex flex-col gap-0 border border-border/40">
      <div className="border-b border-border/30 px-4 py-3">
        <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Статус бекенда</p>
      </div>
      <ServiceRow name="Gateway" up={status?.gateway === 'up'} loading={!status && !error} />
      <ServiceRow name="Registry" up={status?.registry === 'up'} loading={!status && !error} />
      {error && (
        <div className="border-t border-border/30 px-4 py-3">
          <p className="font-mono text-[10px] text-destructive/70">{error}</p>
        </div>
      )}
    </div>
  )
}

function ServiceRow({ name, up, loading }: { name: string; up: boolean; loading: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/20 px-4 py-3 last:border-0">
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground">{name}</span>
      {loading ? (
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20 animate-pulse" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${up ? 'bg-green-400' : 'bg-red-400'}`} />
      )}
    </div>
  )
}
