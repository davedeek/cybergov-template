import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight } from 'lucide-react'

interface AddTaskFormProps {
  onSubmit: (values: z.infer<typeof taskSchema>) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const taskSchema = z.object({
  taskName: z.string().trim().min(3, 'Task name must be at least 3 characters'),
  hours: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Hours must be a positive number'),
})

export function AddTaskForm({ onSubmit, isPending: externalPending, onCancel }: AddTaskFormProps) {
  const form = useForm({
    defaultValues: {
      taskName: '',
      hours: '1',
    },
    validators: {
      onChange: taskSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
      form.reset()
    },
  })

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form 
      onSubmit={handleFormSubmit}
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
            disabled={!canSubmit || isSubmitting || externalPending} 
            size="sm" 
            className="h-8 rounded-none bg-nd-accent hover:bg-nd-accent-hover text-white font-serif tracking-wide px-4"
          >
            {isSubmitting || externalPending ? '...' : 'Add'}
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
