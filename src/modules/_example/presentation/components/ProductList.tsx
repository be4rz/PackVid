/**
 * ProductList Component — Presentation Layer
 *
 * React component that uses the useProducts hook.
 * Components ONLY know about hooks — never about use cases or repositories directly.
 *
 * Dependency chain:
 *   ProductList → useProducts → GetProducts (use case) → ProductRepository (port)
 *                                                                ↑
 *                                        InMemoryProductRepository (infrastructure)
 *
 * @example This is part of the _example module demonstrating Clean Architecture.
 */

import { useState } from 'react'
import { Package, Plus, Search, AlertTriangle, Loader2 } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'

export function ProductList() {
  const { products, total, page, totalPages, isLoading, error, fetchProducts, addProduct } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts(1, searchTerm)
  }

  const handleAddSample = () => {
    addProduct({
      name: `Sản phẩm mẫu ${Date.now()}`,
      sku: `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      price: Math.floor(Math.random() * 500000) + 10000,
      quantity: Math.floor(Math.random() * 100),
    })
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <h3 className="text-surface-100 font-semibold text-sm">
              Sản phẩm mẫu
            </h3>
            <p className="text-surface-500 text-xs">Clean Architecture example</p>
          </div>
        </div>

        <button
          onClick={handleAddSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm mẫu
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-5 py-3 border-b border-surface-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc SKU..."
            className="w-full bg-surface-800 border border-surface-700 rounded-md pl-10 pr-4 py-2 text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-colors"
          />
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 px-3 py-2 bg-danger-500/10 border border-danger-500/20 rounded-md">
          <AlertTriangle className="w-4 h-4 text-danger-400 shrink-0" />
          <p className="text-danger-400 text-xs">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-surface-800 rounded-xl flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-surface-600" />
          </div>
          <p className="text-surface-400 text-sm mb-1">Chưa có sản phẩm</p>
          <p className="text-surface-600 text-xs">Nhấn "Thêm mẫu" để tạo sản phẩm thử</p>
        </div>
      )}

      {/* Product list */}
      {!isLoading && products.length > 0 && (
        <div className="divide-y divide-surface-800">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center px-5 py-3.5 hover:bg-surface-800/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-surface-200 text-sm font-medium truncate">
                  {product.name}
                </p>
                <p className="text-surface-500 text-xs font-mono">{product.sku}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-surface-300 text-sm font-mono">
                  {product.price.toLocaleString('vi-VN')}₫
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  product.isLowStock()
                    ? 'bg-warning-500/10 text-warning-400'
                    : product.isInStock()
                      ? 'bg-success-500/10 text-success-400'
                      : 'bg-danger-500/10 text-danger-400'
                }`}>
                  {product.isInStock() ? `Còn ${product.quantity}` : 'Hết hàng'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with pagination info */}
      {total > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-800">
          <p className="text-surface-500 text-xs">
            Tổng: {total} sản phẩm · Trang {page}/{totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => fetchProducts(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 text-xs text-surface-400 hover:text-surface-200 bg-surface-800 hover:bg-surface-700 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => fetchProducts(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 text-xs text-surface-400 hover:text-surface-200 bg-surface-800 hover:bg-surface-700 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
