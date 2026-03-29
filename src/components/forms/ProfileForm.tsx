import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Save } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

interface ProfileFormProps {
  initialName: string
  email: string
  onSuccess?: () => void
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export function ProfileForm({ initialName, email, onSuccess }: ProfileFormProps) {
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      name: initialName,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      setSaved(false)

      try {
        await authClient.updateUser({ name: value.name })
        setSaved(true)
        onSuccess?.()
      } catch {
        // handle error
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }} 
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
        validators={{
          onChange: profileSchema.shape.name,
        }}
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
              disabled={!canSubmit || isSubmitting || isLoading}
              className="px-8 h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest uppercase rounded-none transition-all border-2 border-nd-ink flex items-center gap-3 shadow-[3px_3px_0px_#C94A1E]"
            >
              <Save className="w-4 h-4" />
              {isLoading || isSubmitting ? 'Processing...' : 'Save Artifacts'}
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
