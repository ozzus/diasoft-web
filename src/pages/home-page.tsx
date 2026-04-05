import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Building2, GraduationCap, UserRoundSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackendStatusPanel } from '@/components/backend-status-panel'
import { useAuth } from '@/lib/auth'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

const surfaces = [
  {
    label: '01',
    title: 'Кабинет ВУЗа',
    desc: 'Загрузка реестров, контроль импортов, аннулирование записей.',
    to: '/university',
    icon: Building2,
  },
  {
    label: '02',
    title: 'Кабинет студента',
    desc: 'Статус диплома, QR-подтверждение, ссылка для работодателя.',
    to: '/student',
    icon: GraduationCap,
  },
  {
    label: '03',
    title: 'Проверка HR',
    desc: 'Верификация по номеру диплома без раскрытия лишних ПДн.',
    to: '/hr',
    icon: UserRoundSearch,
  },
]

const stats = [
  { value: '412 980', label: 'Дипломов в реестре' },
  { value: '2 148',   label: 'Проверок сегодня' },
  { value: '18с',     label: 'P95 распространения' },
]

export function HomePage() {
  const auth = useAuth()

  return (
    <div className="flex flex-col gap-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-8">
        <motion.p
          className="mb-4 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          — Платформа верификации
        </motion.p>
        <div className="overflow-hidden">
          <motion.h1
            className="text-[clamp(2.8rem,8vw,7rem)] font-black leading-[0.9] tracking-tight text-foreground"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            ПРОВЕРКА
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="text-[clamp(2.8rem,8vw,7rem)] font-black leading-[0.9] tracking-tight text-foreground/30"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.06, ease }}
          >
            ДИПЛОМОВ
          </motion.h1>
        </div>

        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
        >
          <Button asChild size="lg">
            <Link to="/hr">
              Проверить диплом
              <ArrowRight size={14} />
            </Link>
          </Button>
          {auth.status !== 'authenticated' && (
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Войти в кабинет</Link>
            </Button>
          )}
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <motion.section
        className="grid grid-cols-3 gap-0 border border-border/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease }}
      >
        {stats.map(({ value, label }, i) => (
          <div key={label} className={`flex flex-col gap-1.5 px-6 py-5 ${i < 2 ? 'border-r border-border/40' : ''}`}>
            <p className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{value}</p>
            <p className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground/40 uppercase">{label}</p>
          </div>
        ))}
      </motion.section>

      {/* ── Surfaces ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease }}
      >
        <p className="mb-6 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase">— Разделы</p>
        <div className="grid gap-0 border border-border/40 lg:grid-cols-3">
          {surfaces.map(({ label, title, desc, to, icon: Icon }, i) => (
            <Link
              key={to}
              to={to}
              className={`group flex flex-col gap-5 p-6 transition-colors hover:bg-foreground/3 ${
                i < 2 ? 'border-b border-border/40 lg:border-b-0 lg:border-r' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/30 uppercase">{label}</span>
                <Icon size={14} className="text-muted-foreground/20 transition-colors group-hover:text-muted-foreground/50" />
              </div>
              <div>
                <p className="mb-2 text-base font-bold tracking-tight text-foreground">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground/60">{desc}</p>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-muted-foreground/30 uppercase transition-colors group-hover:text-muted-foreground/60">
                Открыть <ArrowRight size={10} />
              </span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── Backend status ───────────────────────────────────── */}
      <motion.section
        className="max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease }}
      >
        <BackendStatusPanel />
      </motion.section>

    </div>
  )
}
