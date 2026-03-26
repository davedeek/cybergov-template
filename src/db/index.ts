import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from './schema.ts'
import { env } from '@/lib/env'

export const db = drizzle(env.DATABASE_URL, { schema })
