import { desc, eq, and } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import {
  units,
  processCharts,
  processSteps,
  stepAnnotations,
  wdcCharts,
  wdcEmployees,
  wdcActivities,
  wdcTasks,
  workCounts,
  workCountEntries,
  proposedChanges,
} from '@/db/schema'
import { logAudit } from '@/lib/server-logger'
import {
  EXAMPLE_UNIT,
  EXAMPLE_WDC,
  EXAMPLE_PROCESS_CHART,
  EXAMPLE_ANNOTATIONS,
  EXAMPLE_WORK_COUNT,
  EXAMPLE_PROPOSED_CHANGE,
} from '@/db/example-data'

export const unitsRouter = createTRPCRouter({
  list: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db.query.units.findMany({
        where: eq(units.organizationId, ctx.organizationId),
        orderBy: desc(units.id),
      })
    }),

  get: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        unitId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')
      return unit
    }),

  create: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inserted = await ctx.db
        .insert(units)
        .values({
          organizationId: ctx.organizationId,
          name: input.name,
          description: input.description ?? null,
          createdByUserId: ctx.user.id,
        })
        .returning()
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'unit',
        entityId: String(inserted[0].id),
      })
      return inserted[0]
    }),

  importExampleData: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .mutation(async ({ ctx }) => {
      // Guard against duplicate import
      const existing = await ctx.db.query.units.findFirst({
        where: and(eq(units.organizationId, ctx.organizationId), eq(units.name, EXAMPLE_UNIT.name)),
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'Example data has already been imported. Delete the existing example unit to re-import.',
        })
      }

      // Create unit
      const [unit] = await ctx.db
        .insert(units)
        .values({
          organizationId: ctx.organizationId,
          name: EXAMPLE_UNIT.name,
          description: EXAMPLE_UNIT.description,
          createdByUserId: ctx.user.id,
        })
        .returning()

      // Create WDC
      const [wdc] = await ctx.db
        .insert(wdcCharts)
        .values({
          unitId: unit.id,
          name: EXAMPLE_WDC.name,
          shareToken: randomBytes(32).toString('hex'),
        })
        .returning()

      const employeeIds: number[] = []
      for (let i = 0; i < EXAMPLE_WDC.employees.length; i++) {
        const emp = EXAMPLE_WDC.employees[i]
        const [inserted] = await ctx.db
          .insert(wdcEmployees)
          .values({
            wdcChartId: wdc.id,
            name: emp.name,
            role: emp.role,
            fte: emp.fte,
            sortOrder: i,
          })
          .returning()
        employeeIds.push(inserted.id)
      }

      const activityIds: number[] = []
      for (let i = 0; i < EXAMPLE_WDC.activities.length; i++) {
        const act = EXAMPLE_WDC.activities[i]
        const [inserted] = await ctx.db
          .insert(wdcActivities)
          .values({ wdcChartId: wdc.id, name: act.name, sortOrder: i })
          .returning()
        activityIds.push(inserted.id)
      }

      for (const task of EXAMPLE_WDC.tasks) {
        await ctx.db.insert(wdcTasks).values({
          wdcChartId: wdc.id,
          employeeId: employeeIds[task.employeeIdx],
          activityId: activityIds[task.activityIdx],
          taskName: task.taskName,
          hoursPerWeek: task.hoursPerWeek,
        })
      }

      // Create Process Chart
      const [pc] = await ctx.db
        .insert(processCharts)
        .values({
          unitId: unit.id,
          name: EXAMPLE_PROCESS_CHART.name,
          startPoint: EXAMPLE_PROCESS_CHART.startPoint,
          endPoint: EXAMPLE_PROCESS_CHART.endPoint,
          shareToken: randomBytes(32).toString('hex'),
        })
        .returning()

      const stepIds: number[] = []
      for (let i = 0; i < EXAMPLE_PROCESS_CHART.steps.length; i++) {
        const step = EXAMPLE_PROCESS_CHART.steps[i]
        const [inserted] = await ctx.db
          .insert(processSteps)
          .values({
            processChartId: pc.id,
            sequenceNumber: i,
            symbol: step.symbol,
            description: step.description,
            who: step.who,
            minutes: step.minutes,
            feet: step.feet,
          })
          .returning()
        stepIds.push(inserted.id)
      }

      // Create annotations
      for (const ann of EXAMPLE_ANNOTATIONS) {
        await ctx.db.insert(stepAnnotations).values({
          stepId: stepIds[ann.stepIdx],
          question: ann.question,
          note: ann.note,
          proposedAction: ann.proposedAction,
        })
      }

      // Create Work Count
      const [wc] = await ctx.db
        .insert(workCounts)
        .values({
          unitId: unit.id,
          name: EXAMPLE_WORK_COUNT.name,
          period: EXAMPLE_WORK_COUNT.period,
          shareToken: randomBytes(32).toString('hex'),
        })
        .returning()

      for (let i = 0; i < EXAMPLE_WORK_COUNT.entries.length; i++) {
        const entry = EXAMPLE_WORK_COUNT.entries[i]
        await ctx.db.insert(workCountEntries).values({
          workCountId: wc.id,
          stepId: stepIds[entry.stepIdx],
          description: entry.description,
          sequenceNumber: i,
          count: entry.count,
        })
      }

      // Create Proposed Change
      await ctx.db.insert(proposedChanges).values({
        unitId: unit.id,
        chartType: EXAMPLE_PROPOSED_CHANGE.chartType,
        chartId: pc.id,
        description: EXAMPLE_PROPOSED_CHANGE.description,
        beforeState: EXAMPLE_PROPOSED_CHANGE.beforeState,
        afterState: EXAMPLE_PROPOSED_CHANGE.afterState,
      })

      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'unit',
        entityId: String(unit.id),
        details: { type: 'example_import' },
      })

      return unit
    }),
})
