/**
 * @file hook-query.js
 * @description Hook PreToolUse — consulta Cortex Graph API e retorna contexto do arquivo sendo editado/lido
 */

const API_URL = process.env.CORTEX_API_URL || 'https://cortex-graph.arqxus.workers.dev';
const API_KEY = process.env.CORTEX_API_KEY || process.env.CORTEX_GRAPH_API_KEY;

async function main() {
  if (!API_KEY) process.exit(0);

  // Le input do stdin (JSON do Claude Code)
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString());

  // Extrai file_path do tool_input
  const filePath = input.tool_input?.file_path;
  if (!filePath) process.exit(0);

  // Converte path absoluto para relativo ao projeto
  const projectDir = input.cwd || process.env.CLAUDE_PROJECT_DIR || '';
  let relPath = filePath;
  if (filePath.startsWith('/')) {
    relPath = filePath.replace(projectDir + '/', '');
  }

  // Ignora arquivos fora de src/, worker/, tests/
  if (!relPath.startsWith('src/') && !relPath.startsWith('worker/') && !relPath.startsWith('test/') && !relPath.startsWith('tests/')) {
    process.exit(0);
  }

  // Detecta graphId pelo package.json do projeto
  const fs = require('fs');
  const path = require('path');
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) process.exit(0);
  const graphId = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).name;
  if (!graphId) process.exit(0);

  try {
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Busca node por prop.path (GET /nodes/:id nao funciona com / no ID)
    // + traversal out (imports) e in (dependentes) em paralelo
    const [nodeRes, importsRes, dependentsRes] = await Promise.all([
      fetch(`${API_URL}/graphs/${graphId}/nodes?prop.path=${encodeURIComponent(relPath)}`, { headers }),
      fetch(`${API_URL}/graphs/${graphId}/traverse`, {
        method: 'POST', headers,
        body: JSON.stringify({ from: relPath, direction: 'out', maxDepth: 1, edgeTypes: ['IMPORTS'] }),
      }),
      fetch(`${API_URL}/graphs/${graphId}/traverse`, {
        method: 'POST', headers,
        body: JSON.stringify({ from: relPath, direction: 'in', maxDepth: 1, edgeTypes: ['IMPORTS'] }),
      }),
    ]);

    if (!nodeRes.ok) process.exit(0);

    const nodeData = (await nodeRes.json()).data;
    if (!nodeData.nodes || nodeData.nodes.length === 0) process.exit(0);
    const node = nodeData.nodes[0];

    const imports = importsRes.ok ? (await importsRes.json()).data?.nodes || [] : [];
    const dependents = dependentsRes.ok ? (await dependentsRes.json()).data?.nodes || [] : [];

    const props = node.properties || {};
    const description = props.description;
    const type = props.type;
    const entity = props.entity;
    const fileExports = props.exports || [];

    // Impacto transitivo (traversal depth 3)
    let transitiveCount = 0;
    if (dependents.length > 0) {
      const travRes = await fetch(`${API_URL}/graphs/${graphId}/traverse`, {
        method: 'POST', headers,
        body: JSON.stringify({ from: relPath, direction: 'in', maxDepth: 3, edgeTypes: ['IMPORTS'], limit: 500 }),
      });
      if (travRes.ok) {
        const travData = (await travRes.json()).data;
        transitiveCount = travData.count || 0;
      }
    }

    // Monta contexto legivel
    const lines = [];
    lines.push(`[Graph] ${relPath}`);

    if (description) lines.push(`  "${description}" (${type}${entity ? ', entity: ' + entity : ''})`);

    if (fileExports.length > 0) {
      const MAX_EXPORTS = 10;
      const shown = fileExports.slice(0, MAX_EXPORTS);
      const remaining = fileExports.length - MAX_EXPORTS;
      lines.push(`  Exports: ${shown.join(', ')}${remaining > 0 ? ` ... +${remaining} more` : ''}`);
    }

    if (imports.length > 0) {
      lines.push(`  Imports (${imports.length}):`);
      for (const imp of imports) {
        const p = imp.node?.properties || {};
        lines.push(`    - ${imp.node?.id}${p.description ? ' → "' + p.description + '"' : ''}`);
      }
    }

    if (dependents.length > 0) {
      const label = transitiveCount > dependents.length
        ? `  Dependentes (${dependents.length} diretos, ${transitiveCount} total):`
        : `  Dependentes (${dependents.length}):`;
      lines.push(label);
      for (const dep of dependents) {
        const p = dep.node?.properties || {};
        const id = dep.node?.id || '';
        lines.push(`    - ${id} (${p.type || ''})${p.description ? ' → "' + p.description + '"' : ''}`);
      }
    }

    // Output JSON com additionalContext para PreToolUse
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: lines.join('\n'),
      },
    };
    console.log(JSON.stringify(output));
  } catch (err) {
    // Se API estiver fora, nao bloqueia — sai silenciosamente
    process.exit(0);
  }
}

main();
