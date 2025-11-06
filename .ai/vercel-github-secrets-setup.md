# GitHub Secrets Setup for Vercel Production Deployment

This document describes how to configure GitHub Secrets required for the Vercel production deployment workflow.

---

## Required Secrets

The workflow `.github/workflows/deploy-vercel-production.yml` requires three Vercel secrets:

| Secret Name         | Description                         | Where to Get                          |
| ------------------- | ----------------------------------- | ------------------------------------- |
| `VERCEL_TOKEN`      | Vercel API token for deployments    | Vercel Dashboard → Settings → Tokens  |
| `VERCEL_ORG_ID`     | Your Vercel organization or team ID | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Project ID for 10xcards             | Vercel Project → Settings → General   |

---

## Step 1: Get Vercel Token

### Create API Token:

1. Go to **Vercel Dashboard** (https://vercel.com/dashboard)
2. Click your avatar (bottom left) → **Settings**
3. Navigate to **Tokens** tab (left sidebar)
4. Click **Create Token**

### Configure Token:

**Token settings:**

- **Token Name:** `GitHub Actions - 10xcards Deploy`
- **Scope:** Full Access (or limit to specific teams if needed)
- **Expiration:** No Expiration (or set custom expiration for security)

### Save Token:

- Click **Create Token**
- **COPY THE TOKEN NOW** - you won't see it again!
- Example format: `aBcD1234eFgH5678iJkL9012mNoPqRsT`

---

## Step 2: Get Vercel Organization ID

### Find Organization ID:

1. Go to **Vercel Dashboard**
2. Click your avatar → **Settings**
3. Navigate to **General** tab
4. Scroll to **Your ID** or **Team ID** section
5. Copy the ID value

**Format examples:**

- Personal account: `user_aBcDeFgH1234567890`
- Team account: `team_XyZaBcDeF0987654321`

**Alternative method (via CLI):**

```bash
npx vercel teams ls
# Or for personal account
npx vercel whoami
```

---

## Step 3: Get Vercel Project ID

### Find Project ID:

1. Go to **Vercel Dashboard**
2. Navigate to **Projects** (top navigation)
3. Click on your **10xcards** project
4. Click **Settings** tab (top navigation)
5. Navigate to **General** section (left sidebar)
6. Find **Project ID** field
7. Click to copy the ID

**Format:** `prj_aBcDeFgHiJkLmNoPqRsTuVwXyZ`

**Alternative method (via project settings URL):**
The project ID is visible in the settings URL:

```
https://vercel.com/[org-name]/10xcards/settings
                                    ^^^^^^^^^^^
                                    project-slug
```

You can also get it via CLI:

```bash
npx vercel project ls
```

---

## Step 4: Add Secrets to GitHub

### Navigate to Repository Settings:

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/10xcards`
2. Click **Settings** tab (top navigation)
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret** (green button)

### Add Each Secret:

**Secret 1: VERCEL_TOKEN**

- Name: `VERCEL_TOKEN`
- Secret: [paste your API token from Step 1]
- Click **Add secret**

**Secret 2: VERCEL_ORG_ID**

- Name: `VERCEL_ORG_ID`
- Secret: [paste your Organization ID from Step 2]
- Click **Add secret**

**Secret 3: VERCEL_PROJECT_ID**

- Name: `VERCEL_PROJECT_ID`
- Secret: [paste your Project ID from Step 3]
- Click **Add secret**

---

## Step 5: Verify Secrets

After adding all secrets, you should see them listed:

```
Repository secrets (3)
├─ VERCEL_TOKEN           Updated X minutes ago
├─ VERCEL_ORG_ID          Updated X minutes ago
└─ VERCEL_PROJECT_ID      Updated X minutes ago
```

❌ **You cannot view secret values after creation** (security feature)
✅ **You can update them** by clicking "Update" next to each secret
✅ **You can delete them** by clicking "Remove"

---

## Step 6: Test the Workflow

### Manual Trigger:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **"Deploy to Production (Vercel)"** workflow (left sidebar)
4. Click **"Run workflow"** button (right side)
5. Select branch: **release**
6. Click green **"Run workflow"** button

### Expected Flow:

```
✅ Checkout repository
✅ Configure Git
✅ Rebase release onto main
✅ Push release branch
✅ Setup Node.js
✅ Install dependencies
✅ Run ESLint
✅ Run unit tests
✅ Build production
✅ Calculate next tag version (e.g., v1.0.0)
✅ Create and push tag
✅ Deploy to Vercel (Production)
✅ Generate release notes
✅ Create GitHub Release
✅ Deployment summary
```

### Check Results:

- **GitHub Actions**: See workflow run details in Actions tab
- **Vercel Dashboard**: Check deployments at https://vercel.com/dashboard
- **GitHub Releases**: New release should appear in repo
- **Live Site**: https://10xcards.vercel.app (or your custom domain)

---

## Troubleshooting

### Error: "VERCEL_TOKEN is required"

**Cause:** Token not set or incorrect name

**Solution:**

- Verify secret name is exactly `VERCEL_TOKEN` (case-sensitive)
- Regenerate token in Vercel if needed
- Check token hasn't expired (if expiration was set)

### Error: "Invalid token"

**Cause:** Token is malformed, expired, or revoked

**Solution:**

- Go to Vercel Dashboard → Settings → Tokens
- Delete old token
- Create new token with same settings
- Update `VERCEL_TOKEN` in GitHub Secrets

### Error: "Project not found" or "Resource not accessible"

**Cause:** Wrong `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID`

**Solution:**

- Verify `VERCEL_ORG_ID` matches your account/team
- Verify `VERCEL_PROJECT_ID` matches the 10xcards project
- Check you're using IDs from the correct Vercel account
- Use CLI to verify: `npx vercel project ls`

### Error: "Permission denied" or "Insufficient scope"

**Cause:** Token doesn't have deployment permissions

**Solution:**

- Create new token with **Full Access** scope
- Or ensure token has minimum scope: Deploy permissions for the project
- Update `VERCEL_TOKEN` in GitHub Secrets

### Error: Rebase conflict

**Cause:** Conflicting changes between `main` and `release` branches

**Solution:**

- Manually resolve conflicts locally:
  ```bash
  git checkout release
  git rebase main
  # Resolve conflicts
  git rebase --continue
  git push origin release --force-with-lease
  ```
- Then re-run workflow

### Error: Unit tests failing

**Cause:** Tests are failing on `release` branch

**Solution:**

- This is **expected behavior** - workflow stops deployment
- Fix tests locally:
  ```bash
  npm run test:unit
  # Fix failing tests
  git commit -am "fix: failing tests"
  git push
  ```
- Workflow will re-run automatically on push

---

## Security Best Practices

✅ **DO:**

- Use API tokens with minimal required permissions
- Set token expiration for periodic rotation (e.g., 1 year)
- Regularly audit and rotate secrets (every 6-12 months)
- Use separate tokens for staging vs production environments
- Store tokens only in GitHub Secrets (encrypted at rest)

❌ **DON'T:**

- Share API tokens in code, commits, or public channels
- Use global access tokens when scoped tokens suffice
- Store secrets in `.env` files committed to git
- Use the same token across multiple projects
- Disable expiration on tokens (security risk)

---

## Environment Variables in Vercel

**Important:** GitHub Secrets are only for deployment authentication. Application environment variables (like `NEXT_PUBLIC_SUPABASE_URL`, `OPENROUTER_API_KEY`, etc.) must be configured separately in Vercel Dashboard.

### Configure in Vercel:

1. Go to Vercel Dashboard → 10xcards project
2. Click **Settings** → **Environment Variables**
3. Add all variables from `.env.prod`:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark as **Secret**)
   - `OPENROUTER_API_KEY` (mark as **Secret**)
   - `NODE_ENV=production`
   - etc.

4. Select environment: **Production** (and optionally Preview/Development)
5. Click **Save**

**Note:** Vercel automatically injects these during build and runtime.

---

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel API Tokens](https://vercel.com/docs/rest-api#authentication)

---

## Quick Reference

### Commands to get IDs via CLI:

```bash
# Login to Vercel
npx vercel login

# Get organization/team ID
npx vercel teams ls

# Get project ID
npx vercel project ls

# Get current user ID
npx vercel whoami
```

### Secrets checklist:

- [ ] `VERCEL_TOKEN` created and added to GitHub
- [ ] `VERCEL_ORG_ID` copied and added to GitHub
- [ ] `VERCEL_PROJECT_ID` copied and added to GitHub
- [ ] All 3 secrets visible in GitHub Settings → Actions
- [ ] Environment variables configured in Vercel Dashboard
- [ ] Test workflow run completed successfully
- [ ] Production deployment successful
- [ ] Live site accessible at https://10xcards.vercel.app
