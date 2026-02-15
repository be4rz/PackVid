---
description: Coding conventions and project structure for PackVid (Electron + React + Vite + Tailwind CSS)
---

# PackVid Coding Instructions

## Core Tech Stack
- Electron (latest) — Desktop shell
- React 18 — UI library
- Vite 5 — Build tool / dev server
- TypeScript 5 — Type safety
- Tailwind CSS v4 — Styling (Dark Mode OLED)
- Drizzle ORM + better-sqlite3 — Database
- Lucide React — SVG icons
- Fira Sans / Fira Code — Typography
- npm — Package manager

---

## Clean Architecture

> **ALL code MUST follow Clean Architecture principles.**
> The dependency rule: outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────────┐
│  Presentation (React components, hooks)         │  ← depends on ↓
├─────────────────────────────────────────────────┤
│  Application (use cases, ports/interfaces)      │  ← depends on ↓
├─────────────────────────────────────────────────┤
│  Domain (entities, value objects, rules)        │  ← depends on NOTHING
├─────────────────────────────────────────────────┤
│  Infrastructure (SQLite, file system, IPC)      │  ← implements ports from Application
└─────────────────────────────────────────────────┘
```

### The 4 Layers

| Layer | What goes here | Depends on | Location |
|---|---|---|---|
| **Domain** | Entities, value objects, domain errors, business rules | Nothing (pure TS) | `src/modules/<feature>/domain/` |
| **Application** | Use cases, port interfaces (repository, services), DTOs | Domain only | `src/modules/<feature>/application/` |
| **Infrastructure** | Repository implementations (Drizzle), IPC handlers, external APIs | Application + Domain | `src/modules/<feature>/infrastructure/` or `electron/ipc/` |
| **Presentation** | React components, hooks, pages | Application + Domain | `src/modules/<feature>/presentation/` |

### Why "Ports" and "Infrastructure"?

These names come from **Hexagonal Architecture** (Ports & Adapters pattern):

- **Port** = like a wall outlet shape (standardized interface). It defines *what* you need, not *how*.
  The folder `ports/` contains interfaces for all external capabilities — not just repos:
  ```
  application/ports/
  ├── ProductRepository.ts      ← data access (your "repo interface")
  ├── FileStorageService.ts     ← save/read files from disk
  ├── NotificationService.ts    ← send push notifications
  └── QRScannerService.ts       ← decode QR codes from camera
  ```
- **Infrastructure** = the wiring behind the wall (actual implementation). It holds **adapters**
  that plug into the ports and fulfill the contract using real tools (Drizzle, file system, IPC).

### Key Rules

1. **Domain layer is PURE** — no imports from React, Electron, Drizzle, or any framework
2. **Use cases orchestrate** — they call repository ports (interfaces) to get/save data
3. **Repositories are interfaces** — defined in Application (`ports/`), implemented in Infrastructure
4. **UI calls use cases** — React hooks wrap use cases, components use hooks
5. **IPC is infrastructure** — Electron IPC handlers are adapters, not business logic
6. **Ports are broader than repos** — any external capability interface lives in `ports/`

### Module Structure

Every feature follows this structure:

```
src/modules/<feature>/
├── domain/
│   ├── entities/           # Core business objects
│   │   └── <Entity>.ts
│   ├── value-objects/      # Immutable typed values (optional)
│   │   └── <ValueObject>.ts
│   ├── errors/             # Domain-specific errors
│   │   └── <Feature>Errors.ts
│   └── rules/              # Business rule functions (optional)
│       └── <rule>.ts
├── application/
│   ├── ports/              # Interfaces (contracts)
│   │   └── <Feature>Repository.ts
│   ├── use-cases/          # Application logic
│   │   └── <UseCase>.ts
│   └── dto/                # Data transfer objects (optional)
│       └── <Dto>.ts
├── infrastructure/
│   └── drizzle-<feature>-repository.ts  # Port implementation
└── presentation/
    ├── hooks/
    │   └── use<Feature>.ts
    ├── components/
    │   └── <Component>.tsx
    └── <Feature>View.tsx   # Page-level component (optional)
```

See `src/modules/_example/` for a complete reference implementation.

---

## Project Structure

```
PackVid/
├── electron/                 # Electron main process
│   ├── main.ts              # Entry point, window creation
│   ├── preload.ts           # IPC bridge to renderer
│   └── ipc/                 # IPC handlers (infrastructure adapters)
├── src/                     # React frontend (renderer)
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Root component with routing
│   ├── index.css            # Tailwind v4 @theme + global styles
│   ├── modules/             # Feature modules (Clean Architecture)
│   │   ├── _example/        # Reference module — DO NOT DELETE
│   │   ├── recording/       # Video recording feature
│   │   ├── video-library/   # Video browsing & management
│   │   └── settings/        # App configuration
│   ├── shared/              # Cross-module shared code
│   │   ├── components/      # Shared UI components
│   │   ├── hooks/           # Shared React hooks
│   │   ├── lib/             # Utility functions
│   │   └── types/           # Shared TypeScript types
│   └── db/
│       └── schema.ts        # Drizzle ORM schema definitions
├── public/                  # Static assets
├── storage/                 # Local video storage (gitignored)
└── database/                # SQLite database (gitignored)
```

---

## Coding Conventions

### General
- **ALWAYS follow Clean Architecture** (see above)
- Write clean, maintainable code with proper TypeScript types
- Focus on readability over premature optimization
- Implement proper error handling and loading states
- Use named exports for components

### Naming
- **Directories**: lowercase with dashes (e.g., `video-library/`)
- **Component files**: PascalCase (e.g., `CameraFeed.tsx`)
- **Hook files**: camelCase with `use` prefix (e.g., `useCamera.ts`)
- **Entity files**: PascalCase matching entity name (e.g., `Order.ts`)
- **Use case files**: PascalCase describing action (e.g., `CreateRecording.ts`)
- **Port/interface files**: PascalCase with suffix (e.g., `RecordingRepository.ts`)
- **Infrastructure files**: kebab-case with prefix (e.g., `drizzle-recording-repository.ts`)

### React Patterns
- Functional components only (no class components)
- Custom hooks wrap use cases (`presentation/hooks/`)
- Prefer composition over prop drilling
- Use TypeScript interfaces for component props

### Styling (Tailwind CSS v4)
- Use Tailwind utility classes for all styling
- Custom theme tokens defined in CSS via `@theme` directive
- Use `rounded-md` for border radius (consistent)
- Use semantic color names (surface, primary, success, danger, warning)
- No emojis as icons — use Lucide React

### Electron IPC
- All main process communication through preload.ts IPC bridge
- Use `ipcRenderer.invoke()` for async operations
- Keep IPC handlers in `electron/ipc/` organized by domain
- Never expose Node.js APIs directly to renderer
- IPC handlers are **infrastructure adapters** — they should call use cases

### Language
- UI text in Vietnamese (🇻🇳)
- Code comments and variable names in English
- Type/interface names in English

## Testing
- Use browser subagent for UI verification
- Manual testing with physical cameras for recording features
