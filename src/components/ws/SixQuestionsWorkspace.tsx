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
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Plus } from 'lucide-react'

interface SixQuestionsWorkspaceProps {
  steps: ProcessStep[]
  annotations: StepAnnotation[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annotationsCollection: any
  orgId: number
  processChartId?: number
  onStepInserted?: () => void
  onAnnotationSaved?: () => void
  onDuplicateAsProposal?: () => void
  isDuplicating?: boolean
}

export function SixQuestionsWorkspace({
  steps,
  annotations,
  annotationsCollection,
  orgId,
  processChartId,
  onStepInserted,
  onAnnotationSaved,
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
      debounceTimers.current[timerKey] = setTimeout(async () => {
        if (existing) {
          annotationsCollection.update(existing.id, {
            ...existing,
            note,
            proposedAction,
          })
        } else {
          // Use trpcClient directly for inserts to avoid undefined-key errors
          // in the collection. The upsert endpoint handles both create and update.
          await trpcClient.ws.processChart.upsertAnnotation.mutate({
            organizationId: orgId,
            stepId,
            question: questionKey,
            note,
            proposedAction,
          })
          onAnnotationSaved?.()
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
        {question.example && (
          <details className="mt-3">
            <summary className="text-[10px] font-mono uppercase tracking-widest text-nd-bg/60 cursor-pointer hover:text-nd-bg/80">
              See example
            </summary>
            <div className="mt-2 text-xs font-serif italic text-nd-bg/70 pl-3 border-l-2 border-nd-accent/40">
              {question.example}
            </div>
          </details>
        )}
      </div>

      {/* Steps list for this question */}
      <div className="space-y-4">
        {activeQuestion === 'what' && processChartId && (
          <InsertStepButton
            orgId={orgId}
            processChartId={processChartId}
            afterStepId={undefined}
            onInserted={onStepInserted}
          />
        )}
        {steps.map((step, idx) => (
          <div key={step.id}>
            <StepAnnotationCard
              step={step}
              index={idx}
              questionKey={activeQuestion}
              annotation={getAnnotation(step.id, activeQuestion)}
              onSave={saveAnnotation}
            />
            {activeQuestion === 'what' && processChartId && (
              <InsertStepButton
                orgId={orgId}
                processChartId={processChartId}
                afterStepId={step.id}
                onInserted={onStepInserted}
              />
            )}
          </div>
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

// Insert step button — shown between cards in the "What" question
function InsertStepButton({
  orgId,
  processChartId,
  afterStepId,
  onInserted,
}: {
  orgId: number
  processChartId: number
  afterStepId: number | undefined
  onInserted?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [symbol, setSymbol] = useState<'operation' | 'transportation' | 'storage' | 'inspection'>(
    'operation',
  )
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 py-1.5 group"
      >
        <div className="flex-1 h-[1px] bg-nd-border group-hover:bg-nd-accent transition-colors" />
        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted group-hover:text-nd-accent transition-colors">
          <Plus className="w-3 h-3" />
          Add Missing Step
        </div>
        <div className="flex-1 h-[1px] bg-nd-border group-hover:bg-nd-accent transition-colors" />
      </button>
    )
  }

  const handleSubmit = async () => {
    if (!description.trim() || submitting) return
    setSubmitting(true)
    try {
      await trpcClient.ws.processChart.insertStepAt.mutate({
        organizationId: orgId,
        processChartId,
        afterStepId,
        symbol,
        description: description.trim(),
      })
      setExpanded(false)
      setDescription('')
      setSymbol('operation')
      onInserted?.()
    } finally {
      setSubmitting(false)
    }
  }

  const symbols = ['operation', 'transportation', 'storage', 'inspection'] as const

  return (
    <div className="border-2 border-nd-accent bg-nd-surface p-4 my-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-nd-accent mb-3 font-bold">
        Insert Step {afterStepId ? 'After' : 'At Start'}
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex gap-1">
          {symbols.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`w-8 h-8 flex items-center justify-center border-2 transition-colors ${
                symbol === s
                  ? 'border-nd-ink bg-nd-ink'
                  : 'border-nd-border bg-nd-bg hover:border-nd-ink'
              }`}
              title={SYMBOL_META[s].label}
            >
              <SymbolIcon type={s} size={14} color={symbol === s ? '#F5F0E8' : undefined} />
            </button>
          ))}
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') {
              setExpanded(false)
              setDescription('')
            }
          }}
          placeholder="Describe the missing step..."
          className="flex-1 border border-nd-border bg-white px-3 py-2 text-sm font-serif focus:outline-none focus:border-nd-accent"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!description.trim() || submitting}
          className="px-4 py-2 bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-widest hover:bg-nd-accent transition-colors disabled:opacity-50"
        >
          {submitting ? '...' : 'Insert'}
        </button>
        <button
          onClick={() => {
            setExpanded(false)
            setDescription('')
          }}
          className="px-3 py-2 border border-nd-border text-nd-ink-muted font-mono text-xs hover:text-nd-ink transition-colors"
        >
          Cancel
        </button>
      </div>
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
