import { useState } from 'react'
import { ChevronDown, ChevronUp, Flag } from 'lucide-react'
import { Card, CardBody } from '../ui/Card.jsx'
import { supabase } from '../../lib/supabase.js'

export default function ReportsSection({ reports = [], session }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!reports || reports.length === 0) return null

  const handleSend = async () => {
    setSending(true)
    try {
      if (supabase && session?.user) {
        const rows = reports.map((r) => ({
          user_id: session.user.id,
          question_id: r.questionId,
          subject_id: r.subjectId,
          level_id: r.levelId,
          question_json: r.question ? JSON.stringify(r.question) : null,
        }))
        await supabase.from('question_reports').insert(rows)
      }
      setSent(true)
    } catch (err) {
      console.error('Report send failed', err)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="border-amber-400/30">
      <CardBody className="space-y-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-amber-500" />
            <span className="font-display font-semibold text-sm">
              {reports.length} question{reports.length > 1 ? 's' : ''} signalée{reports.length > 1 ? 's' : ''}
            </span>
          </div>
          {open ? <ChevronUp size={14} className="text-ink-mute" /> : <ChevronDown size={14} className="text-ink-mute" />}
        </button>

        {open && (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.questionId} className="bg-amber-500/8 dark:bg-amber-500/10 rounded-xl px-3 py-2">
                <p className="text-xs font-mono text-ink-mute dark:text-slate-400 mb-0.5">{r.questionId}</p>
                <p className="text-sm font-display font-medium">{r.question?.prompt ?? '—'}</p>
              </div>
            ))}

            {!sent ? (
              <button
                className="w-full py-2.5 rounded-xl border-2 border-amber-400/50 text-amber-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors disabled:opacity-50"
                onClick={handleSend}
                disabled={sending}
              >
                <Flag size={14} />
                {sending ? 'Envoi…' : 'Confirmer le signalement'}
              </button>
            ) : (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Signalement envoyé, merci !
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
