import { desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, orgScopedProcedure } from '../init'
import {
  units,
  wdcCharts,
  wdcEmployees,
  wdcActivities,
  wdcTasks,
  processCharts,
  processSteps,
} from '@/db/schema'

// ─── Units router ──────────────────────────────────────────────────────────────

const unitsRouter = createTRPCRouter({
  list: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db.query.units.findMany({
        where: eq(units.organizationId, ctx.organizationId),
        orderBy: desc(units.id),
      })
    }),

  get: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')
      return unit
    }),

  create: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      name: z.string().min(1),
      description: z.string().optional(),
    }))
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
      return inserted[0]
    }),
})

// ─── WDC router ────────────────────────────────────────────────────────────────

const wdcRouter = createTRPCRouter({
  create: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      unitId: z.number().int().positive(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify unit belongs to org
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')

      const inserted = await ctx.db
        .insert(wdcCharts)
        .values({ unitId: input.unitId, name: input.name })
        .returning()
      return inserted[0]
    }),

  get: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), wdcId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const chart = await ctx.db.query.wdcCharts.findFirst({
        where: eq(wdcCharts.id, input.wdcId),
      })
      if (!chart) throw new Error('WDC not found')

      // Verify ownership through unit
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, chart.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Access denied')

      const employees = await ctx.db.query.wdcEmployees.findMany({
        where: eq(wdcEmployees.wdcChartId, chart.id),
      })
      const activities = await ctx.db.query.wdcActivities.findMany({
        where: eq(wdcActivities.wdcChartId, chart.id),
      })
      const tasks = await ctx.db.query.wdcTasks.findMany({
        where: eq(wdcTasks.wdcChartId, chart.id),
      })

      return { chart, employees, activities, tasks }
    }),

  listByUnit: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      // Verify unit belongs to org
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')

      return ctx.db.query.wdcCharts.findMany({
        where: eq(wdcCharts.unitId, input.unitId),
        orderBy: desc(wdcCharts.id),
      })
    }),

  listEmployees: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), wdcId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.wdcEmployees.findMany({
        where: eq(wdcEmployees.wdcChartId, input.wdcId),
        orderBy: desc(wdcEmployees.sortOrder),
      })
    }),

  listActivities: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), wdcId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.wdcActivities.findMany({
        where: eq(wdcActivities.wdcChartId, input.wdcId),
        orderBy: desc(wdcActivities.sortOrder),
      })
    }),

  listTasks: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), wdcId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.wdcTasks.findMany({
        where: eq(wdcTasks.wdcChartId, input.wdcId),
      })
    }),

  addEmployee: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      wdcId: z.number().int().positive(),
      name: z.string().min(1),
      role: z.string().optional(),
      fte: z.string().default('1.0'),
    }))
    .mutation(async ({ ctx, input }) => {
      const maxSort = await ctx.db.query.wdcEmployees.findFirst({
        where: eq(wdcEmployees.wdcChartId, input.wdcId),
        orderBy: desc(wdcEmployees.sortOrder),
      })
      const inserted = await ctx.db
        .insert(wdcEmployees)
        .values({
          wdcChartId: input.wdcId,
          name: input.name,
          role: input.role ?? null,
          fte: input.fte,
          sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        })
        .returning()
      return inserted[0]
    }),

  addActivity: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      wdcId: z.number().int().positive(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const maxSort = await ctx.db.query.wdcActivities.findFirst({
        where: eq(wdcActivities.wdcChartId, input.wdcId),
        orderBy: desc(wdcActivities.sortOrder),
      })
      const inserted = await ctx.db
        .insert(wdcActivities)
        .values({
          wdcChartId: input.wdcId,
          name: input.name,
          sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        })
        .returning()
      return inserted[0]
    }),

  addTask: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      wdcId: z.number().int().positive(),
      employeeId: z.number().int().positive(),
      activityId: z.number().int().positive(),
      taskName: z.string().min(1),
      hoursPerWeek: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inserted = await ctx.db
        .insert(wdcTasks)
        .values({
          wdcChartId: input.wdcId,
          employeeId: input.employeeId,
          activityId: input.activityId,
          taskName: input.taskName,
          hoursPerWeek: input.hoursPerWeek,
        })
        .returning()
      return inserted[0]
    }),

  removeTask: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      taskId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(wdcTasks).where(eq(wdcTasks.id, input.taskId))
      return { success: true }
    }),
})

