#!/usr/bin/env bash
# ==============================================================================
# DF71 Enterprise GitHub Setup Script
# Initializes labels, milestones, project boards, and branch protection.
# Usage: bash scripts/github/init-repo.sh [owner/repo]
# ==============================================================================
set -euo pipefail

REPO="${1:-}"
GH_ARGS=()
if [ -n "${REPO}" ]; then
  GH_ARGS+=(--repo "${REPO}")
fi

echo "🚀 [df71] initializing enterprise GitHub repository settings..."

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  if gh label list "${GH_ARGS[@]}" --json name -q '.[].name' 2>/dev/null | grep -Fxq "${name}"; then
    gh label edit "${name}" "${GH_ARGS[@]}" --color "${color}" --description "${description}" >/dev/null
    echo "  • label updated: ${name}"
  else
    gh label create "${name}" "${GH_ARGS[@]}" --color "${color}" --description "${description}" >/dev/null
    echo "  • label created: ${name}"
  fi
}

echo "📋 1. Configuring Scrum, Priority, Status and OpenSpec labels..."
# Scrum types
ensure_label "type:story" "1D76DB" "Scrum Story tracking OpenSpec module"
ensure_label "type:task" "0E8A16" "Discrete implementation task with scenarios"
ensure_label "type:bug" "B60205" "Defect or regression with failing test"

# Status (Kanban columns)
ensure_label "status:backlog" "C5DEF5" "Backlog — prioritized work waiting for sprint"
ensure_label "status:sprint" "FBCA04" "Sprint ready — planned for active milestone"
ensure_label "status:in-progress" "D93F0B" "In progress — agent or human authoring code"
ensure_label "status:gate-check" "0E8A16" "Gate check — running make df71:check & verification"
ensure_label "status:review" "5319E7" "Review — PR open for security-review & human merge"
ensure_label "status:done" "0E8A16" "Done — merged and closed"

# Priority
ensure_label "priority:critical" "B60205" "Critical — security, boundaries, fail-closed harness; take first"
ensure_label "priority:high" "D93F0B" "High — core path needed for MVP"
ensure_label "priority:normal" "FBCA04" "Normal — polish, docs, non-blocking UX"

# OpenSpec flow flags
ensure_label "openspec:go" "0E8A16" "openspec-flow: start OpenSpec change / proposal"
ensure_label "openspec:spec" "1D76DB" "openspec-flow: Spec PR / archive path"
ensure_label "openspec:impl" "5319E7" "openspec-flow: Implementation Task / impl PR"

echo "🎯 2. Configuring standard milestones..."
ensure_milestone() {
  local title="$1"
  local description="$2"
  local target_repo="${REPO:-:owner/:repo}"
  if ! gh api "repos/${target_repo}/milestones" --jq '.[].title' 2>/dev/null | grep -Fxq "${title}"; then
    gh api "repos/${target_repo}/milestones" -f title="${title}" -f description="${description}" >/dev/null 2>&1 || true
    echo "  • milestone created: ${title}"
  else
    echo "  • milestone exists: ${title}"
  fi
}

ensure_milestone "v0.1.0-mvp" "Initial MVP delivery with verified baseline"
ensure_milestone "v0.2.0-beta" "Beta stabilization, client planning, and security review"
ensure_milestone "v1.0.0-prod" "Production-ready enterprise release"

echo "🔒 3. Configuring main branch protection rules..."
# Require status check: verification-gate, enforce strict PR merge
gh api --method PUT "repos/:owner/:repo/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<EOF 2>/dev/null || echo "  ⚠️ Note: Branch protection requires admin rights on repo"
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Factory Verification Gate"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo "✅ [df71] GitHub enterprise environment successfully initialized!"
