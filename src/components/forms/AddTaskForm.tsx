import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'

interface AddTaskFormProps {
  orgId: number
  wdcId: number
  activeCell: { actId: number, empId: number } | null
  onSuccess: () => void
  onCancel: () => void
}

const taskSchema = z.object({
  taskName: z.string().trim().min(3, 'Task name must be at least 3 characters'),
  hours: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Hours must be a positive number'),
})

export function AddTaskForm({ orgId, wdcId, activeCell, onSuccess, onCancel }: AddTaskFormProps) {
  const trpc = useTRPC()
  const addTaskMutation = useMutation(trpc.ws.wdc.addTask.mutationOptions())

  const form = useForm({
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
        wdcId: wdcId,
        employeeId: activeCell.empId, 
        activityId: activeCell.actId,
        taskName: value.taskName.trim(), 
        hoursPerWeek: Number(value.hours)
      })
      form.reset()
      onSuccess()
    },
  })

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex items-center gap-2 bg-nd-surface px-4 py-2 border-2 border-nd-accent shadow-sm ml-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <span className="text-[10px] font-mono text-nd-accent tracking-widest uppercase flex items-center gap-1">
        Editing Cell <ArrowRight className="w-3 h-3" />
      </span>
      <form.Field
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
      <form.Field
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
      <form.Subscribe
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
          onCancel()
          form.reset()
        }} 
        size="sm" 
        variant="ghost" 
        className="h-8 rounded-none text-nd-ink-muted hover:text-nd-ink font-serif hover:bg-transparent px-2"
      >
        Done
      </Button>
    </form>
  )
}
