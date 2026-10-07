import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Tabs from '../components/ui/Tabs.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'
import { LEVELS, CYCLES, getLevelsByCycle } from '../data/levels.js'
import { SUBJECTS } from '../data/subjects.js'
import { getCourses } from '../lib/contentLoader.js'
import { useUser } from '../context/UserContext.jsx'

export default function Explore() {
  const { user } = useUser()
  const [levelId, setLevelId] = useState(user?.levelId || LEVELS[0].id)
  const currentCycle = LEVELS.find((l) => l.id === levelId)?.cycle

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold">Explorer</h1>
        <p className="text-ink-mute dark:text-slate-400 text-xs mt-0.5">
          Tous les cours par matière et niveau.
        </p>
      </header>

      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 scrollbar-none">
          {CYCLES.map((c) => {
            const active = currentCycle === c.id
            return (
              <button
                key={c.id}
                onClick={() => setLevelId(getLevelsByCycle(c.id)[0].id)}
                className={`shrink-0 px-2.5 h-7 rounded-lg text-[11px] font-display font-bold uppercase tracking-wider transition-all ${
                  active
                    ? `text-white bg-gradient-to-br ${c.color}`
                    : 'bg-black/5 dark:bg-white/5 text-ink-mute'
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-none">
          <Tabs
            value={levelId}
            onChange={setLevelId}
            tabs={getLevelsByCycle(currentCycle).map((l) => ({ value: l.id, label: l.short }))}
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-5">
        {SUBJECTS.map((s) => {
          const courses = getCourses({ subjectId: s.id, levelId })
          if (courses.length === 0) return null
          const Icon = s.icon
          return (
            <section key={s.id}>
              <header className="flex items-center gap-2 mb-2.5">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center text-white`}
                >
                  <Icon size={16} />
                </div>
                <h2 className="font-display text-base font-bold">{s.name}</h2>
              </header>
              <div className="grid gap-2.5">
                {courses.map((c) => (
                  <Link key={c.id} to={`/course/${c.id}`}>
                    <Card className="hover:border-brand/30 transition-colors">
                      <CardBody className="flex items-center gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-semibold text-sm truncate">{c.title}</div>
                          <div className="text-[11px] text-ink-mute dark:text-slate-400 truncate">
                            {c.questionCount} questions · {c.estimatedMinutes} min
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-ink-mute" />
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
        {SUBJECTS.every((s) => getCourses({ subjectId: s.id, levelId }).length === 0) && (
          <Card>
            <CardBody className="p-4">
              <p className="text-xs text-ink-mute dark:text-slate-400">
                Aucun cours pour ce niveau pour le moment. Ajoute des fichiers JSON dans{' '}
                <code className="font-mono text-brand">src/data/courses/</code>.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
