#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Orphan Asset Audit — UI Extension deployment script
#
# Usage:
#   ./deploy.sh <pim-url> <api-token>
#
# Example:
#   ./deploy.sh https://my-company.cloud.akeneo.com eyJ0eXAiOiJKV1Q...
#
# The script will:
#   1. Create the UI Extension on your PIM instance
#   2. Print the UUID of the newly created extension
#
# After running, set the `allowed_asset_families` custom variable in the PIM
# UI (Connect → UI Extensions → Orphan Asset Audit → Configure) to restrict
# which asset families appear in the audit dropdown, e.g.:
#   ["packshots", "user_guides"]
#
# Requirements: curl
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: ./deploy.sh <pim-url> <api-token>"
  echo "Example: ./deploy.sh https://my-company.cloud.akeneo.com eyJ0eXAiOiJKV1Q..."
  exit 1
fi

PIM_URL="${1%/}"   # strip trailing slash
API_TOKEN="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Deploying Orphan Asset Audit to ${PIM_URL} ..."

RESPONSE=$(curl -s -X POST \
  "${PIM_URL}/api/rest/v1/ui-extensions" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -F "name=akeneo_orphan_audit" \
  -F "type=sdk_script" \
  -F "position=pim.activity.navigation.tab" \
  -F "file=@${SCRIPT_DIR}/akeneo-orphan-audit.js;type=application/javascript" \
  -F "configuration[default_label]=Orphan Asset Audit" \
  -F "configuration[labels][en_US]=Orphan Asset Audit" \
  -F "configuration[labels][fr_FR]=Audit des assets orphelins" \
  -F "configuration[labels][de_DE]=Audit verwaister Assets" \
  -F "configuration[labels][es_ES]=Auditoría de assets huérfanos" \
  -F "configuration[labels][it_IT]=Audit degli asset orfani")

# Extract UUID from response
UUID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('uuid',''))" 2>/dev/null || true)

if [ -z "$UUID" ]; then
  echo "Deployment may have failed. Full response:"
  echo "$RESPONSE"
  exit 1
fi

echo "✓ Extension created successfully."
echo "  UUID: ${UUID}"
echo ""
echo "Next step: set the 'allowed_asset_families' custom variable in the PIM:"
echo "  Connect → UI Extensions → Orphan Asset Audit → Configure"
echo "  e.g. [\"packshots\", \"user_guides\"]"
