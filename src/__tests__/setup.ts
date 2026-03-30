import { beforeAll, afterAll, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'
import { trpcRouter } from '../integrations/trpc/router'

// Use an in-memory SQLite database for fast isolated tests
let sqlite = new Database(':memory:')
export let db = drizzle(sqlite, { schema })

beforeAll(() => {
  // Create all tables in the in-memory database
  // The sqlite driver allows running multi-statement strings
  // but it's simpler to do it table by table or export schema:
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS organization_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE UNIQUE INDEX IF NOT EXISTS org_membership_org_user_uq ON organization_memberships(organization_id, user_id);

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      created_by_user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      completed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      invited_by_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_by_user_id TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS wdc_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      snapshot_date INTEGER,
      hours_threshold INTEGER NOT NULL DEFAULT 40,
      share_token TEXT UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS wdc_employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wdc_chart_id INTEGER NOT NULL REFERENCES wdc_charts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      fte TEXT NOT NULL DEFAULT '1.0',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wdc_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wdc_chart_id INTEGER NOT NULL REFERENCES wdc_charts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wdc_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wdc_chart_id INTEGER NOT NULL REFERENCES wdc_charts(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES wdc_employees(id) ON DELETE CASCADE,
      activity_id INTEGER NOT NULL REFERENCES wdc_activities(id) ON DELETE CASCADE,
      task_name TEXT NOT NULL,
      hours_per_week INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS process_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      start_point TEXT,
      end_point TEXT,
      storage_warn_minutes INTEGER NOT NULL DEFAULT 480,
      distance_warn_feet INTEGER NOT NULL DEFAULT 200,
      share_token TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS process_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_chart_id INTEGER NOT NULL REFERENCES process_charts(id) ON DELETE CASCADE,
      sequence_number INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      description TEXT NOT NULL,
      who TEXT,
      minutes INTEGER,
      feet INTEGER
    );

    CREATE TABLE IF NOT EXISTS step_annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_id INTEGER NOT NULL REFERENCES process_steps(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `)
})

afterEach(() => {
  // Clear tables between tests (in dependency order)
  sqlite.exec(`
    DELETE FROM audit_logs;
    DELETE FROM step_annotations;
    DELETE FROM process_steps;
    DELETE FROM process_charts;
    DELETE FROM wdc_tasks;
    DELETE FROM wdc_activities;
    DELETE FROM wdc_employees;
    DELETE FROM wdc_charts;
    DELETE FROM units;
    DELETE FROM invitations;
    DELETE FROM todos;
    DELETE FROM organization_memberships;
    DELETE FROM organizations;
    DELETE FROM users;
  `)
})

afterAll(() => {
  sqlite.close()
})

// Helper to create an authenticated tRPC router caller
export function createTestCaller(user: { id: string; name?: string; email?: string } | null) {
  const ctx = {
    db,
    user: user ? { ...user, name: user.name || 'Test', email: user.email || 'test@example.com', emailVerified: true, image: null, createdAt: new Date(), updatedAt: new Date() } : null,
    session: user ? { id: 'test', token: 'test', userId: user.id } as any : null,
    req: new Request('http://localhost'),
  }
  
  return trpcRouter.createCaller(ctx)
}
