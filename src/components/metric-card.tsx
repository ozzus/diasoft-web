import type { ReactNode } from 'react'

export function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: string
  description: string
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border border-border/40 p-5">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase">— {label}</p>
        {icon && <span className="text-muted-foreground/30">{icon}</span>}
      </div>
      <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground/60 leading-relaxed">{description}</p>
    </div>
  )
}
