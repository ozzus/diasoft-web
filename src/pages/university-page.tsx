import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, CheckCircle2, Clock, FileSpreadsheet, Loader2, Upload, XCircle } from 'lucide-react'

import { BackendStatusPanel } from '@/components/backend-status-panel'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUniversityImport, getImportErrors, getImportStatus, listUniversityDiplomas, revokeUniversityDiploma, type ImportJob, type ImportJobError, type UniversityDiploma } from '@/lib/api'

const diplomaPageSize = 20
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

const jobStatusIcon: Record<ImportJob['status'], React.ReactNode> = {
  pending: <Clock size={11} className="text-muted-foreground/40 animate-pulse" />,
  processing: <Loader2 size={11} className="animate-spin text-blue-400" />,
  completed: <CheckCircle2 size={11} className="text-green-400" />,
  partially_failed: <CheckCircle2 size={11} className="text-amber-400" />,
  failed: <XCircle size={11} className="text-red-400" />,
}

export function UniversityPage() {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jobErrors, setJobErrors] = useState<ImportJobError[]>([])
  const [diplomas, setDiplomas] = useState<UniversityDiploma[]>([])
  const [diplomaPage, setDiplomaPage] = useState(1)
  const [diplomaTotal, setDiplomaTotal] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [diplomasLoading, setDiplomasLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDiplomasLoading(true)
    setError(null)
    void listUniversityDiplomas(diplomaPage)
      .then((response) => {
        setDiplomas(response.items)
        setDiplomaTotal(response.total)
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки дипломов'))
      .finally(() => setDiplomasLoading(false))
  }, [diplomaPage])

  useEffect(() => {
    const pendingJobs = importJobs.filter((job) => job.status === 'pending' || job.status === 'processing')
    if (pendingJobs.length === 0) {
      return
    }

    const timer = window.setInterval(() => {
      void Promise.all(pendingJobs.map((job) => getImportStatus(job.jobId)))
        .then((updated) => {
          setImportJobs((current) =>
            current.map((job) => updated.find((candidate) => candidate.jobId === job.jobId) ?? job),
          )
        })
        .catch(() => {
          // keep previous timeline state; the explicit upload flow shows errors separately
        })
    }, 4000)

    return () => window.clearInterval(timer)
  }, [importJobs])

  useEffect(() => {
    const job = importJobs.find((item) => item.jobId === selectedJobId)
    if (!job || job.failed === 0) {
      setJobErrors([])
      return
    }

    void getImportErrors(job.jobId)
      .then((response) => setJobErrors(response.errors))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки ошибок'))
  }, [importJobs, selectedJobId])

  const readyCount = useMemo(
    () => importJobs.filter((job) => job.status === 'completed' || job.status === 'partially_failed').length,
    [importJobs],
  )
  const needsReview = useMemo(() => importJobs.filter((job) => job.failed > 0).length, [importJobs])
  const totalPages = useMemo(() => Math.max(1, Math.ceil(diplomaTotal / diplomaPageSize)), [diplomaTotal])

  async function handleUpload() {
    if (!selectedFile) return
    setSubmitting(true)
    setError(null)

    try {
      const accepted = await createUniversityImport(selectedFile)
      const initialStatus = await getImportStatus(accepted.jobId)
      setImportJobs((current) => [initialStatus, ...current])
      setSelectedJobId(initialStatus.jobId)
      setJobErrors([])
      setSelectedFile(null)
      setDiplomaPage(1)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Ошибка загрузки файла')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(diplomaId: string) {
    setError(null)
    try {
      const updated = await revokeUniversityDiploma(diplomaId, 'Аннулировано оператором ВУЗа')
      setDiplomas((current) => current.map((item) => (item.id === diplomaId ? updated : item)))
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Ошибка аннулирования')
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
        <p className="mb-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Кабинет ВУЗа</p>
        <h1 className="text-3xl font-black tracking-tight">РЕЕСТР ДИПЛОМОВ</h1>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle size={12} className="text-red-400" />
          <p className="font-mono text-[10px] text-red-400/80">{error}</p>
        </div>
      )}

      <motion.div
        className="grid gap-0 border border-border/40 lg:grid-cols-[1fr_1fr_1fr_300px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
      >
        <StatBlock label="Загрузок завершено" value={String(readyCount)} />
        <StatBlock label="Требуют проверки" value={String(needsReview)} border />
        <StatBlock label="Дипломов всего" value={String(diplomaTotal)} border />

        <div className="flex flex-col gap-4 border-t border-border/40 p-5 lg:border-l lg:border-t-0">
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Загрузка CSV / XLSX</p>
          <Input
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <Button onClick={() => void handleUpload()} disabled={!selectedFile || submitting} size="sm" className="w-full">
            {submitting ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            {submitting ? 'Загружаем...' : 'Загрузить реестр'}
          </Button>
          {selectedFile && <p className="font-mono text-[9px] text-muted-foreground/40 truncate">{selectedFile.name}</p>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease }}>
        <p className="mb-4 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Импорты</p>
        <div className="border border-border/40">
          <div className="grid grid-cols-[1fr_80px_80px_80px_100px] border-b border-border/30 bg-muted/10">
            {['ID импорта', 'Всего', 'Импорт', 'Ошибок', 'Статус'].map((header) => (
              <div key={header} className="px-4 py-2.5 font-mono text-[9px] tracking-[0.16em] text-muted-foreground/30 uppercase">
                {header}
              </div>
            ))}
          </div>

          {importJobs.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/25 uppercase">Импортов пока нет</p>
            </div>
          )}

          {importJobs.map((job) => (
            <button
              key={job.jobId}
              type="button"
              onClick={() => setSelectedJobId(job.jobId)}
              className={`grid w-full grid-cols-[1fr_80px_80px_80px_100px] border-b border-border/20 text-left transition-colors last:border-0 hover:bg-foreground/3 ${
                selectedJobId === job.jobId ? 'bg-foreground/5' : ''
              }`}
            >
              <div className="flex items-center gap-2 px-4 py-3">
                {jobStatusIcon[job.status]}
                <span className="font-mono text-[10px] text-muted-foreground/70 truncate">{job.jobId}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="font-mono text-[11px] text-muted-foreground/60">{job.total ?? '—'}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="font-mono text-[11px] text-muted-foreground/60">{job.imported}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className={`font-mono text-[11px] ${job.failed > 0 ? 'text-red-400' : 'text-muted-foreground/40'}`}>{job.failed}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <StatusPill status={job.status === 'completed' ? 'ready' : job.status} />
              </div>
            </button>
          ))}
        </div>

        {jobErrors.length > 0 && (
          <div className="mt-4 border border-red-500/15 bg-red-500/3">
            <div className="border-b border-red-500/10 px-4 py-2.5">
              <p className="font-mono text-[9px] tracking-[0.16em] text-red-400/60 uppercase">— Ошибки строк ({jobErrors.length})</p>
            </div>
            <div className="flex flex-col gap-0">
              {jobErrors.map((item) => (
                <div key={`${item.row}-${item.message}`} className="flex items-start gap-3 border-b border-red-500/10 px-4 py-3 last:border-0">
                  <span className="flex-shrink-0 font-mono text-[9px] text-red-400/50">#{item.row}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground/50">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">
            — Дипломы · стр. {diplomaPage} / {totalPages} · {diplomaTotal} записей
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDiplomaPage((page) => Math.max(1, page - 1))} disabled={diplomaPage <= 1 || diplomasLoading}>
              ← Назад
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDiplomaPage((page) => Math.min(totalPages, page + 1))} disabled={diplomaPage >= totalPages || diplomasLoading}>
              Дальше →
            </Button>
          </div>
        </div>

        <div className="border border-border/40">
          <div className="grid grid-cols-[160px_1fr_160px_120px_120px] border-b border-border/30 bg-muted/10">
            {['Номер', 'Владелец и программа', 'Год', 'Статус', 'Действие'].map((header) => (
              <div key={header} className="px-4 py-2.5 font-mono text-[9px] tracking-[0.16em] text-muted-foreground/30 uppercase">
                {header}
              </div>
            ))}
          </div>

          {diplomasLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={14} className="animate-spin text-muted-foreground/20" />
            </div>
          )}

          {!diplomasLoading && diplomas.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/25 uppercase">Дипломов пока нет</p>
            </div>
          )}

          {diplomas.map((diploma) => (
            <div key={diploma.id} className="grid grid-cols-[160px_1fr_160px_120px_120px] border-b border-border/20 last:border-0">
              <div className="px-4 py-3">
                <span className="font-mono text-[10px] text-muted-foreground/70">{diploma.diplomaNumber}</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{diploma.ownerNameMask}</p>
                <p className="mt-1 text-xs text-muted-foreground/60">{diploma.program}</p>
              </div>
              <div className="px-4 py-3">
                <span className="font-mono text-[10px] text-muted-foreground/60">{diploma.graduationYear ?? '—'}</span>
              </div>
              <div className="px-4 py-3">
                <StatusPill status={diploma.status === 'active' ? 'ready' : diploma.status} />
              </div>
              <div className="px-4 py-3">
                <Button variant="ghost" size="sm" disabled={diploma.status !== 'active'} onClick={() => void handleRevoke(diploma.id)}>
                  Отозвать
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25, ease }}>
        <BackendStatusPanel />
      </motion.div>
    </div>
  )
}

function StatBlock({ label, value, border = false }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 px-6 py-5 ${border ? 'border-t border-border/40 lg:border-l lg:border-t-0' : ''}`}>
      <p className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{value}</p>
      <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground/40 uppercase">{label}</p>
    </div>
  )
}
