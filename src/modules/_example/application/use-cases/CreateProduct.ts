/**
 * CreateProduct Use Case — Application Layer
 *
 * Handles creating a new product with validation.
 * Demonstrates how use cases validate input and delegate to domain entities.
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import { Product } from '../../domain/entities/Product'
import type { ProductRepository } from '../ports/ProductRepository'

export interface CreateProductInput {
  name: string
  sku: string
  price: number
  quantity: number
}

export class CreateProduct {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const now = new Date()

    // Domain entity handles validation via factory method
    // If input is invalid, Product.create() throws a domain error
    const product = Product.create({
      id: crypto.randomUUID(),
      name: input.name,
      sku: input.sku,
      price: input.price,
      quantity: input.quantity,
      createdAt: now,
      updatedAt: now,
    })

    await this.productRepository.save(product)

    return product
  }
}
