import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import {
  useProcessChartsCollection,
  useWDCChartsCollection,
  useChangesCollection,
} from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import type { ProcessChart, WdcChart, ProposedChange } from '@/types/entities'
import {
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  GitBranch,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Check,
  X,
} from 'lucide-react'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CreateWdcForm } from '@/components/forms/CreateWdcForm'
import { CreateProcessChartForm } from '@/components/forms/CreateProcessChartForm'

export const Route = createFileRoute('/_authed/ws/$unitId/')({
  component: UnitDashboardPage,
})

function UnitDashboardPage() {
  const { unitId } = Route.useParams()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const { data: unit, isLoading: unitLoading } = useQuery(
    trpc.ws.units.get.queryOptions({ organizationId: orgId!, unitId: parseInt(unitId) }),
  )

  const wdcCollection = useWDCChartsCollection(orgId, parseInt(unitId))
  const { data: rawWdcCharts = [], isLoading: wdcLoading } = useLiveQuery(
    (q) => q.from({ wdc: wdcCollection }).select(({ wdc }) => wdc),
    [wdcCollection],
  )
  const wdcCharts = rawWdcCharts as unknown as WdcChart[]

  const pcCollection = useProcessChartsCollection(orgId, parseInt(unitId))
  const { data: rawPcCharts = [], isLoading: pcLoading } = useLiveQuery(
    (q) => q.from({ pc: pcCollection }).select(({ pc }) => pc),
    [pcCollection],
  )
  const pcCharts = rawPcCharts as unknown as ProcessChart[]

  const changesCollection = useChangesCollection(orgId, parseInt(unitId))
  const { data: rawChanges = [] } = useLiveQuery(
    (q) => q.from({ c: changesCollection }).select(({ c }) => c),
    [changesCollection],
  )
  const changes = rawChanges as unknown as ProposedChange[]

  // Check if any process chart has work counts
  const { data: workCountCheck } = useQuery({
    ...trpc.ws.workCount.listByChart.queryOptions({
      organizationId: orgId ?? -1,
      processChartId: pcCharts[0]?.id ?? -1,
    }),
    enabled: !!orgId && pcCharts.length > 0,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasWorkCounts = (workCountCheck as any[])?.length > 0

  const updateStatusMutation = useMutation(trpc.ws.changes.updateStatus.mutationOptions())

  const [isWdcOpen, setIsWdcOpen] = useState(false)
  const [isPcOpen, setIsPcOpen] = useState(false)

  if (unitLoading || wdcLoading || pcLoading) {
    return (
      <div className="p-8 font-mono text-xs uppercase tracking-widest animate-pulse">
        Retrieving Unit Cache...
      </div>
    )
  }

  const hasWdc = wdcCharts.length > 0
  const hasPc = pcCharts.length > 0

  const openChanges = changes.filter((c) => c.status === 'open')
  const resolvedChanges = changes.filter((c) => c.status !== 'open')

  const handleChangeStatus = async (changeId: number, status: 'accepted' | 'dismissed') => {
    if (!orgId) return
    await handleMutation(
      () => updateStatusMutation.mutateAsync({ organizationId: orgId, changeId, status }),
      {
        label: `${status === 'accepted' ? 'Accept' : 'Dismiss'} Proposal`,
        onSuccess: () => {
          queryClient.invalidateQueries(
            trpc.ws.changes.listByUnit.queryFilter({ unitId: parseInt(unitId) }),
          )
        },
      },
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto font-sans min-h-screen bg-nd-bg">
      <header className="mb-10 border-b-2 border-nd-ink pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/ws"
            search={{ orgId }}
            className="p-2 border-2 border-nd-ink hover:bg-nd-ink hover:text-nd-bg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-nd-accent mb-1">
              <Calendar className="w-4 h-4" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                Operational Record
              </span>
            </div>
            <h1 className="text-3xl font-black font-serif text-nd-ink uppercase tracking-tight">
              {unit?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isWdcOpen} onOpenChange={setIsWdcOpen}>
            <DialogTrigger asChild>
              <Button className="bg-nd-ink hover:bg-nd-accent text-nd-bg rounded-none border-2 border-nd-ink shadow-[3px_3px_0px_#C94A1E] transition-all flex items-center gap-2 uppercase font-bold text-xs tracking-widest px-6 h-11">
                <FileSpreadsheet className="w-4 h-4" />
                New WDC
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-2 border-nd-ink rounded-none bg-nd-surface p-0 overflow-hidden shadow-[8px_8px_0px_rgba(26,26,24,0.1)]">
              {orgId && (
                <div className="p-6">
                  <CreateWdcForm
                    onSubmit={async (values) => {
                      await handleMutation(
                        async () => {
                          const newChart = await wdcCollection.insert({
                            name: values.name,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          } as any)
                          return newChart
                        },
                        {
                          label: 'Create WDC Register',
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onSuccess: (newChart: any) => {
                            setIsWdcOpen(false)
                            navigate({
                              to: '/ws/$unitId/wdc/$wdcId',
                              params: { unitId, wdcId: newChart.id.toString() },
                              search: { orgId },
                            })
                          },
                        },
                      )
                    }}
                    isPending={isPending}
                    onCancel={() => setIsWdcOpen(false)}
                  />
                  {mutationError && (
                    <div className="mt-4 p-3 bg-nd-accent/10 border border-nd-accent text-nd-accent font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-nd-accent" />
                      {mutationError}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isPcOpen} onOpenChange={setIsPcOpen}>
            <DialogTrigger asChild>
              <Button className="bg-nd-ink hover:bg-nd-surface-alt hover:text-nd-ink text-nd-bg rounded-none border-2 border-nd-ink shadow-[3px_3px_0px_rgba(26,26,24,0.1)] transition-all flex items-center gap-2 uppercase font-bold text-xs tracking-widest px-6 h-11">
                <GitBranch className="w-4 h-4" />
                New Process
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-2 border-nd-ink rounded-none bg-nd-surface p-0 overflow-hidden shadow-[8px_8px_0px_rgba(26,26,24,0.1)]">
              {orgId && (
                <div className="p-6">
                  <CreateProcessChartForm
                    onSubmit={async (values) => {
                      await handleMutation(
                        async () => {
                          const newChart = await pcCollection.insert({
                            name: values.name.trim(),
                            description: values.description,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          } as any)
                          return newChart
                        },
                        {
                          label: 'Create Process Definition',
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onSuccess: (newChart: any) => {
                            setIsPcOpen(false)
                            navigate({
                              to: '/ws/$unitId/pc/$pcId',
                              params: { unitId, pcId: newChart.id.toString() },
                              search: { orgId },
                            })
                          },
                        },
                      )
                    }}
                    isPending={isPending}
                    onCancel={() => setIsPcOpen(false)}
                  />
                  {mutationError && (
                    <div className="mt-4 p-3 bg-nd-accent/10 border border-nd-accent text-nd-accent font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-nd-accent" />
                      {mutationError}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Workflow Progress Banner */}
      <div className="mb-10 bg-nd-surface border-2 border-nd-ink p-6 shadow-[4px_4px_0px_rgba(26,26,24,0.08)]">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted mb-4 font-bold">
          Work Simplification Workflow
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
          <WorkflowStep
            number={1}
            label="Chart Workload"
            sublabel="WDC"
            done={hasWdc}
            active={!hasWdc}
          />
          <div className="hidden sm:block w-12 h-0.5 bg-nd-border mx-2" />
          <WorkflowStep
            number={2}
            label="Map Processes"
            sublabel="Process Chart"
            done={hasPc}
            active={hasWdc && !hasPc}
          />
          <div className="hidden sm:block w-12 h-0.5 bg-nd-border mx-2" />
          <WorkflowStep
            number={3}
            label="Count Work"
            sublabel="Work Count"
            done={hasWorkCounts}
            active={hasPc && !hasWorkCounts}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <FileSpreadsheet className="w-5 h-5 text-nd-ink" />
            <h2 className="text-xl font-bold font-serif text-nd-ink uppercase tracking-tight">
              Work Distribution Charts
            </h2>
          </div>
          <div className="space-y-4">
            {wdcCharts.length === 0 ? (
              <EmptyState
                title="No WDC Inventories"
                description="A Work Distribution Chart shows who does what and how long it takes. Start here to understand your unit's workload."
              />
            ) : (
              wdcCharts.map((chart) => (
                <Link
                  key={chart.id}
                  to="/ws/$unitId/wdc/$wdcId"
                  params={{ unitId, wdcId: chart.id.toString() }}
                  search={{ orgId }}
                >
                  <ChartCard
                    title={chart.name}
                    date={new Date(chart.createdAt).toLocaleDateString()}
                    type="WDC"
                  />
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <GitBranch className="w-5 h-5 text-nd-ink" />
            <h2 className="text-xl font-bold font-serif text-nd-ink uppercase tracking-tight">
              Process Flow Charts
            </h2>
          </div>
          <div className="space-y-4">
            {pcCharts.length === 0 ? (
              <EmptyState
                title="No Process Documentation"
                description={
                  hasWdc
                    ? 'Your WDC identified key activities. Now chart those processes step-by-step to find improvements.'
                    : 'Map each step in a workflow. Create a Work Distribution Chart first to identify which processes to analyze.'
                }
              />
            ) : (
              pcCharts.map((chart) => (
                <Link
                  key={chart.id}
                  to="/ws/$unitId/pc/$pcId"
                  params={{ unitId, pcId: chart.id.toString() }}
                  search={{ orgId }}
                >
                  <ChartCard
                    title={chart.name}
                    date={new Date(chart.createdAt).toLocaleDateString()}
                    type="PC"
                    badge={chart.chartState === 'proposed' ? 'PROPOSED' : undefined}
                  />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Proposals Section */}
      {changes.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <ClipboardList className="w-5 h-5 text-nd-ink" />
            <h2 className="text-xl font-bold font-serif text-nd-ink uppercase tracking-tight">
              Proposals
            </h2>
            {openChanges.length > 0 && (
              <span className="bg-nd-accent text-white rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold">
                {openChanges.length} open
              </span>
            )}
          </div>

          <div className="space-y-3">
            {openChanges.map((change) => (
              <div
                key={change.id}
                className="bg-nd-surface border-2 border-nd-ink p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-nd-accent font-bold">
                      {change.chartType === 'wdc' ? 'WDC' : 'Process Chart'}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">
                      Open
                    </span>
                  </div>
                  <p className="text-sm font-serif text-nd-ink leading-snug">
                    {change.description}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => handleChangeStatus(change.id, 'accepted')}
                    size="sm"
                    className="rounded-none bg-nd-ink hover:bg-nd-accent text-nd-bg h-8 px-3"
                  >
                    <Check className="w-3 h-3 mr-1" /> Accept
                  </Button>
                  <Button
                    onClick={() => handleChangeStatus(change.id, 'dismissed')}
                    size="sm"
                    variant="outline"
                    className="rounded-none border-nd-border h-8 px-3 text-nd-ink-muted hover:text-nd-ink"
                  >
                    <X className="w-3 h-3 mr-1" /> Dismiss
                  </Button>
                </div>
              </div>
            ))}

            {resolvedChanges.length > 0 && (
              <details className="mt-2">
                <summary className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted cursor-pointer hover:text-nd-ink">
                  {resolvedChanges.length} resolved proposal
                  {resolvedChanges.length !== 1 ? 's' : ''}
                </summary>
                <div className="mt-2 space-y-2">
                  {resolvedChanges.map((change) => (
                    <div
                      key={change.id}
                      className="bg-nd-surface-alt/50 border border-nd-border p-3 opacity-60"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-widest font-bold ${change.status === 'accepted' ? 'text-green-700' : 'text-nd-ink-muted'}`}
                        >
                          {change.status}
                        </span>
                      </div>
                      <p className="text-xs font-serif text-nd-ink-muted">{change.description}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function WorkflowStep({
  number,
  label,
  sublabel,
  done,
  active,
  disabled,
}: {
  number: number
  label: string
  sublabel: string
  done: boolean
  active: boolean
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-40' : ''}`}>
      <div
        className={`w-8 h-8 flex items-center justify-center border-2 ${
          done
            ? 'bg-nd-accent border-nd-accent'
            : active
              ? 'border-nd-ink bg-nd-bg'
              : 'border-nd-border bg-nd-bg'
        }`}
      >
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-white" />
        ) : (
          <span
            className={`text-sm font-mono font-bold ${active ? 'text-nd-ink' : 'text-nd-ink-muted'}`}
          >
            {number}
          </span>
        )}
      </div>
      <div>
        <div
          className={`text-sm font-serif font-bold ${active ? 'text-nd-ink' : done ? 'text-nd-accent' : 'text-nd-ink-muted'}`}
        >
          {label}
        </div>
        <div className="text-[10px] font-mono text-nd-ink-muted uppercase tracking-widest">
          {sublabel}
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  date,
  type,
  badge,
}: {
  title: string
  date: string
  type: string
  badge?: string
}) {
  return (
    <Card className="bg-nd-surface border-2 border-nd-ink rounded-none hover:shadow-[6px_6px_0px_#1A1A18] hover:-translate-y-1 transition-all group overflow-hidden cursor-pointer">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-nd-surface-alt px-2 py-0.5 border border-nd-ink font-mono text-[8px] font-bold uppercase tracking-widest">
              {type} REF: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
            {badge && (
              <div className="bg-nd-accent text-white px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest">
                {badge}
              </div>
            )}
          </div>
          <div className="font-mono text-[10px] text-nd-ink-muted">{date}</div>
        </div>
        <CardTitle className="text-xl font-black font-serif text-nd-ink uppercase group-hover:text-nd-accent transition-colors leading-6">
          {title}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-nd-surface-alt/20 border-2 border-nd-ink border-dashed p-10 flex flex-col items-center justify-center text-nd-ink-muted">
      <Plus className="w-8 h-8 mb-4 opacity-20" />
      <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{title}</span>
      {description && (
        <p className="mt-3 text-xs font-serif text-nd-ink-muted/80 text-center max-w-xs leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
