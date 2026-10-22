#!/usr/bin/env bash
# Tests LLM_MODEL and each LLM_FALLBACK_MODELS entry from backend/.env.local. Prints no secrets.
set -a; source "$(dirname "$0")/.env.local"; set +a
for m in $LLM_MODEL ${LLM_FALLBACK_MODELS//,/ }; do
  code=$(curl -s -o /tmp/llm_check.json -w "%{http_code}" -H "Authorization: Bearer $LLM_API_KEY" -H "content-type: application/json" \
    "$LLM_BASE_URL/chat/completions" -d "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with the word OK\"}]}")
  echo "$m -> HTTP $code $(grep -o '"content": *"[^"]*"' /tmp/llm_check.json | head -1)"
done
rm -f /tmp/llm_check.json
