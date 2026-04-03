import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { shortTextField } from '@/lib/validators'

interface CreateWorkCountFormProps {
  onSubmit: (values: { name: string; period: 'daily' | 'weekly' | 'monthly' }) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const formSchema = z.object({
  name: shortTextField.min(2, 'Name must be at least 2 characters'),
  period: z.enum(['daily', 'weekly', 'monthly']),
})

export function CreateWorkCountForm({ onSubmit, isPending, onCancel }: CreateWorkCountFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      period: 'weekly' as 'daily' | 'weekly' | 'monthly',
    },
    validators: {
      onChange: formSchema,
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
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <h3 className="text-lg font-serif font-bold text-nd-ink mb-1">New Work Count</h3>
      <p className="text-xs font-mono text-nd-ink-muted mb-4">
        Create a work count to track volume at each process step.
      </p>

      <form.Field
        name="name"
        children={(field) => (
          <div className="space-y-1">
            <Label
              htmlFor={field.name}
              className="text-xs font-mono uppercase tracking-widest text-nd-ink-muted"
            >
              Name
            </Label>
            <Input
              id={field.name}
              placeholder="e.g., March 2026 Weekly Count"
              className="rounded-none border-nd-border font-serif"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoFocus
            />
            <FormError errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Field
        name="period"
        children={(field) => (
          <div className="space-y-1">
            <Label
              htmlFor={field.name}
              className="text-xs font-mono uppercase tracking-widest text-nd-ink-muted"
            >
              Period
            </Label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => field.handleChange(p)}
                  className={`px-4 py-2 border-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    field.state.value === p
                      ? 'bg-nd-ink text-nd-bg border-nd-ink'
                      : 'bg-nd-bg text-nd-ink-muted border-nd-border hover:border-nd-ink'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      />

      <div className="flex gap-3 pt-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isPending}
              className="bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif tracking-wide px-6"
            >
              {isSubmitting || isPending ? 'Creating...' : 'Create'}
            </Button>
          )}
        />
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="rounded-none border-nd-border font-serif"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
