bash scripts/inject-decisions.sh ...#!/bin/bash

#######################################
# Phase 1 Decision Injection Script
#######################################
# 
# Purpose: Replace decision parameters in Phase 1 PRs with locked values
# 
# Usage:
#   ./scripts/inject-decisions.sh --backend-hosting docker --docker-registry ecr --secrets-backend aws-secrets --seed-strategy sql-script [--dry-run|--apply]
#
# Modes:
#   --dry-run  : Show what would change (no modifications)
#   --apply    : Make changes and commit
#
# Example:
#   ./scripts/inject-decisions.sh --backend-hosting docker --docker-registry ecr --secrets-backend aws-secrets --seed-strategy sql-script --dry-run
#   ./scripts/inject-decisions.sh --backend-hosting docker --docker-registry ecr --secrets-backend aws-secrets --seed-strategy sql-script --apply
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
BACKEND_HOSTING=""
DOCKER_REGISTRY=""
SECRETS_BACKEND=""
SEED_STRATEGY=""
MODE="dry-run"  # default to dry-run for safety
VERBOSE=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-hosting)
      BACKEND_HOSTING="$2"
      shift 2
      ;;
    --docker-registry)
      DOCKER_REGISTRY="$2"
      shift 2
      ;;
    --secrets-backend)
      SECRETS_BACKEND="$2"
      shift 2
      ;;
    --seed-strategy)
      SEED_STRATEGY="$2"
      shift 2
      ;;
    --apply)
      MODE="apply"
      shift
      ;;
    --dry-run)
      MODE="dry-run"
      shift
      ;;
    --verbose)
      VERBOSE=1
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate all decisions are provided
if [[ -z "$BACKEND_HOSTING" || -z "$DOCKER_REGISTRY" || -z "$SECRETS_BACKEND" || -z "$SEED_STRATEGY" ]]; then
  echo -e "${RED}Error: Missing required decision parameters${NC}"
  echo ""
  echo "Required:"
  echo "  --backend-hosting    (docker|vercel|kubernetes|render)"
  echo "  --docker-registry    (ecr|docker-hub|gcr|artifact-registry|private)"
  echo "  --secrets-backend    (aws-secrets|vault|supabase-vault|github-secrets)"
  echo "  --seed-strategy      (sql-script|orm-migrations|managed-service|snapshot)"
  echo ""
  echo "Optional:"
  echo "  --dry-run            (preview changes, don't apply)"
  echo "  --apply              (make changes and commit)"
  echo "  --verbose            (show detailed progress)"
  exit 1
fi

# Validate decision values
validate_decision() {
  local decision=$1
  local value=$2
  local valid_values=$3
  
  if ! echo "$valid_values" | grep -w "$value" > /dev/null; then
    echo -e "${RED}Error: Invalid $decision value: $value${NC}"
    echo "Valid values: $valid_values"
    exit 1
  fi
}

validate_decision "backend-hosting" "$BACKEND_HOSTING" "docker vercel kubernetes render"
validate_decision "docker-registry" "$DOCKER_REGISTRY" "ecr docker-hub gcr artifact-registry private"
validate_decision "secrets-backend" "$SECRETS_BACKEND" "aws-secrets vault supabase-vault github-secrets"
validate_decision "seed-strategy" "$SEED_STRATEGY" "sql-script orm-migrations managed-service snapshot"

# Display mode and decisions
echo -e "${BLUE}╔═════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 1 Decision Injection Script      ║${NC}"
echo -e "${BLUE}╚═════════════════════════════════════════╝${NC}"
echo ""
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo ""
echo "Decisions to inject:"
echo -e "  D001 Backend Hosting:  ${GREEN}$BACKEND_HOSTING${NC}"
echo -e "  D002 Docker Registry:  ${GREEN}$DOCKER_REGISTRY${NC}"
echo -e "  D005 Secrets Backend:  ${GREEN}$SECRETS_BACKEND${NC}"
echo -e "  D020 Seed Strategy:    ${GREEN}$SEED_STRATEGY${NC}"
echo ""

# Files to process
declare -a FILES_TO_UPDATE=(
  ".github/workflows/deploy.yml"
  ".github/workflows/test.yml"
  ".github/workflows/health-check.yml"
  ".env.local.example"
  "scripts/seed.ts"
  "scripts/seed-env-detector.ts"
  "scripts/seeds/index.ts"
  "Dockerfile.seed"
  "Makefile"
  "package.json"
)

# Function to perform replacement
replace_in_file() {
  local file=$1
  local old=$2
  local new=$3
  
  if [[ ! -f "$file" ]]; then
    if [[ $VERBOSE -eq 1 ]]; then
      echo -e "${YELLOW}  ⊘ File not found: $file${NC}"
    fi
    return 0
  fi
  
  # Count occurrences (escape special chars in grep)
  local count=$(grep -F "$old" "$file" 2>/dev/null | wc -l)
  
  if [[ $count -eq 0 ]]; then
    if [[ $VERBOSE -eq 1 ]]; then
      echo -e "${YELLOW}  ⊘ No matches in $file${NC}"
    fi
    return 0
  fi
  
  if [[ $VERBOSE -eq 1 ]]; then
    echo -e "${BLUE}  → Found $count occurrence(s) of '$old' in $file${NC}"
  fi
  
  if [[ "$MODE" == "apply" ]]; then
    # Use sed to replace with proper escaping
    # Escape special characters in old and new for sed
    local old_escaped=$(printf '%s\n' "$old" | sed -e 's/[\/&]/\\&/g')
    local new_escaped=$(printf '%s\n' "$new" | sed -e 's/[\/&]/\\&/g')
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s/$old_escaped/$new_escaped/g" "$file"
    else
      # Linux
      sed -i "s/$old_escaped/$new_escaped/g" "$file"
    fi
    echo -e "${GREEN}  ✅ Replaced $count occurrence(s) in $file${NC}"
  else
    # Dry-run: show what would change
    echo -e "${YELLOW}  [DRY-RUN] Would replace $count occurrence(s) in $file${NC}"
  fi
}

