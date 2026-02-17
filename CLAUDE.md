# PackVid

## Tech Stack
- **Electron** (latest) — Desktop shell
- **React 18** — UI library
- **Vite 5** — Build tool / dev server
- **TypeScript 5** — Type safety
- **Tailwind CSS v4** — Styling (Dark Mode OLED)
- **shadcn/ui + Radix UI** — Accessible UI primitives (`src/components/ui/`)
- **motion** (framer-motion) — Sidebar slide animation
- **Drizzle ORM + better-sqlite3** — Database
- **Lucide React** — SVG icons
- **Fira Sans / Fira Code** — Typography
- **pnpm** — Package manager

## Clean Architecture

> **ALL code MUST follow Clean Architecture. Outer layers depend on inner layers, never the reverse.**

```
Presentation (React components, hooks)       → depends on ↓
Application  (use cases, ports/interfaces)   → depends on ↓
Domain       (entities, value objects, rules) → depends on NOTHING
Infrastructure (SQLite, file system, IPC)    → implements Application ports
```

| Layer | Contents | Depends On | Location |
|---|---|---|---|
| **Domain** | Entities, value objects, domain errors, business rules | Nothing (pure TS) | `src/modules/<feature>/domain/` |
| **Application** | Use cases, port interfaces, DTOs | Domain only | `src/modules/<feature>/application/` |
| **Infrastructure** | Repository impls (Drizzle), IPC handlers, external APIs | Application + Domain | `src/modules/<feature>/infrastructure/` or `electron/ipc/` |
| **Presentation** | React components, hooks, pages | Application + Domain | `src/modules/<feature>/presentation/` |

### Key Rules
1. **Domain layer is PURE** — no imports from React, Electron, Drizzle, or any framework
2. **Use cases orchestrate** — they call repository ports to get/save data
3. **Repositories are interfaces** — defined in `application/ports/`, implemented in Infrastructure
4. **UI calls use cases** — React hooks wrap use cases, components use hooks
5. **IPC is infrastructure** — Electron IPC handlers are adapters, not business logic
6. **Ports are broader than repos** — any external capability interface lives in `ports/`

## Module Structure

```
src/modules/<feature>/
├── domain/
│   ├── entities/         # Core business objects
│   ├── value-objects/    # Immutable typed values (optional)
│   ├── errors/           # Domain-specific errors
│   └── rules/            # Business rule functions (optional)
├── application/
│   ├── ports/            # Interfaces (contracts)
│   ├── use-cases/        # Application logic
│   └── dto/              # Data transfer objects (optional)
├── infrastructure/
│   └── drizzle-<feature>-repository.ts
└── presentation/
    ├── hooks/use<Feature>.ts
    ├── components/<Component>.tsx
    └── <Feature>View.tsx  # Page-level component (optional)
```

See `src/modules/_example/` for a complete reference implementation.

## Project Structure

```
PackVid/
├── electron/                # Electron main process
│   ├── main.ts              # Entry point, window creation
│   ├── preload.ts           # IPC bridge to renderer
│   └── ipc/                 # IPC handlers (infrastructure adapters)
├── src/                     # React frontend (renderer)
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Root component with routing
│   ├── index.css            # Tailwind v4 @theme + global styles
│   ├── components/ui/       # shadcn/ui components (auto-generated)
│   ├── lib/utils.ts         # cn() helper for shadcn class merging
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
│   └── db/schema.ts         # Drizzle ORM schema definitions
├── storage/                 # Local video storage (gitignored)
└── database/                # SQLite database (gitignored)
```

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Directories | lowercase-dashes | `video-library/` |
| Component files | PascalCase | `CameraFeed.tsx` |
| Hook files | camelCase, `use` prefix | `useCamera.ts` |
| Entity files | PascalCase | `Order.ts` |
| Use case files | PascalCase, action name | `CreateRecording.ts` |
| Port/interface files | PascalCase | `RecordingRepository.ts` |
| Infrastructure files | kebab-case, prefix | `drizzle-recording-repository.ts` |

## Coding Rules

- Functional components only (no class components)
- Custom hooks wrap use cases (`presentation/hooks/`)
- Prefer composition over prop drilling
- Use TypeScript interfaces for component props
- Use named exports for components
- Write clean, maintainable code with proper TypeScript types
- Implement proper error handling and loading states

## Styling (Tailwind CSS v4)

- Use Tailwind utility classes for all styling
- Custom theme tokens defined in CSS via `@theme` directive
- Use `rounded-md` for border radius (consistent)
- Use semantic color names (`surface`, `primary`, `success`, `danger`, `warning`)
- No emojis as icons — use Lucide React
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json` + `vite.config.ts`)

## UI Components (shadcn/ui)

- shadcn components live in `src/components/ui/` — **do not manually edit** these files
- Add new components via `pnpm dlx shadcn@latest add <component>`
- Config: `components.json` (style: new-york, base color: slate, Tailwind CSS variables: on)
- Installed: `collapsible`, `dropdown-menu`, `tooltip`
- Use `cn()` from `@/lib/utils` for conditional class merging

## UI Quality Rules

### Icons & Visuals
- No emoji icons — use SVG icons (Lucide React)
- Consistent icon sizing: fixed viewBox (24x24) with `w-6 h-6`
- Hover states must not cause layout shift (use color/opacity, not scale)

### Interaction
- Add `cursor-pointer` to all clickable/hoverable elements
- Provide visual hover feedback (color, shadow, border)
- Smooth transitions: `transition-colors duration-200` (150-300ms range)
- Focus states visible for keyboard navigation

### Contrast
- Light mode text: minimum 4.5:1 contrast ratio
- Glass/transparent elements must be visible in light mode (`bg-white/80`+)
- Borders visible in both modes
- Muted text: `slate-600` minimum in light mode

### Layout
- Floating elements: proper spacing from edges
- No content hidden behind fixed navbars
- Consistent `max-w` across sections
- Responsive: test at 375px, 768px, 1024px, 1440px

## Electron IPC

- All main process communication through `preload.ts` IPC bridge
- Use `ipcRenderer.invoke()` for async operations
- Keep IPC handlers in `electron/ipc/` organized by domain
- Never expose Node.js APIs directly to renderer
- IPC handlers are infrastructure adapters — they should call use cases

## Language

- **UI text**: Vietnamese
- **Code** (comments, variables, types): English

## Git Conventions

- **Format**: Conventional commits — `<type>: <description>`
- **Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- **Rules**: imperative mood ("add" not "added"), first line under 72 chars
- **Safety**: NEVER force push, hard reset, or skip hooks without explicit request
- Always review changes before staging; warn about sensitive files (.env, credentials)

## Debugging Discipline

1. **No fixes without root cause** — investigate before proposing solutions
2. **Trace backward** — follow the call chain to the original trigger, fix at source
3. **Verify with evidence** — run the command, read the output, THEN claim the result
4. **Defense-in-depth** — validate at every layer data passes through (entry, business logic, environment, logging)
5. **3+ failed fixes** — stop and question the architecture, don't attempt another patch

## Memory & Documentation

- **Before exploring**: check existing docs first (`grep -ri "topic" --include="*.md"`)
- **After discovering**: write findings into the codebase (inline docs, header comments, or README files)
- Storage format: JSDoc for functions, header comments for files, `{module}.README.md` for modules with 4+ files
- Keep docs short, link to code with `file.ts:functionName`, commit docs with code

## Testing

- Manual testing with physical cameras for recording features
- Create failing test cases before fixing bugs
- Verify fix with fresh test run before claiming success
