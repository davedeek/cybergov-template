import { desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { units, wdcCharts, wdcEmployees, wdcActivities, wdcTasks } from '@/db/schema'

export const wdcRouter = createTRPCRouter({
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

  listAll: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: wdcCharts.id,
          unitId: wdcCharts.unitId,
          name: wdcCharts.name,
          createdAt: wdcCharts.createdAt,
          updatedAt: wdcCharts.updatedAt,
          unitName: units.name,
        })
        .from(wdcCharts)
        .innerJoin(units, eq(wdcCharts.unitId, units.id))
        .where(eq(units.organizationId, ctx.organizationId))
        .orderBy(desc(wdcCharts.id))
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
