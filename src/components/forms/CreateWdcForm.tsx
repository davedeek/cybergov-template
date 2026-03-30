import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface CreateWdcFormProps {
  onSubmit: (values: { name: string }) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const wdcSchema = z.object({
  name: z.string().min(3, 'Chart name must be at least 3 characters'),
})

export function CreateWdcForm({ onSubmit, isPending: externalPending, onCancel }: CreateWdcFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: wdcSchema,
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
        <DialogTitle>New Work Distribution Chart</DialogTitle>
        <DialogDescription>
          Map out activities, tasks, and hours for the team.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-4">
        <form.Field
          name="name"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>Chart Name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., Q3 2026 Snapshot"
                autoFocus
              />
              <FormError errors={field.state.meta.errors} />
            </>
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
              {isSubmitting || externalPending ? 'Creating...' : 'Create Chart'}
            </Button>
          )}
        />
      </DialogFooter>
    </form>
  )
}
