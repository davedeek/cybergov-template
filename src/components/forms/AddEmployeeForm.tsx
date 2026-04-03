import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { nameField } from '@/lib/validators'

interface AddEmployeeFormProps {
  onSubmit: (values: z.infer<typeof empSchema>) => Promise<void>
  isPending?: boolean
  onCancel: () => void
}

const empSchema = z.object({
  name: nameField,
  role: z.string().trim().max(255),
  fte: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'FTE must be a positive number'),
})

export function AddEmployeeForm({
  onSubmit,
  isPending: externalPending,
  onCancel,
}: AddEmployeeFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      role: '',
      fte: '1.0',
    },
    validators: {
      onChange: empSchema,
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
              placeholder="Name"
              className="w-[120px] font-mono text-xs h-8 border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent"
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
        name="role"
        children={(field) => (
          <Input
            placeholder="Role"
            className="w-[140px] font-mono text-xs h-8 border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />
      <form.Field
        name="fte"
        children={(field) => (
          <div className="flex flex-col gap-1">
            <Input
              placeholder="FTE (e.g. 1.0)"
              className="w-[90px] font-mono text-xs h-8 border-nd-border focus-visible:ring-1 focus-visible:ring-nd-accent"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              title="Full-Time Equivalent: 1.0 = 40 hrs/wk, 0.5 = 20 hrs/wk"
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
            className="h-8 bg-nd-accent hover:bg-nd-accent-hover text-white font-serif tracking-wide px-4"
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
        className="h-8 text-nd-ink-muted hover:text-nd-ink font-serif hover:bg-transparent"
      >
        Cancel
      </Button>
    </form>
  )
}
