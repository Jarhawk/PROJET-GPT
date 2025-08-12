#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ADMIN_SQL="$ROOT_DIR/00_admin_only.sql"
APP_SQL="$ROOT_DIR/01_app_safe.sql"
CHECKS_SQL="$SCRIPT_DIR/checks_after.sql"
REPORT_FILE="$SCRIPT_DIR/report_apply.md"
CHECKS_OUT="$SCRIPT_DIR/checks_after.out"

have_cmd psql || fail "psql command not found"

[[ -f "$ADMIN_SQL" ]] || fail "missing $ADMIN_SQL"
[[ -f "$APP_SQL" ]] || fail "missing $APP_SQL"

safe_forbidden_patterns=(
  'create\s+extension'
  'create\s+role|alter\s+role|grant\s+.*\bto\b\s+role'
  '\bauth\\.|\bstorage\\.|\brealtime\.'
  'net\\.http_'
  'create\s+or\s+replace\s+function\s+auth\\.uid'
  'alter\s+system'
)

admin_required_patterns=(
  'create\s+extension'
  'create\s+role'
  '\bauth\.'
  'net\\.http_'
  'security\s+definer'
)

scan_forbidden() {
  local file="$1"; shift
  local pattern line
  for pattern in "$@"; do
    if line=$(grep -n -i -P "$pattern" "$file" | head -n1); then
      echo "$line"
      return 1
    fi
  done
  return 0
}

scan_required() {
  local file="$1"; shift
  local pattern
  for pattern in "$@"; do
    if grep -i -P "$pattern" "$file" >/dev/null; then
      echo "pattern '$pattern' found"
      return 0
    fi
  done
  echo "no required patterns matched"
  return 1
}

ADMIN_SCAN_MSG=$(scan_required "$ADMIN_SQL" "${admin_required_patterns[@]}")
if [[ $? -eq 0 ]]; then
  ADMIN_SCAN_RES="OK"
else
  ADMIN_SCAN_RES="KO"
fi

APP_SCAN_MSG=$(scan_forbidden "$APP_SQL" "${safe_forbidden_patterns[@]}")
if [[ $? -eq 0 ]]; then
  APP_SCAN_RES="OK"
else
  APP_SCAN_RES="KO"
fi

FINAL_EXIT=0
APPLY_00="SKIPPED"; APPLY_01="SKIPPED"; CHECKS_RESULT="SKIPPED"
APPLY_00_LOG=""; APPLY_01_LOG=""; CHECKS_LOG=""

if [[ "$ADMIN_SCAN_RES" == "OK" && "$APP_SCAN_RES" == "OK" ]]; then
  ADMIN_DSN="${SUPABASE_DB_URL_ADMIN:-${PSQL_ADMIN_DSN:-}}"
  APP_DSN="${SUPABASE_DB_URL_APP:-${PSQL_APP_DSN:-}}"
  if [[ -z "$ADMIN_DSN" ]]; then
    fail "no admin DSN provided"
  fi
  if [[ -z "$APP_DSN" ]]; then
    APP_DSN="$ADMIN_DSN"
  fi
  if [[ $DRY_RUN -eq 0 ]]; then
    APPLY_00_LOG=$(psql "$ADMIN_DSN" -v ON_ERROR_STOP=1 -f "$ADMIN_SQL" 2>&1) || { APPLY_00="KO"; FINAL_EXIT=1; }
    [[ "$APPLY_00" == "KO" ]] || APPLY_00="OK"
    APPLY_01_LOG=$(psql "$APP_DSN" -v ON_ERROR_STOP=1 -f "$APP_SQL" 2>&1) || { APPLY_01="KO"; FINAL_EXIT=1; }
    [[ "$APPLY_01" == "KO" ]] || APPLY_01="OK"
    CHECKS_LOG=$(psql "$APP_DSN" -f "$CHECKS_SQL" -o "$CHECKS_OUT" 2>&1) || { CHECKS_RESULT="KO"; FINAL_EXIT=1; }
    if [[ "$CHECKS_RESULT" != "KO" ]]; then
      CHECKS_RESULT="OK ($(wc -l < "$CHECKS_OUT") lines)"
    fi
  else
    APPLY_00="DRY-RUN"
    APPLY_01="DRY-RUN"
    CHECKS_RESULT="DRY-RUN"
  fi
else
  FINAL_EXIT=1
fi

mask_dsn() {
  local dsn="$1"
  [[ -z "$dsn" ]] && { echo "n/a"; return; }
  echo "${dsn%%://*}://***"
}

{
  echo "# Rapport d'application"
  echo "Date: $(date -u)"
  echo
  echo "## DSN"
  echo "- Admin: $(mask_dsn "${ADMIN_DSN:-}")"
  echo "- App: $(mask_dsn "${APP_DSN:-}")"
  echo
  echo "## Résultats des scans"
  echo "- 00_admin_only.sql: $ADMIN_SCAN_RES"
  [[ -n "$ADMIN_SCAN_MSG" ]] && echo "  $ADMIN_SCAN_MSG"
  echo "- 01_app_safe.sql: $APP_SCAN_RES"
  [[ -n "$APP_SCAN_MSG" ]] && echo "  $APP_SCAN_MSG"
  echo
  echo "## Application"
  echo "- 00_admin_only.sql: $APPLY_00"
  if [[ -n "$APPLY_00_LOG" && "$APPLY_00" != "OK" ]]; then
    echo '```'
    echo "$APPLY_00_LOG"
    echo '```'
  fi
  echo "- 01_app_safe.sql: $APPLY_01"
  if [[ -n "$APPLY_01_LOG" && "$APPLY_01" != "OK" ]]; then
    echo '```'
    echo "$APPLY_01_LOG"
    echo '```'
  fi
  echo
  echo "## Checks"
  echo "- checks_after.sql: $CHECKS_RESULT"
  if [[ -n "$CHECKS_LOG" && "$CHECKS_RESULT" != "OK" ]]; then
    echo '```'
    echo "$CHECKS_LOG"
    echo '```'
  fi
} > "$REPORT_FILE"

exit $FINAL_EXIT
