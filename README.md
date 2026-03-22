# Orbi

AI agent for business management. Fork of [OpenCode](https://github.com/anomalyco/opencode).

## Install

```bash
# CLI (from source)
cd packages/orbi
bun run script/build.ts --single
```

## Usage

```bash
# Terminal UI
orbi

# Web UI
orbi web

# Headless server
orbi serve --port 4096
```

## Build Desktop

```bash
# Mac/Windows/Linux (Tauri)
cd packages/desktop
cargo tauri build
```

## Stack

- **Runtime:** Bun
- **LLM:** Vercel AI SDK (20+ providers)
- **Server:** Hono
- **UI:** Solid.js
- **Desktop:** Tauri
- **Database:** SQLite (Drizzle ORM)

## License

MIT
