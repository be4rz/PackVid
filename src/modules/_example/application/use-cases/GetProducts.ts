/**
 * GetProducts Use Case — Application Layer
 *
 * Orchestrates the retrieval of products. This is WHERE business logic
 * decisions happen (e.g., filtering, validation, authorization).
 *
 * Use cases:
 * - Depend on Domain entities and Application ports (interfaces)
 * - NEVER depend on Infrastructure (no Drizzle, no SQLite, no React)
 * - Are called by Presentation hooks
 * - Call Repository ports to access data
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import type { Product } from '../../domain/entities/Product'
import type { ProductRepository, ProductFilter } from '../ports/ProductRepository'

export interface GetProductsInput {
  searchTerm?: string
  inStockOnly?: boolean
  page?: number
  pageSize?: number
}

export interface GetProductsOutput {
  products: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class GetProducts {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: GetProductsInput = {}): Promise<GetProductsOutput> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const offset = (page - 1) * pageSize

    const filter: ProductFilter = {
      searchTerm: input.searchTerm,
      inStockOnly: input.inStockOnly,
      limit: pageSize,
      offset,
    }

    // Execute both in parallel — use case orchestrates data retrieval
    const [products, total] = await Promise.all([
      this.productRepository.findAll(filter),
      this.productRepository.count(filter),
    ])

    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }
}
