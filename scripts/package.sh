#!/usr/bin/env bash
# Builds one runnable jar with the web app bundled, for servers without Docker:
#   ./scripts/package.sh && java -jar backend/target/vaanishopai-backend-*.jar
set -euo pipefail
cd "$(dirname "$0")/.."

(cd frontend && npm ci --no-audit --no-fund && npm run build)
rm -rf backend/src/main/resources/static
cp -R frontend/dist backend/src/main/resources/static
(cd backend && mvn -B -q -DskipTests package)
echo "Built: $(ls backend/target/vaanishopai-backend-*.jar)"
