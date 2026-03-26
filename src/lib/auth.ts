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
  plugins: [tanstackStartCookies()],
})
