import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

import { BackendStatusPanel } from '@/components/backend-status-panel'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import {
  createUniversityImport,
  getImportErrors,
  listUniversities,
  listUniversityDiplomas,
  listUniversityImportJobs,
  revokeUniversityDiploma,
  type ImportJobError,
  type ImportJob,
  type RegistryDiploma,
  type University,
} from '@/lib/api'
import { cn } from '@/lib/utils'

const diplomaPageSize = 20
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

const jobStatusIcon: Record<ImportJob['status'], React.ReactNode> = {
  pending:          <Clock size={11} className="text-muted-foreground/40 animate-pulse" />,
  processing:       <Loader2 size={11} className="animate-spin text-blue-400" />,
  completed:        <CheckCircle2 size={11} className="text-green-400" />,
  partially_failed: <CheckCircle2 size={11} className="text-amber-400" />,
  failed:           <XCircle size={11} className="text-red-400" />,
}

export function UniversityPage() {
  const auth = useAuth()
  const [universities, setUniversities]         = useState<University[]>([])
  const [selectedUniversityId, setSelectedUni]  = useState('')
  const [importJobs, setImportJobs]             = useState<ImportJob[]>([])
  const [selectedJobId, setSelectedJobId]       = useState('')
  const [jobErrors, setJobErrors]               = useState<ImportJobError[]>([])
  const [diplomas, setDiplomas]                 = useState<RegistryDiploma[]>([])
  const [diplomaPage, setDiplomaPage]           = useState(1)
  const [diplomaTotal, setDiplomaTotal]         = useState(0)
  const [selectedFile, setSelectedFile]         = useState<File | null>(null)
  const [loading, setLoading]                   = useState(true)
  const [diplomasLoading, setDiplomasLoading]   = useState(true)
  const [submitting, setSubmitting]             = useState(false)
  const [error, setError]                       = useState<string | null>(null)

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.user) return
    void (async () => {
      try {
        const items = await listUniversities()
        setUniversities(items)
        setSelectedUni((cur) => cur || auth.user?.universityId || items[0]?.id || '')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      }
    })()
  }, [auth.status, auth.user])

  useEffect(() => {
    if (!selectedUniversityId) return
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const jobs = await listUniversityImportJobs(selectedUniversityId)
        setImportJobs(jobs)
        setSelectedJobId((cur) => {
          if (cur && jobs.some((j) => j.id === cur)) return cur
          return jobs.find((j) => j.failedRows > 0)?.id ?? jobs[0]?.id ?? ''
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки импортов')
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedUniversityId])

  useEffect(() => {
    if (!selectedUniversityId) return
    setDiplomasLoading(true)
    setError(null)
    void (async () => {
      try {
        const res = await listUniversityDiplomas({
          page: diplomaPage,
          universityId: auth.hasAnyRole('super_admin') ? selectedUniversityId : undefined,
        })
        setDiplomas(res.items)
        setDiplomaTotal(res.total)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки дипломов')
      } finally {
        setDiplomasLoading(false)
      }
    })()
  }, [auth, diplomaPage, selectedUniversityId])

  useEffect(() => {
    const job = importJobs.find((j) => j.id === selectedJobId)
    if (!selectedJobId || !job || job.failedRows === 0) { setJobErrors([]); return }
    void getImportErrors(selectedJobId)
      .then(setJobErrors)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки ошибок'))
  }, [importJobs, selectedJobId])

  const readyCount = useMemo(
    () => importJobs.filter((j) => j.status === 'completed' || j.status === 'partially_failed').length,
    [importJobs],
  )
  const needsReview = useMemo(() => importJobs.filter((j) => j.failedRows > 0).length, [importJobs])
  const totalPages  = useMemo(() => Math.max(1, Math.ceil(diplomaTotal / diplomaPageSize)), [diplomaTotal])

  async function handleUpload() {
    if (!selectedUniversityId || !selectedFile) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createUniversityImport(selectedUniversityId, selectedFile)
      setImportJobs((cur) => [created, ...cur])
      setSelectedJobId(created.id)
      setJobErrors([])
      setSelectedFile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки файла')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(diplomaId: string) {
    if (!selectedUniversityId) return
    setError(null)
    try {
      await revokeUniversityDiploma(diplomaId, 'Revoked by university operator')
      setDiplomas((cur) => cur.map((d) => (d.id === diplomaId ? { ...d, status: 'revoked' } : d)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка аннулирования')
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
        <p className="mb-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Кабинет ВУЗа</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight">РЕЕСТР<br />ДИПЛОМОВ</h1>
          {/* University selector */}
          {auth.hasAnyRole('super_admin') && universities.length > 0 && (
            <select
              value={selectedUniversityId}
              onChange={(e) => { setSelectedUni(e.target.value); setDiplomaPage(1) }}
              className="h-9 border-0 border-b border-border/40 bg-transparent px-0 font-mono text-[10px] tracking-widest uppercase text-muted-foreground focus:outline-none"
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle size={12} className="text-red-400" />
          <p className="font-mono text-[10px] text-red-400/80">{error}</p>
        </div>
      )}

      {/* ── Top row: metrics + upload ───────────────────────── */}
      <motion.div
        className="grid gap-0 border border-border/40 lg:grid-cols-[1fr_1fr_1fr_300px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
      >
        <StatBlock label="Загрузок завершено" value={String(readyCount)} />
        <StatBlock label="Требуют ревью"      value={String(needsReview)} border />
        <StatBlock label="Дипломов всего"     value={String(diplomaTotal)} border />

        {/* Upload */}
        <div className="flex flex-col gap-4 border-t border-border/40 p-5 lg:border-l lg:border-t-0">
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Загрузка CSV</p>
          <Input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <Button
            onClick={() => void handleUpload()}
            disabled={!selectedFile || !selectedUniversityId || submitting}
            size="sm"
            className="w-full"
          >
            {submitting ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            {submitting ? 'Загружаем...' : 'Загрузить реестр'}
          </Button>
          {selectedFile && (
            <p className="font-mono text-[9px] text-muted-foreground/40 truncate">{selectedFile.name}</p>
          )}
        </div>
      </motion.div>

      {/* ── Import timeline ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease }}
      >
        <p className="mb-4 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Импорты</p>
        <div className="border border-border/40">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_100px] border-b border-border/30 bg-muted/10">
            {['ID импорта', 'Строк', 'Обработано', 'Ошибок', 'Статус'].map((h) => (
              <div key={h} className="px-4 py-2.5 font-mono text-[9px] tracking-[0.16em] text-muted-foreground/30 uppercase">
                {h}
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={14} className="animate-spin text-muted-foreground/20" />
            </div>
          )}

          {!loading && importJobs.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/25 uppercase">
                Импортов пока нет
              </p>
            </div>
          )}

          {importJobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJobId(job.id)}
              className={cn(
                'grid w-full grid-cols-[1fr_80px_80px_80px_100px] border-b border-border/20 text-left transition-colors last:border-0 hover:bg-foreground/3',
                selectedJobId === job.id && 'bg-foreground/5',
              )}
            >
              <div className="flex items-center gap-2 px-4 py-3">
                {jobStatusIcon[job.status]}
                <span className="font-mono text-[10px] text-muted-foreground/70 truncate">{job.id}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="font-mono text-[11px] text-muted-foreground/60">{job.totalRows ?? '—'}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="font-mono text-[11px] text-muted-foreground/60">{job.processedRows}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className={cn('font-mono text-[11px]', job.failedRows > 0 ? 'text-red-400' : 'text-muted-foreground/40')}>
                  {job.failedRows}
                </span>
              </div>
              <div className="flex items-center px-4 py-3">
                <StatusPill status={job.status === 'completed' ? 'ready' : job.status} />
              </div>
            </button>
          ))}
        </div>

        {/* Import errors */}
        {jobErrors.length > 0 && (
          <div className="mt-4 border border-red-500/15 bg-red-500/3">
            <div className="border-b border-red-500/10 px-4 py-2.5">
              <p className="font-mono text-[9px] tracking-[0.16em] text-red-400/60 uppercase">
                — Ошибки строк ({jobErrors.length})
              </p>
            </div>
            <div className="flex flex-col gap-0">
              {jobErrors.map((err) => (
                <div key={err.id} className="flex items-start gap-3 border-b border-red-500/10 px-4 py-3 last:border-0">
                  <span className="flex-shrink-0 font-mono text-[9px] text-red-400/50">#{err.rowNumber}</span>
                  <div>
                    <span className="font-mono text-[9px] tracking-wide text-red-400/60 uppercase">{err.code}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground/50">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Diploma list ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">
            — Дипломы · стр. {diplomaPage} / {totalPages} · {diplomaTotal} записей
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => setDiplomaPage((p) => Math.max(1, p - 1))}
              disabled={diplomaPage <= 1 || diplomasLoading}
            >
              ← Назад
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => setDiplomaPage((p) => Math.min(totalPages, p + 1))}
              disabled={diplomaPage >= totalPages || diplomasLoading}
            >
              Вперёд →
            </Button>
          </div>
        </div>

        <div className="border border-border/40">
          {/* Header */}
          <div className="grid grid-cols-[1fr_140px_1fr_100px_120px] border-b border-border/30 bg-muted/10">
            {['Университет · Номер', 'Владелец', 'Специальность', 'Статус', ''].map((h) => (
              <div key={h} className="px-4 py-2.5 font-mono text-[9px] tracking-[0.16em] text-muted-foreground/30 uppercase">
                {h}
              </div>
            ))}
          </div>

          {diplomasLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={14} className="animate-spin text-muted-foreground/20" />
            </div>
          )}

          {!diplomasLoading && diplomas.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/25 uppercase">
                Дипломы не найдены
              </p>
            </div>
          )}

          {diplomas.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[1fr_140px_1fr_100px_120px] border-b border-border/20 transition-colors last:border-0 hover:bg-foreground/3 group"
            >
              <div className="flex flex-col justify-center px-4 py-3">
                <span className="font-mono text-[10px] text-muted-foreground/60">{d.universityCode}</span>
                <span className="font-mono text-[11px] text-foreground/80">{d.diplomaNumber}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="text-sm text-muted-foreground/70 truncate">{d.ownerNameMask}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="text-xs text-muted-foreground/50 truncate">{d.programName}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <StatusPill status={d.status as Parameters<typeof StatusPill>[0]['status']} />
              </div>
              <div className="flex items-center justify-end px-4 py-3 opacity-0 transition-opacity group-hover:opacity-100">
                {d.status !== 'revoked' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive/60 hover:text-destructive"
                    onClick={() => void handleRevoke(d.id)}
                  >
                    <AlertTriangle size={10} />
                    Отозвать
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Backend panel ───────────────────────────────────── */}
      <motion.div
        className="max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease }}
      >
        <BackendStatusPanel />
      </motion.div>

    </div>
  )
}

function StatBlock({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-2 p-5', border && 'border-l border-border/40')}>
      <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— {label}</p>
      <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  )
}
