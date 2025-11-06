# Vercel Production Deployment Workflow

**Goal**: Automated CI/CD workflow for deploying to Vercel production from `release` branch with quality gates, versioning, and GitHub releases.

**Approach**: GitHub Actions workflow with manual and automatic triggers, rebase strategy (main → release), quality gates (lint + unit tests), semantic versioning (auto-increment patch), and production deployment via Vercel CLI.

**Status**: ⏳ PENDING APPROVAL

---

## 1. Overview

Implement complete CI/CD pipeline for production deployments to Vercel hosting platform.

### Key Requirements:

1. **Deployment triggers:**
   - Manual trigger (`workflow_dispatch`) - on-demand deployments
   - Automatic trigger - push to `release` branch

2. **Quality gates:**
   - ESLint checks (code quality)
   - Unit tests (vitest) - fail = stop deployment
   - Production build verification

3. **Git strategy:**
   - Rebase `main` → `release` before deployment
   - Auto-increment patch version (v1.0.0 → v1.0.1)
   - Create Git tags for each release
   - Generate GitHub Release with notes

4. **Deployment:**
   - Vercel CLI deployment to production
   - Production flag (`--prod`)
   - Environment variables from Vercel dashboard

---

## 2. Approach (MVP Strategy)

**Philosophy**: Vendor-agnostic code, provider-specific CI/CD. Application code remains portable, deployment automation is external.

### Key Decisions:

1. **Vercel CLI deployment** - `vercel --prod` via GitHub Actions
2. **No vendor lock-in** - application code has ZERO Vercel dependencies
3. **Rebase strategy** - keep release branch updated with main
4. **Semantic versioning** - auto-increment patch only (MVP scope)
5. **Quality-first** - tests must pass before deployment

### Workflow Flow:

```
Trigger (manual/push)
  → Checkout code
  → Rebase release ← main
  → Install deps
  → Lint
  → Unit tests (FAIL → STOP)
  → Build
  → Calculate version tag
  → Create & push tag
  → Deploy to Vercel (production)
  → Create GitHub Release
  → Summary
```

---

## 3. Implementation Plan

### PHASE 1: GitHub Actions Workflow

#### Task 1.1: Create workflow file

**Objective:** Implement `.github/workflows/deploy-vercel-production.yml`

- [ ] **Workflow metadata:**
  - Name: "Deploy to Production (Vercel)"
  - Triggers: `workflow_dispatch` + `push` on `release` branch

- [ ] **Jobs structure:**
  - Single job: `deploy-production`
  - Runner: `ubuntu-latest`
  - Node.js: 22 (via `setup-node@v4`)

- [ ] **Steps (15 total):**

**Step 1-2: Git configuration**

```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0 # Full history for rebase
    token: ${{ secrets.GITHUB_TOKEN }}

- name: Configure Git
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
```

**Step 3-4: Rebase strategy**

```yaml
- name: Rebase release onto main
  run: |
    git checkout release
    git rebase origin/main
    echo "✅ Release branch rebased onto main"

- name: Push release branch
  run: |
    git push origin release --force-with-lease
    echo "✅ Release branch pushed"
```

**Step 5-6: Setup environment**

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "22"
    cache: "npm"

- name: Install dependencies
  run: npm ci
```

**Step 7-9: Quality gates**

```yaml
- name: Run ESLint
  run: npm run lint

- name: Run unit tests
  run: npm run test:unit # CRITICAL - fail stops deployment

- name: Build production
  run: npm run build
