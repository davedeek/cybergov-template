import { useMemo } from 'react'
import type { WdcChart, WdcEmployee, WdcActivity, WdcTask } from '@/types/entities'
import type { Flag } from '@/types/flag'

interface UseWdcFlagsParams {
  chart: WdcChart | undefined
  employees: WdcEmployee[]
  activities: WdcActivity[]
  tasks: WdcTask[]
  empTotals: Record<number, number>
  actTotals: Record<number, number>
}

export function useWdcFlags({ chart, employees, activities, tasks, empTotals, actTotals }: UseWdcFlagsParams): Flag[] {
  return useMemo(() => {
    if (!chart || (!employees.length && !activities.length)) return []
    const result: Flag[] = []

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
        .filter(t => t.employeeId === mgr.id)
        .filter(t => { const a = activities.find(act => act.id === t.activityId); return a && !a.name.toLowerCase().includes('management') })
        .reduce((sum, t) => sum + t.hoursPerWeek, 0)
      if (nonMgmtHours > 20) {
        result.push({ type: 'Manager in the Weeds', severity: 'yellow', message: `${mgr.name} has ~${nonMgmtHours} hrs/wk in non-management activities.`, guide: 'Which tasks can be delegated to ground staff?' })
      }
    }

    // 3. Thin coverage
    activities.forEach(a => {
      const eIds = new Set(tasks.filter(t => t.activityId === a.id).map(t => t.employeeId))
      if (eIds.size === 1 && actTotals[a.id] > 5) {
        result.push({ type: 'Thin Coverage', severity: 'blue', message: `"${a.name}" has only one person assigned — key-person risk.`, guide: 'What happens if this person is out sick for a week?' })
      }
    })

    // 4. Fragmented effort
    employees.forEach(e => {
      const actCount = new Set(tasks.filter(t => t.employeeId === e.id).map(t => t.activityId)).size
      if (actCount >= 4) {
        result.push({ type: 'Fragmented Effort', severity: 'yellow', message: `${e.name} has tasks spread across ${actCount} activities.`, guide: 'Are these related? Should they be consolidated or reassigned?' })
      }
    })

    // 5. Missing work
    activities.forEach(a => {
      if (actTotals[a.id] === 0 || !actTotals[a.id]) {
        result.push({ type: 'Missing Work', severity: 'gray', message: `Activity "${a.name}" has zero hours assigned.`, guide: 'Is work happening here undocumented? Or is the activity obsolete?' })
      }
    })

    return result
  }, [chart, employees, activities, tasks, empTotals, actTotals])
}
