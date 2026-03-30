import { useState, useCallback } from 'react'

export function useMutationHandler() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMutation = useCallback(async <T>(
    mutationFn: () => T | Promise<T>,
    options?: {
      onSuccess?: (data: T) => void | Promise<void>
      onError?: (error: any) => void
      onSettled?: () => void
      label?: string
    }
  ) => {
    setIsPending(true)
    setError(null)
    const label = options?.label || 'Mutation'
    
    try {
      console.log(`[Mutation Started]: ${label}`)
      const result = await Promise.resolve(mutationFn())
      
      // Handle the case where the mutation itself returns an error object (e.g. better-auth)
      if (result && typeof result === 'object' && ('error' in result) && result.error) {
        const err = result.error as any
        const message = err.message || 'Operation failed'
        console.error(`[Mutation Error]: ${label}`, message)
        setError(message)
        options?.onError?.(err)
        return { error: { message } }
      }

      console.log(`[Mutation Success]: ${label}`, result)
      await options?.onSuccess?.(result)
      return result
    } catch (err: any) {
      console.error(`[Mutation Error]: ${label}`, err)
      
      // Extract human-readable error message
      let message = 'An unexpected error occurred'
      if (typeof err === 'string') message = err
      else if (err?.message) message = err.message
      else if (err?.error?.message) message = err.error.message
      
      setError(message)
      options?.onError?.(err)
      return { error: { message } }
    } finally {
      setIsPending(false)
      options?.onSettled?.()
      console.log(`[Mutation Settled]: ${label}`)
    }
  }, [])

  return { isPending, error, handleMutation }
}
