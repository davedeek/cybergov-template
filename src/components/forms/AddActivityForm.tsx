import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'

interface AddActivityFormProps {
  orgId: number
  wdcId: number
  onSuccess: () => void
  onCancel: () => void
}

const actSchema = z.object({
  name: z.string().trim().min(3, 'Activity name must be at least 3 characters'),
})

export function AddActivityForm({ orgId, wdcId, onSuccess, onCancel }: AddActivityFormProps) {
  const trpc = useTRPC()
  const addActMutation = useMutation(trpc.ws.wdc.addActivity.mutationOptions())

  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: actSchema,
    },
    onSubmit: async ({ value }) => {
      if (!orgId) return
      await addActMutation.mutateAsync({ 
        organizationId: orgId, 
        wdcId: wdcId, 
        name: value.name 
      })
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
            disabled={!canSubmit || isSubmitting || addActMutation.isPending} 
            size="sm" 
            className="h-8 rounded-none bg-nd-accent hover:bg-nd-accent-hover text-white font-serif tracking-wide px-4"
          >
            {isSubmitting || addActMutation.isPending ? '...' : 'Add'}
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
