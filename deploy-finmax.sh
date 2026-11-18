#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
ENV_FILE="${FINMAX_ENV_FILE:-.env}"
RUN_SEED=0
RUN_START=0
SKIP_DB=0
SKIP_TESTS=0

usage() {
  cat <<'HELP'
Usage: bash scripts/deploy-finmax.sh [options]

Options:
  --env-file PATH       Load PATH instead of .env
  --init-env            Create .env from .env.example and exit
  --seed                Run the idempotent demo seed after migrations
  --start               Start the production server after build
  --skip-db             Skip the migration and database smoke test
  --skip-tests          Skip check, lint and test (not recommended)
  -h, --help            Show this help
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --init-env)
      [[ -f .env.example ]] || { echo ".env.example not found" >&2; exit 1; }
      [[ -e .env ]] && { echo ".env already exists; refusing to overwrite it" >&2; exit 1; }
      cp .env.example .env
      echo "Created .env from .env.example. Fill private values, then rerun."
      exit 0
      ;;
    --seed) RUN_SEED=1; shift ;;
    --start) RUN_START=1; shift ;;
    --skip-db) SKIP_DB=1; shift ;;
    --skip-tests) SKIP_TESTS=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -f "$ENV_FILE" ]] || { echo "Environment file not found: $ENV_FILE. Run --init-env or provide --env-file." >&2; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(DATABASE_URL MANUS_PROJECT_ID MANUS_JWT_SECRET)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || { echo "Required environment variable is missing: $name" >&2; exit 1; }
done

command -v corepack >/dev/null || { echo "corepack is required" >&2; exit 1; }
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

if [[ "$SKIP_DB" -eq 0 ]]; then
  pnpm exec drizzle-kit migrate
  pnpm db:smoke ${RUN_SEED:+}
fi

if [[ "$RUN_SEED" -eq 1 ]]; then
  pnpm db:seed
  pnpm db:smoke -- --require-seed
fi

if [[ "$SKIP_TESTS" -eq 0 ]]; then
  pnpm check
  pnpm lint
  pnpm test
fi

pnpm build
printf '%s\n' "Fin MaX deployment preparation completed."

if [[ "$RUN_START" -eq 1 ]]; then
  exec pnpm start
fi
