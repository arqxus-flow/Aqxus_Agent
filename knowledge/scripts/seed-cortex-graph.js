/**
 * @file seed-cortex-graph.js
 * @description Popula o Cortex Graph API com nos File + relacoes IMPORTS de um projeto.
 *              Substitui o seed-graph.js (Neo4j) pelo graph edge-native.
 *
 * Uso: CORTEX_API_KEY=xxx node seed-cortex-graph.js /caminho/para/projeto
 */

const fs = require('fs');
const path = require('path');

// =====================================================
// CONFIG
// =====================================================

const API_URL = process.env.CORTEX_API_URL || 'https://cortex-graph.arqxus.workers.dev';
const API_KEY = process.env.CORTEX_API_KEY || process.env.CORTEX_GRAPH_API_KEY;
const PROJECT_DIR = path.resolve(process.argv[2] || '.');
const SCAN_DIRS = ['src', 'worker', 'test', 'tests'];

if (!API_KEY) {
  console.error('Erro: CORTEX_API_KEY nao definida');
  console.error('Uso: CORTEX_API_KEY=xxx node seed-cortex-graph.js /caminho/para/projeto');
  process.exit(1);
}

// =====================================================
// HELPERS (mesma logica do seed-graph.js)
// =====================================================

function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getDescription(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/@description\s+(.+)/);
  return match ? match[1].trim() : null;
}

function getFileType(relPath) {
  if (relPath.startsWith('test/') || relPath.startsWith('tests/')) return 'test';
  if (relPath.startsWith('worker/routes/') || relPath.startsWith('src/routes/')) return 'route';
  if (relPath.startsWith('worker/schemas/') || relPath.startsWith('src/schemas/')) return 'schema';
  if (relPath.startsWith('worker/durable-objects/') || relPath.startsWith('src/durable-objects/')) return 'durable-object';
  if (relPath.startsWith('src/workflows/')) return 'workflow';
  if (relPath.startsWith('worker/lib/') || relPath.startsWith('src/lib/')) return 'lib';
  if (relPath.startsWith('src/components/')) return 'component';
  if (relPath.startsWith('src/hooks/')) return 'hook';
  if (relPath.startsWith('src/types/')) return 'type';
  return 'config';
}

