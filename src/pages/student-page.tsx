import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { QrCode, Share2, ShieldCheck, ExternalLink } from 'lucide-react'

import { BackendStatusPanel } from '@/components/backend-status-panel'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { createStudentShareLink, listStudentDiplomas, type RegistryDiploma, type ShareLink } from '@/lib/api'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

export function StudentPage() {
  const auth = useAuth()
  const [diplomas, setDiplomas]   = useState<RegistryDiploma[]>([])
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const diploma = diplomas[0]
  const studentExternalId = auth.user?.studentExternalId ?? ''

  useEffect(() => {
    if (!studentExternalId) return
    setLoading(true)
    setError(null)
    void listStudentDiplomas()
      .then(setDiplomas)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [studentExternalId])

  const verifyUrl = useMemo(() => {
    if (!diploma?.verificationToken) return null
    return `/public/verify/${encodeURIComponent(diploma.verificationToken)}`
  }, [diploma])

  async function handleShare() {
    if (!diploma) return
    setError(null)
    try {
      setShareLink(await createStudentShareLink(diploma.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания ссылки')
    }
  }

  return (
    <div className="flex flex-col gap-12">

      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div
        className="border-b border-border/30 pb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <p className="mb-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Кабинет студента</p>
        <h1 className="text-3xl font-black tracking-tight">МОЙ<br />ДИПЛОМ</h1>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr_220px]">

        {/* ── Diploma card ───────────────────────────────── */}
        <motion.div
          className="flex flex-col gap-0 bg-foreground text-background"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          <div className="border-b border-background/10 px-5 py-4">
            <p className="font-mono text-[9px] tracking-[0.2em] text-background/40 uppercase">— Документ</p>
          </div>

          {/* QR area */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-10">
            <div className="flex h-36 w-36 items-center justify-center border border-background/10 bg-background/5">
              <QrCode size={80} strokeWidth={1.2} className="text-background/70" />
            </div>
            {loading && (
              <p className="font-mono text-[9px] tracking-[0.2em] text-background/30 uppercase animate-pulse">
                Загрузка...
              </p>
            )}
          </div>

          {/* Diploma info */}
          {diploma && (
            <div className="border-t border-background/10 px-5 py-4 flex flex-col gap-1">
              <p className="text-sm font-bold tracking-tight">{diploma.ownerNameMask}</p>
              <p className="font-mono text-[10px] text-background/50">{diploma.programName}</p>
              <p className="font-mono text-[10px] text-background/40">{diploma.diplomaNumber}</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 border-t border-background/10">
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={!diploma}
              className="flex items-center justify-center gap-2 border-r border-background/10 py-4 font-mono text-[9px] tracking-widest uppercase text-background/60 transition-colors hover:bg-background/5 hover:text-background disabled:opacity-30"
            >
              <Share2 size={11} />
              Share
            </button>
            <button
              type="button"
              disabled={!verifyUrl}
              onClick={() => verifyUrl && (window.location.href = verifyUrl)}
              className="flex items-center justify-center gap-2 py-4 font-mono text-[9px] tracking-widest uppercase text-background/60 transition-colors hover:bg-background/5 hover:text-background disabled:opacity-30"
            >
              <ShieldCheck size={11} />
              Verify
            </button>
          </div>
        </motion.div>

        {/* ── Details panel ──────────────────────────────── */}
        <motion.div
          className="flex flex-col gap-0 border border-border/40"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
        >
          <div className="border-b border-border/30 px-5 py-4">
            <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Сводка</p>
          </div>

          <div className="flex flex-col gap-0">
            <InfoRow label="Статус">
              <StatusPill status={(diploma?.status ?? 'pending') as Parameters<typeof StatusPill>[0]['status']} />
            </InfoRow>
            <InfoRow label="Владелец">
              <span className="text-sm text-foreground">{diploma?.ownerNameMask ?? '—'}</span>
            </InfoRow>
            <InfoRow label="Специальность">
              <span className="text-sm text-foreground">{diploma?.programName ?? '—'}</span>
            </InfoRow>
            <InfoRow label="Verification token">
              <span className="font-mono text-[10px] text-muted-foreground/60 break-all">
                {diploma?.verificationToken ?? '—'}
              </span>
            </InfoRow>
            <InfoRow label="External ID">
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {studentExternalId || '—'}
              </span>
            </InfoRow>
          </div>

          {shareLink && (
            <div className="border-t border-border/30 p-5 flex flex-col gap-2">
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Активная ссылка</p>
              <div className="flex items-start justify-between gap-2">
                <p className="break-all font-mono text-[10px] text-muted-foreground/60">{shareLink.shareUrl}</p>
                <a
                  href={shareLink.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="border-t border-red-500/20 p-5">
              <p className="font-mono text-[10px] text-red-400/80">{error}</p>
            </div>
          )}

          {verifyUrl && (
            <div className="border-t border-border/30 p-5">
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={verifyUrl}>
                  Открыть страницу верификации
                  <ExternalLink size={10} />
                </a>
              </Button>
            </div>
          )}
        </motion.div>

        {/* ── Backend status ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease }}
        >
          <BackendStatusPanel />
        </motion.div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/20 px-5 py-3.5 last:border-0">
      <span className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground/40 uppercase flex-shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
