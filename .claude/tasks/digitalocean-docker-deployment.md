# DigitalOcean Docker Deployment Workflow

**Goal**: Automated CI/CD workflow for building Docker images, pushing to GitHub Container Registry (GHCR), and deploying to DigitalOcean App Platform from `main` branch.

**Approach**: GitHub Actions workflow with automatic trigger on push to main, quality gates (lint + tests), Docker multi-stage build, GHCR storage, SHA-based tagging, and DigitalOcean App Platform deployment.

**Status**: ⏳ PENDING APPROVAL

---

## 1. Overview

Implement complete CI/CD pipeline for containerized production deployments to DigitalOcean App Platform.

### Key Requirements:

1. **Deployment triggers:**
   - Automatic trigger - push to `main` branch
   - Manual trigger (`workflow_dispatch`) - on-demand deployments

2. **Quality gates:**
   - ESLint checks (code quality)
   - Unit tests (vitest) - fail = stop deployment
   - TypeScript type check

3. **Docker build:**
   - Multi-stage build from `Dockerfile`
   - Push to GitHub Container Registry (ghcr.io)
   - Tag with commit SHA (e.g., `sha-abc1234`)
   - Tag with `latest` for main branch

4. **Deployment:**
   - Deploy to DigitalOcean App Platform
   - Use App Spec from `.do/app.yaml`
   - Automatic image pull from GHCR
   - Zero-downtime deployment

---

## 2. Approach (MVP Strategy)

**Philosophy**: Build once, deploy anywhere. Docker image as deployment artifact ensures consistency across environments.

### Key Decisions:

1. **GitHub Container Registry** - Native integration with GitHub Actions, better rate limits
2. **SHA-based tagging** - Immutable tags for rollback capability
3. **App Spec deployment** - Infrastructure as Code in `.do/app.yaml`
4. **Quality-first** - All quality gates must pass before build
5. **Security** - Non-root container user, health checks, minimal attack surface

### Workflow Flow:

```
Trigger (push to main / manual)
  → Checkout code
  → Setup Node.js 22
  → Install dependencies
  → Lint (FAIL → STOP)
  → Unit tests (FAIL → STOP)
  → Type check (FAIL → STOP)
  → Login to GHCR
  → Extract metadata (tags, labels)
  → Build Docker image (multi-stage)
  → Push to GHCR (sha-xxx + latest)
  → Deploy to DigitalOcean App Platform
  → Summary
```

---

## 3. Implementation Plan

### PHASE 1: GitHub Actions Workflow

#### Task 1.1: Create workflow file `.github/workflows/master-docker.yml`

**Objective:** Implement automated Docker build and DigitalOcean deployment

- [ ] **Workflow metadata:**
  - Name: "Build Docker & Deploy to DigitalOcean"
  - Triggers:
    - `push` on `main` branch
    - `workflow_dispatch` (manual trigger)

- [ ] **Jobs structure:**
  - Single job: `build-and-deploy`
  - Runner: `ubuntu-latest`
  - Node.js: 22 (via `setup-node@v6`)

- [ ] **Steps (12 total):**

**Step 1-2: Checkout and Setup**

```yaml
- name: Checkout repository
  uses: actions/checkout@v5

- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: "22"
    cache: "npm"
```

**Step 3: Install dependencies**

```yaml
- name: Install dependencies
  run: npm ci
```

**Step 4-6: Quality gates**

```yaml
- name: Run ESLint
  run: npm run lint

- name: Run unit tests
  run: npm run test:unit

- name: TypeScript type check
  run: npx tsc --noEmit
```

**Step 7: Login to GitHub Container Registry**

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

**Step 8: Extract Docker metadata**

```yaml
- name: Docker metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=sha,prefix={{branch}}-
      type=raw,value=latest,enable={{is_default_branch}}
    labels: |
      org.opencontainers.image.title=10xCards
      org.opencontainers.image.description=AI-powered flashcard generator
      org.opencontainers.image.vendor=10xDevs
```

**Step 9: Build and push Docker image**

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v6
  with:
    context: .
    file: ./Dockerfile
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    platforms: linux/amd64
```

**Step 10: Deploy to DigitalOcean App Platform**

```yaml
- name: Deploy to DigitalOcean App Platform
  uses: digitalocean/app_action/deploy@v2
  with:
    token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
```

**Step 11: Get deployment URL**

```yaml
- name: Get App Platform URL
  id: app_url
  run: |
    echo "App deployed successfully!"
    echo "url=https://10xcards.ondigitalocean.app" >> $GITHUB_OUTPUT
