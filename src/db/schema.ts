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

// ─── Recordings: Video Recording Metadata ───────────────────────
// Maps to: src/modules/recording/domain/entities/Recording.ts

export const recordings = sqliteTable('recordings', {
  id: text('id').primaryKey(),                                       // UUID
  trackingNumber: text('tracking_number').notNull(),                 // e.g. SPXVN061116275422
  carrier: text('carrier'),                                          // 'SPX' | 'GHN' | 'GHTK'
  fileKey: text('file_key').notNull(),                               // "2026/02/15/SPXVN061116275422.webm"
  fileSize: integer('file_size'),                                    // bytes (updated after recording)
  duration: integer('duration'),                                     // seconds (updated after recording)
  status: text('status').notNull().default('recording'),             // 'recording' | 'saved' | 'failed'
  lifecycleStage: text('lifecycle_stage').notNull().default('active'), // 'active' | 'archived'
  thumbnailKey: text('thumbnail_key'),                               // DEPRECATED: "2026/02/15/SPXVN061116275422.jpg"
  thumbnailData: text('thumbnail_data'),                             // base64 data URI: "data:image/jpeg;base64,..."
  originalFileSize: integer('original_file_size'),                   // bytes before compression
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
