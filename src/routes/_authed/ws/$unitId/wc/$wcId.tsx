import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import type { WorkCountEntry } from '@/types/entities'
import { ArrowLeft, Plus, Trash2, BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineError } from '@/components/ui/inline-error'

export const Route = createFileRoute('/_authed/ws/$unitId/wc/$wcId')({
  component: WorkCountPage,
  head: () => ({
    meta: [{ title: 'Work Count — CyberGov' }],
  }),
})

function WorkCountPage() {
  const { unitId, wcId } = Route.useParams()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const pWcId = parseInt(wcId, 10)

  const { data: wcData, isLoading } = useQuery({
    ...trpc.ws.workCount.get.queryOptions({
      organizationId: orgId as number,
      workCountId: pWcId,
    }),
    enabled: !!orgId && !isNaN(pWcId),
  })

  const addEntryMutation = useMutation(trpc.ws.workCount.addEntry.mutationOptions())
  const upsertEntryMutation = useMutation(trpc.ws.workCount.upsertEntry.mutationOptions())
  const removeEntryMutation = useMutation(trpc.ws.workCount.removeEntry.mutationOptions())
  const removeMutation = useMutation(trpc.ws.workCount.remove.mutationOptions())

  const [addingEntry, setAddingEntry] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [newCount, setNewCount] = useState('0')

  const invalidate = () => {
    queryClient.invalidateQueries(trpc.ws.workCount.get.queryFilter({ workCountId: pWcId }))
    queryClient.invalidateQueries(
      trpc.ws.workCount.listByUnit.queryFilter({ unitId: parseInt(unitId, 10) }),
    )
    queryClient.invalidateQueries(trpc.ws.workCount.listAll.queryFilter({}))
  }

  if (isLoading || !orgId) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent" />
      </div>
    )
  }

  if (!wcData) {
    return <div className="p-8 text-center text-nd-ink-muted font-mono">Work count not found.</div>
  }

  const { workCount, entries } = wcData
  const typedEntries = entries as WorkCountEntry[]
  const totalCount = typedEntries.reduce((sum, e) => sum + e.count, 0)

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto bg-nd-bg min-h-full">
      {/* Back link */}
      <Link
        to="/ws/$unitId"
        params={{ unitId }}
        search={orgId ? { orgId } : {}}
        className="inline-flex items-center text-sm font-semibold text-nd-ink-muted hover:text-nd-accent mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Unit
      </Link>

      {/* Header */}
      <div className="bg-nd-ink text-nd-bg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-nd-accent" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-nd-accent">
                Work Count &middot; {workCount.period}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold">{workCount.name}</h1>
          </div>
        </div>
      </div>

      {mutationError && (
        <InlineError className="mb-4">{mutationError}</InlineError>
      )}

      {/* Entries table */}
      <div className="bg-nd-surface border border-nd-border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-nd-border">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">
            Entries ({typedEntries.length})
          </h2>
          {!addingEntry && (
            <Button
              onClick={() => setAddingEntry(true)}
              variant="outline"
              className="rounded-none border-nd-border hover:border-nd-accent hover:text-nd-accent font-mono text-xs uppercase tracking-widest"
            >
              <Plus className="w-3 h-3 mr-2" /> Add Entry
            </Button>
          )}
        </div>

        {addingEntry && (
          <div className="p-4 bg-nd-bg border-b border-nd-border">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted block mb-1">
                  Description
                </label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Receive application"
                  className="rounded-none border-nd-border font-serif"
                  autoFocus
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted block mb-1">
                  Count
                </label>
                <Input
                  type="number"
                  value={newCount}
                  onChange={(e) => setNewCount(e.target.value)}
                  className="rounded-none border-nd-border font-mono text-right"
                  min={0}
                />
              </div>
              <Button
                onClick={async () => {
                  if (!newDescription.trim()) return
                  await handleMutation(
                    () =>
                      addEntryMutation.mutateAsync({
                        organizationId: orgId,
                        workCountId: pWcId,
                        description: newDescription.trim(),
                        count: parseInt(newCount, 10) || 0,
                      }),
                    {
                      label: 'Add Entry',
                      successToast: 'Entry added',
                      onSuccess: () => {
                        setNewDescription('')
                        setNewCount('0')
                        setAddingEntry(false)
                        invalidate()
                      },
                    },
                  )
                }}
                disabled={isPending || !newDescription.trim()}
                className="bg-nd-ink hover:bg-nd-accent text-nd-bg rounded-none font-mono text-xs uppercase tracking-widest"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setAddingEntry(false)
                  setNewDescription('')
                  setNewCount('0')
                }}
                variant="outline"
                className="rounded-none border-nd-border font-mono text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {typedEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted border-b-2 border-nd-ink bg-nd-surface-alt w-10">
                    #
                  </th>
                  <th className="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted border-b-2 border-nd-ink bg-nd-surface-alt">
                    Description
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted border-b-2 border-nd-ink bg-nd-surface-alt w-24">
                    Count
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted border-b-2 border-nd-ink bg-nd-surface-alt w-16">
                    %
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted border-b-2 border-nd-ink bg-nd-surface-alt w-12"></th>
                </tr>
              </thead>
              <tbody>
                {typedEntries.map((entry, idx) => {
                  const pct = totalCount > 0 ? Math.round((entry.count / totalCount) * 100) : 0
                  const prevEntry = idx > 0 ? typedEntries[idx - 1] : null
                  const hasDrop =
                    prevEntry &&
                    prevEntry.count > 0 &&
                    entry.count < prevEntry.count &&
                    ((prevEntry.count - entry.count) / prevEntry.count) * 100 >= 30

                  return (
                    <tr key={entry.id} className={hasDrop ? 'bg-nd-accent/5' : ''}>
                      <td className="border-b border-r border-nd-border px-3 py-2 font-mono text-xs text-nd-ink-muted">
                        {idx + 1}
                      </td>
                      <td className="border-b border-r border-nd-border px-3 py-2 text-sm font-serif text-nd-ink">
                        {entry.description}
                        {hasDrop && prevEntry && (
                          <span className="ml-2 text-[10px] font-mono text-nd-accent uppercase">
                            &darr;{' '}
                            {Math.round(((prevEntry.count - entry.count) / prevEntry.count) * 100)}%
                          </span>
                        )}
                      </td>
                      <td className="border-b border-r border-nd-border px-3 py-2 text-right">
                        <CountInput
                          value={entry.count}
                          onUpdate={async (newCount) => {
                            await handleMutation(
                              () =>
                                upsertEntryMutation.mutateAsync({
                                  organizationId: orgId,
                                  workCountId: pWcId,
                                  entryId: entry.id,
                                  description: entry.description,
                                  count: newCount,
                                }),
                              {
                                label: 'Update Count',
                                successToast: 'Count updated',
                                onSuccess: () => invalidate(),
                              },
                            )
                          }}
                        />
                      </td>
                      <td className="border-b border-r border-nd-border px-3 py-2 text-right font-mono text-xs text-nd-ink-muted">
                        {pct}%
                      </td>
                      <td className="border-b border-nd-border px-3 py-2 text-right">
                        <button
                          onClick={async () => {
                            await handleMutation(
                              () =>
                                removeEntryMutation.mutateAsync({
                                  organizationId: orgId,
                                  entryId: entry.id,
                                }),
                              {
                                label: 'Remove Entry',
                                successToast: 'Entry removed',
                                onSuccess: () => invalidate(),
                              },
                            )
                          }}
                          className="text-nd-ink-muted hover:text-nd-accent transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-nd-surface-alt font-bold">
                  <td
                    colSpan={2}
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
                  <td className="border-t-2 border-nd-ink" />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          !addingEntry && (
            <div className="p-8 text-center border-t border-nd-border bg-nd-surface-alt font-mono text-sm text-nd-ink-muted">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No entries yet. Add entries to start tracking volume.
            </div>
          )
        )}

        {/* Delete button */}
        <div className="p-4 border-t border-nd-border flex justify-end">
          <Button
            variant="ghost"
            onClick={async () => {
              await handleMutation(
                () =>
                  removeMutation.mutateAsync({
                    organizationId: orgId,
                    workCountId: pWcId,
                  }),
                {
                  label: 'Delete Work Count',
                  successToast: 'Work count deleted',
                  onSuccess: () => {
                    invalidate()
                    window.history.back()
                  },
                },
              )
            }}
            className="text-nd-ink-muted hover:text-nd-accent text-xs font-mono uppercase tracking-widest"
          >
            <Trash2 className="w-3 h-3 mr-2" /> Delete Work Count
          </Button>
        </div>
      </div>
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
