import { ArrowLeft, BookOpen, Clock, ListChecks, Play, Zap } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import MathText from '../components/ui/MathText.jsx'
import MarkdownRenderer from '../components/ui/MarkdownRenderer.jsx'
import { getCourseById } from '../lib/contentLoader.js'
import { getSubject } from '../data/subjects.js'
import { getLevel } from '../data/levels.js'

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = getCourseById(courseId)

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-mute">Cours introuvable.</p>
        <Link to="/explore" className="text-brand font-semibold">
          Retour
        </Link>
      </div>
    )
  }

  const subject = getSubject(course.subjectId)
  const level = getLevel(course.levelId)
  const Icon = subject?.icon

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-ink-mute">
        <ArrowLeft size={16} /> Retour
      </button>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${subject?.color} grid place-items-center text-white`}
            >
              {Icon && <Icon size={22} />}
            </div>
            <div>
              <div className="text-xs text-ink-mute dark:text-slate-400">
                {subject?.name} · {level?.name}
              </div>
              <h1 className="font-display text-2xl font-bold">{course.title}</h1>
            </div>
          </div>
          <p className="text-ink-soft dark:text-slate-300"><MathText>{course.summary}</MathText></p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">
              <ListChecks size={12} /> {course.questionCount} questions
            </Badge>
            <Badge tone="slate">
              <Clock size={12} /> {course.estimatedMinutes} min
            </Badge>
            {course.tags?.map((t) => (
              <Badge key={t} tone="brand">
                #{t}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-2 text-ink-mute dark:text-slate-400">
            <BookOpen size={16} />
            <h2 className="font-display font-bold text-sm uppercase tracking-wide">Leçon</h2>
          </div>
          <div className="text-ink-soft dark:text-slate-300 leading-relaxed">
            <MarkdownRenderer content={course.lesson} />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate(`/quiz/${course.id}`)} size="lg" className="h-16">
          <Play size={18} /> Démarrer
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-16"
          onClick={() => navigate(`/quiz/${course.id}?mode=challenge`)}
        >
          <Zap size={18} /> Mode défi
        </Button>
      </div>
    </div>
  )
}
