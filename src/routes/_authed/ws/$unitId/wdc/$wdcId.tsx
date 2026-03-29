import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useWDCEmployeesCollection, useWDCActivitiesCollection, useWDCTasksCollection } from '@/db-collections'
import { ArrowLeft, ArrowRight, AlertCircle, FileText, HelpCircle, UserPlus, Plus, Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

export const Route = createFileRoute('/_authed/ws/$unitId/wdc/$wdcId')({
  component: WdcPage,
})

function WdcPage() {
  const { unitId, wdcId } = Route.useParams()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const trpc = useTRPC()
  const queryClient = useQueryClient()

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

  // -- Mutations --
  const addEmpMutation = useMutation(trpc.ws.wdc.addEmployee.mutationOptions())
  const addActMutation = useMutation(trpc.ws.wdc.addActivity.mutationOptions())
  const addTaskMutation = useMutation(trpc.ws.wdc.addTask.mutationOptions())
  const removeTaskMutation = useMutation(trpc.ws.wdc.removeTask.mutationOptions())

  // -- Local State --
  const [activeTab, setActiveTab] = useState('chart')
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [addingActivity, setAddingActivity] = useState(false)
  const [activeCell, setActiveCell] = useState<{ actId: number, empId: number } | null>(null)

  const empSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    role: z.string().trim(),
    fte: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'FTE must be a positive number'),
  })

  const empForm = useForm({
    defaultValues: {
      name: '',
      role: '',
      fte: '1.0',
    },
    validators: {
      onChange: empSchema,
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return
      await addEmpMutation.mutateAsync({
        organizationId: orgId, 
        wdcId: pWdcId,
        name: value.name, 
        role: value.role || undefined, 
        fte: value.fte
      })
      empForm.reset()
      setAddingEmployee(false)
      invalidateWdc()
    },
  })

  const actSchema = z.object({
    name: z.string().trim().min(3, 'Activity name must be at least 3 characters'),
  })

  const actForm = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: actSchema,
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return
      await addActMutation.mutateAsync({ 
        organizationId: orgId, 
        wdcId: pWdcId, 
        name: value.name 
      })
      actForm.reset()
      setAddingActivity(false)
      invalidateWdc()
    },
  })

  const taskSchema = z.object({
    taskName: z.string().trim().min(3, 'Task name must be at least 3 characters'),
    hours: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Hours must be a positive number'),
  })

  const taskForm = useForm({
    defaultValues: {
      taskName: '',
      hours: '',
    },
    validators: {
      onChange: taskSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeCell || !orgId) return
      await addTaskMutation.mutateAsync({
        organizationId: orgId, 
        wdcId: pWdcId,
        employeeId: activeCell.empId, 
        activityId: activeCell.actId,
        taskName: value.taskName.trim(), 
        hoursPerWeek: Number(value.hours)
      })
      taskForm.reset()
      invalidateWdc()
    },
  })

  const invalidateWdc = () => {
    queryClient.invalidateQueries(trpc.ws.wdc.get.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listEmployees.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listActivities.queryFilter({ wdcId: pWdcId }))
    queryClient.invalidateQueries(trpc.ws.wdc.listTasks.queryFilter({ wdcId: pWdcId }))
  }

  // Actions
  const handleAddEmployee = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    empForm.handleSubmit()
  }

  const handleAddActivity = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    actForm.handleSubmit()
  }

  const handleAddTask = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    taskForm.handleSubmit()
  }

  const handleRemoveTask = async (taskId: number) => {
    if (!orgId) return
    await removeTaskMutation.mutateAsync({ organizationId: orgId, taskId })
    invalidateWdc()
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
                  <form 
                    onSubmit={handleAddEmployee}
                    className="flex items-center gap-2 bg-nd-surface px-3 py-2 border border-nd-border shadow-sm"
                  >
                    <empForm.Field
                      name="name"
                      children={(field) => (
                        <div className="flex flex-col gap-1">
                          <Input 
                            placeholder="Name" 
                            className="w-[120px] font-mono text-xs h-8 border-nd-border rounded-none focus-visible:ring-1 focus-visible:ring-nd-accent" 
                            value={field.state.value} 
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)} 
                            autoFocus 
                          />
                          <FormError errors={field.state.meta.errors} />
                        </div>
                      )}
                    />
                    <empForm.Field
                      name="role"
                      children={(field) => (
                        <Input 
                          placeholder="Role" 
                          className="w-[140px] font-mono text-xs h-8 border-nd-border rounded-none focus-visible:ring-1 focus-visible:ring-nd-accent" 
                          value={field.state.value} 
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)} 
                        />
                      )}
                    />
                    <empForm.Field
                      name="fte"
                      children={(field) => (
                        <Input 
                          placeholder="FTE (e.g. 1.0)" 
                          className="w-[90px] font-mono text-xs h-8 border-nd-border rounded-none focus-visible:ring-1 focus-visible:ring-nd-accent" 
                          value={field.state.value} 
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)} 
                        />
                      )}
                    />
                    <empForm.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button 
                          type="submit"
                          disabled={!canSubmit || isSubmitting || addEmpMutation.isPending} 
                          size="sm" 
                          className="h-8 rounded-none bg-nd-accent hover:bg-nd-accent-hover text-white font-serif tracking-wide px-4"
                        >
                          {isSubmitting || addEmpMutation.isPending ? '...' : 'Add'}
                        </Button>
                      )}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        setAddingEmployee(false)
                        empForm.reset()
                      }} 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 rounded-none text-nd-ink-muted hover:text-nd-ink font-serif hover:bg-transparent"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <Button onClick={() => setAddingEmployee(true)} variant="outline" className="border-nd-border bg-nd-surface hover:bg-nd-surface hover:border-nd-accent hover:text-nd-accent font-serif tracking-wide rounded-none text-nd-ink-muted shadow-sm h-9">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Employee
                  </Button>
                )}
                
                {addingActivity ? (
                  <form 
                    onSubmit={handleAddActivity}
                    className="flex items-center gap-2 bg-nd-surface px-3 py-2 border border-nd-border shadow-sm"
                  >
                    <actForm.Field
                      name="name"
                      children={(field) => (
                        <div className="flex flex-col gap-1">
                          <Input 
                            placeholder="Activity Name" 
                            className="w-[200px] font-mono text-xs h-8 border-nd-border rounded-none focus-visible:ring-1 focus-visible:ring-nd-accent" 
                            value={field.state.value} 
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)} 
                            autoFocus 
                          />
                          <FormError errors={field.state.meta.errors} />
                        </div>
                      )}
                    />
                    <actForm.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button 
                          type="submit"
                          disabled={!canSubmit || isSubmitting || addActMutation.isPending} 
                          size="sm" 
                          className="h-8 rounded-none bg-nd-accent hover:bg-nd-accent-hover text-white font-serif tracking-wide px-4"
                        >
                          {isSubmitting || addActMutation.isPending ? '...' : 'Add'}
                        </Button>
                      )}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        setAddingActivity(false)
                        actForm.reset()
                      }} 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 rounded-none text-nd-ink-muted hover:text-nd-ink font-serif hover:bg-transparent"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <Button onClick={() => setAddingActivity(true)} variant="outline" className="border-nd-border bg-nd-surface hover:bg-nd-surface hover:border-nd-accent hover:text-nd-accent font-serif tracking-wide rounded-none text-nd-ink-muted shadow-sm h-9">
                    <Plus className="w-4 h-4 mr-2" /> Add Activity Row
                  </Button>
                )}

                {activeCell && (
                  <form 
                    onSubmit={handleAddTask}
                    className="flex items-center gap-2 bg-nd-surface px-4 py-2 border-2 border-nd-accent shadow-sm ml-auto animate-in fade-in zoom-in-95 duration-200"
                  >
                    <span className="text-[10px] font-mono text-nd-accent tracking-widest uppercase flex items-center gap-1">
                      Editing Cell <ArrowRight className="w-3 h-3" />
                    </span>
                    <taskForm.Field
                      name="taskName"
                      children={(field) => (
                        <div className="flex flex-col gap-1">
                          <Input 
                            placeholder="Task description..." 
                            className="w-[240px] font-mono text-xs h-8 border-nd-border rounded-none focus-visible:ring-1 focus-visible:ring-nd-accent shadow-inner outline-none" 
                            value={field.state.value} 
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)} 
                            autoFocus 
                          />
                          <FormError errors={field.state.meta.errors} />
                        </div>
                      )}
                    />
                    <taskForm.Field
                      name="hours"
                      children={(field) => (
                        <div className="flex flex-col gap-1">
                          <Input 
                            type="number" 
                            placeholder="hrs/wk" 
                            className="w-[80px] font-mono text-xs h-8 border-nd-border rounded-none text-right focus-visible:ring-1 focus-visible:ring-nd-accent shadow-inner outline-none" 
                            value={field.state.value} 
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)} 
                          />
                          <FormError errors={field.state.meta.errors} />
                        </div>
                      )}
                    />
                    <taskForm.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button 
                          type="submit"
                          disabled={!canSubmit || isSubmitting || addTaskMutation.isPending} 
                          size="sm" 
                          className="h-8 rounded-none bg-nd-accent hover:bg-nd-accent-hover text-white font-serif uppercase text-xs tracking-wider px-4 shadow-sm active:translate-y-[1px]"
                        >
                          {isSubmitting || addTaskMutation.isPending ? '...' : 'Add'}
                        </Button>
                      )}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        setActiveCell(null)
                        taskForm.reset()
                      }} 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 rounded-none text-nd-ink-muted hover:text-nd-ink font-serif hover:bg-transparent px-2"
                    >
                      Done
                    </Button>
                  </form>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto border-2 border-nd-ink bg-nd-surface shadow-sm ring-1 ring-black/5 rounded-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thClass} style={{ minWidth: 160 }}>Activity / Task</th>
                      {employees.map((e: any) => (
                        <th key={e.id} className={thClass}>
                          <div className="text-[13px]">{e.name}</div>
                          {e.role && <div className="font-sans font-normal opacity-70 text-[10px] mt-0.5 normal-case tracking-normal">{e.role}</div>}
                          <div className="font-mono font-normal opacity-50 text-[10px] mt-0.5 normal-case tracking-normal text-nd-accent-light">FTE: {e.fte}</div>
                        </th>
                      ))}
                      <th className={`${thClass} text-right min-w-[70px]`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a: any) => (
                      <tr key={a.id} className="group/row">
                        <td className={`${tdClass} ${actLabelClass}`}>{a.name}</td>
                        {employees.map((e: any) => {
                          const cellTasks = getCellTasks(a.id, e.id)
                          const isActive = activeCell?.actId === a.id && activeCell?.empId === e.id
                          const hrs = cellTasks.reduce((s: number, t: any) => s + t.hoursPerWeek, 0)
                          
                          return (
                            <td key={e.id} className={`${tdClass} relative ${isActive ? 'ring-2 ring-inset ring-nd-accent z-10' : 'group-hover/row:bg-black/5'}`}>
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
                                  onClick={() => setActiveCell({ actId: a.id, empId: e.id })}
                                  className="w-full text-left font-mono text-[10px] text-nd-border border border-dashed border-nd-border hover:border-nd-accent hover:text-nd-accent px-2 py-1 transition-colors mt-auto rounded-none bg-nd-surface/30 print:hidden"
                                >
                                  {cellTasks.length === 0 ? '+ add task' : `+ add · ${hrs}h ttl`}
                                </button>
                                {/* Print total */}
                                <div className="hidden print:block font-mono text-[10px] text-right text-nd-ink-muted mt-auto pt-1">{hrs > 0 ? `${hrs}h` : ''}</div>
                              </div>
                            </td>
                          )
                        })}
                        <td className={`${tdClass} bg-nd-surface-alt font-mono text-xs text-right text-nd-ink align-bottom pb-3 leading-snug border-l-2 border-l-nd-bg`}>
                          {actTotals[a.id] || 0}h
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="border-t-[3px] border-nd-ink">
                      <td className="bg-nd-ink text-nd-bg font-mono text-xs tracking-widest p-3 text-left">HRS / WEEK</td>
                      {employees.map(e => {
                        const threshold = chart.hoursThreshold * parseFloat(e.fte || '1')
                        const over = empTotals[e.id] > threshold
                        return (
                          <td key={e.id} className={`font-mono text-sm p-3 text-left border-r border-[#2E2E2C] font-semibold tracking-tight ${over ? 'bg-[#FDF0ED] text-[#C94A1E]' : 'bg-nd-ink text-nd-bg'}`}>
                            {empTotals[e.id] || 0}h {over ? <Flag className="inline w-3 h-3 ml-1 mb-0.5 text-[#C94A1E] fill-current" /> : ''}
                          </td>
                        )
                      })}
                      <td className="bg-nd-ink text-nd-accent-light font-mono text-sm p-3 text-right font-bold tracking-tight border-l-nd-bg border-l-2">
                        {Object.values(empTotals).reduce((a, b) => a + b, 0)}h
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
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
