#!/usr/bin/env bash
# Team user helper for the local TideCloak dev server (Docker on :8080).
# Uses the same master admin credentials as init/tcinit.sh (init/.env.example). Prints no passwords or tokens.
#
#   bash init/team-users.sh status            who exists, who is linked to Tide, roles, pending change requests
#   bash init/team-users.sh roles             assign realm roles from TEAM below, then approve pending change requests
#   bash init/team-users.sh link <username>   make the user invitable and print a fresh Tide enrollment link (1 hour)
#   bash init/team-users.sh approve           approve all pending change requests (dev only)
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
TC="${TIDECLOAK_LOCAL_URL:-http://localhost:8080}"
REALM="${NEW_REALM_NAME:-nextjs-test}"
KC_USER="${KC_USER:-admin}"
KC_PASSWORD="${KC_PASSWORD:-password}"
# username:role[,role]
TEAM="${TEAM:-nguyen_manh_thang:requester tran_duc_phuc:approver vo_duc_anh:approver admin:requester,approver}"

command -v jq >/dev/null || { echo "Missing jq (brew install jq)"; exit 1; }

token() {
  curl -s -X POST "$TC/realms/master/protocol/openid-connect/token" \
    -d "username=$KC_USER" -d "password=$KC_PASSWORD" -d grant_type=password -d client_id=admin-cli | jq -r .access_token
}
T="$(token)"
[[ -n "$T" && "$T" != "null" ]] || { echo "Cannot get an admin token from $TC (is TideCloak running?)"; exit 1; }
A=(-H "Authorization: Bearer $T")
ADMIN="$TC/admin/realms/$REALM"

user_json() { curl -s "${A[@]}" "$ADMIN/users?username=$1&exact=true" | jq '.[0] // empty'; }

approve_all() {
  local ids n=0
  for _ in 1 2 3 4 5 6; do
    ids=$(curl -s "${A[@]}" "$ADMIN/iga/change-requests?status=PENDING" | jq -r '.[]?.id // empty')
    [[ -z "$ids" ]] && break
    for id in $ids; do
      code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${A[@]}" -H "Content-Type: application/json" -d '{}' \
        "$ADMIN/iga/change-requests/$id/approve")
      echo "  approve change request $id -> HTTP $code"; n=$((n + 1))
    done
    sleep 1
  done
  echo "Approved $n change request(s)."
}

case "${1:-status}" in
  status)
    for entry in $TEAM; do
      u="${entry%%:*}"; want="${entry#*:}"
      j="$(user_json "$u")"
      if [[ -z "$j" ]]; then echo "$u: NOT FOUND"; continue; fi
      id=$(jq -r .id <<<"$j")
      linked=$(jq -r 'if (.attributes.tideUserKey // [] | length) > 0 and (.attributes.vuid // [] | length) > 0 then "yes" else "NO" end' <<<"$j")
      invitable=$(jq -r '.attributes.tideInvitable[0] // "missing"' <<<"$j")
      roles=$(curl -s "${A[@]}" "$ADMIN/users/$id/role-mappings/realm" | jq -r '[.[].name] | join(",")')
      echo "$u: linked-to-Tide=$linked tideInvitable=$invitable realm-roles=[$roles] wanted=[$want]"
    done
    echo "Pending change requests: $(curl -s "${A[@]}" "$ADMIN/iga/change-requests?status=PENDING" | jq 'length')"
    ;;
  roles)
    for entry in $TEAM; do
      u="${entry%%:*}"; IFS=',' read -r -a want <<<"${entry#*:}"
      j="$(user_json "$u")"; [[ -z "$j" ]] && { echo "$u: NOT FOUND"; continue; }
      id=$(jq -r .id <<<"$j")
      for r in "${want[@]}"; do
        role=$(curl -s "${A[@]}" "$ADMIN/roles/$r")
        if [[ "$(jq -r '.name // empty' <<<"$role")" != "$r" ]]; then echo "  realm role '$r' does not exist"; continue; fi
        code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${A[@]}" -H "Content-Type: application/json" \
          -d "[$role]" "$ADMIN/users/$id/role-mappings/realm")
        echo "  $u += $r -> HTTP $code"
      done
    done
    approve_all
    ;;
  link)
    u="${2:?usage: link <username>}"
    j="$(user_json "$u")"; [[ -z "$j" ]] && { echo "$u: NOT FOUND"; exit 1; }
    id=$(jq -r .id <<<"$j")
    if [[ "$(jq -r '.attributes.tideInvitable[0] // ""' <<<"$j")" != "true" ]]; then
      body=$(jq '.attributes = ((.attributes // {}) + {tideInvitable: ["true"]})' <<<"$j")
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "${A[@]}" -H "Content-Type: application/json" -d "$body" "$ADMIN/users/$id")
      echo "  set tideInvitable=true -> HTTP $code"
      approve_all
    fi
    link=$(curl -s -X POST "${A[@]}" -H "Content-Type: application/json" -H "Accept: text/plain" \
      -d '["link-tide-account-action"]' "$ADMIN/tideAdminResources/get-required-action-link?userId=$id&lifespan=3600")
    echo
    echo "Enrollment link for $u (valid 1 hour). Open it ON THIS MAC in a separate Chrome window/profile:"
    echo "$link"
    echo
    echo "After the user finishes enrollment, run: bash init/team-users.sh approve   then   bash init/team-users.sh status"
    ;;
  approve) approve_all ;;
  *) sed -n '2,9p' "$0" ;;
esac
