import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

interface ProfileFormProps {
  initialName: string
  email: string
  onSubmit: (values: { name: string }) => Promise<void>
  isPending?: boolean
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export function ProfileForm({ initialName, email, onSubmit, isPending: externalPending }: ProfileFormProps) {
  const [saved, setSaved] = useState(false)

  const form = useForm({
    defaultValues: {
      name: initialName,
    },
    validators: {
      onChange: profileSchema,
    },
    onSubmit: async ({ value }) => {
      setSaved(false)
      await onSubmit(value)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
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
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="h-12 bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink-muted cursor-not-allowed font-mono text-sm opacity-60 shadow-inner"
        />
      </div>

      <form.Field
        name="name"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
              Legal Entity Name
            </Label>
            <Input
              id={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                setSaved(false)
                field.handleChange(e.target.value)
              }}
              className="h-12 bg-nd-bg border-2 border-nd-border focus:border-nd-ink rounded-none text-nd-ink font-serif text-lg shadow-inner"
            />
            <FormError errors={field.state.meta.errors} />
          </div>
        )}
      />

      <div className="flex items-center gap-6 pt-6 border-t border-nd-border border-dashed">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || externalPending}
              className="px-8 h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest uppercase rounded-none transition-all border-2 border-nd-ink flex items-center gap-3 shadow-[3px_3px_0px_#C94A1E]"
            >
              <Save className="w-4 h-4" />
              {isSubmitting || externalPending ? 'Processing...' : 'Save Artifacts'}
            </Button>
          )}
        />
        {saved && (
          <span className="text-nd-flag-blue font-mono text-[10px] uppercase tracking-widest font-bold bg-nd-flag-blue/5 border border-nd-flag-blue px-2 py-1 italic">
            Changes Committed
          </span>
        )}
      </div>
    </form>
  )
}
