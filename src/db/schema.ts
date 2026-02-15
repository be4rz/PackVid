/**
 * Drizzle ORM Schema — Database table definitions
 *
 * This file defines ALL database tables for the app.
 * Each module's domain entities map to tables defined here.
 * The Infrastructure layer (repository adapters) handles the mapping.
 *
 * Convention:
 * - Table names: snake_case plural (e.g., products, recordings, orders)
 * - Column names: snake_case (e.g., created_at, file_size)
 * - Use `text` for IDs (UUIDs stored as strings)
 * - Use `integer` with `{ mode: 'timestamp' }` for dates
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ─── Example Module: Products ───────────────────────────────────
// Maps to: src/modules/_example/domain/entities/Product.ts

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// ─── Settings: Key-Value Store ──────────────────────────────────
// Generic settings table used by camera config, preferences, etc.

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),            // JSON-stringified
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
