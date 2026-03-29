import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useProcessChartsCollection, useWDCChartsCollection } from '@/db-collections'
import { ArrowLeft, Plus, FileSpreadsheet, GitBranch, Calendar } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

export const Route = createFileRoute('/_authed/ws/$unitId/')({
  component: UnitDashboardPage,
})

function UnitDashboardPage() {
  const { unitId } = Route.useParams()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const navigate = useNavigate()
  const trpc = useTRPC()

  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const parsedUnitId = parseInt(unitId, 10)

  // Fetch unit details
  const { data: unit, isLoading: unitLoading } = useQuery({
    ...trpc.ws.units.get.queryOptions({ organizationId: orgId as number, unitId: parsedUnitId }),
    enabled: !!orgId && !isNaN(parsedUnitId),
  })

  // Fetch charts via TanStack DB collections
  const wdcCollection = useWDCChartsCollection(orgId, parsedUnitId)
  const pcCollection = useProcessChartsCollection(orgId, parsedUnitId)

  const { data: wdcList = [], isLoading: wdcLoading } = useLiveQuery(
    (q) => q.from({ wdc: wdcCollection }).select(({ wdc }) => wdc),
    [wdcCollection],
  )

  const { data: pcList = [], isLoading: pcLoading } = useLiveQuery(
    (q) => q.from({ pc: pcCollection }).select(({ pc }) => pc),
    [pcCollection],
  )

  // Create WDC Mutation
  const [isWdcOpen, setIsWdcOpen] = useState(false)
 
  const wdcSchema = z.object({
    name: z.string().min(3, 'Chart name must be at least 3 characters'),
  })
 
  const wdcForm = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return

      const newChart = await wdcCollection.insert({
        name: value.name,
      } as any)

      wdcForm.reset()
      setIsWdcOpen(false)
      navigate({ to: '/ws/$unitId/wdc/$wdcId', params: { unitId, wdcId: newChart.id.toString() }, search: { orgId } })
    },
  })

  // Create PC Mutation
  const [isPcOpen, setIsPcOpen] = useState(false)
 
  const pcSchema = z.object({
    name: z.string().min(3, 'Process name must be at least 3 characters'),
  })
 
  const pcForm = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return

      const newChart = await pcCollection.insert({
        name: value.name.trim(),
      } as any)

      pcForm.reset()
      setIsPcOpen(false)
      navigate({ to: '/ws/$unitId/pc/$pcId', params: { unitId, pcId: newChart.id.toString() }, search: { orgId } })
    },
  })

  if (unitLoading || wdcLoading || pcLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="p-8 text-center bg-nd-bg min-h-full">
        <h2 className="text-xl font-heading text-nd-ink">Unit not found</h2>
        <Button variant="link" asChild className="mt-4 text-nd-accent hover:text-nd-accent-hover">
          <Link to="/ws" search={orgId ? { orgId } : {}}>Return to Units</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-nd-bg min-h-full">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/ws"
          search={orgId ? { orgId } : {}}
          className="inline-flex items-center text-sm font-semibold text-nd-ink-muted hover:text-nd-accent mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Units
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-nd-ink">{unit.name}</h1>
            {unit.description && <p className="text-nd-ink-muted mt-2">{unit.description}</p>}
          </div>
          <div className="flex items-center gap-3 bg-nd-surface px-4 py-2 border border-nd-border rounded-md shadow-sm">
            <div className="w-3 h-3 rounded-full bg-nd-flag-blue" />
            <span className="text-sm font-medium text-nd-ink">Active State</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Work Distribution Charts Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-semibold text-nd-ink flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-nd-accent" />
              Work Distribution
            </h2>
            <Dialog open={isWdcOpen} onOpenChange={setIsWdcOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-nd-accent text-nd-accent hover:bg-nd-accent hover:text-white">
                  <Plus className="w-4 h-4 mr-1" /> New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    wdcForm.handleSubmit()
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>New Work Distribution Chart</DialogTitle>
                    <DialogDescription>
                      Map out activities, tasks, and hours for the team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 py-4">
                    <wdcForm.Field
                      name="name"
                      validators={{
                        onChange: wdcSchema.shape.name,
                      }}
                      children={(field) => (
                        <>
                          <Label htmlFor={field.name}>Chart Name</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g., Q3 2026 Snapshot"
                            autoFocus
                          />
                          <FormError errors={field.state.meta.errors} />
                        </>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsWdcOpen(false)
                      wdcForm.reset()
                    }}>Cancel</Button>
                    <wdcForm.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className="bg-nd-accent hover:bg-nd-accent-hover text-white">
                          {isSubmitting ? 'Creating...' : 'Create Chart'}
                        </Button>
                      )}
                    />
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {wdcList.length === 0 ? (
            <Card className="border-dashed border-2 border-nd-border bg-transparent shadow-none">
              <CardContent className="py-8 text-center text-nd-ink-muted">
                No Work Distribution Charts yet. Create one to see who does what.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {wdcList.map(chart => (
                <Link
                  key={chart.id}
                  to="/ws/$unitId/wdc/$wdcId"
                  params={{ unitId: unitId, wdcId: chart.id.toString() }}
                  search={orgId ? { orgId } : {}}
                  className="block group"
                >
                  <Card className="border-nd-border bg-nd-surface shadow-sm group-hover:border-nd-accent/40 transition-colors">
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-heading text-nd-ink group-hover:text-nd-accent transition-colors">
                          {chart.name}
                        </CardTitle>
                        <span className="text-xs text-nd-ink-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(chart.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Process Charts Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-semibold text-nd-ink flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-nd-accent" />
              Process Charts
            </h2>
            <Dialog open={isPcOpen} onOpenChange={setIsPcOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-nd-accent text-nd-accent hover:bg-nd-accent hover:text-white">
                  <Plus className="w-4 h-4 mr-1" /> New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    pcForm.handleSubmit()
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>New Process Chart</DialogTitle>
                    <DialogDescription>
                      Document a specific process step-by-step.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 py-4">
                    <pcForm.Field
                      name="name"
                      validators={{
                        onChange: pcSchema.shape.name,
                      }}
                      children={(field) => (
                        <>
                          <Label htmlFor={field.name}>Process Name</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g., Mail Sorting Procedure"
                            autoFocus
                          />
                          <FormError errors={field.state.meta.errors} />
                        </>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsPcOpen(false)
                      pcForm.reset()
                    }}>Cancel</Button>
                    <pcForm.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting} className="bg-nd-accent hover:bg-nd-accent-hover text-white">
                          {isSubmitting ? 'Creating...' : 'Create Chart'}
                        </Button>
                      )}
                    />
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {pcList.length === 0 ? (
            <Card className="border-dashed border-2 border-nd-border bg-transparent shadow-none">
              <CardContent className="py-8 text-center text-nd-ink-muted">
                No Process Charts yet. Create one to document a workflow.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pcList.map(chart => (
                <Link
                  key={chart.id}
                  to="/ws/$unitId/pc/$pcId"
                  params={{ unitId: unitId, pcId: chart.id.toString() }}
                  search={orgId ? { orgId } : {}}
                  className="block group"
                >
                  <Card className="border-nd-border bg-nd-surface shadow-sm group-hover:border-nd-accent/40 transition-colors">
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-heading text-nd-ink group-hover:text-nd-accent transition-colors">
                          {chart.name}
                        </CardTitle>
                        <span className="text-xs text-nd-ink-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(chart.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
