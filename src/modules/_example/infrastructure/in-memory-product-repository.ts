/**
 * In-Memory Product Repository — Infrastructure Layer
 *
 * Implements the ProductRepository port (interface) from Application layer.
 * This is a simple in-memory implementation for the example module.
 *
 * In a real feature, this would use Drizzle ORM + better-sqlite3.
 * The key point: the Presentation and Application layers don't care
 * which implementation is used — they only know the interface.
 *
 * Naming convention: `<adapter>-<feature>-repository.ts`
 *   - `drizzle-recording-repository.ts` (real feature)
 *   - `in-memory-product-repository.ts` (this example)
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import { Product } from '../domain/entities/Product'
import type { ProductRepository, ProductFilter } from '../application/ports/ProductRepository'

export class InMemoryProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map()

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null
  }

  async findAll(filter?: ProductFilter): Promise<Product[]> {
    let result = Array.from(this.products.values())

    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase()
      result = result.filter(
        p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
      )
    }

    if (filter?.inStockOnly) {
      result = result.filter(p => p.isInStock())
    }

    // Pagination
    const offset = filter?.offset ?? 0
    const limit = filter?.limit ?? result.length
    result = result.slice(offset, offset + limit)

    return result
  }

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product)
  }

  async update(product: Product): Promise<void> {
    if (!this.products.has(product.id)) {
      throw new Error(`Product not found: ${product.id}`)
    }
    this.products.set(product.id, product)
  }

  async delete(id: string): Promise<void> {
    this.products.delete(id)
  }

  async count(filter?: ProductFilter): Promise<number> {
    let result = Array.from(this.products.values())

    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase()
      result = result.filter(
        p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
      )
    }

    if (filter?.inStockOnly) {
      result = result.filter(p => p.isInStock())
    }

    return result.length
  }
}
