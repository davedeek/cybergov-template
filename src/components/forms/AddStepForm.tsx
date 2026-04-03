/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SymbolIcon, SYMBOL_META, SymbolType } from '../ws/pc/SymbolMeta'
import { FormError } from '@/components/ui/form-error'

interface AddStepFormProps {
  form: any
  isPending?: boolean
}

export function AddStepForm({ form, isPending: externalPending }: AddStepFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="grid grid-cols-1 md:grid-cols-12 gap-1 items-end bg-nd-ink border-2 border-nd-ink shadow-stamp print:hidden"
    >
      <form.Field
        name="symbol"
        children={(field: any) => (
          <div className="md:col-span-2">
            <label className="block text-[9px] font-mono uppercase tracking-[0.1em] text-nd-bg/60 mb-1 ml-2 mt-1">
              Symbol
            </label>
            <Select
              value={field.state.value}
              onValueChange={(v: string) => field.handleChange(v as SymbolType)}
            >
              <SelectTrigger className="h-10 bg-nd-ink text-nd-bg border-none hover:bg-white/5 font-mono text-xs focus:ring-0">
                <div className="flex items-center gap-2">
                  <SymbolIcon type={field.state.value} size={14} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-nd-ink text-nd-bg border-nd-border font-mono text-xs">
                {(Object.keys(SYMBOL_META) as SymbolType[]).map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    className="focus:bg-nd-accent focus:text-nd-bg"
                  >
                    <div className="flex items-center gap-2">
                      <SymbolIcon type={type} size={14} />
                      <span>{SYMBOL_META[type].label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-[8px] font-mono text-nd-bg/40 ml-2 mt-0.5 leading-tight italic">
              {SYMBOL_META[field.state.value as SymbolType].hint}
            </div>
          </div>
        )}
      />

      <form.Field
        name="description"
        children={(field: any) => (
          <div className="md:col-span-4">
            <label className="block text-[9px] font-mono uppercase tracking-[0.1em] text-nd-bg/60 mb-1 ml-2 mt-1">
              Step Description
            </label>
            <Input
              placeholder="What happens?"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              className="h-10 bg-nd-ink text-nd-bg border-none hover:bg-white/5 placeholder:text-nd-bg/30 focus-visible:ring-0 text-sm"
            />
            <div className="absolute left-2 bottom-0 transform translate-y-full z-10 w-full">
              <FormError errors={field.state.meta.errors} />
            </div>
          </div>
        )}
      />

      <form.Field
        name="who"
        children={(field: any) => (
          <div className="md:col-span-2">
            <label className="block text-[9px] font-mono uppercase tracking-[0.1em] text-nd-bg/60 mb-1 ml-2 mt-1">
              Person/Machine
            </label>
            <Input
              placeholder="Who/What?"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              className="h-10 bg-nd-ink text-nd-bg border-none hover:bg-white/5 placeholder:text-nd-bg/30 font-mono text-xs focus-visible:ring-0"
            />
            <div className="absolute left-2 bottom-0 transform translate-y-full z-10 w-full">
              <FormError errors={field.state.meta.errors} />
            </div>
          </div>
        )}
      />

      <form.Field
        name="minutes"
        children={(field: any) => (
          <div className="md:col-span-1">
            <form.Subscribe
              selector={(state: any) => (state as { values: { symbol: string } }).values.symbol}
              children={(symbol: any) => (
                <>
                  <label className="block text-[9px] font-mono uppercase tracking-[0.1em] text-nd-bg/60 mb-1 ml-2 mt-1">
                    {symbol === 'storage' ? 'Wait(m)' : 'Min'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    className="h-10 bg-nd-ink text-nd-bg border-none hover:bg-white/5 placeholder:text-nd-bg/30 font-mono text-xs focus-visible:ring-0 text-right"
                  />
                </>
              )}
            />
          </div>
        )}
      />

      <form.Field
        name="feet"
        children={(field: any) => (
          <div className="md:col-span-1">
            <form.Subscribe
              selector={(state: any) => (state as { values: { symbol: string } }).values.symbol}
              children={(symbol: any) => (
                <>
                  <label className="block text-[9px] font-mono uppercase tracking-[0.1em] text-nd-bg/60 mb-1 ml-2 mt-1">
                    {symbol === 'transportation' ? 'Dist(ft)' : 'Feet'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    className="h-10 bg-nd-ink text-nd-bg border-none hover:bg-white/5 placeholder:text-nd-bg/30 font-mono text-xs focus-visible:ring-0 text-right"
                  />
                </>
              )}
            />
          </div>
        )}
      />

      <div className="md:col-span-2">
        <form.Subscribe
          selector={(state: any) =>
            [
              state.canSubmit,
              state.isSubmitting,
              (state as { values: { description: string } }).values.description,
            ] as const
          }
          children={([canSubmit, isSubmitting, description]: any) => (
            <Button
              type="submit"
              disabled={
                !canSubmit || isSubmitting || externalPending || !(description as string).trim()
              }
              className="w-full h-10 bg-nd-accent text-nd-bg hover:bg-nd-accent/90 font-mono text-[10px] tracking-[0.15em] uppercase border-none disabled:bg-nd-bg/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting || externalPending ? 'Adding...' : 'Add Step'}
            </Button>
          )}
        />
      </div>
    </form>
  )
}
