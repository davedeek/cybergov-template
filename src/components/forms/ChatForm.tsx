import { useForm } from '@tanstack/react-form'
import { Send } from 'lucide-react'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatFormProps {
  onSubmit: (message: string) => void
  isLoading: boolean
}

const chatSchema = z.object({
  input: z.string().trim().min(1, 'Please enter a command or inquiry'),
})

export function ChatForm({ onSubmit, isLoading }: ChatFormProps) {
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

  return (
    <form 
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }} 
      className="flex gap-4 items-end"
    >
      <form.Field
        name="input"
        children={(field: any) => (
          <div className="flex-1">
            <Textarea
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
              placeholder="Enter command or inquiry..."
              className="min-h-[60px] max-h-[200px] bg-nd-bg border-2 border-nd-border focus:border-nd-ink rounded-none font-mono text-sm resize-none shadow-inner p-4"
              disabled={isLoading}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  form.handleSubmit()
                }
              }}
            />
            <FormError errors={field.state.meta.errors} />
          </div>
        )}
      />
      <form.Subscribe
        selector={(state: any) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]: any[]) => (
          <Button 
            type="submit" 
            disabled={!canSubmit || isSubmitting || isLoading}
            className="h-[60px] px-8 bg-nd-ink hover:bg-nd-accent text-nd-bg rounded-none transition-all border-2 border-nd-ink shadow-[4px_4px_0px_#C94A1E]"
          >
            <Send className="w-5 h-5" />
          </Button>
        )}
      />
    </form>
  )
}
