import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck, ShieldX, ShieldOff, ShieldAlert, Loader2 } from 'lucide-react'

import { verifyDiplomaByToken, type VerificationResult } from '@/lib/api'
import { Button } from '@/components/ui/button'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

type Verdict = NonNullable<VerificationResult['verdict']>

const verdictConfig: Record<Verdict, { label: string; sub: string; color: string; bg: string; Icon: typeof ShieldCheck }> = {
  valid:     { label: 'ДЕЙСТВИТЕЛЕН',  sub: 'Диплом подтверждён реестром данных',      color: 'text-green-400',         bg: 'bg-green-400/5 border-green-400/15',  Icon: ShieldCheck },
  revoked:   { label: 'АННУЛИРОВАН',   sub: 'Запись была отозвана оператором ВУЗа',    color: 'text-red-400',           bg: 'bg-red-400/5 border-red-400/15',      Icon: ShieldX     },
  expired:   { label: 'ИСТЁК',         sub: 'Срок действия документа истёк',           color: 'text-amber-400',         bg: 'bg-amber-400/5 border-amber-400/15',  Icon: ShieldOff   },
  not_found: { label: 'НЕ НАЙДЕН',     sub: 'Диплом не обнаружен в реестре',           color: 'text-muted-foreground',  bg: 'bg-border/20 border-border/20',       Icon: ShieldAlert },
}

export function PublicVerifyPage() {
  const { verificationToken } = useParams()
  const [result, setResult]   = useState<VerificationResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!verificationToken) {
      setError('Токен верификации не указан')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void verifyDiplomaByToken(verificationToken)
      .then((r) => { if (!cancelled) setResult(r) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка запроса') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [verificationToken])

  const cfg = result?.verdict ? verdictConfig[result.verdict] : null

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center gap-10">

      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={20} className="animate-spin text-muted-foreground/30" />
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/30 uppercase animate-pulse">
            Запрос к реестру...
          </p>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col gap-4 border border-red-500/20 bg-red-500/5 p-8"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-red-400" />
            <p className="font-mono text-[10px] tracking-wide text-red-400 uppercase">{error}</p>
          </div>
        </motion.div>
      )}

      {result && cfg && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex flex-col gap-0"
        >
          {/* Verdict hero */}
          <div className={`flex items-center gap-5 border p-8 ${cfg.bg}`}>
            <cfg.Icon size={32} className={cfg.color} strokeWidth={1.5} />
            <div>
              <p className={`text-4xl font-black tracking-tight ${cfg.color}`}>{cfg.label}</p>
              <p className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground/50">{cfg.sub}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-0 border border-t-0 border-border/40">
            <DetailCell label="Университет"   value={result.universityCode ?? '—'} />
            <DetailCell label="Номер диплома" value={result.diplomaNumber ?? '—'}  border />
            <DetailCell label="Владелец"      value={result.ownerNameMask ?? '—'}  top />
            <DetailCell label="Специальность" value={result.program ?? '—'}        top border />
          </div>

          {/* Token */}
          <div className="border border-t-0 border-border/40 px-5 py-3.5">
            <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground/30 uppercase">
              Token: {verificationToken}
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease }}
      >
        <Button asChild variant="ghost" size="sm">
          <Link to="/hr">← Вернуться к проверке</Link>
        </Button>
      </motion.div>

    </div>
  )
}

function DetailCell({ label, value, border, top }: { label: string; value: string; border?: boolean; top?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 p-5 ${border ? 'border-l border-border/40' : ''} ${top ? 'border-t border-border/40' : ''}`}>
      <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground/40 uppercase">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
