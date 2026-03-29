import { useForm } from '@tanstack/react-form'
import { Shield } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

interface InviteMemberFormProps {
  orgId: number
  onSuccess?: () => void
}

const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['member', 'admin']),
})

export function InviteMemberForm({ orgId, onSuccess }: InviteMemberFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const inviteMutation = useMutation(
    trpc.organization.invite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
        onSuccess?.()
      },
    }),
  )

  const form = useForm({
    defaultValues: {
      email: '',
      role: 'member' as 'member' | 'admin',
    },
    onSubmit: async ({ value }) => {
      if (!value.email.trim() || !orgId) return
      await inviteMutation.mutateAsync({
        organizationId: orgId,
        email: value.email,
        role: value.role,
      })
      form.reset()
    },
  })

  return (
    <div className="space-y-6">
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }} 
        className="flex flex-col md:flex-row gap-4 items-end"
      >
        <form.Field
          name="email"
          validators={{
            onChange: inviteSchema.shape.email,
          }}
          children={(field) => (
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor={field.name} className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                Member Transmission Endpoint (Email)
              </Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="representative@domain.gov"
                className="h-12 bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus:border-nd-ink transition-all font-mono text-sm shadow-inner"
              />
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />
        <form.Field
          name="role"
          validators={{
            onChange: inviteSchema.shape.role,
          }}
          children={(field) => (
            <div className="w-full md:w-[160px] space-y-2">
              <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                Authorization Tier
              </Label>
              <Select 
                value={field.state.value} 
                onValueChange={(v) => field.handleChange(v as 'member' | 'admin')}
              >
                <SelectTrigger className="h-12 w-full bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink font-mono text-xs focus:ring-nd-ink shadow-inner uppercase">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-nd-ink bg-nd-surface">
                  <SelectItem value="member" className="font-mono text-xs uppercase tracking-widest">Member</SelectItem>
                  <SelectItem value="admin" className="font-mono text-xs uppercase tracking-widest">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || inviteMutation.isPending}
              className="h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest rounded-none transition-all border-2 border-nd-ink whitespace-nowrap px-8 uppercase shadow-[3px_3px_0px_#C94A1E]"
            >
              {inviteMutation.isPending || isSubmitting ? 'Invoking...' : 'Induct User'}
            </Button>
          )}
        />
      </form>
      {inviteMutation.isSuccess && (
        <div className="mt-6 p-3 bg-nd-flag-blue/5 border border-nd-flag-blue border-dashed text-nd-flag-blue font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
          <Shield className="w-3 h-3" />
          Manifest Dispatched Successfully.
        </div>
      )}
    </div>
  )
}
