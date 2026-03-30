import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { useWorkCountFlags } from '@/hooks/useWorkCountFlags'
import { FLAG_SEVERITY_COLORS } from './table-styles'
import { TABLE_STYLES } from './table-styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreateWorkCountForm } from '@/components/forms/CreateWorkCountForm'
import { Plus, Trash2, AlertCircle, BarChart3 } from 'lucide-react'
import type { ProcessStep, WorkCount, WorkCountEntry } from '@/types/entities'

interface WorkCountTabProps {
  orgId: number
  processChartId: number
  steps: ProcessStep[]
}

export function WorkCountTab({ orgId, processChartId, steps }: WorkCountTabProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const [creating, setCreating] = useState(false)
  const [activeCountId, setActiveCountId] = useState<number | null>(null)

  // Queries
  const { data: workCounts = [], isLoading } = useQuery({
    ...trpc.ws.workCount.listByChart.queryOptions({ organizationId: orgId, processChartId }),
  })

  const selectedCount = activeCountId
    ? (workCounts as WorkCount[]).find((wc) => wc.id === activeCountId)
    : ((workCounts as WorkCount[])[0] ?? null)

  const effectiveCountId = selectedCount?.id ?? null

  const { data: entries = [] } = useQuery({
    ...trpc.ws.workCount.listEntries.queryOptions({
      organizationId: orgId,
      workCountId: effectiveCountId ?? -1,
    }),
    enabled: !!effectiveCountId,
  })

  const typedEntries = entries as WorkCountEntry[]

  // Mutations
  const createMutation = useMutation(trpc.ws.workCount.create.mutationOptions())
  const upsertEntryMutation = useMutation(trpc.ws.workCount.upsertEntry.mutationOptions())
  const removeMutation = useMutation(trpc.ws.workCount.remove.mutationOptions())

  const invalidate = () => {
    queryClient.invalidateQueries(trpc.ws.workCount.listByChart.queryFilter({ processChartId }))
    if (effectiveCountId) {
      queryClient.invalidateQueries(
        trpc.ws.workCount.listEntries.queryFilter({ workCountId: effectiveCountId }),
      )
    }
  }

  // Build entry map for the table
  const entryMap: Record<number, WorkCountEntry> = {}
  typedEntries.forEach((e) => {
    entryMap[e.stepId] = e
  })

  const sortedSteps = [...steps].sort((a, b) => a.sequenceNumber - b.sequenceNumber)

  // Flags
  const flags = useWorkCountFlags({ steps, entries: typedEntries })

  // Total count
  const totalCount = typedEntries.reduce((sum, e) => sum + e.count, 0)

  const SYMBOL_LABELS: Record<string, string> = {
    operation: 'OP',
    transportation: 'TR',
    storage: 'ST',
    inspection: 'IN',
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-nd-surface p-6 border border-nd-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-nd-ink m-0 mb-1">Work Count</h2>
            <p className="text-xs font-mono text-nd-ink-muted">
              Track volume at each process step to find bottlenecks and imbalances.
            </p>
          </div>
          {!creating && (
            <Button
              onClick={() => setCreating(true)}
              variant="outline"
              className="rounded-none border-nd-border hover:border-nd-accent hover:text-nd-accent font-mono text-xs uppercase tracking-widest"
            >
              <Plus className="w-3 h-3 mr-2" /> New Count
            </Button>
          )}
        </div>

        {mutationError && (
          <div className="mb-4 p-3 bg-nd-accent/10 border border-nd-accent text-nd-accent font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            {mutationError}
          </div>
        )}

        {creating && (
          <div className="mb-6 p-4 border border-nd-border bg-nd-bg">
            <CreateWorkCountForm
              onSubmit={async (values) => {
                await handleMutation(
                  () =>
                    createMutation.mutateAsync({
                      organizationId: orgId,
                      processChartId,
                      name: values.name,
                      period: values.period,
                    }),
                  {
                    label: 'Create Work Count',
                    onSuccess: (result: { id: number }) => {
                      setCreating(false)
                      setActiveCountId(result.id)
                      invalidate()
                    },
                  },
                )
              }}
              isPending={isPending}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {/* Count selector */}
        {(workCounts as WorkCount[]).length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-mono text-nd-ink-muted uppercase tracking-widest">
              Select:
            </span>
            <div className="flex gap-2 flex-wrap">
              {(workCounts as WorkCount[]).map((wc) => (
                <button
                  key={wc.id}
                  onClick={() => setActiveCountId(wc.id)}
                  className={`px-3 py-1.5 border font-mono text-xs transition-colors ${
                    effectiveCountId === wc.id
                      ? 'bg-nd-ink text-nd-bg border-nd-ink'
                      : 'bg-nd-bg text-nd-ink-muted border-nd-border hover:border-nd-ink'
                  }`}
                >
                  {wc.name}
                  <span className="ml-2 text-[10px] opacity-60">{wc.period}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data table */}
        {effectiveCountId && sortedSteps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TABLE_STYLES.th}>#</th>
                  <th className={TABLE_STYLES.th}>Type</th>
                  <th className={TABLE_STYLES.th}>Step</th>
                  <th className={TABLE_STYLES.th + ' text-right'}>Count</th>
                  <th className={TABLE_STYLES.th + ' text-right w-[60px]'}>%</th>
                </tr>
              </thead>
              <tbody>
                {sortedSteps.map((step, idx) => {
                  const entry = entryMap[step.id]
                  const count = entry?.count ?? 0
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0

                  // Check for drop from previous step
                  const prevStep = idx > 0 ? sortedSteps[idx - 1] : null
                  const prevCount = prevStep ? (entryMap[prevStep.id]?.count ?? 0) : 0
                  const hasDrop =
                    prevStep &&
                    prevCount > 0 &&
                    count < prevCount &&
                    ((prevCount - count) / prevCount) * 100 >= 30

                  return (
                    <tr key={step.id} className={`group ${hasDrop ? 'bg-[#FDF0ED]' : ''}`}>
                      <td className="border-b border-r border-nd-border px-3 py-2 font-mono text-xs text-nd-ink-muted">
                        {idx + 1}
                      </td>
                      <td className="border-b border-r border-nd-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-nd-ink-muted">
                        {SYMBOL_LABELS[step.symbol] ?? step.symbol}
                      </td>
                      <td className="border-b border-r border-nd-border px-3 py-2 text-sm font-serif text-nd-ink">
                        {step.description}
                        {hasDrop && (
                          <span className="ml-2 text-[10px] font-mono text-[#C94A1E] uppercase">
                            &darr; {Math.round(((prevCount - count) / prevCount) * 100)}%
                          </span>
                        )}
                      </td>
                      <td className="border-b border-nd-border px-3 py-2 text-right">
                        <CountInput
                          value={count}
                          onUpdate={async (newCount) => {
                            await handleMutation(
                              () =>
                                upsertEntryMutation.mutateAsync({
                                  organizationId: orgId,
                                  workCountId: effectiveCountId,
                                  stepId: step.id,
                                  count: newCount,
                                }),
                              {
                                label: 'Update Count',
                                onSuccess: () => invalidate(),
                              },
                            )
                          }}
                        />
                      </td>
                      <td className="border-b border-nd-border px-3 py-2 text-right font-mono text-xs text-nd-ink-muted">
                        {pct}%
                      </td>
                    </tr>
                  )
                })}
                {/* Totals */}
                <tr className="bg-nd-surface-alt font-bold">
                  <td
                    colSpan={3}
                    className="px-3 py-2 text-right font-mono text-xs uppercase tracking-widest text-nd-ink-muted border-t-2 border-nd-ink"
                  >
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-nd-ink border-t-2 border-nd-ink">
                    {totalCount}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-nd-ink-muted border-t-2 border-nd-ink">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          !creating &&
          (workCounts as WorkCount[]).length === 0 && (
            <div className="p-8 text-center border border-dashed border-nd-border bg-nd-surface-alt font-mono text-sm text-nd-ink-muted">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No work counts yet. Create one to start tracking volume at each step.
            </div>
          )
        )}

        {/* Delete button */}
        {selectedCount && (
          <div className="mt-4 pt-4 border-t border-nd-border flex justify-end">
            <Button
              variant="ghost"
              onClick={async () => {
                await handleMutation(
                  () =>
                    removeMutation.mutateAsync({
                      organizationId: orgId,
                      workCountId: selectedCount.id,
                    }),
                  {
                    label: 'Delete Work Count',
                    onSuccess: () => {
                      setActiveCountId(null)
                      invalidate()
                    },
                  },
                )
              }}
              className="text-nd-ink-muted hover:text-nd-accent text-xs font-mono uppercase tracking-widest"
            >
              <Trash2 className="w-3 h-3 mr-2" /> Delete Count
            </Button>
          </div>
        )}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="bg-nd-surface p-6 border border-nd-border shadow-sm">
          <h3 className="text-lg font-bold font-serif text-nd-ink mb-4">Volume Flags</h3>
          <div className="space-y-3">
            {flags.map((f, i) => {
              const colors = FLAG_SEVERITY_COLORS[f.severity]
              return (
                <div key={i} className={`p-3 pl-4 border-l-4 ${colors.bg} ${colors.border}`}>
                  <div
                    className={`text-[10px] font-mono uppercase tracking-[0.12em] mb-1 font-bold ${colors.text}`}
                  >
                    {f.type}
                  </div>
                  <div className="text-sm font-serif leading-snug">{f.message}</div>
                  <div className="text-xs font-mono text-nd-ink-muted mt-1">{f.guide}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CountInput({
  value,
  onUpdate,
}: {
  value: number
  onUpdate: (count: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(String(value))

  if (!editing) {
    return (
      <button
        onClick={() => {
          setLocalValue(String(value))
          setEditing(true)
        }}
        className="font-mono text-sm text-nd-ink hover:text-nd-accent cursor-pointer bg-transparent border-none p-0 text-right w-full"
      >
        {value}
      </button>
    )
  }

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={async () => {
        const num = parseInt(localValue, 10)
        if (!isNaN(num) && num >= 0 && num !== value) {
          await onUpdate(num)
        }
        setEditing(false)
      }}
      onKeyDown={async (e) => {
        if (e.key === 'Enter') {
          const num = parseInt(localValue, 10)
          if (!isNaN(num) && num >= 0 && num !== value) {
            await onUpdate(num)
          }
          setEditing(false)
        } else if (e.key === 'Escape') {
          setEditing(false)
        }
      }}
      className="w-[80px] h-7 font-mono text-sm text-right rounded-none border-nd-accent ml-auto"
      autoFocus
      min={0}
    />
  )
}
