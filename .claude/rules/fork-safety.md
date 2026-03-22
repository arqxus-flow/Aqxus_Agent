---
paths:
  - "**/*"
---

# Fork Safety — Regras globais do Orbi

## Conventions

- Ir devagar, mudancas incrementais — entender antes de mudar
- Manter maximo do original ate ter confianca
- Buildar de dentro do package: `cd packages/orbi && bun run script/build.ts --single`
- Typecheck: `bun typecheck` (de dentro do package, nunca do root)
- Testes: rodar de dentro dos packages, nao do root
- Commitar frequente, mudancas pequenas
- Prefix de commits: `chore:`, `fix:`, `feat:`, `docs:`
- Push com `--no-verify` se husky bloquear por typecheck de packages removidos
- Atualizar FORK_LOG.md com o que foi feito
- Release: Actions → publish → Run workflow → digitar versao (ex: 0.0.3)
- Web dev mode: `orbi web` (API porta 4096) + `cd packages/app && bun dev` (frontend porta 3000)

## Gotchas

- **Pacotes externos no rebrand**: Nunca renomear pacotes externos (ex: `@gitlab/opencode-gitlab-auth` e externo, nao nosso). So renomear referencias ao namespace `@orbi/` (interno)
- **bun.lock apos rebrand**: Sempre regenerar com `rm bun.lock && bun install` apos find & replace em massa
- **Patches**: Verificar `patches/` se algum patch referencia nomes antigos apos rebrand
- **Console removido**: `packages/console` foi deletado (SaaS deles). Se typecheck falhar referenciando console, verificar se algum import sobrou
- **Packages nao mexer por enquanto**: `packages/enterprise`, `packages/function` — serao removidos quando Arthur sentir confianca
- **Refs ao repo original**: `script/changelog.ts`, `script/publish.ts`, `electron-builder.config.ts` e `tauri.prod.conf.json` ainda tem refs a `anomalyco/orbi`. Nao bloqueiam CI atual mas precisam fix se forem reativados
- **Secrets vazios no CI**: Nunca passar secrets como env vars se podem ser vazios — causa falha silenciosa (electron-builder tenta assinar, tauri tenta decodar key vazia). Usar `CSC_IDENTITY_AUTO_DISCOVERY=false` ou omitir env vars
- **Electron icon.ico**: Precisa ter 256x256 minimo pra Windows. Gerar com: `magick mark-512x512.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`
- **Tauri createUpdaterArtifacts**: Desabilitado em `tauri.prod.conf.json` porque precisa de `TAURI_SIGNING_PRIVATE_KEY`. Reabilitar quando gerar keys com `cargo tauri signer generate`
- **Web UI nao embute no CLI**: `orbi web` so sobe a API (Hono). Frontend Solid.js precisa de `bun dev` separado ou do desktop (Tauri/Electron embute)