```

**Step 10-11: Versioning**

```yaml
- name: Calculate next tag version
  id: tag
  run: |
    LATEST_TAG=$(git tag -l "v*.*.*" | sort -V | tail -n1)

    if [ -z "$LATEST_TAG" ]; then
      NEW_TAG="v1.0.0"
    else
      VERSION=${LATEST_TAG#v}
      MAJOR=$(echo $VERSION | cut -d. -f1)
      MINOR=$(echo $VERSION | cut -d. -f2)
      PATCH=$(echo $VERSION | cut -d. -f3)
      NEW_PATCH=$((PATCH + 1))
      NEW_TAG="v${MAJOR}.${MINOR}.${NEW_PATCH}"
    fi

    echo "previous_tag=${LATEST_TAG}" >> $GITHUB_OUTPUT
    echo "new_tag=${NEW_TAG}" >> $GITHUB_OUTPUT
    echo "📦 New version: ${NEW_TAG} (previous: ${LATEST_TAG:-none})"

- name: Create and push tag
  run: |
    git tag ${{ steps.tag.outputs.new_tag }}
    git push origin ${{ steps.tag.outputs.new_tag }}
    echo "✅ Tag ${{ steps.tag.outputs.new_tag }} created and pushed"
```

**Step 12: Vercel deployment**

```yaml
- name: Deploy to Vercel (Production)
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Step 13-14: GitHub Release**

```yaml
- name: Generate release notes
  id: release_notes
  run: |
    if [ -z "${{ steps.tag.outputs.previous_tag }}" ]; then
      COMMITS=$(git log --pretty=format:"- %s (%h)" --no-merges)
    else
      COMMITS=$(git log ${{ steps.tag.outputs.previous_tag }}..HEAD --pretty=format:"- %s (%h)" --no-merges)
    fi
    echo "${COMMITS}" > release_notes.txt
    echo "📝 Release notes generated"

- name: Create GitHub Release
  uses: actions/create-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tag_name: ${{ steps.tag.outputs.new_tag }}
    release_name: Release ${{ steps.tag.outputs.new_tag }}
    body_path: release_notes.txt
    draft: false
    prerelease: false
```

**Step 15: Summary**

```yaml
- name: Deployment summary
  run: |
    echo "🚀 Deployment completed successfully!"
    echo "📦 Version: ${{ steps.tag.outputs.new_tag }}"
    echo "🌐 Vercel: https://10xcards.vercel.app"
    echo "📋 GitHub Release: https://github.com/${{ github.repository }}/releases/tag/${{ steps.tag.outputs.new_tag }}"
```

**Time estimate:** ~45 minutes

---

### PHASE 2: Documentation

#### Task 2.1: Create secrets setup guide

**Objective:** Document how to obtain and configure GitHub Secrets for Vercel

- [ ] Create `.ai/vercel-github-secrets-setup.md`

**Content structure:**

1. **Required Secrets (3):**
   - `VERCEL_TOKEN` - Vercel API token
   - `VERCEL_ORG_ID` - Organization/Team ID
   - `VERCEL_PROJECT_ID` - Project ID for 10xcards

2. **Step 1: Get Vercel Token**
   - Navigate to Vercel Dashboard → Settings → Tokens
   - Create new token: "GitHub Actions - 10xcards Deploy"
   - Scope: Full Access (or specific to project)
   - Copy token (shown once)

3. **Step 2: Get Vercel Organization ID**
   - Navigate to Vercel Dashboard → Settings → General
   - Copy "Organization ID" or "Team ID"
   - Format: `team_xxxxxxxxxxxxx` or `user_xxxxxxxxxxxxx`

4. **Step 3: Get Vercel Project ID**
   - Navigate to Vercel Dashboard → Project (10xcards) → Settings → General
   - Copy "Project ID"
   - Format: `prj_xxxxxxxxxxxxx`

5. **Step 4: Add Secrets to GitHub**
   - GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each secret:
     - Name: `VERCEL_TOKEN`, Value: [token from Step 1]
     - Name: `VERCEL_ORG_ID`, Value: [ID from Step 2]
     - Name: `VERCEL_PROJECT_ID`, Value: [ID from Step 3]

6. **Step 5: Verify Setup**
   - Check secrets are listed (values hidden)
   - Values are encrypted at rest
   - Cannot view after creation (can only update)

7. **Troubleshooting:**
   - Error: "Invalid token" → Regenerate in Vercel
   - Error: "Project not found" → Verify PROJECT_ID
   - Error: "Permission denied" → Check token scope

8. **Security Best Practices:**
   - ✅ Use tokens with minimal required scope
   - ✅ Rotate tokens periodically (every 6-12 months)
   - ✅ Never commit tokens to repository
   - ✅ Use separate tokens for staging vs production

**Time estimate:** ~30 minutes

---

## 4. Files to Create

### New files (2):

1. **`.github/workflows/deploy-vercel-production.yml`**
   - GitHub Actions workflow (YAML)
   - ~150 lines
   - 15 deployment steps

2. **`.ai/vercel-github-secrets-setup.md`**
   - Documentation (Markdown)
   - Step-by-step guide for secrets
   - Troubleshooting section

### Modified files (0):

No modifications to existing files needed (vendor-agnostic approach).

---

## 5. Success Criteria

✅ **After implementation:**

1. **Workflow execution:**
   - [ ] Manual trigger works (Actions tab → "Run workflow")
   - [ ] Automatic trigger works (push to `release` branch)
   - [ ] All 15 steps execute successfully
   - [ ] Total execution time: ~5-8 minutes

2. **Quality gates:**
   - [ ] Lint failures stop deployment
   - [ ] Unit test failures stop deployment
   - [ ] Build failures stop deployment
   - [ ] All gates pass → deployment proceeds

3. **Git operations:**
   - [ ] Rebase main → release succeeds
   - [ ] Force-with-lease push succeeds
   - [ ] Version tag created (e.g., v1.0.1)
   - [ ] Tag pushed to remote

4. **Vercel deployment:**
   - [ ] Deployment succeeds with `--prod` flag
   - [ ] Production URL updated: https://10xcards.vercel.app
   - [ ] Environment variables from Vercel dashboard used
   - [ ] Build logs visible in GitHub Actions

5. **GitHub Release:**
   - [ ] Release created for new tag
   - [ ] Release notes include commit history
   - [ ] Release visible in "Releases" page
   - [ ] Release linked to tag

6. **Documentation:**
   - [ ] Secrets setup guide is clear
   - [ ] All 3 secrets documented
   - [ ] Troubleshooting section helpful

---

## 6. GitHub Secrets Required

User must configure these secrets before first deployment:

| Secret Name         | Where to Get                          | Example Format               | Type   |
| ------------------- | ------------------------------------- | ---------------------------- | ------ |
| `VERCEL_TOKEN`      | Vercel Dashboard → Settings → Tokens  | `aBcD1234...`                | Secret |
| `VERCEL_ORG_ID`     | Vercel Dashboard → Settings → General | `team_xxxxx` or `user_xxxxx` | Plain  |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings → General   | `prj_xxxxx`                  | Plain  |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions (no manual setup).

---

## 7. Testing Plan

### Manual testing after implementation:

1. **Test 1: Manual trigger with passing tests**
   - Actions → "Deploy to Production (Vercel)" → "Run workflow"
   - Select branch: `release`
   - Verify: Deployment succeeds, tag created, release published

2. **Test 2: Automatic trigger on push to release**
   - Make dummy commit to `release` branch
   - Push to remote
   - Verify: Workflow automatically starts and completes

3. **Test 3: Quality gate - failing lint**
   - Introduce lint error in code
   - Trigger workflow
   - Verify: Workflow stops at "Run ESLint" step

4. **Test 4: Quality gate - failing tests**
   - Break a unit test
   - Trigger workflow
   - Verify: Workflow stops at "Run unit tests" step

5. **Test 5: Version increment**
   - Note current latest tag (e.g., v1.0.5)
   - Trigger workflow
   - Verify: New tag is v1.0.6 (patch incremented)

6. **Test 6: Rebase conflict handling**
   - Create conflicting changes on main and release
   - Trigger workflow
   - Verify: Workflow fails with clear error message

---

## 8. Time Estimate

**Total:** ~1.5 hours (90 minutes)

**PHASE 1 (Workflow):** 45 minutes

- Task 1.1 (Create workflow file): 45 min

**PHASE 2 (Documentation):** 30 minutes

- Task 2.1 (Secrets setup guide): 30 min

**Testing & Verification:** 15 minutes

- Manual testing (6 test scenarios)

---

## 9. MVP Scope Notes

**Included in MVP:**

- ✅ Manual and automatic triggers
- ✅ Rebase strategy (main → release)
- ✅ Quality gates (lint + tests)
- ✅ Semantic versioning (patch auto-increment)
- ✅ Production deployment to Vercel
- ✅ GitHub Release creation

**Excluded from MVP (can add later):**

- ❌ E2E tests before deployment (only unit tests)
- ❌ Slack/Discord notifications on deploy
- ❌ Rollback mechanism (use Vercel UI for now)
- ❌ Staging environment deployment
- ❌ Performance budgets (Lighthouse checks)
- ❌ Major/minor version increments (always patch)
- ❌ Changelog generation (beyond commit list)
- ❌ Deploy previews for PRs (separate workflow)

**Assumptions:**

- ✅ `release` branch already exists
- ✅ Vercel project already created and connected
- ✅ Environment variables configured in Vercel dashboard
- ✅ `.env.prod` file created (local reference only, not used in CI)

**Anti-patterns to avoid:**

- ❌ Storing secrets in repository (use GitHub Secrets)
- ❌ Using `--force` push (use `--force-with-lease` for safety)
- ❌ Skipping tests in CI (never use `--no-verify` or skip flags)
- ❌ Manual version bumps (automate with git tags)
- ❌ Deploying from `main` (only from `release`)

---

## 10. Dependencies

**External dependencies:**

- Vercel account with project created
- GitHub repository with Actions enabled
- Node.js 22 environment
- Existing scripts in package.json: `lint`, `test:unit`, `build`

**Internal dependencies:**

- `release` branch exists
- Tests are passing on `main` branch
- Build succeeds locally

---

## 11. Risks & Mitigations

| Risk                           | Probability | Impact | Mitigation                                      |
| ------------------------------ | ----------- | ------ | ----------------------------------------------- |
| **Secrets not configured**     | High        | High   | Clear documentation, verification step          |
| **Rebase conflicts**           | Medium      | Medium | Workflow fails gracefully, manual resolution    |
| **Vercel rate limits**         | Low         | Medium | Use official Vercel action (better rate limits) |
| **Failed deployment (Vercel)** | Low         | High   | Rollback via Vercel UI, keep previous version   |
| **Tag already exists**         | Low         | Low    | Workflow fails, manual tag cleanup needed       |

---

## 12. Questions to Resolve

- [x] **Deploy from `release` branch only?**
  - Decision: YES - only `release` → production

- [x] **Rebase main → release before deploy?**
  - Decision: YES - keep release up to date

- [x] **Auto-increment patch only (no major/minor)?**
  - Decision: YES - MVP scope, manual for major/minor

- [x] **Include E2E tests?**
  - Decision: NO - only unit tests (faster, MVP scope)

- [x] **Use Vercel CLI or Vercel Action?**
  - Decision: Vercel CLI (`npx vercel --prod`) - simpler, more explicit

---

## 13. What I Actually Did (vs Plan)

_Section to fill during implementation_

### PHASE 1: WORKFLOW FILE ✅ / ⏳ / ❌

**Task 1.1: Create GitHub Actions workflow**

- Status:
- Time actual:
- Changes vs plan:
- Issues encountered:

### PHASE 2: DOCUMENTATION ✅ / ⏳ / ❌

**Task 2.1: Secrets setup guide**

- Status:
- Time actual:
- Changes vs plan:

### TESTING ✅ / ⏳ / ❌

**Manual testing results:**

- Test 1 (manual trigger):
- Test 2 (auto trigger):
- Test 3 (lint failure):
- Test 4 (test failure):
- Test 5 (versioning):
- Test 6 (rebase conflict):

---

## 14. References

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions - Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Semantic Versioning](https://semver.org/)
- [Git Rebase Documentation](https://git-scm.com/docs/git-rebase)

---

**READY FOR APPROVAL**

Awaiting user confirmation to proceed with implementation.
