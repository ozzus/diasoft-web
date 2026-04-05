import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ExternalLink, Loader2, Share2, ShieldCheck } from 'lucide-react'
import QRCode from 'qrcode'

import { BackendStatusPanel } from '@/components/backend-status-panel'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { createStudentShareLink, getStudentDiploma, revokeStudentShareLink, type ShareLink, type StudentDiploma } from '@/lib/api'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

export function StudentPage() {
  const auth = useAuth()
  const [diploma, setDiploma] = useState<StudentDiploma | null>(null)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [qrCodeSrc, setQrCodeSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    void getStudentDiploma()
      .then(setDiploma)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки диплома'))
      .finally(() => setLoading(false))
  }, [])

  const verifyUrl = useMemo(() => {
    if (!diploma?.verificationToken) return null
    return `${window.location.origin}/v/${encodeURIComponent(diploma.verificationToken)}`
  }, [diploma])

  useEffect(() => {
    if (!verifyUrl) {
      setQrCodeSrc(null)
      return
    }

    void QRCode.toDataURL(verifyUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrCodeSrc)
      .catch(() => setQrCodeSrc(null))
  }, [verifyUrl])

  async function handleShareCreate() {
    setShareLoading(true)
    setError(null)
    try {
      setShareLink(await createStudentShareLink())
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Ошибка создания ссылки')
    } finally {
      setShareLoading(false)
    }
  }

  async function handleShareRevoke() {
    if (!shareLink) return
    setShareLoading(true)
    setError(null)
    try {
      await revokeStudentShareLink(shareLink.shareToken)
      setShareLink(null)
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Ошибка удаления ссылки')
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <motion.div
        className="border-b border-border/30 pb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <p className="mb-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Кабинет студента</p>
        <h1 className="text-3xl font-black tracking-tight">МОЙ ДИПЛОМ</h1>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr_220px]">
        <motion.div
          className="flex flex-col gap-0 bg-foreground text-background"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          <div className="border-b border-background/10 px-5 py-4">
            <p className="font-mono text-[9px] tracking-[0.2em] text-background/40 uppercase">— Документ</p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-10">
            <div className="flex h-36 w-36 items-center justify-center border border-background/10 bg-white p-2">
              {qrCodeSrc ? (
                <img src={qrCodeSrc} alt="QR-код диплома" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-background/5 text-background/40">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              )}
            </div>
            {loading && (
              <p className="font-mono text-[9px] tracking-[0.2em] text-background/30 uppercase animate-pulse">Загрузка...</p>
            )}
          </div>

          {diploma && (
            <div className="border-t border-background/10 px-5 py-4 flex flex-col gap-1">
              <p className="text-sm font-bold tracking-tight">{auth.user?.name ?? 'Студент'}</p>
              <p className="font-mono text-[10px] text-background/50">{diploma.program}</p>
              <p className="font-mono text-[10px] text-background/40">{diploma.diplomaNumber}</p>
            </div>
          )}

          <div className="grid grid-cols-2 border-t border-background/10">
            <button
              type="button"
              onClick={() => void handleShareCreate()}
              disabled={!diploma || shareLoading}
              className="flex items-center justify-center gap-2 border-r border-background/10 py-4 font-mono text-[9px] tracking-widest uppercase text-background/60 transition-colors hover:bg-background/5 hover:text-background disabled:opacity-30"
            >
              {shareLoading ? <Loader2 size={11} className="animate-spin" /> : <Share2 size={11} />}
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
            <InfoRow label="Номер диплома">
              <span className="text-sm text-foreground">{diploma?.diplomaNumber ?? '—'}</span>
            </InfoRow>
            <InfoRow label="ВУЗ">
              <span className="text-sm text-foreground">{diploma?.universityCode ?? '—'}</span>
            </InfoRow>
            <InfoRow label="Специальность">
              <span className="text-sm text-foreground">{diploma?.program ?? '—'}</span>
            </InfoRow>
            <InfoRow label="Год выпуска">
              <span className="text-sm text-foreground">{diploma?.graduationYear ?? '—'}</span>
            </InfoRow>
            <InfoRow label="Токен проверки">
              <span className="font-mono text-[10px] text-muted-foreground/60 break-all">{diploma?.verificationToken ?? '—'}</span>
            </InfoRow>
          </div>

          {shareLink && (
            <div className="border-t border-border/30 p-5 flex flex-col gap-3">
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Активная ссылка</p>
              <div className="flex items-start justify-between gap-2">
                <p className="break-all font-mono text-[10px] text-muted-foreground/60">{shareLink.shareUrl}</p>
                <a href={shareLink.shareUrl} target="_blank" rel="noreferrer" className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <a href={shareLink.shareUrl} target="_blank" rel="noreferrer">
                    Открыть
                    <ExternalLink size={10} />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => void handleShareRevoke()} disabled={shareLoading}>
                  Удалить
                </Button>
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
                  Открыть страницу проверки
                  <ExternalLink size={10} />
                </a>
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25, ease }}>
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
