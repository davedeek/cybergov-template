import { useForm } from '@tanstack/react-form'
import { UserPlus } from 'lucide-react'
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
  onSubmit: (values: z.infer<typeof inviteSchema>) => Promise<void>
  isPending?: boolean
}

const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['member', 'admin']),
})

export function InviteMemberForm({ onSubmit, isPending: externalPending }: InviteMemberFormProps) {
  const form = useForm({
    defaultValues: {
      email: '',
      role: 'member' as 'admin' | 'member',
    },
    validators: {
      onChange: inviteSchema,
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
    <div className="space-y-6">
      <form 
        onSubmit={handleFormSubmit} 
        className="flex flex-col md:flex-row gap-4 items-end"
      >
        <form.Field
          name="email"
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
              disabled={!canSubmit || isSubmitting || externalPending}
              className="px-8 h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest uppercase rounded-none transition-all border-2 border-nd-ink flex items-center gap-3 shadow-[3px_3px_0px_#C94A1E]"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting || externalPending ? 'Issuing...' : 'Issue Invitation'}
            </Button>
          )}
        />
      </form>
    </div>
  )
}
