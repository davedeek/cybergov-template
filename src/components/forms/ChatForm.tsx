import { useForm } from '@tanstack/react-form'
import { Send } from 'lucide-react'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ChatFormProps {
  onSubmit: (message: string) => void
  isPending?: boolean
}

const chatSchema = z.object({
  input: z.string().trim().min(1, 'Please enter a command or inquiry').max(10000, 'Message is too long'),
})

export function ChatForm({ onSubmit, isPending: externalPending }: ChatFormProps) {
  const form = useForm({
    defaultValues: {
      input: '',
    },
    validators: {
      onChange: chatSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value.input)
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
      className="flex gap-4 items-end"
    >
      <form.Field
        name="input"
        children={(field) => (
          <div className="flex-1 w-full">
            <Label htmlFor="chat-input" className="sr-only">Message</Label>
            <Textarea
              id="chat-input"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
              placeholder="Enter command or inquiry..."
              className="min-h-[60px] max-h-[200px] w-full bg-nd-bg border-2 border-nd-border focus:border-nd-ink font-mono text-sm resize-none shadow-inner p-4"
              disabled={externalPending}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  form.handleSubmit()
                }
              }}
            />
            <div className="absolute transform translate-y-1">
              <FormError errors={field.state.meta.errors} />
            </div>
          </div>
        )}
      />
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        children={([canSubmit, isSubmitting]) => (
          <Button 
            type="submit" 
            disabled={!canSubmit || isSubmitting || externalPending}
            className="h-[60px] px-8 bg-nd-ink hover:bg-nd-accent text-nd-bg transition-all border-2 border-nd-ink shadow-stamp-accent"
          >
            <Send className="w-5 h-5" />
          </Button>
        )}
      />
    </form>
  )
}
