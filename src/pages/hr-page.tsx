import { startTransition, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ShieldCheck, ShieldAlert, ShieldX, ShieldOff } from 'lucide-react'

import type { VerificationResult } from '@/lib/api'
import { verifyDiplomaByLookup } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

type Verdict = NonNullable<VerificationResult['verdict']>

const verdictConfig: Record<Verdict, { label: string; sublabel: string; color: string; Icon: typeof ShieldCheck }> = {
  valid:     { label: 'ДЕЙСТВИТЕЛЕН',  sublabel: 'Диплом подтверждён реестром',           color: 'text-green-400',  Icon: ShieldCheck },
  revoked:   { label: 'АННУЛИРОВАН',   sublabel: 'Запись отозвана оператором ВУЗа',        color: 'text-red-400',    Icon: ShieldX },
  expired:   { label: 'ИСТЁК',         sublabel: 'Срок действия диплома истёк',            color: 'text-amber-400',  Icon: ShieldOff },
  not_found: { label: 'НЕ НАЙДЕН',     sublabel: 'Диплом отсутствует в реестре',           color: 'text-muted-foreground', Icon: ShieldAlert },
}

export function HrPage() {
  const [diplomaNumber, setDiplomaNumber]   = useState('')
  const [universityCode, setUniversityCode] = useState('')
  const [result, setResult]                 = useState<VerificationResult | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await verifyDiplomaByLookup({
        diplomaNumber: diplomaNumber.trim(),
        universityCode: universityCode.trim(),
      })
      startTransition(() => setResult(res))
    } catch (cause) {
      setResult(null)
      setError(cause instanceof Error ? cause.message : 'Ошибка запроса')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result?.verdict ? verdictConfig[result.verdict] : null

  return (
    <div className="flex flex-col gap-12">

      {/* ── Label ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="border-b border-border/30 pb-6"
      >
        <p className="mb-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Проверка работодателя</p>
        <h1 className="text-3xl font-black tracking-tight">ВЕРИФИКАЦИЯ<br />ДИПЛОМА</h1>
      </motion.div>

      {/* ── Layout ────────────────────────────────────────── */}
      <div className="grid gap-12 lg:grid-cols-[400px_1fr]">

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase">
                Номер диплома
              </label>
              <Input
                value={diplomaNumber}
                onChange={(e) => setDiplomaNumber(e.target.value)}
                placeholder="D-2026-0042"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase">
                Код университета
              </label>
              <Input
                value={universityCode}
                onChange={(e) => setUniversityCode(e.target.value)}
                placeholder="ITMO"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? (
                <span className="animate-pulse">Проверяем...</span>
              ) : (
                <>
                  <Search size={12} />
                  Проверить
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Result */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {!result && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-48 items-center justify-center border border-dashed border-border/30"
              >
                <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/25 uppercase">
                  Результат появится здесь
                </p>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                className="flex flex-col gap-3 border border-red-500/20 bg-red-500/5 p-6"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-400" />
                  <p className="font-mono text-[10px] tracking-wide text-red-400">{error}</p>
                </div>
              </motion.div>
            )}

            {result && cfg && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease }}
                className="flex flex-col gap-6 border border-border/40 p-6"
              >
                {/* Verdict */}
                <div className="flex items-start gap-4">
                  <cfg.Icon size={22} className={cfg.color} />
                  <div>
                    <p className={`text-2xl font-black tracking-tight ${cfg.color}`}>{cfg.label}</p>
                    <p className="mt-0.5 font-mono text-[10px] tracking-wide text-muted-foreground/50">{cfg.sublabel}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-0 border border-border/30">
                  <DetailCell label="Университет"    value={result.universityCode ?? '—'} />
                  <DetailCell label="Номер диплома"  value={result.diplomaNumber ?? '—'} border />
                  <DetailCell label="Владелец"       value={result.ownerNameMask ?? '—'} top />
                  <DetailCell label="Специальность"  value={result.program ?? '—'}       top border />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function DetailCell({ label, value, border, top }: { label: string; value: string; border?: boolean; top?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 p-4 ${border ? 'border-l border-border/30' : ''} ${top ? 'border-t border-border/30' : ''}`}>
      <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground/40 uppercase">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
