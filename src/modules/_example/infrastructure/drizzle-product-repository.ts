/**
 * Drizzle Product Repository — Infrastructure Layer (PRODUCTION)
 *
 * This is the REAL repository that uses Drizzle ORM + SQLite.
 * It implements the same ProductRepository port as InMemoryProductRepository,
 * demonstrating how adapters are swappable.
 *
 * Key pattern: Domain Entity ↔ DB Row mapping
 * - `save()`: Domain Entity → DB row (via `db.insert`)
 * - `findById()`: DB row → Domain Entity (via `Product.fromPersistence`)
 *
 * The domain entity and use cases know NOTHING about Drizzle or SQL.
 * All that knowledge lives here, in the infrastructure layer.
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import { eq, and, gt, sql } from 'drizzle-orm'
import { Product } from '../domain/entities/Product'
import { products } from '../../../db/schema'
import { db } from '../../../db/connection'
import type { ProductRepository, ProductFilter } from '../application/ports/ProductRepository'

export class DrizzleProductRepository implements ProductRepository {

  async findById(id: string): Promise<Product | null> {
    const rows = db.select().from(products).where(eq(products.id, id)).all()

    if (rows.length === 0) return null

    // ─── DB Row → Domain Entity ───
    return Product.fromPersistence({
      id: rows[0].id,
      name: rows[0].name,
      sku: rows[0].sku,
      price: rows[0].price,
      quantity: rows[0].quantity,
      createdAt: rows[0].createdAt,
      updatedAt: rows[0].updatedAt,
    })
  }

  async findAll(filter?: ProductFilter): Promise<Product[]> {
    let query = db.select().from(products)

    const conditions = []

    if (filter?.searchTerm) {
      const term = `%${filter.searchTerm}%`
      conditions.push(
        sql`(${products.name} LIKE ${term} OR ${products.sku} LIKE ${term})`
      )
    }

    if (filter?.inStockOnly) {
      conditions.push(gt(products.quantity, 0))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const limit = filter?.limit ?? 100
    const offset = filter?.offset ?? 0

    const rows = query.limit(limit).offset(offset).all()

    // ─── DB Rows → Domain Entities ───
    return rows.map(row => Product.fromPersistence({
      id: row.id,
      name: row.name,
      sku: row.sku,
      price: row.price,
      quantity: row.quantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  }

  async save(product: Product): Promise<void> {
    // ─── Domain Entity → DB Row ───
    db.insert(products).values({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }).run()
  }

  async update(product: Product): Promise<void> {
    // ─── Domain Entity → DB Row (partial) ───
    db.update(products)
      .set({
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: product.quantity,
        updatedAt: product.updatedAt,
      })
      .where(eq(products.id, product.id))
      .run()
  }

  async delete(id: string): Promise<void> {
    db.delete(products).where(eq(products.id, id)).run()
  }

  async count(filter?: ProductFilter): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(products)

    const conditions = []

    if (filter?.searchTerm) {
      const term = `%${filter.searchTerm}%`
      conditions.push(
        sql`(${products.name} LIKE ${term} OR ${products.sku} LIKE ${term})`
      )
    }

    if (filter?.inStockOnly) {
      conditions.push(gt(products.quantity, 0))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const rows = query.all()
    return rows[0]?.count ?? 0
  }
}
