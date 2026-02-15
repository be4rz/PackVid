# _example Module — Clean Architecture Reference

> **DO NOT DELETE this module.** It serves as the reference implementation
> for all future features in the PackVid project.

## Purpose

This module demonstrates the Clean Architecture pattern used in PackVid.
Every new feature module should follow this exact structure.

## Layer Map

```
_example/
├── domain/                    # Layer 1: Domain (innermost)
│   └── entities/
│       └── Product.ts         # Entity with factory methods + business rules
├── application/               # Layer 2: Application
│   ├── ports/
│   │   └── ProductRepository.ts   # Interface (contract for data access)
│   └── use-cases/
│       ├── GetProducts.ts     # Query use case with pagination
│       └── CreateProduct.ts   # Command use case with validation
├── infrastructure/            # Layer 3: Infrastructure
│   ├── in-memory-product-repository.ts    # Adapter for testing (no DB)
│   └── drizzle-product-repository.ts      # Adapter for production (SQLite)
└── presentation/              # Layer 4: Presentation (outermost)
    ├── hooks/
    │   └── useProducts.ts     # React hook (bridges architecture ↔ React)
    └── components/
        └── ProductList.tsx    # UI component (uses hook only)
```

**Shared DB files** (outside the module):
```
src/db/
├── schema.ts                  # Drizzle table definitions (products table here)
└── connection.ts              # Singleton DB connection
```

## Dependency Rule

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
  (React)      (use cases)  (entities)  (implements ports)
```

**Inner layers NEVER import from outer layers.**

## How to Create a New Feature

1. Copy this module structure for your feature
2. Replace `Product` with your domain entity
3. Add your Drizzle table to `src/db/schema.ts`
4. Define your repository port interface in `application/ports/`
5. Implement use cases in `application/use-cases/`
6. Create the real repository in `infrastructure/` (e.g., `drizzle-<feature>-repository.ts`)
7. Create hooks in `presentation/hooks/` that wire use cases
8. Build components in `presentation/components/`
9. Run `npx drizzle-kit generate` to create the migration
10. Migrations auto-apply on app startup

## Key Patterns Demonstrated

| Pattern | File | What it shows |
|---|---|---|
| Factory method | `Product.ts` | `create()` validates, `fromPersistence()` skips validation |
| Domain error | `Product.ts` | `InvalidProductError` for business rule violations |
| Repository port | `ProductRepository.ts` | Interface defined in Application, implemented in Infrastructure |
| Use case | `GetProducts.ts` | Orchestrates data retrieval with pagination |
| In-memory adapter | `in-memory-product-repository.ts` | Simple adapter for dev/testing |
| Drizzle adapter | `drizzle-product-repository.ts` | **Real DB adapter with Entity ↔ Row mapping** |
| DB schema | `src/db/schema.ts` | Drizzle table definition (decoupled from domain) |
| Hook bridge | `useProducts.ts` | Instantiates infra + use cases, manages React state |
| Component | `ProductList.tsx` | Only depends on hook, never on use cases directly |

## Entity ↔ DB Row Mapping

The Drizzle repository handles all mapping between domain entities and DB rows:

```typescript
// DB Row → Domain Entity (reading)
Product.fromPersistence({
  id: row.id,
  name: row.name,
  ...
})

// Domain Entity → DB Row (writing)
db.insert(products).values({
  id: product.id,
  name: product.name,
  ...
})
```

The domain entity knows nothing about the database.
The database schema knows nothing about business rules.
The repository adapter is the translator between them.
