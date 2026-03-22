# Orbi - Claude Code Context

## Projeto
Fork do OpenCode renomeado para **Orbi**. Agente de IA para gestão empresarial.

- **Repo:** https://github.com/arqxus-flow/Aqxus_Agent
- **Branch:** main
- **Produto:** Orbi (CLI + Web + Desktop)
- **Domínio:** orbicowork.arqxus.com
- **Namespace:** @orbi
- **Runtime:** Bun
- **Log de mudanças:** FORK_LOG.md (gitignored, local)

## Estrutura principal

```
packages/orbi/       → Core (CLI + servidor + agentes + tools)
packages/app/        → Web UI (Solid.js)
packages/desktop/    → Desktop Tauri
packages/desktop-electron/ → Desktop Electron
packages/ui/         → Componentes compartilhados
packages/sdk/        → SDK cliente
packages/plugin/     → Sistema de plugins
packages/util/       → Utilitários
```

## Build

```bash
cd packages/orbi
bun run script/build.ts --single    # compila CLI pro sistema atual
```

Binário: `packages/orbi/dist/orbi-darwin-arm64/bin/orbi`

Typecheck: `bun typecheck` (rodar de dentro do package, nunca do root)

Testes: rodar de dentro dos packages, não do root.

## Style Guide (do AGENTS.md original)

- Nomes curtos: `cfg`, `err`, `opts`, `dir`, `root`
- `const` > `let`. Ternários > reassignment
- Sem `else` — early return
- Sem `try/catch` desnecessário
- Sem `any`
- Bun APIs quando possível (`Bun.file()`, `bun:sqlite`)
- Functional array methods > for loops
- Snake_case em schemas Drizzle
- Sem mocks em testes

## Cortex Graph (contexto automático)

Hooks em `.claude/settings.local.json` injetam contexto do Cortex Graph API automaticamente:
- **PreToolUse (Read/Edit/Write):** consulta imports e dependentes do arquivo sendo editado
- **PostToolUse (Edit/Write):** sincroniza grafo após mudanças

Grafo: 951 nodes, 3.047 edges (imports entre arquivos). Top arquivos por PageRank:
- `packages/orbi/src/project/instance.ts` (hub central, 111 conexões)
- `packages/orbi/src/config/config.ts` (configuração)
- `packages/orbi/src/session/prompt.ts` (loop principal do agente)
- `packages/orbi/src/agent/agent.ts` (definição de agentes)

Reseed: `cd knowledge && npm run seed -- /Users/arthuraquino/opencode`

## Contexto do negócio

Orbi é um harness de agente para gestão empresarial:
- Cada pessoa roda Orbi local no PC
- Cloudflare faz parte assíncrona (cron, tarefas, webhooks)
- MCP servers na Cloudflare com OAuth via Access (padrão Tácito)
- Sandbox sob demanda para interfaces visuais
- Banco central (D1/Postgres) como fonte de verdade

## MCPs do Arthur (referência)

- **Pipeline ERP** (pipelinegeterp.innutri.work) — Postgres com dados do ERP Maxiprod
- **Tácito** (Arqxus/Tacito) — Files, folders, tags, search com R2/D1
- **Sandbox** (sandbox.innutri.work) — React sob demanda

## Bug conhecido

App desktop (Electron) renderiza tabelas markdown com HTML entities quebradas.
- `packages/ui/src/context/marked.tsx` — `highlightCodeBlocks()` só unescape dentro de `<pre><code>`
- `packages/ui/src/components/markdown.tsx` — `innerHTML` mantém entities escapadas
- TUI e web funcionam perfeito