function getEntity(relPath) {
  const patterns = [
    { regex: /^(?:worker|src)\/routes\/([^/]+)\//, skip: [] },
    { regex: /^(?:worker|src)\/schemas\/([^/]+)\//, skip: ['shared'] },
    { regex: /^(?:worker|src)\/lib\/([^/]+)\//, skip: ['shared'] },
    { regex: /^(?:worker|src)\/durable-objects\/([^/]+)\//, skip: [] },
    { regex: /^src\/workflows\/([^/]+)\//, skip: [] },
    { regex: /^src\/components\/([^/]+)\//, skip: ['ui', 'layout'] },
    { regex: /^src\/hooks\/([^/]+)\//, skip: ['shared'] },
    { regex: /^src\/types\/([^/]+)\//, skip: ['shared'] },
  ];
  for (const { regex, skip } of patterns) {
    const match = relPath.match(regex);
    if (match) {
      const entity = match[1];
      return skip.includes(entity) ? null : entity;
    }
  }
  return null;
}

function getExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = [];
  const namedRegex = /export\s+(?:async\s+)?(?:function|class|interface|type|const|let|enum)\s+(\w+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) exports.push(match[1]);
  const braceRegex = /export\s*\{([^}]+)\}/g;
  while ((match = braceRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => {
      const parts = n.trim().split(/\s+as\s+/);
      return (parts[parts.length - 1] || '').trim();
    }).filter(Boolean);
    exports.push(...names);
  }
  return [...new Set(exports)].sort();
}

function getImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  const regex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) imports.push(match[1]);
  return imports;
}

function loadPathAliases(projectDir) {
  const aliases = {};
  const tsconfigPath = path.join(projectDir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return aliases;
  const raw = fs.readFileSync(tsconfigPath, 'utf-8')
    .split('\n')
    .map(line => line.replace(/^\s*\/\/.*$/, ''))
    .join('\n')
    .replace(/,\s*([\]}])/g, '$1');
  try {
    const tsconfig = JSON.parse(raw);
    const paths = tsconfig?.compilerOptions?.paths || {};
    const baseUrl = tsconfig?.compilerOptions?.baseUrl || '.';
    for (const [alias, targets] of Object.entries(paths)) {
      if (!alias.endsWith('/*') || !targets[0]?.endsWith('/*')) continue;
      const prefix = alias.slice(0, -1);
      const target = path.join(baseUrl, targets[0].slice(0, -1));
      aliases[prefix] = path.normalize(target);
    }
  } catch { /* tsconfig parse failed — no aliases */ }
  return aliases;
}

const PATH_ALIASES = loadPathAliases(PROJECT_DIR);

function resolveImport(fromFile, importPath) {
  if (importPath.startsWith('cloudflare:')) return null;
  const isRelative = importPath.startsWith('.');
  const matchedAlias = Object.keys(PATH_ALIASES).find(prefix => importPath.startsWith(prefix));
  if (!isRelative && !matchedAlias) return null;
  let resolved;
  if (matchedAlias) {
    resolved = path.join(PATH_ALIASES[matchedAlias], importPath.slice(matchedAlias.length));
  } else {
    resolved = path.join(path.dirname(fromFile), importPath);
  }
  resolved = path.normalize(resolved);
  const candidates = [
    resolved + '.ts', resolved + '.tsx',
    path.join(resolved, 'index.ts'), path.join(resolved, 'index.tsx'),
    resolved,
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(PROJECT_DIR, candidate))) return candidate;
  }
  return null;
}

// =====================================================
// API CLIENT
// =====================================================

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { ...headers, 'x-confirm-destructive': 'true' },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`DELETE ${path} → ${res.status}: ${text}`);
  }
  return res.status;
}

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  const pkgPath = path.join(PROJECT_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`Erro: package.json nao encontrado em ${PROJECT_DIR}`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const projectName = pkg.name;
  const graphId = projectName; // graphId = nome do projeto

  console.log(`=== Seed Cortex Graph: ${projectName} ===`);
  console.log(`    Dir: ${PROJECT_DIR}`);
  console.log(`    API: ${API_URL}`);
  console.log(`    Graph: ${graphId}`);

  // Descricao do CLAUDE.md (linha 3)
  let projectDesc = '';
  const claudeMd = path.join(PROJECT_DIR, '.claude', 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const lines = fs.readFileSync(claudeMd, 'utf-8').split('\n');
    projectDesc = (lines[2] || '').trim();
  }

  // Step 1: Reset graph (limpa dados anteriores deste projeto)
  console.log('\n[1/5] Resetando graph...');
  try {
    await apiDelete(`/graphs/${graphId}/reset`);
    console.log('       Graph resetado');
  } catch (e) {
    console.log('       Graph novo (nada pra resetar)');
  }

  // Step 2: Coleta arquivos
  console.log('[2/5] Coletando arquivos...');
  const allFiles = [];
  for (const dir of SCAN_DIRS) {
    allFiles.push(...collectFiles(path.join(PROJECT_DIR, dir)));
  }
  allFiles.sort();
  console.log(`       ${allFiles.length} arquivos encontrados`);

  // Step 3: Cria nodes (bulk)
  console.log('[3/5] Criando nodes...');
  const start = Date.now();

  // Prepara todos os nodes (project + files)
  const fileNodes = allFiles.map(absPath => {
    const relPath = path.relative(PROJECT_DIR, absPath);
    return {
      id: relPath,
      label: 'File',
      properties: {
        path: relPath,
        directory: path.dirname(relPath),
        description: getDescription(absPath),
        type: getFileType(relPath),
        entity: getEntity(relPath),
        exports: getExports(absPath),
      },
    };
  });

  const allNodes = [
    {
      id: `project:${projectName}`,
      label: 'Project',
      properties: {
        name: projectName,
        description: projectDesc,
        root_path: PROJECT_DIR,
      },
    },
    ...fileNodes,
  ];

  // Bulk em batches de 1000 (limite da API)
  const NODE_BATCH = 1000;
  let nodesCreated = 0;
  let nodesErrors = 0;
  for (let i = 0; i < allNodes.length; i += NODE_BATCH) {
    const batch = allNodes.slice(i, i + NODE_BATCH);
    const res = await apiPost(`/graphs/${graphId}/nodes/bulk`, { nodes: batch });
    nodesCreated += res.data?.created || 0;
    nodesErrors += res.data?.errors?.length || 0;
  }
  console.log(`       ${nodesCreated} nodes criados (${nodesErrors} erros)`);

  // Step 4: Cria edges (bulk)
  console.log('[4/5] Criando edges...');

  // BELONGS_TO: File -> Project
  const belongsEdges = fileNodes.map(node => ({
    fromId: node.id,
    toId: `project:${projectName}`,
    type: 'BELONGS_TO',
  }));

  // IMPORTS: File -> File
  const importEdges = [];
  for (const absPath of allFiles) {
    const relPath = path.relative(PROJECT_DIR, absPath);
    for (const imp of getImports(absPath)) {
      const resolved = resolveImport(relPath, imp);
      if (resolved) {
        importEdges.push({
          fromId: relPath,
          toId: resolved,
          type: 'IMPORTS',
        });
      }
    }
  }

  const allEdges = [...belongsEdges, ...importEdges];
  let edgesCreated = 0;
  let edgesErrors = 0;

  // Bulk em batches de 5000 (limite da API)
  const EDGE_BATCH = 5000;
  for (let i = 0; i < allEdges.length; i += EDGE_BATCH) {
    const batch = allEdges.slice(i, i + EDGE_BATCH);
    const res = await apiPost(`/graphs/${graphId}/edges/bulk`, { edges: batch });
    edgesCreated += res.data?.created || 0;
    edgesErrors += res.data?.errors?.length || 0;
  }
  console.log(`       ${edgesCreated} edges criadas (${edgesErrors} erros)`);

  // Step 5: Property indexes (acelera queries do hook-query.js)
  console.log('[5/5] Criando property indexes...');
  const INDEXED_PROPS = ['path', 'type', 'entity', 'directory'];
  let indexesCreated = 0;
  for (const propPath of INDEXED_PROPS) {
    try {
      await apiPost(`/graphs/${graphId}/indexes`, { target: 'nodes', propPath });
      indexesCreated++;
    } catch (e) {
      // 409 = index ja existe (ok apos reset)
      if (!e.message.includes('409')) console.log(`       Erro ao criar index ${propPath}: ${e.message}`);
    }
  }
  console.log(`       ${indexesCreated} indexes criados (${INDEXED_PROPS.join(', ')})`);

  // Stats
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n============================================');
  console.log(`  Projeto:     ${projectName}`);
  console.log(`  Graph ID:    ${graphId}`);
  console.log(`  Nodes:       ${nodesCreated} (${fileNodes.length} files + 1 project)`);
  console.log(`  Edges:       ${edgesCreated} (${belongsEdges.length} belongs_to + ${importEdges.length} imports)`);
  console.log(`  Erros:       ${nodesErrors + edgesErrors}`);
  console.log(`  Tempo:       ${elapsed}s`);
  console.log('============================================');
  console.log('Seed concluido!');

  // Quick test: stats do graph
  try {
    const stats = await apiGet(`/graphs/${graphId}/stats`);
    console.log('\n[Stats da API]');
    console.log(JSON.stringify(stats.data || stats, null, 2));
  } catch (e) {
    console.log('(stats nao disponivel ainda — alarm hourly)');
  }
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
