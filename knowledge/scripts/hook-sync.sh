#!/usr/bin/env bash
# @file hook-sync.sh
# @description Hook PostToolUse — roda seed do Cortex Graph API apos editar/escrever arquivo

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Le stdin (obrigatorio para hooks) e descarta
cat > /dev/null

# Carrega .env se existir
ENV_FILE="$SCRIPT_DIR/../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Roda seed em background para nao bloquear o Claude
node "$SCRIPT_DIR/seed-cortex-graph.js" "/Users/arthuraquino/Innutri/Pipeline/Pipeline Get ERP" > /dev/null 2>&1 &

exit 0
