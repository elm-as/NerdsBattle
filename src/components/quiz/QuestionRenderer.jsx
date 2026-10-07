import { Check, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import MathText from '../ui/MathText.jsx'

// Rend une question selon son `type` et appelle onSubmit(answer)
export default function QuestionRenderer({ question, locked, userAnswer, onChange, onSubmit }) {
  switch (question.type) {
    case 'mcq':
      return <MCQ question={question} locked={locked} value={userAnswer} onChange={onChange} />
    case 'truefalse':
      return <TrueFalse question={question} locked={locked} value={userAnswer} onChange={onChange} />
    case 'fill':
      return <Fill question={question} locked={locked} value={userAnswer} onChange={onChange} onSubmit={onSubmit} />
    default:
      return <p className="text-rose-500">Type de question inconnu : {question.type}</p>
  }
}

function optionState(locked, isSelected, isCorrect) {
  if (!locked) {
    return isSelected
      ? 'border-brand bg-brand/8 dark:bg-brand-dark/15 scale-[1.01]'
      : 'border-black/10 dark:border-white/10 hover:border-brand/50 hover:scale-[1.005]'
  }
  if (isCorrect) return 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (isSelected && !isCorrect) return 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
  return 'border-black/5 dark:border-white/5 opacity-40'
}

function MCQ({ question, locked, value, onChange }) {
  return (
    <div className="space-y-2.5">
      {question.options.map((opt, i) => {
        const selected = value === i
        const correct = i === Number(question.answer)
        // Extraire le label de l'option (string ou objet avec label/text)
        const optionLabel = typeof opt === 'string' ? opt : (opt?.label || opt?.text || '')
        return (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => onChange(i)}
            className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 font-display font-medium transition-all duration-150 ${optionState(
              locked,
              selected,
              correct
            )}`}
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-xl border-2 border-current grid place-items-center text-sm font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1"><MathText>{optionLabel}</MathText></span>
            {locked && correct && <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />}
            {locked && selected && !correct && <XCircle size={18} className="text-rose-500 flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}

function TrueFalse({ question, locked, value, onChange }) {
  const opts = [
    { v: true, label: 'Vrai', emoji: '✓' },
    { v: false, label: 'Faux', emoji: '✗' }
  ]
  // Convertir la réponse en boolean (la réponse peut être string "true"/"false")
  const correctAnswerBool = question.answer === true || question.answer === 'true'
  // Convertir aussi la valeur utilisateur en boolean
  const userValueBool = value === true || value === 'true'
  return (
    <div className="grid grid-cols-2 gap-3">
      {opts.map((o) => {
        const selected = userValueBool === o.v
        const correct = correctAnswerBool === o.v
        return (
          <button
            key={String(o.v)}
            type="button"
            disabled={locked}
            onClick={() => onChange(o.v)}
            className={`h-20 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 font-display font-semibold transition-all duration-150 ${optionState(
              locked,
              selected,
              correct
            )}`}
          >
            <span className="text-2xl">{o.emoji}</span>
            <span>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Fill({ question, locked, value, onChange, onSubmit }) {
  const [local, setLocal] = useState(value ?? '')
  const inputRef = useRef(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  // Réinitialiser le state local quand la valeur ou la question change
  useEffect(() => {
    setLocal(value ?? '')
  }, [value, question.id])

  useEffect(() => {
    if (locked) return
    onChangeRef.current(local)
  }, [local, locked])

  const correct = locked && local.trim().toLowerCase() === String(question.answer).trim().toLowerCase()

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={locked}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !locked && onSubmit?.()}
          placeholder="Ta réponse..."
          // taille 16px minimum pour éviter zoom iOS
          className={`w-full h-12 px-4 pr-12 rounded-xl border-2 bg-white dark:bg-slate-800 font-mono text-base focus:outline-none transition-all ${
            !locked
              ? 'border-slate-300 dark:border-slate-600 focus:border-brand focus:ring-2 focus:ring-brand/20'
              : correct
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
          }`}
        />
        {locked && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            {correct ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <XCircle size={20} className="text-rose-500" />
            )}
          </span>
        )}
      </div>
      
      {/* Bouton valider inline pour mobile - visible uniquement si pas locked */}
      {!locked && (
        <button
          onClick={() => onSubmit?.()}
          disabled={!local.trim()}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
            local.trim()
              ? 'bg-brand text-white shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Valider ma réponse
        </button>
      )}
      
      {locked && !correct && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Réponse : <strong className="font-mono text-emerald-600 dark:text-emerald-400"><MathText>{String(question.answer)}</MathText></strong></span>
        </div>
      )}
    </div>
  )
}
