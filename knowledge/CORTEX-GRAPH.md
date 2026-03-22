# Cortex Graph — Knowledge Graph

Grafo de conhecimento estruturado compartilhado entre projetos. Injeta contexto ao Claude Code via hooks — cada arquivo e um node com descricao e relacionamentos de imports.

**Backend:** Cortex Graph API — graph database edge-native em Cloudflare Workers com Durable Objects (SQLite).
**URL:** `https://cortex-graph.arqxus.workers.dev`
**Auth:** Bearer token via `CORTEX_GRAPH_API_KEY` (em `knowledge/.env`)

## Arquitetura de Contexto

O Claude Code usa camadas complementares:

| Camada | O que contem | Quando carrega |
|--------|-------------|----------------|
| **CLAUDE.md** | Visao geral, comandos, regras globais | Sempre (toda conversa) |
| **Rules** | Convencoes, padroes, gotchas por dominio | Automatico pelo `paths:` |
| **Graph (Cortex Graph API)** | Estrutura de arquivos, descricoes, imports | Via hook ao editar/ler arquivo |

## Schema do Grafo

### Nodes

**Project** (label: `Project`)
| Propriedade | Tipo | Exemplo |
|-------------|------|---------|
| `name` | string | `"orbi-chat"` |
| `description` | string | `"Plataforma de atendimento multicanal..."` |
| `root_path` | string | `"/Users/.../Aplicacao"` |

**File** (label: `File`)
| Propriedade | Tipo | Exemplo |
|-------------|------|---------|
| `path` | string | `"worker/routes/webhooks/index.ts"` |
| `directory` | string | `"worker/routes/webhooks"` |
| `description` | string / null | `"Endpoints para receber webhooks da Meta"` |
| `type` | string | `"route"` |
| `entity` | string / null | `"webhooks"` |
| `exports` | string[] | `["getConversations", "sendMessage"]` |

Valores de `type`:
- `route`, `schema`, `lib`, `durable-object` (worker)
- `component`, `hook`, `type`, `lib` (frontend)
- `test`, `config`

### Edges

| Type | De | Para | Significado |
|------|-----|------|-------------|
| `BELONGS_TO` | File | Project | Arquivo pertence ao projeto |
| `IMPORTS` | File | File | Arquivo importa outro |

## Classificacao Automatica

### type (pelo path)

| Path | Type |
|------|------|
| `tests/**` | test |
| `worker/routes/**/` | route |
| `worker/schemas/**/` | schema |
| `worker/durable-objects/**/` | durable-object |
| `worker/lib/**/` | lib |
| `src/components/**/` | component |
| `src/hooks/**/` | hook |
| `src/types/**/` | type |
| `src/lib/**/` | lib |

### entity (pelo path)

Extraido do primeiro segmento apos a pasta conhecida:
- `worker/routes/{entity}/` → entity
- `worker/schemas/{entity}/` → entity (shared → null)
- `worker/lib/{entity}/` → entity (shared → null)
- `worker/durable-objects/{entity}/` → entity
- `src/components/{entity}/` → entity (ui, layout → null)
- `src/hooks/{entity}/` → entity (shared → null)
- `src/types/{entity}/` → entity (shared → null)
- `src/lib/{entity}/` → entity (shared → null)

## Requisitos por Arquivo

Cada arquivo .ts/.tsx deve ter no topo:

```typescript
/**
 * @file Nome do arquivo
 * @description Descricao em portugues do que o arquivo faz
 */
```

O script de seed extrai `@description` automaticamente.

## Script de Seed

**Localizacao:** `knowledge/scripts/seed-cortex-graph.js`

### Como rodar

```bash
cd knowledge && npm run seed -- /caminho/para/projeto
```

### O que o script faz

1. Le `name` do `package.json` do projeto (= graphId)
2. Reseta o graph anterior (DELETE /graphs/:graphId/reset)
3. Cria nodes em bulk (POST /graphs/:graphId/nodes/bulk)
   - 1 node Project + N nodes File
4. Cria edges em bulk (POST /graphs/:graphId/edges/bulk)
   - BELONGS_TO (File → Project) + IMPORTS (File → File)
5. Cria property indexes (POST /graphs/:graphId/indexes)
   - `type`, `entity`, `directory` — acelera queries do hook-query.js
6. Imprime resumo com tempo de execucao

**Performance:** ~1.1s para ~135 nodes + ~451 edges (3 requests: reset + bulk nodes + bulk edges)

**Multi-projeto:** Cada graphId e um Durable Object isolado. Rodar seed em um projeto nao afeta outros.

## Queries Uteis (via curl)

