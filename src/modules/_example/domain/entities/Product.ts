/**
 * Product Entity — Domain Layer
 *
 * Pure TypeScript class. NO framework imports (no React, Electron, Drizzle).
 * Encapsulates business rules and invariants.
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 * @see /src/modules/_example/README.md
 */

export interface ProductProps {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export class Product {
  readonly id: string
  readonly name: string
  readonly sku: string
  readonly price: number
  readonly quantity: number
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: ProductProps) {
    this.id = props.id
    this.name = props.name
    this.sku = props.sku
    this.price = props.price
    this.quantity = props.quantity
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  /**
   * Factory method — validates business rules before creating.
   * This is the ONLY way to instantiate a Product.
   */
  static create(props: ProductProps): Product {
    if (props.price < 0) {
      throw new InvalidProductError('Price cannot be negative')
    }
    if (props.quantity < 0) {
      throw new InvalidProductError('Quantity cannot be negative')
    }
    if (props.name.trim().length === 0) {
      throw new InvalidProductError('Name cannot be empty')
    }
    return new Product(props)
  }

  /**
   * Reconstitute from persistence (skip validation — data is already valid).
   * Used by repository implementations when loading from DB.
   */
  static fromPersistence(props: ProductProps): Product {
    return new Product(props)
  }

  /** Business rule: check if product is in stock */
  isInStock(): boolean {
    return this.quantity > 0
  }

  /** Business rule: check if product is low stock */
  isLowStock(threshold: number = 5): boolean {
    return this.quantity > 0 && this.quantity <= threshold
  }
}

/**
 * Domain error — specific to Product domain.
 * Extends Error for standard error handling.
 */
export class InvalidProductError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidProductError'
  }
}
