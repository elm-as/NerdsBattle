import { Check, Lightbulb, X } from 'lucide-react'
import MathText from '../ui/MathText.jsx'

export function formatAnswer(question, answer) {
  if (answer === null || answer === undefined || answer === '') return null
  switch (question.type) {
    case 'mcq':
      return question.options?.[Number(answer)] ?? String(answer)
    case 'truefalse':
      return answer ? 'Vrai' : 'Faux'
    case 'fill':
      return String(answer)
    default:
      return String(answer)
  }
}

export default function QuestionCorrectionItem({ d, index }) {
  const { question, userAnswer, correct } = d
  const correctAnswer = formatAnswer(question, question.answer)
  const givenAnswer = formatAnswer(question, userAnswer)

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${correct 
      ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-slate-800/50' 
      : 'border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-slate-800/50'
    }`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${correct ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      
      <div className="p-4 pl-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center font-bold text-lg ${
            correct 
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-200 dark:shadow-none' 
              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shadow-sm shadow-rose-200 dark:shadow-none'
          }`}>
            {correct ? <Check size={20} strokeWidth={2.5} /> : <X size={20} strokeWidth={2.5} />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
              Question {index + 1}
            </p>
            <p className={`font-bold text-sm ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {correct ? 'Bonne réponse !' : 'Réponse incorrecte'}
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="font-display font-semibold text-slate-800 dark:text-slate-200 text-base leading-relaxed">
            <MathText>{question.prompt}</MathText>
          </p>
        </div>
        
        <div className="space-y-2.5">
          {!correct && givenAnswer && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-100/70 dark:bg-rose-900/30 border border-rose-200/70 dark:border-rose-800/50">
              <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                <X size={14} className="text-white" strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-0.5">Ta réponse</p>
                <p className="text-sm text-rose-700 dark:text-rose-300 font-semibold">
                  <MathText>{givenAnswer}</MathText>
                </p>
              </div>
            </div>
          )}
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${correct 
            ? 'bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200/70 dark:border-emerald-800/50' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30'
          }`}>
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check size={14} className="text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                {correct ? 'Ta réponse' : 'Bonne réponse'}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                <MathText>{correctAnswer}</MathText>
              </p>
            </div>
          </div>
        </div>
        
        {question.explanation && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Explication</p>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <MathText>{question.explanation}</MathText>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