// ─── Process Chart router ──────────────────────────────────────────────────────

const processChartRouter = createTRPCRouter({
  create: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      unitId: z.number().int().positive(),
      name: z.string().min(1),
      startPoint: z.string().optional(),
      endPoint: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')

      const inserted = await ctx.db
        .insert(processCharts)
        .values({
          unitId: input.unitId,
          name: input.name,
          startPoint: input.startPoint ?? null,
          endPoint: input.endPoint ?? null,
        })
        .returning()
      return inserted[0]
    }),

  get: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), processChartId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const chart = await ctx.db.query.processCharts.findFirst({
        where: eq(processCharts.id, input.processChartId),
      })
      if (!chart) throw new Error('Process chart not found')

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, chart.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Access denied')

      const steps = await ctx.db.query.processSteps.findMany({
        where: eq(processSteps.processChartId, chart.id),
      })

      return { chart, steps: steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber) }
    }),

  listByUnit: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')

      return ctx.db.query.processCharts.findMany({
        where: eq(processCharts.unitId, input.unitId),
        orderBy: desc(processCharts.id),
      })
    }),

  listSteps: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), processChartId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.processSteps.findMany({
        where: eq(processSteps.processChartId, input.processChartId),
        orderBy: processSteps.sequenceNumber,
      })
    }),

  addStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      processChartId: z.number().int().positive(),
      symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
      description: z.string().min(1),
      who: z.string().optional(),
      minutes: z.number().int().optional(),
      feet: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the next sequence number
      const lastStep = await ctx.db.query.processSteps.findFirst({
        where: eq(processSteps.processChartId, input.processChartId),
        orderBy: desc(processSteps.sequenceNumber),
      })

      const inserted = await ctx.db
        .insert(processSteps)
        .values({
          processChartId: input.processChartId,
          sequenceNumber: (lastStep?.sequenceNumber ?? -1) + 1,
          symbol: input.symbol,
          description: input.description,
          who: input.who ?? null,
          minutes: input.minutes ?? null,
          feet: input.feet ?? null,
        })
        .returning()
      return inserted[0]
    }),

  updateStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      stepId: z.number().int().positive(),
      symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
      description: z.string().min(1),
      who: z.string().optional(),
      minutes: z.number().int().optional(),
      feet: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(processSteps)
        .set({
          symbol: input.symbol,
          description: input.description,
          who: input.who ?? null,
          minutes: input.minutes ?? null,
          feet: input.feet ?? null,
        })
        .where(eq(processSteps.id, input.stepId))
        .returning()
      if (updated.length === 0) throw new Error('Step not found')
      return updated[0]
    }),

  removeStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      stepId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(processSteps).where(eq(processSteps.id, input.stepId))
      return { success: true }
    }),

  reorderSteps: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      processChartId: z.number().int().positive(),
      stepIds: z.array(z.number().int().positive()),
    }))
    .mutation(async ({ ctx, input }) => {
      for (let i = 0; i < input.stepIds.length; i++) {
        await ctx.db
          .update(processSteps)
          .set({ sequenceNumber: i })
          .where(eq(processSteps.id, input.stepIds[i]))
      }
      return { success: true }
    }),
})

// ─── Work Simplification root router ───────────────────────────────────────────

export const wsRouter = createTRPCRouter({
  units: unitsRouter,
  wdc: wdcRouter,
  processChart: processChartRouter,
})
