---
paths:
  - ".github/**/*"
  - "packages/desktop/src-tauri/**/*"
  - "packages/desktop-electron/**/*"
  - "packages/orbi/script/publish.ts"
  - "packages/orbi/script/postinstall.mjs"
  - "packages/orbi/Dockerfile"
  - "install.sh"
---

# CI/CD — Build, Release e Distribuicao

## Conventions

- Release por tag: `git tag v0.0.X && git push origin v0.0.X --no-verify`
- Runners: Blacksmith (free, open source plan) — IPs dedicados, builds mais rapidos
- Binarios CLI NAO vao pro npm — vao pro GitHub Releases. npm recebe so wrapper leve
- publish.ts publica 3 pacotes no npm: @orbi/sdk, @orbi/plugin, orbi-ai
- postinstall.mjs baixa binario do GitHub Releases (abordagem esbuild/Sentry)
- Docker image: ghcr.io/arqxus-flow/orbi (Alpine + ripgrep)
- Electron desabilitado no CI (reativar quando necessario)
- Tauri e o desktop principal — 4 plataformas (mac arm64/x64, win x64, linux x64)
- Sem certificado Apple/Windows por enquanto — apps mostram aviso no OS

## Distribuicao

| Canal | Comando | Fonte |
|-------|---------|-------|
| curl | `curl -fsSL https://orbicowork.arqxus.com/install \| bash` | GitHub Releases |
| npm | `npm i -g orbi-ai` | npm (wrapper) + GitHub Releases (binario) |
| Docker | `docker run -it ghcr.io/arqxus-flow/orbi` | ghcr.io |
| Desktop | Download .dmg/.exe | GitHub Releases (Tauri) |

## Secrets no GitHub

| Secret | Obrigatorio |
|--------|-------------|
| `NPM_TOKEN` | Sim (npm publish) |
| `TAURI_SIGNING_PRIVATE_KEY` | Sim (updater) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Sim (updater) |
| `APPLE_CERTIFICATE` + relacionados | Nao (futuro, $99/ano) |

## Fluxo de Release

```
1. Fazer mudancas no codigo
2. Commit + push
3. git tag v0.0.X && git push origin v0.0.X --no-verify
4. CI dispara automaticamente:
   - version: cria draft release
   - build-cli: builda binarios (Blacksmith)
   - build-tauri: builda desktop (4 plataformas)
   - publish-npm: publica @orbi/sdk, @orbi/plugin, orbi-ai
   - build-docker: builda e pusha imagem Docker
   - finalize: undraft release
5. Release publicada com assets
```

## Gotchas

- **npm rate limit**: 25 publishes/24h por conta. NAO publicar binarios no npm — usar GitHub Releases
- **"user undefined" no npm**: e so como o npm formata erro de rate limit, nao e problema de auth
- **Blacksmith migration wizard**: pode trocar target ao inves de host na matrix. Verificar manualmente
- **% no final da chave**: `cat ~/.tauri/orbi.key` mostra `%` no final — e o prompt do zsh, NAO faz parte da chave
- **Secrets vazios**: Nunca passar secrets como env vars se podem ser vazios. Electron-builder e Tauri tentam usar e falham
- **fetch-tags no checkout**: `actions/checkout@v4` com `fetch-tags: true` conflita quando o trigger e uma tag
- **createUpdaterArtifacts**: Precisa de TAURI_SIGNING_PRIVATE_KEY. Sem a key, build falha
- **macOS Gatekeeper**: `xattr -cr /Applications/Orbi.app` ou codesign ad-hoc: `codesign --force --sign - binario`

## Web UI (Cloudflare Pages)

```
# Projeto Pages: orbi-app
# URL: orbi-app.pages.dev
# Deploy: cd packages/app && bun run build && npx wrangler pages deploy dist --project-name orbi-app
# Proxy: packages/orbi/src/server/server.ts → proxy("https://orbi-app.pages.dev")
```

## Landing Page + Install (Cloudflare Worker)

```
# Worker: orbi-worker (em /orbi-worker/)
# URL: orbicowork.arqxus.com
# /install → serve install.sh do GitHub
# / → landing page minimalista
# Deploy: cd orbi-worker && npm run deploy
```
