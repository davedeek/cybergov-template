import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

export function useMutationHandler() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMutation = useCallback(async <T>(
    mutationFn: () => T | Promise<T>,
    options?: {
      onSuccess?: (data: T) => void | Promise<void>
      onError?: (error: unknown) => void
      onSettled?: () => void
      label?: string
    }
  ) => {
    setIsPending(true)
    setError(null)
    const label = options?.label || 'Mutation'
    
    try {
      logger.info(`[Mutation Started]: ${label}`)
      const result = await Promise.resolve(mutationFn())

      // Handle the case where the mutation itself returns an error object (e.g. better-auth)
      if (result && typeof result === 'object' && ('error' in result) && result.error) {
        const err = result.error as { message?: string }
        const message = err.message || 'Operation failed'
        logger.error(`[Mutation Error]: ${label}`, message)
        setError(message)
        options?.onError?.(err)
        return { error: { message } }
      }

      logger.info(`[Mutation Success]: ${label}`)
      await options?.onSuccess?.(result)
      return result
    } catch (err: unknown) {
      logger.error(`[Mutation Error]: ${label}`, err)

      // Extract human-readable error message
      let message = 'An unexpected error occurred'
      if (typeof err === 'string') message = err
      else if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') message = (err as { message: string }).message
      else if (err && typeof err === 'object' && 'error' in err) {
        const inner = (err as { error: unknown }).error
        if (inner && typeof inner === 'object' && 'message' in inner && typeof (inner as { message: unknown }).message === 'string') {
          message = (inner as { message: string }).message
        }
      }

      setError(message)
      options?.onError?.(err)
      return { error: { message } }
    } finally {
      setIsPending(false)
      options?.onSettled?.()
      logger.info(`[Mutation Settled]: ${label}`)
    }
  }, [])

  return { isPending, error, handleMutation }
}
