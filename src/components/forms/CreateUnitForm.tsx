import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface CreateUnitFormProps {
  unitsCollection: any
  onSuccess: () => void
  onCancel: () => void
  orgId: number
}

const unitSchema = z.object({
  name: z.string().min(3, 'Unit name must be at least 3 characters'),
  description: z.string(),
})

export function CreateUnitForm({ unitsCollection, onSuccess, onCancel, orgId }: CreateUnitFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return

      await unitsCollection.insert({
        name: value.name.trim(),
        description: value.description.trim() || null,
      } as any)

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
    >
      <DialogHeader>
        <DialogTitle>Create New Unit</DialogTitle>
        <DialogDescription>
          A unit is a logical grouping of team members who work together on shared processes.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <form.Field
          name="name"
          validators={{
            onChange: unitSchema.shape.name,
          }}
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
          validators={{
            onChange: unitSchema.shape.description,
          }}
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
              disabled={!canSubmit || isSubmitting}
              className="bg-nd-accent hover:bg-nd-accent-hover text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Unit'}
            </Button>
          )}
        />
      </DialogFooter>
    </form>
  )
}