```

**Step 12: Deployment summary**

```yaml
- name: Deployment summary
  run: |
    echo "🚀 Deployment completed successfully!"
    echo "📦 Docker Image: ghcr.io/${{ github.repository }}:${{ steps.meta.outputs.version }}"
    echo "🔖 Tags: ${{ steps.meta.outputs.tags }}"
    echo "🌐 Live URL: ${{ steps.app_url.outputs.url }}"
```

**Time estimate:** ~60 minutes

---

### PHASE 2: DigitalOcean App Spec

#### Task 2.1: Create App Spec file `.do/app.yaml`

**Objective:** Define infrastructure as code for DigitalOcean App Platform

- [ ] Create `.do/app.yaml` with app configuration

**Content structure:**

```yaml
name: 10xcards
region: nyc

services:
  - name: web
    # Image from GitHub Container Registry
    image:
      registry_type: GHCR
      registry: ghcr.io
      repository: <your-github-username>/10xcards
      tag: latest

    # Health check
    health_check:
      http_path: /api/health
      initial_delay_seconds: 10
      period_seconds: 10
      timeout_seconds: 3
      success_threshold: 1
      failure_threshold: 3

    # Instance configuration
    instance_count: 1
    instance_size_slug: basic-xxs # 512MB RAM, 0.5 vCPU

    # HTTP configuration
    http_port: 3000

    # Environment variables (add your actual values in DO dashboard)
    envs:
      - key: NODE_ENV
        value: production
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"
      - key: PORT
        value: "3000"
      # Add secrets via DigitalOcean dashboard:
      # - NEXT_PUBLIC_SUPABASE_URL
      # - NEXT_PUBLIC_SUPABASE_ANON_KEY
      # - SUPABASE_SERVICE_ROLE_KEY
      # - OPENROUTER_API_KEY
# Optional: Add a database component if needed
# databases:
#   - name: db
#     engine: PG
#     version: "15"
```

**Time estimate:** ~20 minutes

---

### PHASE 3: Documentation

#### Task 3.1: Create deployment setup guide

**Objective:** Document DigitalOcean App Platform configuration

- [ ] Create `.ai/digitalocean-setup.md`

**Content structure:**

1. **Prerequisites:**
   - DigitalOcean account
   - GitHub repository connected to DigitalOcean
   - GHCR access configured

2. **Step 1: Create DigitalOcean API Token**
   - Navigate to DigitalOcean → API → Tokens/Keys
   - Generate new token: "GitHub Actions - 10xcards Deploy"
   - Scope: Read + Write
   - Copy token (shown once)

3. **Step 2: Add token to GitHub Secrets**
   - GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DIGITALOCEAN_ACCESS_TOKEN`
   - Value: [token from Step 1]

4. **Step 3: Configure GHCR permissions**
   - GitHub repo → Settings → Actions → General
   - Workflow permissions: "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"

5. **Step 4: Create App on DigitalOcean**
   - Navigate to DigitalOcean → Apps → Create App
   - Choose "Deploy from GitHub"
   - Select repository: 10xcards
   - Branch: main
   - Autodeploy: Disabled (we use GitHub Actions)
   - Upload `.do/app.yaml` as App Spec

6. **Step 5: Configure environment variables**
   - In App settings → Environment Variables
   - Add production secrets:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `OPENROUTER_API_KEY`

7. **Verification:**
   - Push to main → GitHub Actions runs
   - Docker image appears in GHCR
   - DigitalOcean deploys new image
   - App accessible at live URL

8. **Troubleshooting:**
   - Error: "Failed to pull image" → Check GHCR permissions
   - Error: "Health check failed" → Verify `/api/health` endpoint
   - Error: "Build failed" → Check Dockerfile syntax
   - Error: "Permission denied" → Verify DO token scope

**Time estimate:** ~30 minutes

---

## 4. Files to Create/Modify

### New files (3):

1. **`.github/workflows/master-docker.yml`**
   - GitHub Actions workflow (YAML)
   - ~150 lines
   - 12 deployment steps

2. **`.do/app.yaml`**
   - DigitalOcean App Spec (YAML)
   - ~50 lines
   - Infrastructure as Code

3. **`.ai/digitalocean-setup.md`**
   - Documentation (Markdown)
   - Step-by-step setup guide
   - Troubleshooting section

### Modified files (1):

1. **`.github/workflows/deploy.yml`**
   - Uncomment and update docker job (lines 78-101)
   - OR keep as-is and deprecate in favor of `master-docker.yml`

---

## 5. Success Criteria

