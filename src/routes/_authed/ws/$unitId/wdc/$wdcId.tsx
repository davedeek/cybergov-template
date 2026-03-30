import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef 
} from '@tanstack/react-table'
import { useWDCEmployeesCollection, useWDCActivitiesCollection, useWDCTasksCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { ArrowLeft, AlertCircle, FileText, HelpCircle, UserPlus, Plus, Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddEmployeeForm } from '@/components/forms/AddEmployeeForm'
import { AddActivityForm } from '@/components/forms/AddActivityForm'
import { AddTaskForm } from '@/components/forms/AddTaskForm'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

  const { data: employees = [], isLoading: empLoading } = useLiveQuery(
    (q) => q.from({ emp: employeesCollection }).select(({ emp }) => emp),
    [employeesCollection],
  )

  const { data: activities = [], isLoading: actLoading } = useLiveQuery(
    (q) => q.from({ act: activitiesCollection }).select(({ act }) => act),
    [activitiesCollection],
  )

  const { data: tasks = [], isLoading: tasksLoading } = useLiveQuery(
    (q) => q.from({ task: tasksCollection }).select(({ task }) => task),
    [tasksCollection],
  )

  const isLoading = wdcLoading || empLoading || actLoading || tasksLoading

  // -- Mutations (Legacy, using async handlers now) --
  const addEmpMutation = useMutation(trpc.ws.wdc.addEmployee.mutationOptions())
  const addActivityMutation = useMutation(trpc.ws.wdc.addActivity.mutationOptions())
  const addTaskMutation = useMutation(trpc.ws.wdc.addTask.mutationOptions())
  const removeTaskMutation = useMutation(trpc.ws.wdc.removeTask.mutationOptions())

  // -- Local State --
  const [activeTab, setActiveTab] = useState('chart')
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [addingActivity, setAddingActivity] = useState(false)
  const [activeCell, setActiveCell] = useState<{ actId: number, empId: number } | null>(null)

  const invalidateWdc = () => {
    queryClient.invalidateQueries(trpc.ws.wdc.get.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listEmployees.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listActivities.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listTasks.queryFilter({ wdcId: pWdcId }))
  }

  const handleRemoveTask = async (taskId: number) => {
    if (!orgId) return
    await handleMutation(
      () => removeTaskMutation.mutateAsync({ organizationId: orgId, taskId }),
      { 
        label: 'Remove Task',
        onSuccess: () => invalidateWdc()
      }
    )
  }

  // Derived Data
  const chart = wdcData?.chart

  const empTotals = useMemo(() => {
    const t: Record<number, number> = {}
    employees.forEach(e => { t[e.id] = 0 })
    tasks.forEach(task => { if (t[task.employeeId] !== undefined) t[task.employeeId] += task.hoursPerWeek })
    return t
  }, [employees, tasks])

  const actTotals = useMemo(() => {
    const t: Record<number, number> = {}
    activities.forEach(a => { t[a.id] = 0 })
    tasks.forEach(task => { if (t[task.activityId] !== undefined) t[task.activityId] += task.hoursPerWeek })
    return t
  }, [activities, tasks])

  const getCellTasks = (actId: number, empId: number) => tasks.filter(t => t.activityId === actId && t.employeeId === empId)

  // Flags Logic
  const flags = useMemo(() => {
    if (!chart || (!employees.length && !activities.length)) return []
    const result: Array<{ type: string, severity: 'red'|'yellow'|'blue'|'gray', message: string, guide: string }> = []
    
    // 1. Overloaded
    employees.forEach(e => {
      const threshold = chart.hoursThreshold * parseFloat(e.fte || '1')
      if (empTotals[e.id] > threshold) {
        result.push({ type: 'Overloaded', severity: 'red', message: `${e.name} is logged at ${empTotals[e.id]} hrs/wk (threshold is ${threshold}).`, guide: 'Who can absorb tasks? Does this unit need a new hire?' })
      }
    })

    // 2. Manager doing analyst work
    const mgr = employees[0]
    if (mgr) {
      const nonMgmtHours = tasks
        .filter((t: any) => t.employeeId === mgr.id)
        .filter((t: any) => { const a = activities.find((act: any) => act.id === t.activityId); return a && !a.name.toLowerCase().includes('management') })
        .reduce((sum: number, t: any) => sum + t.hoursPerWeek, 0)
      if (nonMgmtHours > 20) {
        result.push({ type: 'Manager in the Weeds', severity: 'yellow', message: `${mgr.name} has ~${nonMgmtHours} hrs/wk in non-management activities.`, guide: 'Which tasks can be delegated to ground staff?' })
      }
    }

    // 3. Thin coverage
    activities.forEach((a: any) => {
      const eIds = new Set(tasks.filter((t: any) => t.activityId === a.id).map((t: any) => t.employeeId))
      if (eIds.size === 1 && actTotals[a.id] > 5) {
        result.push({ type: 'Thin Coverage', severity: 'blue', message: `"${a.name}" has only one person assigned — key-person risk.`, guide: 'What happens if this person is out sick for a week?' })
      }
    })

    // 4. Fragmented effort
    employees.forEach((e: any) => {
      const actCount = new Set(tasks.filter((t: any) => t.employeeId === e.id).map((t: any) => t.activityId)).size
      if (actCount >= 4) {
        result.push({ type: 'Fragmented Effort', severity: 'yellow', message: `${e.name} has tasks spread across ${actCount} activities.`, guide: 'Are these related? Should they be consolidated or reassigned?' })
      }
    })

    // 5. Missing work
    activities.forEach((a: any) => {
      if (actTotals[a.id] === 0 || !actTotals[a.id]) {
        result.push({ type: 'Missing Work', severity: 'gray', message: `Activity "${a.name}" has zero hours assigned.`, guide: 'Is work happening here undocumented? Or is the activity obsolete?' })
      }
    })

    return result
  }, [chart, employees, activities, tasks, empTotals, actTotals])

  if (isLoading || !chart) {
    return (
      <div className="p-8 flex justify-center bg-nd-bg min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  const thClass = "bg-nd-ink text-nd-bg font-mono text-xs uppercase tracking-wider p-3 text-left border-r border-[#2E2E2C] whitespace-nowrap align-top select-none"
  const tdClass = "border border-nd-border p-2 align-top bg-nd-surface min-w-[140px]"
  const actLabelClass = "bg-[#2A2A28] text-nd-bg font-mono text-xs min-w-[160px] max-w-[160px] border-none select-none"
  
  return (
    <div className="bg-nd-bg min-h-screen flex flex-col font-serif text-nd-ink pb-20">
      
      {/* Header */}
      <div className="bg-nd-ink text-nd-bg px-8 py-6 print:py-0 print:bg-nd-surface print:text-black">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2">Work Simplification Program — Tool I</div>
            <h1 className="m-0 text-3xl font-bold tracking-tight">{chart.name}</h1>
            <div className="text-xs text-[#8A8880] mt-1.5 font-mono print:text-black">Who does what — and how many hours it takes</div>
          </div>
          <Link to="/ws/$unitId" params={{ unitId: unitId }} search={orgId ? { orgId } : {}} className="text-nd-bg/70 hover:text-white print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
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
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger value="chart" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted">
                <FileText className="w-4 h-4 mr-2" />
                Ledger View
              </TabsTrigger>
              <TabsTrigger value="flags" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted">
                <AlertCircle className="w-4 h-4 mr-2" />
                Analysis Flags
                {flags.length > 0 && <span className="bg-nd-accent text-white rounded-full px-2 py-0.5 text-[10px] ml-2 leading-none font-mono">{flags.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="legend" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-nd-accent rounded-none shadow-none px-2 py-3 font-serif font-semibold text-nd-ink text-sm data-[state=inactive]:text-nd-ink-muted">
                <HelpCircle className="w-4 h-4 mr-2" />
                Six Questions
              </TabsTrigger>
            </TabsList>
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
                        () => addEmpMutation.mutateAsync({
                          organizationId: orgId,
                          wdcId: pWdcId,
                          name: values.name,
                          role: values.role || undefined,
                          fte: values.fte
                        }),
                        { 
                          label: 'Add Employee to Roster',
                          onSuccess: () => {
                            setAddingEmployee(false)
                            invalidateWdc()
                          }
                        }
                      )
                    }} 
                    isPending={isPending}
                    onCancel={() => setAddingEmployee(false)} 
                  />
                ) : (
                  <Button onClick={() => setAddingEmployee(true)} variant="outline" className="border-nd-border bg-nd-surface hover:bg-nd-surface hover:border-nd-accent hover:text-nd-accent font-serif tracking-wide rounded-none text-nd-ink-muted shadow-sm h-9">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Employee
                  </Button>
                )}
                
                {addingActivity ? (
                  <AddActivityForm 
                    onSubmit={async (values) => {
                      if (!orgId) return
                      await handleMutation(
                        () => addActivityMutation.mutateAsync({
                          organizationId: orgId,
                          wdcId: pWdcId,
                          name: values.name
                        }),
                        { 
                          label: 'Add Activity Row',
                          onSuccess: () => {
                            setAddingActivity(false)
                            invalidateWdc()
                          }
                        }
                      )
                    }} 
                    isPending={isPending}
                    onCancel={() => setAddingActivity(false)} 
                  />
                ) : (
                  <Button onClick={() => setAddingActivity(true)} variant="outline" className="border-nd-border bg-nd-surface hover:bg-nd-surface hover:border-nd-accent hover:text-nd-accent font-serif tracking-wide rounded-none text-nd-ink-muted shadow-sm h-9">
                    <Plus className="w-4 h-4 mr-2" /> Add Activity Row
                  </Button>
                )}

                {activeCell && (
                  <AddTaskForm 
                    onSubmit={async (values) => {
                      if (!orgId || !activeCell) return
                      await handleMutation(
                        () => addTaskMutation.mutateAsync({
                          organizationId: orgId,
                          wdcId: pWdcId,
                          employeeId: activeCell.empId,
                          activityId: activeCell.actId,
                          taskName: values.taskName.trim(),
                          hoursPerWeek: Number(values.hours)
                        }),
                        { 
                          label: 'Register Individual Task',
                          onSuccess: () => {
                            setActiveCell(null)
                            invalidateWdc()
                          }
                        }
                      )
                    }} 
                    isPending={isPending}
                    onCancel={() => setActiveCell(null)} 
                  />
                )}
              </div>

              {/* Table */}
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
                thClass={thClass}
                tdClass={tdClass}
                actLabelClass={actLabelClass}
              />
              
              <div className="mt-4 text-[11px] font-mono text-nd-ink-muted">
                <span className="text-nd-accent mr-1 font-bold">⚑</span> indicates employee total hours exceed configured capacity threshold. 
                <Button variant="link" className="text-nd-accent h-auto p-0 ml-4 hover:decoration-nd-accent print:hidden" onClick={() => setActiveTab('flags')}>Analyze Flags →</Button>
              </div>

            </TabsContent>

            {/* 2. FLAGS VIEW */}
            <TabsContent value="flags" className="m-0 border-none outline-none">
              <div className="max-w-2xl bg-nd-surface p-8 border border-nd-border shadow-sm">
                <h2 className="text-2xl font-bold font-serif m-0 mb-1 text-nd-ink">Analysis Flags</h2>
                <p className="text-xs font-mono text-nd-ink-muted mb-8 pb-4 border-b border-nd-border dashed">
                  Automatically raised from chart data. Starting points for inquiry — not verdicts.
                </p>
                
                {flags.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-nd-border bg-nd-surface-alt font-mono text-sm text-nd-ink-muted">
                    No active flags. Add data to the chart or adjust capacities to see pattern analysis.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flags.map((f, i) => {
                      const colors = {
                        red: { bg: 'bg-[#FDF0ED]', border: 'border-l-[#C94A1E]', text: 'text-[#C94A1E]' },
                        yellow: { bg: 'bg-nd-bg', border: 'border-l-[#D4A017]', text: 'text-[#9A7000]' },
                        blue: { bg: 'bg-[#EDF1FB]', border: 'border-l-[#2B5EA7]', text: 'text-[#2B5EA7]' },
                        gray: { bg: 'bg-[#F5F5F5]', border: 'border-l-[#8A8880]', text: 'text-[#5C5A52]' }
                      }[f.severity]

                      return (
                        <div key={i} className={`p-4 pl-5 border-l-4 border border-nd-border border-r-0 border-t-0 border-b-0 shadow-sm ${colors.bg} ${colors.border}`}>
                          <div className={`text-[10px] font-mono uppercase tracking-[0.12em] mb-1.5 font-bold ${colors.text}`}>{f.type}</div>
                          <div className="text-sm font-serif mb-2 leading-snug">{f.message}</div>
                          <div className="text-xs font-mono text-nd-ink-muted bg-nd-surface/50 p-2 border border-nd-border/50">
                            <span className="text-nd-accent mr-2 font-bold opacity-50">→</span>
                            {f.guide}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 3. SIX QUESTIONS VIEW */}
            <TabsContent value="legend" className="m-0 border-none outline-none">
              <div className="max-w-3xl bg-nd-surface border border-nd-border shadow-sm">
                <div className="p-8 pb-6 border-b border-nd-border bg-nd-surface-alt">
                  <h2 className="text-2xl font-bold font-serif m-0 mb-1 text-nd-ink">The Six Questions</h2>
                  <p className="text-xs font-mono text-nd-ink-muted m-0">
                    From the original Work Simplification program. Apply to every task and activity on your chart.
                  </p>
                </div>
                
                <div className="flex flex-col divide-y divide-nd-border">
                  {[
                    { q: 'What', prompt: 'What are the steps? Do I have them all? What does each task actually do?' },
                    { q: 'Why', prompt: 'Is this task necessary? Can a good result be obtained without it? Don\'t be misled by an excuse when you\'re looking for a reason.' },
                    { q: 'Where', prompt: 'Can this be done closer to where the output is needed? Can we reduce transportation by changing location of employees or equipment?' },
                    { q: 'When', prompt: 'Is this done in the right sequence? Can steps be combined or simplified by moving them earlier or later?' },
                    { q: 'Who', prompt: 'Is the right person doing this? Is there someone better placed — or should it be delegated?' },
                    { q: 'How', prompt: 'Can it be done better with different equipment, a form, or a different layout? Can we make the job easier for everyone involved?' },
                  ].map(({ q, prompt }) => (
                    <div key={q} className="flex flex-col sm:flex-row items-stretch">
                      <div className="bg-nd-ink text-nd-accent font-serif font-bold text-xl px-8 py-5 sm:w-32 flex-shrink-0 flex items-center shadow-inner">
                        {q}
                      </div>
                      <div className="p-5 flex-1 bg-nd-surface text-sm font-serif leading-relaxed text-nd-ink/90 flex items-center border-[0.5px] border-l-0 border-nd-border/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                        {prompt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  )
}

interface WdcDataTableProps {
  activities: any[]
  employees: any[]
  getCellTasks: (actId: number, empId: number) => any[]
  activeCell: { actId: number, empId: number } | null
  setActiveCell: (cell: { actId: number, empId: number } | null) => void
  handleRemoveTask: (taskId: number) => Promise<void>
  actTotals: Record<number, number>
  empTotals: Record<number, number>
  chart: any
  thClass: string
  tdClass: string
  actLabelClass: string
}

function WdcDataTable({
  activities,
  employees,
  getCellTasks,
  activeCell,
  setActiveCell,
  handleRemoveTask,
  actTotals,
  empTotals,
  chart,
  thClass,
  tdClass,
  actLabelClass
}: WdcDataTableProps) {
  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        accessorKey: 'name',
        header: 'Activity / Task',
        cell: ({ row }) => <div className={`${tdClass} ${actLabelClass}`}>{row.original.name}</div>,
        size: 160,
      },
    ]

    employees.forEach((emp) => {
      cols.push({
        id: `emp-${emp.id}`,
        header: () => (
          <div className="flex flex-col">
            <div className="text-[13px]">{emp.name}</div>
            {emp.role && <div className="font-sans font-normal opacity-70 text-[10px] mt-0.5 normal-case tracking-normal">{emp.role}</div>}
            <div className="font-mono font-normal opacity-50 text-[10px] mt-0.5 normal-case tracking-normal text-nd-accent-light">FTE: {emp.fte}</div>
          </div>
        ),
        cell: ({ row }: { row: any }) => {
          const act = row.original
          const cellTasks = getCellTasks(act.id, emp.id)
          const hrs = cellTasks.reduce((s: number, t: any) => s + t.hoursPerWeek, 0)

          return (
            <div className="flex flex-col h-full min-h-[60px]">
              <div className="flex-1 space-y-1 mb-2">
                {cellTasks.map((t: any) => (
                  <div key={t.id} className="flex items-start justify-between gap-2 py-1 border-b border-nd-border border-dotted group/task">
                    <span className="text-xs flex-1 leading-snug font-serif text-nd-ink/90">{t.taskName}</span>
                    <span className="font-mono text-[10px] text-nd-ink-muted whitespace-nowrap mt-0.5">{t.hoursPerWeek}h</span>
                    <button onClick={() => handleRemoveTask(t.id)} className="opacity-0 group-hover/task:opacity-100 text-nd-border hover:text-nd-accent transition-all shrink-0 -mt-0.5 ml-1 leading-none print:hidden">×</button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveCell({ actId: act.id, empId: emp.id })}
                className="w-full text-left font-mono text-[10px] text-nd-border border border-dashed border-nd-border hover:border-nd-accent hover:text-nd-accent px-2 py-1 transition-colors mt-auto rounded-none bg-nd-surface/30 print:hidden"
              >
                {cellTasks.length === 0 ? '+ add task' : `+ add · ${hrs}h ttl`}
              </button>
              <div className="hidden print:block font-mono text-[10px] text-right text-nd-ink-muted mt-auto pt-1">{hrs > 0 ? `${hrs}h` : ''}</div>
            </div>
          )
        },
        meta: { 
          empId: emp.id,
          empName: emp.name,
          fte: emp.fte
        }
      } as any)
    })

    cols.push({
      id: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div className="text-right font-mono text-xs text-nd-ink align-bottom pb-3 leading-snug">
          {actTotals[row.original.id] || 0}h
        </div>
      ),
      size: 70,
      meta: { className: "bg-nd-surface-alt border-l-2 border-l-nd-bg" }
    })

    return cols
  }, [activities, employees, getCellTasks, activeCell, setActiveCell, handleRemoveTask, actTotals, tdClass, actLabelClass])

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto border-2 border-nd-ink bg-nd-surface shadow-sm ring-1 ring-black/5 rounded-sm">
      <Table className="w-full border-collapse">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead 
                  key={header.id} 
                  className={thClass}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="group/row hover:bg-transparent border-none">
              {row.getVisibleCells().map((cell) => {
                const isActive = (cell.column.id.startsWith('emp-')) && activeCell?.actId === (row.original as any).id && activeCell?.empId === (cell.column.columnDef.meta as any)?.empId
                
                return (
                  <TableCell 
                    key={cell.id} 
                    className={`${tdClass} relative ${isActive ? 'ring-2 ring-inset ring-nd-accent z-10' : 'group-hover/row:bg-black/5'} ${(cell.column.columnDef.meta as any)?.className || ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          
          {/* Column Totals (Footer) */}
          <TableRow className="border-t-[3px] border-nd-ink hover:bg-transparent">
            <TableCell className="bg-nd-ink text-nd-bg font-mono text-xs tracking-widest p-3 text-left">HRS / WEEK</TableCell>
            {employees.map(e => {
              const threshold = chart.hoursThreshold * parseFloat(e.fte || '1')
              const over = empTotals[e.id] > threshold
              return (
                <TableCell key={e.id} className={`font-mono text-sm p-3 text-left border-r border-[#2E2E2C] font-semibold tracking-tight ${over ? 'bg-[#FDF0ED] text-[#C94A1E]' : 'bg-nd-ink text-nd-bg'}`}>
                  {empTotals[e.id] || 0}h {over ? <Flag className="inline w-3 h-3 ml-1 mb-0.5 text-[#C94A1E] fill-current" /> : ''}
                </TableCell>
              )
            })}
            <TableCell className="bg-nd-ink text-nd-accent-light font-mono text-sm p-3 text-right font-bold tracking-tight border-l-nd-bg border-l-2">
              {Object.values(empTotals).reduce((a, b) => a + b, 0)}h
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