```bash
API="https://cortex-graph.arqxus.workers.dev"
G="orbi-chat"
AUTH="Authorization: Bearer $CORTEX_GRAPH_API_KEY"

# Buscar arquivo por texto
curl -H "$AUTH" "$API/graphs/$G/search?q=webhook"

# Filtrar por entity
curl -H "$AUTH" "$API/graphs/$G/nodes?prop.entity=chat"

# Filtrar por type
curl -H "$AUTH" "$API/graphs/$G/nodes?prop.type=route"

# Vizinhos (imports + dependentes)
curl -H "$AUTH" "$API/graphs/$G/nodes/worker%2Froutes%2Fconversations%2Findex.ts/neighbours?direction=both"

# Traversal BFS (impacto de mudanca)
curl -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/graphs/$G/traverse" \
  -d '{"from":"worker/schemas/index.ts","direction":"in","maxDepth":3,"edgeTypes":["IMPORTS"]}'

# Shortest path
curl -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/graphs/$G/paths" \
  -d '{"from":"src/components/chat/ChatWindow.tsx","to":"worker/lib/shared/errors.ts","direction":"both"}'

# Stats do grafo (inclui PageRank)
curl -H "$AUTH" "$API/graphs/$G/stats"

# Pattern match: cadeia de dependencia File→IMPORTS→File→IMPORTS→File
curl -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/graphs/$G/match" \
  -d '{"pattern":[{"label":"File"},{"edge":"IMPORTS","direction":"out"},{"label":"File"},{"edge":"IMPORTS","direction":"out"},{"label":"File"}],"limit":20}'

# Pattern match: componentes que importam libs de auth
curl -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/graphs/$G/match" \
  -d '{"pattern":[{"label":"File","filter":{"type":"component"}},{"edge":"IMPORTS","direction":"out"},{"label":"File","filter":{"entity":"auth"}}],"limit":50}'

# Top nodes por PageRank (arquivos mais criticos)
curl -H "$AUTH" "$API/graphs/$G/stats" | jq '.data.pageRank.topNodes[:10]'

# Property indexes ativos
curl -H "$AUTH" "$API/graphs/$G/indexes"
```

## Checklist: Adicionar Novo Projeto

1. **Garantir `@description` nos arquivos**
   - Cada .ts/.tsx deve ter `@file` e `@description` no topo

2. **Ter `package.json` com `name`**
   - O script usa `name` como graphId

3. **Ter `.claude/CLAUDE.md`** (opcional)
   - Linha 3 e usada como descricao do node Project

4. **Ter `CORTEX_GRAPH_API_KEY` no `.env`**
   ```bash
   # knowledge/.env
   CORTEX_GRAPH_API_KEY=sua-chave-aqui
   ```

5. **Rodar o seed**
   ```bash
   cd knowledge && npm run seed -- /caminho/para/novo-projeto
   ```

6. **Configurar hooks** em `.claude/settings.json` do projeto (ver secao Hooks abaixo)

## Hooks do Claude Code

Hooks configurados em `.claude/settings.json` de cada projeto. Injetam contexto do grafo automaticamente durante o uso do Claude Code.

### Scripts

| Script | Funcao | Quando roda |
|--------|--------|-------------|
| `hook-query.js` | Consulta API e retorna imports + dependentes do arquivo | PreToolUse (Read, Edit, Write) |
| `hook-sync.sh` | Roda seed bulk em background | PostToolUse (Edit, Write) |

### Configuracao (`.claude/settings.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "export $(grep -v '^#' '/Users/arthuraquino/Innutri/Pipeline/Pipeline Get ERP/knowledge/.env' | xargs) && node '/Users/arthuraquino/Innutri/Pipeline/Pipeline Get ERP/knowledge/scripts/hook-query.js'",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "'/Users/arthuraquino/Innutri/Pipeline/Pipeline Get ERP/knowledge/scripts/hook-sync.sh'",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### Como funciona

**PreToolUse (hook-query.js):**
1. Recebe JSON do Claude Code via stdin com `tool_input.file_path`
2. Converte path absoluto para relativo ao projeto
3. Consulta API: node + vizinhos (imports e dependentes) em paralelo
4. Opcionalmente faz traversal depth 3 pra impacto transitivo
5. Retorna JSON com `additionalContext`

**PostToolUse (hook-sync.sh):**
1. Carrega `.env` com a API key
2. Roda `seed-cortex-graph.js` em background apos cada Edit/Write
3. Grafo sempre atualizado sem bloquear o Claude

### Formato de saida do hook-query.js

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "additionalContext": "[Graph] src/lib/chat/api.ts\n  \"Endpoints de listagem...\" (lib, entity: chat)\n  Exports: getConversations, sendMessage, uploadMedia\n  Imports (2):\n    - src/types/chat/index.ts\n  Dependentes (4 diretos, 6 total):\n    - src/components/chat/ChatWindow.tsx (component)"
  }
}
```

**Importante:** PreToolUse hooks nao injetam stdout como texto. Precisa retornar JSON com `hookSpecificOutput.additionalContext`. Plain stdout e descartado.

### Comportamento de fallback

- Se API estiver fora do ar: hook sai com exit 0 silenciosamente, nao bloqueia
- Se arquivo nao esta no grafo: hook sai com exit 0, sem contexto
- Se arquivo esta fora de src/, worker/, tests/: hook ignora