✅ **After implementation:**

1. **Workflow execution:**
   - [ ] Manual trigger works (Actions → "Run workflow")
   - [ ] Automatic trigger works (push to `main`)
   - [ ] All 12 steps execute successfully
   - [ ] Total execution time: ~8-12 minutes

2. **Quality gates:**
   - [ ] Lint failures stop deployment
   - [ ] Unit test failures stop deployment
   - [ ] Type check failures stop deployment
   - [ ] All gates pass → build proceeds

3. **Docker build:**
   - [ ] Multi-stage build succeeds
   - [ ] Image size < 500MB (optimized)
   - [ ] Image tagged with SHA (e.g., `main-sha-abc1234`)
   - [ ] Image tagged with `latest`
   - [ ] Image visible in GHCR (ghcr.io/your-username/10xcards)

4. **Container registry:**
   - [ ] Login to GHCR succeeds
   - [ ] Push to GHCR succeeds
   - [ ] Image layers cached for faster builds
   - [ ] Old images can be cleaned up manually

5. **DigitalOcean deployment:**
   - [ ] App Spec recognized
   - [ ] Image pulled from GHCR
   - [ ] Health check passes (`/api/health` returns 200)
   - [ ] App accessible at live URL
   - [ ] Zero-downtime deployment

6. **Documentation:**
   - [ ] Setup guide is clear
   - [ ] All secrets documented
   - [ ] App Spec explained
   - [ ] Troubleshooting helpful

---

## 6. GitHub Secrets & Permissions Required

### GitHub Secrets (1):

| Secret Name                 | Where to Get                | Example Format    | Type   |
| --------------------------- | --------------------------- | ----------------- | ------ |
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean → API → Tokens | `dop_v1_xxxxx...` | Secret |

### GitHub Permissions:

- **Workflow permissions:**
  - Read and write permissions (for GHCR push)
  - Contents: Read
  - Packages: Write

- **GITHUB_TOKEN** (automatic):
  - Used for GHCR authentication
  - No manual setup needed

---

## 7. Testing Plan

### Manual testing after implementation:

1. **Test 1: Manual trigger**
   - Actions → "Build Docker & Deploy to DigitalOcean"
   - Click "Run workflow"
   - Verify: Build succeeds, image pushed, app deployed

2. **Test 2: Automatic trigger**
   - Make dummy commit to `main`
   - Push to remote
   - Verify: Workflow automatically starts and completes

3. **Test 3: Quality gate - failing lint**
   - Introduce lint error
   - Push to main
   - Verify: Workflow stops at "Run ESLint" step

4. **Test 4: Quality gate - failing tests**
   - Break a unit test
   - Push to main
   - Verify: Workflow stops at "Run unit tests" step

5. **Test 5: Docker image tagging**
   - After successful build, check GHCR
   - Verify: Two tags exist:
     - `main-sha-<commit-sha>`
     - `latest`

6. **Test 6: App Platform health**
   - After deployment, visit `/api/health`
   - Verify: Returns 200 OK
   - Check DO dashboard: "Healthy" status

7. **Test 7: Rollback scenario**
   - Note current SHA tag
   - Deploy broken version
   - Manually change tag in DO dashboard to previous SHA
   - Verify: App rolls back to working version

---

## 8. Time Estimate

**Total:** ~2 hours (120 minutes)

**PHASE 1 (Workflow):** 60 minutes

- Task 1.1 (Create workflow file): 60 min

**PHASE 2 (App Spec):** 20 minutes

- Task 2.1 (Create .do/app.yaml): 20 min

**PHASE 3 (Documentation):** 30 minutes

- Task 3.1 (Setup guide): 30 min

**Testing & Verification:** 10 minutes

- Manual testing (7 test scenarios)

---

## 9. MVP Scope Notes

**Included in MVP:**

- ✅ Automatic deployment on push to main
- ✅ Quality gates (lint + tests + type check)
- ✅ Docker multi-stage build
- ✅ GitHub Container Registry
- ✅ SHA-based immutable tags
- ✅ DigitalOcean App Platform deployment
- ✅ Health checks
- ✅ Build caching for faster builds

**Excluded from MVP (can add later):**

- ❌ Multi-environment deployments (staging/production)
- ❌ E2E tests before deployment
- ❌ Slack/Discord notifications
- ❌ Automatic rollback on health check failure
- ❌ Image vulnerability scanning (Trivy/Snyk)
- ❌ Multi-architecture builds (arm64)
- ❌ Deploy previews for PRs
- ❌ Blue-green deployment strategy
- ❌ Automatic old image cleanup

