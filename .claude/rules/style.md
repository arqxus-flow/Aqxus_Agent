---
description: Style guide para código no Orbi
globs: ["packages/**/*.ts", "packages/**/*.tsx"]
---

# Style Guide Orbi

- Nomes curtos: `cfg`, `err`, `opts`, `dir`, `root`
- `const` > `let`. Ternários > reassignment
- Sem `else` — early return
- Sem `try/catch` desnecessário
- Sem `any`
- Bun APIs quando possível (`Bun.file()`, `bun:sqlite`)
- Functional array methods > for loops
- Snake_case em schemas Drizzle
- Sem mocks em testes
- Inline valores usados uma vez só
