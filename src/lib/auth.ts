import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'
import { env } from './env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    usePlural: true,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    window: 60,
    max: 10,
    customRules: {
      '/sign-in/email': { window: 300, max: 5 },
      '/sign-up/email': { window: 3600, max: 3 },
    },
    storage: 'memory',
  },
  plugins: [tanstackStartCookies()],
})
