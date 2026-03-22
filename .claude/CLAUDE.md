# Orbi

Fork do OpenCode renomeado para **Orbi**. Agente de IA para gestao empresarial.

- **Repo:** https://github.com/arqxus-flow/Aqxus_Agent
- **Branch:** main
- **Namespace:** @orbi
- **Runtime:** Bun
- **Log de mudancas:** FORK_LOG.md (gitignored, local)

## Stack

Bun + TypeScript + Hono (server) + Solid.js (UI) + Drizzle ORM (SQLite) + Vercel AI SDK (LLM) + Zod (validacao) + Tauri/Electron (desktop)

## Commands

- `cd packages/orbi && bun run script/build.ts --single` — build CLI (binario nativo)
- `cd packages/orbi && bun typecheck` — typecheck (nunca do root)
- `cd packages/orbi && bun test` — testes (nunca do root)
- `bun install` — instalar dependencias
- `cd knowledge && npm run seed -- /Users/arthuraquino/opencode` — reseed Cortex Graph
- Release manual: GitHub Actions → publish → Run workflow → digitar versao
- Release por tag: `git tag v0.0.3 && git push origin v0.0.3` (CI dispara automatico)
- Web dev: `./packages/orbi/dist/orbi-darwin-arm64/bin/orbi web` + `cd packages/app && bun dev`

## Estrutura principal

```
packages/orbi/       → Core (CLI + servidor + agentes + tools + loop principal)
packages/app/        → Web UI (Solid.js, compartilhada entre web e desktop)
packages/desktop/    → Desktop Tauri (Mac/Win/Linux)
packages/desktop-electron/ → Desktop Electron
packages/ui/         → Componentes UI compartilhados
packages/sdk/        → SDK cliente TypeScript
packages/plugin/     → Sistema de plugins
packages/util/       → Utilitarios
packages/web/        → Site docs (Astro)
```

## Nao faca

- NAO buildar ou rodar typecheck/testes do root — sempre de dentro do package
- NAO renomear pacotes externos no rebrand (ex: `@gitlab/opencode-gitlab-auth`)
- NAO mexer em `packages/enterprise` ou `packages/function` por enquanto
- NAO commitar sem rodar build antes
- NAO fazer push sem `--no-verify` se husky bloquear por packages removidos

## Fluxo de Trabalho

### Classificacao
- **Simples** — fix, chore, mudanca isolada (1 arquivo, sem planning)
- **Medio** — feature auto-contida, refactor localizado (plan mode primeiro)
- **Grande** — feature complexa, multiplas partes

### Simples
1. Implementar direto
2. Build: `cd packages/orbi && bun run script/build.ts --single`
3. Commit + push

### Medio
1. Plan mode — explorar codigo, desenhar approach
2. Implementar
3. Build + typecheck
4. Atualizar docs (CLAUDE.md, rules, FORK_LOG.md) se necessario
5. Commit + push

### Grande
1. Plan mode — desenhar plano completo
2. Implementar em etapas (commit por etapa)
3. Build + typecheck a cada etapa
4. Atualizar docs
5. Push

## Regras Git

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
- Commitar frequente, mudancas pequenas
- Push com `--no-verify` se husky bloquear
- Atualizar FORK_LOG.md com o que foi feito

## Cortex Graph (contexto automatico)

Hooks em `.claude/settings.local.json` injetam contexto do Cortex Graph API automaticamente:
- **PreToolUse (Read/Edit/Write):** consulta imports e dependentes do arquivo sendo editado
- **PostToolUse (Edit/Write):** sincroniza grafo apos mudancas

Top arquivos por PageRank (hub central do codigo):
- `packages/orbi/src/project/instance.ts` (111 conexoes)
- `packages/orbi/src/config/config.ts` (configuracao)
- `packages/orbi/src/session/prompt.ts` (loop principal do agente)
- `packages/orbi/src/agent/agent.ts` (definicao de agentes)
- `packages/orbi/src/tool/registry.ts` (registro de tools)

## Bugs corrigidos

- **Desktop markdown tables**: nativeParser desativado em Electron e Tauri. Usa jsParser (igual web). Commit 90dc0a8c8
