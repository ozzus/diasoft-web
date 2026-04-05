import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border/40 bg-foreground/5 text-foreground/70',
        success: 'border-green-500/20 bg-green-500/8 text-green-400',
        warning: 'border-amber-500/20 bg-amber-500/8 text-amber-400',
        destructive: 'border-red-500/20 bg-red-500/8 text-red-400',
        outline: 'border-border/40 bg-transparent text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
