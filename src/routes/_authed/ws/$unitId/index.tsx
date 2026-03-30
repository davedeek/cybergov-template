import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useProcessChartsCollection, useWDCChartsCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { ArrowLeft, Plus, FileSpreadsheet, GitBranch, Calendar, AlertCircle } from 'lucide-react'

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
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const { data: unit, isLoading: unitLoading } = useQuery(
    trpc.ws.units.get.queryOptions({ organizationId: orgId!, unitId: parseInt(unitId) }),
  )

  const wdcCollection = useWDCChartsCollection(orgId, parseInt(unitId))
  const { data: wdcCharts = [], isLoading: wdcLoading } = useLiveQuery(
    (q) => q.from({ wdc: wdcCollection }).select(({ wdc }) => wdc),
    [wdcCollection],
  )

  const pcCollection = useProcessChartsCollection(orgId, parseInt(unitId))
  const { data: pcCharts = [], isLoading: pcLoading } = useLiveQuery(
    (q) => q.from({ pc: pcCollection }).select(({ pc }) => pc),
    [pcCollection],
  )

  const [isWdcOpen, setIsWdcOpen] = useState(false)
  const [isPcOpen, setIsPcOpen] = useState(false)

  if (unitLoading || wdcLoading || pcLoading) {
    return (
      <div className="p-8 font-mono text-xs uppercase tracking-widest animate-pulse">
        Retrieving Unit Cache...
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto font-sans min-h-screen bg-nd-bg">
      <header className="mb-10 border-b-2 border-nd-ink pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/ws" search={{ orgId }} className="p-2 border-2 border-nd-ink hover:bg-nd-ink hover:text-nd-bg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-nd-accent mb-1">
              <Calendar className="w-4 h-4" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Operational Record</span>
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
                          } as any)
                          return newChart
                        },
                        { 
                          label: 'Create WDC Register',
                          onSuccess: (newChart: any) => {
                            setIsWdcOpen(false)
                            navigate({ to: '/ws/$unitId/wdc/$wdcId', params: { unitId, wdcId: newChart.id.toString() }, search: { orgId } })
                          }
                        }
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
                          } as any)
                          return newChart
                        },
                        { 
                          label: 'Create Process Definition',
                          onSuccess: (newChart: any) => {
                            setIsPcOpen(false)
                            navigate({ to: '/ws/$unitId/pc/$pcId', params: { unitId, pcId: newChart.id.toString() }, search: { orgId } })
                          }
                        }
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

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <FileSpreadsheet className="w-5 h-5 text-nd-ink" />
            <h2 className="text-xl font-bold font-serif text-nd-ink uppercase tracking-tight">Work Distribution Charts</h2>
          </div>
          <div className="space-y-4">
            {wdcCharts.length === 0 ? (
              <EmptyState title="No WDC Inventories" />
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
            <h2 className="text-xl font-bold font-serif text-nd-ink uppercase tracking-tight">Process Flow Charts</h2>
          </div>
          <div className="space-y-4">
            {pcCharts.length === 0 ? (
              <EmptyState title="No Process Documentation" />
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
                  />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function ChartCard({ title, date, type }: { title: string, date: string, type: string }) {
  return (
    <Card className="bg-nd-surface border-2 border-nd-ink rounded-none hover:shadow-[6px_6px_0px_#1A1A18] hover:-translate-y-1 transition-all group overflow-hidden cursor-pointer">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="bg-nd-surface-alt px-2 py-0.5 border border-nd-ink font-mono text-[8px] font-bold uppercase tracking-widest">
            {type} REF: {Math.random().toString(36).substring(7).toUpperCase()}
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

function EmptyState({ title }: { title: string }) {
  return (
    <div className="bg-nd-surface-alt/20 border-2 border-nd-ink border-dashed p-10 flex flex-col items-center justify-center text-nd-ink-muted">
      <Plus className="w-8 h-8 mb-4 opacity-20" />
      <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{title}</span>
    </div>
  )
}
