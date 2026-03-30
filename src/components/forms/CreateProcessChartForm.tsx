import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface CreateProcessChartFormProps {
  onSubmit: (values: { name: string, description: string }) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const processChartSchema = z.object({
  name: z.string().min(3, 'Process name must be at least 3 characters'),
  description: z.string(),
})

export function CreateProcessChartForm({ onSubmit, isPending: externalPending, onCancel }: CreateProcessChartFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    validators: {
      onChange: processChartSchema,
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
    <form onSubmit={handleFormSubmit}>
      <DialogHeader>
        <DialogTitle>New Process Chart</DialogTitle>
        <DialogDescription>
          Document a specific process step-by-step.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-4">
        <form.Field
          name="name"
          children={(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Chart Name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., Records Ingestion Process"
                autoFocus
              />
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />
        <form.Field
          name="description"
          children={(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Description (optional)</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Brief purpose of this process"
              />
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => {
          onCancel()
          form.reset()
        }}>Cancel</Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button 
              type="submit" 
              disabled={!canSubmit || isSubmitting || externalPending} 
              className="bg-nd-accent hover:bg-nd-accent-hover text-white px-8"
            >
              {isSubmitting || externalPending ? 'Creating...' : 'Create Process'}
            </Button>
          )}
        />
      </DialogFooter>
    </form>
  )
}
