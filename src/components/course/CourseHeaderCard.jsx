import React from 'react'
import { Clock, ListChecks, ArrowLeft } from 'lucide-react'
import { Card, CardBody } from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import MathText from '../ui/MathText.jsx'

/**
 * En-tête héroïque du cours : matière, niveau, titre, temps estimé et résumé.
 */
export default function CourseHeaderCard({ course, subject, level, questionsCount, onBack }) {
  const Icon = subject?.icon

  return (
    <div className="space-y-3">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors py-1"
        >
          <ArrowLeft size={15} />
          <span>Retour aux cours</span>
        </button>
      )}

      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardBody className="space-y-3.5 p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${subject?.color || 'from-brand to-brand-dark'} grid place-items-center text-white shrink-0 shadow-md shadow-brand/10`}
            >
              {Icon && <Icon size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-brand font-black">{subject?.name}</span>
                <span>·</span>
                <span>{level?.name}</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                <MathText>{course.title}</MathText>
              </h1>
            </div>
          </div>

          {course.summary && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-l-4 border-brand text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              <MathText>{course.summary}</MathText>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <Badge tone="slate">
              <ListChecks size={13} className="text-brand" />
              <span className="tabular-nums font-bold">{questionsCount}</span> question{questionsCount > 1 ? 's' : ''}
            </Badge>
            <Badge tone="slate">
              <Clock size={13} className="text-amber-500" />
              <span className="tabular-nums font-bold">{course.estimatedMinutes || 10}</span> min
            </Badge>
            {course.tags?.map((tag) => (
              <Badge key={tag} tone="brand">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
