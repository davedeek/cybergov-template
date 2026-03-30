
interface FormErrorProps {
  errors?: Array<string | { message?: string } | undefined> | null
}

export function FormError({ errors }: FormErrorProps) {
  if (!errors || errors.length === 0) return null

  return (
    <div role="alert" className="mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      {errors.map((error, idx) => {
        if (error == null) return null
        const message = typeof error === 'object' && error !== null
          ? (error as { message?: string }).message || JSON.stringify(error)
          : String(error)

        return (
          <span key={idx} className="block text-[10px] font-mono font-bold text-[#C94A1E] uppercase tracking-wider leading-tight">
            ▸ {message}
          </span>
        )
      })}
    </div>
  )
}
