/**
 * useProducts Hook — Presentation Layer
 *
 * React hook that wraps use cases and provides reactive state to components.
 * This is the BRIDGE between Clean Architecture and React.
 *
 * The hook:
 * - Instantiates the repository (infrastructure) and use cases (application)
 * - Manages React state (loading, error, data)
 * - Exposes clean API to components (no use case details leaked)
 *
 * In a real app with Electron IPC:
 * - The repository would call `window.ipcRenderer.invoke('db:products:findAll')`
 * - The IPC handler in `electron/ipc/` would use Drizzle to query SQLite
 * - The hook stays the same — only the repository implementation changes
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Product } from '../../domain/entities/Product'
import { GetProducts } from '../../application/use-cases/GetProducts'
import { CreateProduct, type CreateProductInput } from '../../application/use-cases/CreateProduct'
import { InMemoryProductRepository } from '../../infrastructure/in-memory-product-repository'
// To switch to real SQLite (via Electron IPC), swap the line above with:
// import { DrizzleProductRepository } from '../../infrastructure/drizzle-product-repository'
// Then change `new InMemoryProductRepository()` → `new DrizzleProductRepository()` below

interface UseProductsState {
  products: Product[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
}

export function useProducts(pageSize: number = 10) {
  // Infrastructure is instantiated here — easily swappable
  const repositoryRef = useRef(new InMemoryProductRepository())
  const repository = repositoryRef.current

  // Use cases are instantiated with the repository
  const getProductsRef = useRef(new GetProducts(repository))
  const createProductRef = useRef(new CreateProduct(repository))

  const [state, setState] = useState<UseProductsState>({
    products: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    error: null,
  })

  const fetchProducts = useCallback(async (page: number = 1, searchTerm?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await getProductsRef.current.execute({ page, pageSize, searchTerm })
      setState({
        products: result.products,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [pageSize])

  const addProduct = useCallback(async (input: CreateProductInput) => {
    try {
      await createProductRef.current.execute(input)
      // Refresh the list after creating
      await fetchProducts(state.page)
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to create product',
      }))
    }
  }, [fetchProducts, state.page])

  // Load initial data
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    ...state,
    fetchProducts,
    addProduct,
  }
}