**Assumptions:**

- ✅ `Dockerfile` exists and is tested
- ✅ `/api/health` endpoint exists
- ✅ DigitalOcean account created
- ✅ Production Supabase project configured
- ✅ OpenRouter API key obtained
- ✅ GitHub Actions enabled on repository

**Anti-patterns to avoid:**

- ❌ Storing secrets in repository (use GitHub Secrets)
- ❌ Using `:latest` tag only (always use SHA)
- ❌ Skipping tests in CI (never bypass quality gates)
- ❌ Root user in container (security risk)
- ❌ Missing health checks (causes deployment issues)
- ❌ Committing `.env` files (use App Platform env vars)

---

## 10. Dependencies

**External dependencies:**

- DigitalOcean account with App Platform access
- GitHub repository with Actions and Packages enabled
- Node.js 22 environment
- Docker runtime (provided by GitHub Actions)
- Existing scripts in package.json: `lint`, `test:unit`, `build`

**Internal dependencies:**

- Working `Dockerfile` with multi-stage build
- Health check endpoint: `/api/health`
- Tests passing on `main` branch
- Build succeeds locally

---

## 11. Risks & Mitigations

| Risk                         | Probability | Impact | Mitigation                                         |
| ---------------------------- | ----------- | ------ | -------------------------------------------------- |
| **GHCR push fails**          | Medium      | High   | Check workflow permissions, use GITHUB_TOKEN       |
| **DO deployment fails**      | Medium      | High   | Verify App Spec, check image pull permissions      |
| **Health check fails**       | Medium      | Medium | Test /api/health locally, check port configuration |
| **Large image size**         | Low         | Medium | Multi-stage build, minimize layers                 |
| **Build timeout (>60 min)**  | Low         | Medium | Use build cache, optimize Dockerfile               |
| **Environment vars not set** | High        | High   | Clear documentation, verification step             |
| **GHCR rate limits**         | Low         | Low    | Use caching, avoid excessive rebuilds              |

---

## 12. Questions to Resolve

- [x] **Use GitHub Container Registry or Docker Hub?**
  - Decision: GHCR - better integration, included in GitHub plan

- [x] **Tag strategy: SHA only or SHA + latest?**
  - Decision: Both - SHA for rollback, latest for convenience

- [x] **Deploy from main or release branch?**
  - Decision: main - simpler for MVP, single source of truth

- [x] **Include E2E tests before deploy?**
  - Decision: NO - unit tests only (faster, MVP scope)

- [x] **App Spec in repo or manual config?**
  - Decision: In repo (`.do/app.yaml`) - Infrastructure as Code

- [x] **Manual or automatic DigitalOcean deploys?**
  - Decision: Automatic via GitHub Actions after quality gates

---

## 13. Latest GitHub Actions Versions (2025)

**Verified versions for this workflow:**

- `actions/checkout@v5` - Latest stable (Jan 2025)
- `actions/setup-node@v6` - Latest with node 24 support
- `docker/login-action@v3` - Latest for registry auth
- `docker/metadata-action@v5` - Latest for tag generation
- `docker/build-push-action@v6` - Latest with Buildx
- `digitalocean/app_action/deploy@v2` - Official DO action

---

## 14. What I Actually Did (vs Plan)

_Section to fill during implementation_

### PHASE 1: WORKFLOW FILE ✅ / ⏳ / ❌

**Task 1.1: Create GitHub Actions workflow**

- Status:
- Time actual:
- Changes vs plan:
- Issues encountered:

### PHASE 2: APP SPEC ✅ / ⏳ / ❌

**Task 2.1: Create .do/app.yaml**

- Status:
- Time actual:
- Changes vs plan:

### PHASE 3: DOCUMENTATION ✅ / ⏳ / ❌

**Task 3.1: Setup guide**

- Status:
- Time actual:
- Changes vs plan:

### TESTING ✅ / ⏳ / ❌

**Manual testing results:**

- Test 1 (manual trigger):
- Test 2 (auto trigger):
- Test 3 (lint failure):
- Test 4 (test failure):
- Test 5 (tagging):
- Test 6 (health check):
- Test 7 (rollback):

---

## 15. References

- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build GitHub Actions](https://docs.docker.com/build/ci/github-actions/)
- [DigitalOcean App Platform - GitHub Actions](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-github-actions/)
- [DigitalOcean App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [Docker Metadata Action](https://github.com/docker/metadata-action)

---

**READY FOR APPROVAL**

Awaiting user confirmation to proceed with implementation.
