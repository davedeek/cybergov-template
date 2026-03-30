import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import {
  useWDCEmployeesCollection,
  useWDCActivitiesCollection,
  useWDCTasksCollection,
} from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { useWdcFlags } from '@/hooks/useWdcFlags'
import type { WdcChart, WdcEmployee, WdcActivity, WdcTask } from '@/types/entities'
import { ArrowLeft, AlertCircle, FileText, BookOpen, UserPlus, Plus, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddEmployeeForm } from '@/components/forms/AddEmployeeForm'
import { AddActivityForm } from '@/components/forms/AddActivityForm'
import { AddTaskForm } from '@/components/forms/AddTaskForm'
import { WdcDataTable } from '@/components/ws/WdcDataTable'
import { WdcFlags } from '@/components/ws/WdcFlags'
import { WdcLegend } from '@/components/ws/WdcLegend'
import { ShareDialog } from '@/components/ws/ShareDialog'

export const Route = createFileRoute('/_authed/ws/$unitId/wdc/$wdcId')({
  component: WdcPage,
})

function WdcPage() {
  const { unitId, wdcId } = Route.useParams()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const pWdcId = parseInt(wdcId, 10)

  // -- Queries --
  const { data: wdcData, isLoading: wdcLoading } = useQuery({
    ...trpc.ws.wdc.get.queryOptions({ organizationId: orgId as number, wdcId: pWdcId }),
    enabled: !!orgId && !isNaN(pWdcId),
  })

  // TanStack DB Collections
  const employeesCollection = useWDCEmployeesCollection(orgId, pWdcId)
  const activitiesCollection = useWDCActivitiesCollection(orgId, pWdcId)
  const tasksCollection = useWDCTasksCollection(orgId, pWdcId)

  const { data: rawEmployees = [], isLoading: empLoading } = useLiveQuery(
    (q) => q.from({ emp: employeesCollection }).select(({ emp }) => emp),
    [employeesCollection],
  )
  const employees = rawEmployees as unknown as WdcEmployee[]

  const { data: rawActivities = [], isLoading: actLoading } = useLiveQuery(
    (q) => q.from({ act: activitiesCollection }).select(({ act }) => act),
    [activitiesCollection],
  )
  const activities = rawActivities as unknown as WdcActivity[]

  const { data: rawTasks = [], isLoading: tasksLoading } = useLiveQuery(
    (q) => q.from({ task: tasksCollection }).select(({ task }) => task),
    [tasksCollection],
  )
  const tasks = rawTasks as unknown as WdcTask[]

  const isLoading = wdcLoading || empLoading || actLoading || tasksLoading

  // -- Mutations --
  const addEmpMutation = useMutation(trpc.ws.wdc.addEmployee.mutationOptions())
  const addActivityMutation = useMutation(trpc.ws.wdc.addActivity.mutationOptions())
  const addTaskMutation = useMutation(trpc.ws.wdc.addTask.mutationOptions())
  const removeTaskMutation = useMutation(trpc.ws.wdc.removeTask.mutationOptions())

  // -- Local State --
  const [activeTab, setActiveTab] = useState('chart')
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [addingActivity, setAddingActivity] = useState(false)
  const [activeCell, setActiveCell] = useState<{ actId: number; empId: number } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const regenerateTokenMutation = useMutation(trpc.ws.wdc.regenerateShareToken.mutationOptions())

  const invalidateWdc = () => {
    queryClient.invalidateQueries(trpc.ws.wdc.get.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listEmployees.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listActivities.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listTasks.queryFilter({ wdcId: pWdcId }))
  }

  const handleRemoveTask = async (taskId: number) => {
    if (!orgId) return
    await handleMutation(() => removeTaskMutation.mutateAsync({ organizationId: orgId, taskId }), {
      label: 'Remove Task',
      onSuccess: () => invalidateWdc(),
    })
  }

  // Derived Data
  const chart = wdcData?.chart as WdcChart | undefined

  const empTotals = useMemo(() => {
    const t: Record<number, number> = {}
    employees.forEach((e) => {
      t[e.id] = 0
    })
    tasks.forEach((task) => {
      if (t[task.employeeId] !== undefined) t[task.employeeId] += task.hoursPerWeek
    })
    return t
  }, [employees, tasks])

  const actTotals = useMemo(() => {
    const t: Record<number, number> = {}
    activities.forEach((a) => {
      t[a.id] = 0
    })
    tasks.forEach((task) => {
      if (t[task.activityId] !== undefined) t[task.activityId] += task.hoursPerWeek
    })
    return t
  }, [activities, tasks])

  const getCellTasks = (actId: number, empId: number) =>
    tasks.filter((t) => t.activityId === actId && t.employeeId === empId)

  // Flags (extracted hook)
  const flags = useWdcFlags({ chart, employees, activities, tasks, empTotals, actTotals })

  if (isLoading || !chart) {
    return (
      <div className="p-8 flex justify-center bg-nd-bg min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  return (
    <div className="bg-nd-bg min-h-screen flex flex-col font-serif text-nd-ink pb-20">
      {/* Header */}
      <div className="bg-nd-ink text-nd-bg px-8 py-6 print:py-0 print:bg-nd-surface print:text-black">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2">
              Work Simplification Program — Tool I
            </div>
            <h1 className="m-0 text-3xl font-bold tracking-tight">{chart.name}</h1>
            <div className="text-xs text-[#8A8880] mt-1.5 font-mono print:text-black">
              Who does what — and how many hours it takes
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="rounded-none border-2 border-nd-bg/30 text-nd-bg/70 hover:text-white hover:border-white font-mono text-[10px] uppercase tracking-widest bg-transparent"
            >
              <Share2 className="w-3 h-3 mr-2" /> Share
            </Button>
            <Link
              to="/ws/$unitId"
              params={{ unitId: unitId }}
              search={orgId ? { orgId } : {}}
              className="text-nd-bg/70 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-full overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <div className="bg-[#EDE8E0] border-b border-nd-border px-8 print:hidden">
            {mutationError && (
              <div className="py-2 px-4 bg-nd-accent text-nd-bg font-mono text-[10px] uppercase tracking-widest flex items-center gap-3">
                <AlertCircle className="w-3 h-3" />
                <span>Critical Sync Error: {mutationError}</span>
              </div>
            )}
            <div className="overflow-x-auto -mx-2 px-2">
              <TabsList className="bg-transparent h-auto p-0 gap-6 flex-nowrap whitespace-nowrap">
                <TabsTrigger
                  value="chart"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ledger View</span>
                  <span className="sm:hidden">Ledger</span>
                </TabsTrigger>
                <TabsTrigger
                  value="flags"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Analysis Flags</span>
                  <span className="sm:hidden">Flags</span>
                  {flags.length > 0 && (
                    <span className="bg-nd-accent text-white rounded-full px-2 py-0.5 text-[10px] ml-2 leading-none font-mono">
                      {flags.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="legend"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Reference Guide</span>
                  <span className="sm:hidden">Reference</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="p-8 pb-32">
            {/* 1. CHART VIEW */}
            <TabsContent value="chart" className="m-0 border-none outline-none">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-3 mb-5 items-start print:hidden">
                {addingEmployee ? (
                  <AddEmployeeForm
                    onSubmit={async (values) => {
                      if (!orgId) return
                      await handleMutation(
                        () =>
                          addEmpMutation.mutateAsync({
                            organizationId: orgId,
                            wdcId: pWdcId,
                            name: values.name,
                            role: values.role || undefined,
                            fte: values.fte,
                          }),
                        {
                          label: 'Add Employee to Roster',
                          onSuccess: () => {
                            setAddingEmployee(false)
                            invalidateWdc()
                          },
                        },
                      )
                    }}
                    isPending={isPending}
                    onCancel={() => setAddingEmployee(false)}
                  />
                ) : (
                  <Button
                    onClick={() => setAddingEmployee(true)}
                    variant="outline"
                    className="border-nd-border bg-nd-surface hover:bg-nd-surface hover:border-nd-accent hover:text-nd-accent font-serif tracking-wide rounded-none text-nd-ink-muted shadow-sm h-9"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Employee
                  </Button>
                )}

                {addingActivity ? (
                  <AddActivityForm
                    onSubmit={async (values) => {
                      if (!orgId) return
                      await handleMutation(
                        () =>
                          addActivityMutation.mutateAsync({
                            organizationId: orgId,
                            wdcId: pWdcId,
                            name: values.name,
                          }),
                        {
                          label: 'Add Activity Row',
                          onSuccess: () => {
                            setAddingActivity(false)
                            invalidateWdc()
                          },
                        },
                      )
                    }}
                    isPending={isPending}
                    onCancel={() => setAddingActivity(false)}
                  />
                ) : (
                  <Button
                    onClick={() => setAddingActivity(true)}
                    variant="outline"
                    className="border-nd-border bg-nd-surface hover:bg-nd-surface hover:border-nd-accent hover:text-nd-accent font-serif tracking-wide rounded-none text-nd-ink-muted shadow-sm h-9"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Activity Row
                  </Button>
                )}

                {activeCell && (
                  <AddTaskForm
                    onSubmit={async (values) => {
                      if (!orgId || !activeCell) return
                      await handleMutation(
                        () =>
                          addTaskMutation.mutateAsync({
                            organizationId: orgId,
                            wdcId: pWdcId,
                            employeeId: activeCell.empId,
                            activityId: activeCell.actId,
                            taskName: values.taskName.trim(),
                            hoursPerWeek: Number(values.hours),
                          }),
                        {
                          label: 'Register Individual Task',
                          onSuccess: () => {
                            setActiveCell(null)
                            invalidateWdc()
                          },
                        },
                      )
                    }}
                    isPending={isPending}
                    onCancel={() => setActiveCell(null)}
                  />
                )}
              </div>

              {/* Table (extracted component) */}
              <WdcDataTable
                activities={activities}
                employees={employees}
                getCellTasks={getCellTasks}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
                handleRemoveTask={handleRemoveTask}
                actTotals={actTotals}
                empTotals={empTotals}
                chart={chart}
              />

              <div className="mt-4 text-[11px] font-mono text-nd-ink-muted">
                <span className="text-nd-accent mr-1 font-bold">&#9873;</span> indicates employee
                total hours exceed configured capacity threshold.
                <Button
                  variant="link"
                  className="text-nd-accent h-auto p-0 ml-4 hover:decoration-nd-accent print:hidden"
                  onClick={() => setActiveTab('flags')}
                >
                  Analyze Flags &rarr;
                </Button>
              </div>
            </TabsContent>

            {/* 2. FLAGS VIEW (extracted component) */}
            <TabsContent value="flags" className="m-0 border-none outline-none">
              <WdcFlags flags={flags} onNavigateToReference={() => setActiveTab('legend')} />
            </TabsContent>

            {/* 3. SIX QUESTIONS VIEW (extracted component) */}
            <TabsContent value="legend" className="m-0 border-none outline-none">
              <WdcLegend />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        shareToken={chart.shareToken}
        onRegenerate={async () => {
          if (!orgId) return
          await regenerateTokenMutation.mutateAsync({ organizationId: orgId, wdcId: pWdcId })
          invalidateWdc()
        }}
        isRegenerating={regenerateTokenMutation.isPending}
      />
    </div>
  )
}
