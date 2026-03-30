import { useState, useCallback, useRef } from 'react'
import { SymbolIcon, SYMBOL_META, SymbolType, fmtMinutes } from './SymbolMeta'
import {
  SIX_QUESTIONS,
  PROPOSED_ACTIONS,
  ACTION_COLORS,
  type QuestionKey,
  type ProposedAction,
} from './six-questions'
import type { ProcessStep, StepAnnotation } from '@/types/entities'

interface SixQuestionsWorkspaceProps {
  steps: ProcessStep[]
  annotations: StepAnnotation[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annotationsCollection: any
  onDuplicateAsProposal?: () => void
  isDuplicating?: boolean
}

export function SixQuestionsWorkspace({
  steps,
  annotations,
  annotationsCollection,
  onDuplicateAsProposal,
  isDuplicating,
}: SixQuestionsWorkspaceProps) {
  const [activeQuestion, setActiveQuestion] = useState<QuestionKey>('what')
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const question = SIX_QUESTIONS.find((q) => q.key === activeQuestion)!

  // Count annotations per question
  const countByQuestion = (key: QuestionKey) =>
    annotations.filter((a) => a.question === key && (a.note.trim() || a.proposedAction !== 'none'))
      .length

  // Get annotation for a specific step + question
  const getAnnotation = (stepId: number, questionKey: QuestionKey) =>
    annotations.find((a) => a.stepId === stepId && a.question === questionKey)

  // Count proposed actions (non-'none') across all annotations
  const actionCounts = annotations.reduce(
    (acc, a) => {
      if (a.proposedAction !== 'none') {
        acc[a.proposedAction] = (acc[a.proposedAction] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )
  const totalActions = Object.values(actionCounts).reduce((s, c) => s + c, 0)

  const saveAnnotation = useCallback(
    (stepId: number, questionKey: QuestionKey, note: string, proposedAction: ProposedAction) => {
      const existing = annotations.find((a) => a.stepId === stepId && a.question === questionKey)
      const timerKey = `${stepId}-${questionKey}`

      clearTimeout(debounceTimers.current[timerKey])
      debounceTimers.current[timerKey] = setTimeout(() => {
        if (existing) {
          annotationsCollection.update(existing.id, {
            ...existing,
            note,
            proposedAction,
          })
        } else {
          annotationsCollection.insert({
            stepId,
            question: questionKey,
            note,
            proposedAction,
          } as Partial<StepAnnotation>)
        }
      }, 500)
    },
    [annotations, annotationsCollection],
  )

  if (steps.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-nd-border bg-nd-surface-alt">
        <p className="font-mono text-sm text-nd-ink-muted">
          Add steps to your process chart before starting analysis.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Question selector */}
      <div className="flex gap-0 mb-8 border-2 border-nd-ink">
        {SIX_QUESTIONS.map((q) => {
          const count = countByQuestion(q.key)
          const isActive = activeQuestion === q.key
          return (
            <button
              key={q.key}
              onClick={() => setActiveQuestion(q.key)}
              className={`flex-1 py-3 px-4 font-mono text-xs uppercase tracking-widest transition-colors border-r border-nd-ink last:border-r-0
                ${
                  isActive ? 'bg-nd-ink text-nd-bg' : 'bg-nd-surface text-nd-ink hover:bg-nd-ink/10'
                }`}
            >
              <span className="font-bold">{q.q}</span>
              {count > 0 && (
                <span className={`ml-2 ${isActive ? 'text-nd-accent' : 'text-nd-ink-muted'}`}>
                  {count}/{steps.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active question header */}
      <div className="bg-nd-ink text-nd-bg p-6 mb-6">
        <h3 className="text-2xl font-serif font-bold mb-2">{question.q}</h3>
        <p className="text-sm font-serif leading-relaxed opacity-90 mb-3">{question.prompt}</p>
        <div className="text-xs font-mono text-nd-accent opacity-80">
          Look for: {question.lookFor}
        </div>
      </div>

      {/* Steps list for this question */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <StepAnnotationCard
            key={step.id}
            step={step}
            index={idx}
            questionKey={activeQuestion}
            annotation={getAnnotation(step.id, activeQuestion)}
            onSave={saveAnnotation}
          />
        ))}
      </div>

      {/* Summary footer */}
      {totalActions > 0 && (
        <div className="mt-8 p-5 bg-nd-surface border border-nd-border">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted mb-3">
            Proposed Changes Summary
          </h4>
          <div className="flex gap-4 flex-wrap mb-4">
            {PROPOSED_ACTIONS.filter((a) => a.value !== 'none' && actionCounts[a.value]).map(
              (a) => (
                <div
                  key={a.value}
                  className={`px-3 py-1.5 border-l-4 bg-nd-bg text-xs font-mono ${ACTION_COLORS[a.value]}`}
                >
                  <span className="font-bold">{actionCounts[a.value]}</span> {a.label}
                </div>
              ),
            )}
          </div>
          {onDuplicateAsProposal && (
            <button
              onClick={onDuplicateAsProposal}
              disabled={isDuplicating}
              className="px-4 py-2 bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-widest hover:bg-nd-accent transition-colors disabled:opacity-50"
            >
              {isDuplicating ? 'Creating...' : 'Duplicate as Proposal'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Individual step card within a question view
function StepAnnotationCard({
  step,
  index,
  questionKey,
  annotation,
  onSave,
}: {
  step: ProcessStep
  index: number
  questionKey: QuestionKey
  annotation: StepAnnotation | undefined
  onSave: (
    stepId: number,
    questionKey: QuestionKey,
    note: string,
    proposedAction: ProposedAction,
  ) => void
}) {
  const [note, setNote] = useState(annotation?.note ?? '')
  const [action, setAction] = useState<ProposedAction>(
    (annotation?.proposedAction as ProposedAction) ?? 'none',
  )
  const hasContent = note.trim() || action !== 'none'
  const borderColor = action !== 'none' ? ACTION_COLORS[action] : ''

  // Sync from props when annotation changes externally
  const prevAnnotationRef = useRef(annotation)
  if (annotation !== prevAnnotationRef.current) {
    prevAnnotationRef.current = annotation
    if (annotation) {
      if (annotation.note !== note) setNote(annotation.note)
      if (annotation.proposedAction !== action)
        setAction(annotation.proposedAction as ProposedAction)
    }
  }

  const handleNoteChange = (value: string) => {
    setNote(value)
    onSave(step.id, questionKey, value, action)
  }

  const handleActionChange = (value: ProposedAction) => {
    setAction(value)
    onSave(step.id, questionKey, note, value)
  }

  return (
    <div
      className={`border border-nd-border bg-nd-surface ${borderColor ? `border-l-4 ${borderColor}` : ''} ${hasContent ? 'shadow-sm' : ''}`}
    >
      {/* Step context */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-nd-border/50 bg-nd-bg/50">
        <span className="text-[10px] font-mono text-nd-ink-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <SymbolIcon type={step.symbol as SymbolType} size={16} />
        <span
          className="text-[9px] font-mono uppercase tracking-[0.1em] font-bold"
          style={{ color: SYMBOL_META[step.symbol as SymbolType].color }}
        >
          {SYMBOL_META[step.symbol as SymbolType].label}
        </span>
        <span className="text-sm font-serif flex-1">{step.description}</span>
        {step.who && <span className="text-[10px] font-mono text-nd-ink-muted">{step.who}</span>}
        {step.minutes && (
          <span className="text-[10px] font-mono text-nd-ink-muted">
            {fmtMinutes(step.minutes)}
          </span>
        )}
        {step.feet && (
          <span className="text-[10px] font-mono text-nd-ink-muted">{step.feet} ft</span>
        )}
      </div>

      {/* Finding + proposed action */}
      <div className="p-4 flex gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted block mb-1.5">
            Finding
          </label>
          <textarea
            className="w-full border border-nd-border bg-white p-2.5 text-sm font-serif leading-relaxed resize-none focus:outline-none focus:border-nd-accent min-h-[60px]"
            placeholder="What did you observe?"
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            rows={2}
          />
        </div>
        <div className="w-40 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted block mb-1.5">
            Proposed Action
          </label>
          <select
            className="w-full border border-nd-border bg-white p-2.5 text-sm font-mono focus:outline-none focus:border-nd-accent"
            value={action}
            onChange={(e) => handleActionChange(e.target.value as ProposedAction)}
          >
            {PROPOSED_ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
