/**
 * Product Repository Port — Application Layer
 *
 * This is an INTERFACE (port). It defines WHAT the application needs,
 * not HOW it's done. The Infrastructure layer provides the implementation.
 *
 * Key principle: Application layer defines the contract,
 * Infrastructure layer fulfills it.
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import type { Product } from '../../domain/entities/Product'

export interface ProductFilter {
  searchTerm?: string
  inStockOnly?: boolean
  limit?: number
  offset?: number
}

export interface ProductRepository {
  /** Find a single product by its ID */
  findById(id: string): Promise<Product | null>

  /** Find all products matching optional filters */
  findAll(filter?: ProductFilter): Promise<Product[]>

  /** Persist a new product */
  save(product: Product): Promise<void>

  /** Update an existing product */
  update(product: Product): Promise<void>

  /** Delete a product by its ID */
  delete(id: string): Promise<void>

  /** Count total products (for pagination) */
  count(filter?: ProductFilter): Promise<number>
}
