#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3333}"
TMP_DIR="/tmp/lumnipsi-smoke-$$"

mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -fsS "$API_URL/health" -o "$TMP_DIR/health.json"
grep -q '"status":"ok"' "$TMP_DIR/health.json"

curl -fsS -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@lumnipsi.app","password":"LumniPsi@123"}' \
  -o "$TMP_DIR/login.json"
grep -q '"token":"' "$TMP_DIR/login.json"
sed -n 's/.*"token":"\([^"]*\)".*/\1/p' "$TMP_DIR/login.json" > "$TMP_DIR/token.txt"
read -r token < "$TMP_DIR/token.txt"

curl -fsS -X POST "$API_URL/auth/pin" \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{"pin":"4321"}' \
  -o "$TMP_DIR/pin.json"
grep -q '"verified":true' "$TMP_DIR/pin.json"
grep -q '"pinToken":"' "$TMP_DIR/pin.json"

curl -fsS -X POST "$API_URL/portal/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"portal.helena@example.com","password":"Portal@123"}' \
  -o "$TMP_DIR/portal.json"
grep -q '"token":"' "$TMP_DIR/portal.json"

echo "Smoke API OK"
