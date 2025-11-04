# Branch Protection Configuration

This document describes the recommended branch protection rules for the `main` branch to ensure code quality and prevent direct pushes.

## 🛡️ Why Branch Protection?

Branch protection enforces code review processes and automated quality checks before merging changes to the main branch. This prevents:

- Breaking changes being pushed directly to production
- Code that doesn't pass tests from being merged
- Unreviewed code entering the codebase
- Build failures on the main branch

## ⚙️ Configuration Steps

### 1. Navigate to Repository Settings

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar)
4. Click **Add branch protection rule**

### 2. Configure Protection Rules

#### Branch Name Pattern

```
main
```

#### Required Settings

**✅ Require a pull request before merging**

- Require approvals: **1** (minimum)
- Dismiss stale pull request approvals when new commits are pushed: **Enabled**
- Require review from Code Owners: **Disabled** (optional, enable if you have CODEOWNERS file)

**✅ Require status checks to pass before merging**

- Require branches to be up to date before merging: **Enabled**
- Status checks that are required:
  - ✅ `Code Quality`
  - ✅ `Unit Tests`
  - ✅ `Build Verification`
  - ⚠️ `E2E Tests` (optional - mark as required only if E2E tests are stable)

**✅ Require conversation resolution before merging**

- All review comments must be resolved: **Enabled**

**✅ Require linear history** (optional but recommended)

- Prevents merge commits: **Enabled**
- Forces rebase or squash merges

**✅ Do not allow bypassing the above settings**

- Include administrators: **Enabled** (even admins must follow the rules)

#### Optional Settings

**⚠️ Require deployments to succeed before merging**

- Only enable if you have deployment previews configured

**⚠️ Lock branch**

- Disable for active development (only for archived branches)

**⚠️ Allow force pushes**

- Keep **Disabled** (prevents force pushes to main)

**⚠️ Allow deletions**

- Keep **Disabled** (prevents accidental branch deletion)

## 📋 Required Status Checks Details

The following GitHub Actions jobs must pass before PR can be merged:

| Status Check       | Job Name       | What It Checks               | Critical?   |
| ------------------ | -------------- | ---------------------------- | ----------- |
| Code Quality       | `code-quality` | ESLint, TypeScript, Prettier | ✅ Yes      |
| Unit Tests         | `unit-tests`   | All unit tests + coverage    | ✅ Yes      |
| Build Verification | `build`        | Production build succeeds    | ✅ Yes      |
| E2E Tests          | `e2e-tests`    | Playwright integration tests | ⚠️ Optional |

### Why E2E Tests Are Optional

E2E tests can be flaky and may fail due to:

- External service dependencies
- Timing issues
- Environment differences

**Recommendation**:

- Start with E2E tests as **non-blocking** (don't require them)
- Monitor stability for 2-3 weeks
- Make them required once they're consistently passing

## 🔄 Pull Request Workflow

With branch protection enabled, the workflow becomes:

```
1. Developer creates feature branch from main
   ↓
2. Developer pushes commits to feature branch
   ↓
3. Developer opens Pull Request to main
   ↓
4. GitHub Actions automatically runs:
   - Code Quality checks
   - Unit Tests
   - E2E Tests
   - Build Verification
   ↓
5. Automated PR comment shows test results
   ↓
6. If checks fail:
   → GitHub Issue automatically created
   → Developer fixes issues
   → Push new commits (re-triggers checks)
   ↓
7. If all checks pass:
   → Automated issue automatically closed
   → Ready for code review
   ↓
8. Reviewer reviews code and approves
   ↓
9. All conversations resolved
   ↓
10. PR can be merged (squash/rebase)
```

## 🚨 Automatic Issue Creation

When critical checks fail, an automated issue is created with:

- **Title**: `🚨 CI/CD Failure: PR #123 - Feature Name`
- **Labels**: `ci-failure`, `automated`
- **Content**:
  - Link to failed PR
  - List of failed checks
  - Link to workflow run
  - Action items for developer

**Issue Lifecycle**:

- ✅ Created automatically when checks fail
- 🔄 Updated if checks fail again
- ✅ Closed automatically when all checks pass

## 🎯 Benefits

With these protection rules:

1. **Code Quality**: All code is linted and type-checked before merge
2. **Test Coverage**: All tests must pass (130+ tests)
3. **Build Safety**: Ensures production build works
4. **Review Process**: At least one approval required
5. **Traceability**: All changes tracked via PRs
6. **Issue Tracking**: Automatic issue creation for failures
7. **Team Awareness**: PR comments keep everyone informed

## 🔧 Exceptions and Hotfixes

### Emergency Hotfixes

For critical production issues:

1. **Option 1**: Temporarily disable protection (not recommended)
   - Settings → Branches → Edit rule → Disable temporarily
   - Apply hotfix
   - Re-enable immediately

2. **Option 2**: Fast-track PR process (recommended)
   - Create hotfix branch from main
   - Open PR with `[HOTFIX]` prefix
   - Run checks (they're fast: ~5 minutes)
   - Get quick approval from team lead
   - Merge via GitHub UI

### Admin Override

If you enabled "Include administrators", even admins cannot bypass. To override:

- Temporarily disable the rule
- Apply changes
- Re-enable immediately
- Document why in commit message

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Project PRD](./../.ai/prd.md)
- [CI/CD Documentation](./3x5-wdrazanie-cicd-z-github-actions.md)

## ✅ Verification Checklist

After configuring branch protection, verify:

- [ ] Protection rule is enabled for `main` branch
- [ ] Pull requests are required
- [ ] At least 1 approval is required
- [ ] Status checks are required: Code Quality, Unit Tests, Build
- [ ] Branch must be up to date before merging
- [ ] Force pushes are disabled
- [ ] Branch deletion is disabled
- [ ] Test the workflow by creating a test PR
- [ ] Verify PR comment automation works
- [ ] Verify issue creation on failure works

## 🔒 Security Note

These settings prevent:

- Accidental deletion of main branch
- Force pushes that rewrite history
- Merging broken code
- Skipping code review
- Deploying without tests

**Never disable these protections** unless absolutely necessary, and always re-enable immediately.
