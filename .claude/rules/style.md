---
paths:
  - "packages/**/*.ts"
  - "packages/**/*.tsx"
---

# Style Guide — Codigo TypeScript do Orbi

## Conventions

- Nomes curtos: `cfg`, `err`, `opts`, `dir`, `root`, `pid`, `state`
- `const` sobre `let` — usar ternarios ou early returns em vez de reassignment
- Sem `else` — preferir early return
- Sem `try/catch` desnecessario
- Sem `any` — usar tipos concretos
- Bun APIs quando possivel (`Bun.file()`, `bun:sqlite`, `Bun.serve()`)
- Functional array methods (`map`, `filter`, `flatMap`) sobre `for` loops
- Snake_case em schemas Drizzle pra nomes de coluna
- Inline valores usados uma vez so
- Sem mocks em testes — testar implementacao real

## Patterns

- **Destructuring**: Evitar destructuring desnecessario, usar dot notation pra preservar contexto
  ```typescript
  // Bom
  obj.a
  obj.b
  // Ruim
  const { a, b } = obj
  ```

- **Inline values**: Reduzir variaveis intermediarias
  ```typescript
  // Bom
  const journal = await Bun.file(path.join(dir, "journal.json")).json()
  // Ruim
  const journalPath = path.join(dir, "journal.json")
  const journal = await Bun.file(journalPath).json()
  ```

## Gotchas

- **Testes do root**: Nunca rodar testes do root do repo — rodar de dentro do package (`cd packages/orbi && bun test`)
- **tsc direto**: Nunca rodar `tsc` direto — usar `bun typecheck` que configura corretamente