# Perform injections
echo -e "${BLUE}Processing files...${NC}"
echo ""

# D001: Backend Hosting
echo "Injecting D001 (Backend Hosting = $BACKEND_HOSTING):"
replace_in_file ".github/workflows/deploy.yml" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
replace_in_file ".github/workflows/health-check.yml" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
replace_in_file ".env.local.example" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
replace_in_file "scripts/seed.ts" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
replace_in_file "scripts/seed-env-detector.ts" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
replace_in_file "Makefile" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
replace_in_file "package.json" '\${D001_BACKEND_HOSTING}' "$BACKEND_HOSTING"
echo ""

# D002: Docker Registry
echo "Injecting D002 (Docker Registry = $DOCKER_REGISTRY):"
replace_in_file ".github/workflows/deploy.yml" '\${D002_DOCKER_REGISTRY}' "$DOCKER_REGISTRY"
replace_in_file ".github/workflows/test.yml" '\${D002_DOCKER_REGISTRY}' "$DOCKER_REGISTRY"
replace_in_file ".env.local.example" '\${D002_DOCKER_REGISTRY}' "$DOCKER_REGISTRY"
replace_in_file "Makefile" '\${D002_DOCKER_REGISTRY}' "$DOCKER_REGISTRY"
echo ""

# D005: Secrets Backend
echo "Injecting D005 (Secrets Backend = $SECRETS_BACKEND):"
replace_in_file ".github/workflows/deploy.yml" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file ".github/workflows/test.yml" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file ".env.local.example" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file "scripts/seed.ts" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file "scripts/seed-env-detector.ts" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file "scripts/seeds/index.ts" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file "Makefile" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
replace_in_file "package.json" '\${D005_SECRETS_BACKEND}' "$SECRETS_BACKEND"
echo ""

# D020: Seed Strategy
echo "Injecting D020 (Seed Strategy = $SEED_STRATEGY):"
replace_in_file "scripts/seed.ts" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
replace_in_file "scripts/seed-env-detector.ts" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
replace_in_file "scripts/seeds/index.ts" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
replace_in_file ".env.local.example" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
replace_in_file "Dockerfile.seed" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
replace_in_file "Makefile" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
replace_in_file "package.json" '\${D020_SEED_STRATEGY}' "$SEED_STRATEGY"
echo ""

# Verify no parameters remain
echo -e "${BLUE}Verification...${NC}"
echo ""

remaining=$(find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.ts" -o -name "*.js" -o -name ".env*" -o -name "Dockerfile*" -o -name "Makefile" -o -name "package.json" \) -exec grep -l '\${D0[0-9][0-9]' {} \; 2>/dev/null | grep -v node_modules | wc -l)

if [[ $remaining -eq 0 ]]; then
  echo -e "${GREEN}✅ All parameters injected successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: Found $remaining file(s) with remaining parameters${NC}"
  find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.ts" -o -name "*.js" -o -name ".env*" -o -name "Dockerfile*" -o -name "Makefile" -o -name "package.json" \) -exec grep -l '\${D0[0-9][0-9]' {} \; 2>/dev/null | grep -v node_modules | head -5
fi

echo ""

# If applying, commit changes
if [[ "$MODE" == "apply" ]]; then
  echo -e "${BLUE}Creating commit...${NC}"
  echo ""
  
  git add -A
  
  commit_message="Inject Phase 1 decisions: D001=$BACKEND_HOSTING, D002=$DOCKER_REGISTRY, D005=$SECRETS_BACKEND, D020=$SEED_STRATEGY

Locked decisions from DECISIONS_LOCKED.md:
- D001 Backend Hosting: $BACKEND_HOSTING
- D002 Docker Registry: $DOCKER_REGISTRY
- D005 Secrets Backend: $SECRETS_BACKEND
- D020 Seed Strategy: $SEED_STRATEGY

Updated files:
- .github/workflows/deploy.yml
- .github/workflows/test.yml
- .github/workflows/health-check.yml
- .env.local.example
- scripts/seed.ts
- scripts/seed-env-detector.ts
- scripts/seeds/index.ts
- Dockerfile.seed
- Makefile
- package.json

Ready to merge PR-2, PR-3, PR-4."
  
  git commit -m "$commit_message"
  
  echo -e "${GREEN}✅ Changes committed${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review the commit: git show HEAD"
  echo "  2. Merge PR-2 (CI/CD Pipeline)"
  echo "  3. Merge PR-3 (Environment Documentation)"
  echo "  4. Merge PR-4 (Seed Script)"
  echo ""
  echo -e "${GREEN}Phase 1 scaffolding is production-ready!${NC}"
else
  echo -e "${YELLOW}DRY-RUN MODE${NC}"
  echo ""
  echo "To apply these changes, run:"
  echo ""
  echo -e "${BLUE}./scripts/inject-decisions.sh \\${NC}"
  echo -e "${BLUE}  --backend-hosting $BACKEND_HOSTING \\${NC}"
  echo -e "${BLUE}  --docker-registry $DOCKER_REGISTRY \\${NC}"
  echo -e "${BLUE}  --secrets-backend $SECRETS_BACKEND \\${NC}"
  echo -e "${BLUE}  --seed-strategy $SEED_STRATEGY \\${NC}"
  echo -e "${BLUE}  --apply${NC}"
fi

echo ""
echo -e "${BLUE}╔═════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Injection script complete              ║${NC}"
echo -e "${BLUE}╚═════════════════════════════════════════╝${NC}"
