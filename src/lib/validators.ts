import { z } from 'zod'

export const nameField = z
  .string()
  .trim()
  .min(2, 'Must be at least 2 characters')
  .max(255, 'Must be 255 characters or fewer')
export const emailField = z.string().trim().email('Valid email is required')
export const passwordField = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or fewer')
export const shortTextField = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(255, 'Must be 255 characters or fewer')
export const longTextField = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(2000, 'Must be 2000 characters or fewer')
export const positiveInt = z.number().int().positive('Must be a positive integer')
export const positiveFloat = z.number().positive('Must be a positive number')

// -- Process Step Form Schema --
// Used by both AddStepForm and inline editing in ProcessChartLedger
export const stepFormSchema = z.object({
  symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
  description: z.string().trim().min(3, 'Description must be at least 3 characters'),
  who: z.string().trim(),
  minutes: z.string().refine((v) => v === '' || !isNaN(Number(v)), 'Must be a number'),
  feet: z.string().refine((v) => v === '' || !isNaN(Number(v)), 'Must be a number'),
  notes: z.string().trim().optional(),
})

export type StepFormValues = z.infer<typeof stepFormSchema>

export const STEP_FORM_DEFAULTS: StepFormValues = {
  symbol: 'operation',
  description: '',
  who: '',
  minutes: '',
  feet: '',
  notes: '',
}
