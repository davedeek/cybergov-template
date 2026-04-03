import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { shortTextField } from '@/lib/validators'

interface AddTodoFormProps {
  onSubmit: (values: { name: string }) => Promise<void>
  isPending?: boolean
}

const todoSchema = z.object({
  name: shortTextField.min(3, 'Task description must be at least 3 characters'),
})

export function AddTodoForm({ onSubmit, isPending }: AddTodoFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: todoSchema,
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
    <form onSubmit={handleFormSubmit} className="flex gap-3">
      <form.Field
        name="name"
        children={(field) => (
          <div className="flex-1 space-y-2">
            <Input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter task description..."
              className="w-full bg-nd-bg border-2 border-nd-border focus:border-nd-ink font-serif h-12 shadow-inner"
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
            className="bg-nd-ink hover:bg-nd-accent text-nd-bg px-8 h-12 transition-all shadow-stamp-accent"
            disabled={!canSubmit || isSubmitting || !!isPending}
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="font-bold uppercase tracking-widest text-xs">
              {isSubmitting || isPending ? 'Appending...' : 'Append'}
            </span>
          </Button>
        )}
      />
    </form>
  )
}
