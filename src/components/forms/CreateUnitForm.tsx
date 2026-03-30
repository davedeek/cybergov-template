import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface CreateUnitFormProps {
  onSubmit: (values: { name: string, description: string }) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const unitSchema = z.object({
  name: z.string().min(3, 'Unit name must be at least 3 characters'),
  description: z.string(),
})

export function CreateUnitForm({ onSubmit, isPending: externalPending, onCancel }: CreateUnitFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    validators: {
      onChange: unitSchema,
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
        <DialogTitle>Create New Unit</DialogTitle>
        <DialogDescription>
          A unit is a logical grouping of team members who work together on shared processes.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <form.Field
          name="name"
          children={(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Unit Name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., Records Processing"
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
                placeholder="Brief description of the unit's function"
              />
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onCancel()
            form.reset()
          }}
        >
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || externalPending}
              className="bg-nd-accent hover:bg-nd-accent-hover text-white px-8"
            >
              {isSubmitting || externalPending ? 'Creating...' : 'Create Unit'}
            </Button>
          )}
        />
      </DialogFooter>
    </form>
  )
}
