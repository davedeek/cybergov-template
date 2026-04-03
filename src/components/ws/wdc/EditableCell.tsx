import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormError } from '@/components/ui/form-error'
import type { SymbolType } from '../pc/SymbolMeta'

interface EditableCellBaseProps {
  isEditing: boolean
  editForm: any
  onCommit: () => void
  onCancel: () => void
}

interface TextCellProps extends EditableCellBaseProps {
  type: 'text'
  fieldName: string
  displayValue: React.ReactNode
  autoFocus?: boolean
  inputClassName?: string
}

interface NumberCellProps extends EditableCellBaseProps {
  type: 'number'
  fieldName: string
  displayValue: React.ReactNode
  /** If set, the field only shows when the symbol matches this value */
  visibleForSymbol?: SymbolType
  inputClassName?: string
}

interface SelectCellProps extends EditableCellBaseProps {
  type: 'select'
  fieldName: string
  displayValue: React.ReactNode
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>
}

export type EditableCellProps = TextCellProps | NumberCellProps | SelectCellProps

export function EditableCell(props: EditableCellProps) {
  const { isEditing, editForm, onCommit, onCancel } = props

  if (!isEditing) return <>{props.displayValue}</>

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onCommit()
    if (e.key === 'Escape') onCancel()
  }

  if (props.type === 'select') {
    return (
      <editForm.Field
        name={props.fieldName}
        children={(field: any) => (
          <Select value={field.state.value} onValueChange={(v: string) => field.handleChange(v)}>
            <SelectTrigger className="h-7 text-xs font-mono rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              {props.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {opt.icon}
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    )
  }

  if (props.type === 'number' && props.visibleForSymbol) {
    return (
      <editForm.Subscribe
        selector={(state: any) => state.values.symbol}
        children={(symbol: string) =>
          symbol === props.visibleForSymbol ? (
            <editForm.Field
              name={props.fieldName}
              children={(field: any) => (
                <div className="relative">
                  <Input
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={props.inputClassName ?? "h-7 text-xs font-mono text-right rounded-none border-nd-border focus-visible:ring-nd-accent"}
                  />
                  <div className="absolute right-0 top-full z-20">
                    <FormError errors={field.state.meta.errors} />
                  </div>
                </div>
              )}
            />
          ) : (
            <span className="text-[11px] text-nd-ink-muted/50">—</span>
          )
        }
      />
    )
  }

  // text or number (without symbol condition)
  return (
    <editForm.Field
      name={props.fieldName}
      children={(field: any) => (
        <>
          <Input
            type={props.type}
            autoFocus={props.type === 'text' && (props as TextCellProps).autoFocus}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={
              ('inputClassName' in props && props.inputClassName)
                ? props.inputClassName
                : "h-7 text-sm rounded-none border-nd-border focus-visible:ring-nd-accent"
            }
          />
          <FormError errors={field.state.meta.errors} />
        </>
      )}
    />
  )
}
