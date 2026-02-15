# 📦 PackVid — Packing Video Recorder

Video recording app for e-commerce packing — scan a shipping label QR, record the packing process, and keep evidence linked to each order.

Built for personal use with **Shopee SPX Express** labels.

## Features

- 🎥 **Dual Camera Display** — Scanner + Recorder feeds with camera selection
- 📱 **QR / Barcode Scanning** — Auto-detect tracking numbers from shipping labels *(in progress)*
- 🎬 **Video Recording** — Record packing process linked to scanned orders *(planned)*
- 🔊 **Voice Notifications** — TTS announcements for recording state changes *(planned)*
- 📚 **Video Library** — Browse, search, and manage stored recordings *(planned)*
- ♻️ **Lifecycle Management** — Auto-cleanup rules for old videos *(planned)*
- 🌗 **Light / Dark Mode** — System preference, manual toggle, OLED dark theme

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron |
| Frontend | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS v4 |
| Database | Drizzle ORM + SQLite (better-sqlite3) |
| Icons | Lucide React |
| Fonts | Fira Sans / Fira Code |
| Architecture | Clean Architecture (Domain → Application → Infrastructure → Presentation) |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (Electron + Vite HMR)
npm run dev

# Build for production
npm run build
```

## Project Structure

```
PackVid/
├── electron/              # Electron main process
│   ├── main.ts            # App lifecycle, window creation
│   ├── preload.ts         # IPC bridge (contextBridge)
│   ├── db.ts              # Drizzle ORM + SQLite singleton
│   └── ipc/               # IPC handlers (infrastructure)
├── src/                   # React renderer
│   ├── App.tsx            # Routes (react-router)
│   ├── index.css          # Tailwind v4 theme (light/dark vars)
│   ├── views/             # Page components
│   ├── shared/            # Cross-module hooks, components, types
│   ├── modules/           # Feature modules (Clean Architecture)
│   │   └── _example/      # Reference module (DO NOT DELETE)
│   └── db/
│       └── schema.ts      # Drizzle ORM table definitions
├── storage/               # Local video storage (gitignored)
└── database/              # SQLite file (gitignored)
```

## Architecture

All code follows **Clean Architecture** with 4 layers:

```
┌────────────────────────────────────────┐
│  Presentation (React components/hooks) │
├────────────────────────────────────────┤
│  Application (use cases, ports)        │
├────────────────────────────────────────┤
│  Domain (entities, business rules)     │  ← depends on NOTHING
├────────────────────────────────────────┤
│  Infrastructure (SQLite, IPC, APIs)    │  ← implements ports
└────────────────────────────────────────┘
```

See `src/modules/_example/` for a reference implementation.

## UI Language

🇻🇳 Vietnamese — all user-facing text is in Vietnamese.

## License

MIT
