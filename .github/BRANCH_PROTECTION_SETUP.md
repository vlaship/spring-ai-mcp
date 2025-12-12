# Branch Protection Setup

This document explains how to configure GitHub branch protection rules to prevent merging PRs when the CI pipeline fails.

## Required Status Check

The CI workflow includes a `ci-status` job that serves as the single required status check for branch protection. This job depends on both `test` and `build` jobs and will fail if either fails.

## Manual Setup (Repository Owner Required)

### Step 1: Navigate to Branch Protection Settings

1. Go to your repository: `https://github.com/vlaship/spring-ai-mcp`
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** or edit existing rule for `main` branch

### Step 2: Configure Protection Rules

**Branch name pattern:** `main`

**Required settings:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1` (recommended)
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if you have CODEOWNERS file)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:** Add `ci-status`
    - Type `ci-status` in the search box
    - Select it from the dropdown

- ✅ **Require conversation resolution before merging**
- ✅ **Include administrators** (applies rules to repo admins too)

### Step 3: Save Protection Rule

Click **Create** or **Save changes**

## Alternative: GitHub CLI Setup

If you have GitHub CLI installed, you can run this command:

```bash
gh api repos/vlaship/spring-ai-mcp/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci-status"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

## Verification

After setup:

1. Create a test PR with failing tests
2. Verify that the **Merge** button is disabled
3. Check that it shows "Required status check ci-status has not succeeded"
4. Fix the tests and verify the merge button becomes available

## Status Check Details

- **Job Name:** `ci-status`
- **Depends On:** `test` + `build` jobs
- **Success Criteria:** Both test and build jobs must succeed
- **Failure Scenarios:**
  - Java tests fail → `ci-status` fails → PR cannot be merged
  - UI tests fail → `ci-status` fails → PR cannot be merged  
  - Docker build fails → `ci-status` fails → PR cannot be merged

## Benefits

- 🛡️ **Quality Gate:** No broken code can be merged to main
- 🚀 **Automated Enforcement:** No manual checking required
- 📊 **Clear Status:** PR shows exactly what's blocking the merge
- 🔄 **Consistent Process:** Same rules apply to all contributors