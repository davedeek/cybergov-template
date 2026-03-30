import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { shortTextField } from '@/lib/validators'

interface AddActivityFormProps {
  onSubmit: (values: z.infer<typeof actSchema>) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const actSchema = z.object({
  name: shortTextField.min(3, 'Activity name must be at least 3 characters'),
})

export function AddActivityForm({ onSubmit, isPending: externalPending, onCancel }: AddActivityFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: actSchema,
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
      className="flex items-center gap-2 bg-nd-surface px-3 py-2 border border-nd-border shadow-sm"
    >
      <form.Field
        name="name"
        children={(field) => (
          <div className="flex flex-col gap-1">
            <Input 
              placeholder="Activity Name" 
              className="w-[200px] font-mono text-xs h-8 border-nd-border rounded-none focus-visible:ring-1 focus-visible:ring-nd-accent" 
              value={field.state.value} 
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)} 
              autoFocus 
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
        className="h-8 rounded-none text-nd-ink-muted hover:text-nd-ink font-serif hover:bg-transparent"
      >
        Cancel
      </Button>
    </form>
  )
}
