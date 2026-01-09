#!/bin/bash
# ============================================================================
# CCP-06 Branded Reports - Curl Smoke Test (Alternative)
# ============================================================================
# Usage:
#   bash smoke-test.sh -t "YOUR_AUTH_TOKEN" -w "workspace-id"
# ============================================================================

AUTH_TOKEN="${AUTH_TOKEN:-}"
WORKSPACE_ID="${WORKSPACE_ID:-test-workspace-123}"
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--token) AUTH_TOKEN="$2"; shift 2 ;;
        -w|--workspace) WORKSPACE_ID="$2"; shift 2 ;;
        -b|--base-url) BASE_URL="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ No auth token provided!"
    echo "   Usage: bash smoke-test.sh -t 'YOUR_TOKEN' -w 'workspace-id'"
    exit 1
fi

echo "🚀 CCP-06 Branded Reports - Curl Smoke Test"
echo "=========================================="
echo ""

# Headers
HEADERS=(-H "Content-Type: application/json" -H "Authorization: Bearer $AUTH_TOKEN")

# 1. CREATE
echo "1️⃣  CREATE Branded Report"
echo "   POST $BASE_URL/api/workspaces/$WORKSPACE_ID/branded-reports"

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/workspaces/$WORKSPACE_ID/branded-reports" \
    "${HEADERS[@]}" \
    -d '{
        "name": "Test Report",
        "projection": {
            "parcel_id": "test-001",
            "location": {"lat": 40.7128, "lng": -74.0060},
            "intent": "appraisal"
        },
        "branding": {
            "logo_url": "https://example.com/logo.png",
            "primary_color": "#FF0000",
            "secondary_color": "#00FF00",
            "footer_text": "Test Footer"
        }
    }')

echo "$CREATE_RESPONSE" | jq '.'

REPORT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "   📌 Report ID: $REPORT_ID"
echo ""

# 2. ACTIVATE
echo "2️⃣  ACTIVATE Report"
echo "   POST $BASE_URL/api/workspaces/$WORKSPACE_ID/branded-reports/$REPORT_ID/activate"

ACTIVATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/workspaces/$WORKSPACE_ID/branded-reports/$REPORT_ID/activate" \
    "${HEADERS[@]}")

echo "$ACTIVATE_RESPONSE" | jq '.'
echo ""

# 3. LIST
echo "3️⃣  LIST Branded Reports"
echo "   GET $BASE_URL/api/workspaces/$WORKSPACE_ID/branded-reports"

LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/workspaces/$WORKSPACE_ID/branded-reports" \
    "${HEADERS[@]}")

echo "$LIST_RESPONSE" | jq '.'
echo ""

echo "✅ Smoke test complete!"
