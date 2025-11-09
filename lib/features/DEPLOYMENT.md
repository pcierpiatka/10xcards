# Feature Flags - Deployment Configuration

Instructions for configuring `ENV_NAME` environment variable across different deployment platforms.

## Overview

The feature flags system requires `ENV_NAME` environment variable to be set on all environments:

- **local**: Development (all features ON)
- **integration**: Staging (partial enablement for testing)
- **production**: Production (controlled rollout)

## Local Development

Already configured in `.env.local`:

```bash
ENV_NAME=local
```

Restart your dev server after any changes:

```bash
npm run dev
```

## Vercel Deployment

### Via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `ENV_NAME`
   - **Value**: `production` (or `integration` for preview branches)
   - **Environments**: Select appropriate environments:
     - Production → `production`
     - Preview → `integration`
     - Development → `local`

### Via Vercel CLI

```bash
# Production
vercel env add ENV_NAME production production

# Preview (all preview branches)
vercel env add ENV_NAME integration preview

# Development
vercel env add ENV_NAME local development
```

### Branch-specific Configuration

For specific preview branches:

```bash
# Integration branch → integration environment
vercel env add ENV_NAME integration preview --git-branch=integration
```

### Verify Configuration

After deployment, check logs:

```bash
vercel logs
```

Look for feature flag initialization or use the following test endpoint (if created):

```bash
curl https://your-app.vercel.app/api/health
```

## DigitalOcean App Platform

### Via Dashboard

1. Go to your App in DigitalOcean App Platform
2. Navigate to **Settings** → **App-Level Environment Variables**
3. Click **Edit** → **Add Variable**:
   - **Key**: `ENV_NAME`
   - **Value**: `production`
   - **Scope**: All components
4. Click **Save**
5. Redeploy your app

### Via doctl CLI

```bash
# Get your app ID
doctl apps list

# Add environment variable
doctl apps update YOUR_APP_ID --env "ENV_NAME=production"
```

### Docker Deployment

If using Docker on DigitalOcean, add to your `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - ENV_NAME=production
```

Or pass via docker run:

```bash
docker run -e ENV_NAME=production your-image:tag
```

## GitHub Actions (CI/CD)

For automated deployments, add `ENV_NAME` to GitHub Secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets:
   - `PRODUCTION_ENV_NAME` = `production`
   - `INTEGRATION_ENV_NAME` = `integration`

Then use in workflow:

```yaml
# .github/workflows/deploy-production.yml
- name: Deploy to Vercel
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    ENV_NAME: ${{ secrets.PRODUCTION_ENV_NAME }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Docker

### Docker Compose

In `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    environment:
      - ENV_NAME=${ENV_NAME:-local}
    ports:
      - "3000:3000"
```

### Dockerfile

**Do NOT hardcode ENV_NAME in Dockerfile** - pass at runtime:

```dockerfile
# ❌ DON'T DO THIS
ENV ENV_NAME=production

# ✅ DO THIS - accept as build arg or runtime env
ARG ENV_NAME
ENV ENV_NAME=${ENV_NAME}
```

Run with:

```bash
docker build --build-arg ENV_NAME=production -t app .
docker run -e ENV_NAME=production -p 3000:3000 app
```

## Kubernetes

In deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
        - name: app
          image: your-image:tag
          env:
            - name: ENV_NAME
              value: "production"
```

Or use ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  ENV_NAME: "production"
---
apiVersion: apps/v1
kind: Deployment
# ...
          envFrom:
            - configMapRef:
                name: app-config
```

## Environment Strategy

### Recommended Setup

| Environment     | ENV_NAME Value | Use Case                         |
| --------------- | -------------- | -------------------------------- |
| **Local**       | `local`        | Development, all features ON     |
| **Integration** | `integration`  | Staging, partial features for QA |
| **Production**  | `production`   | Live, controlled feature rollout |

### Feature Rollout Strategy

Example: Rolling out Collections feature

**Phase 1: Development**

- ENV_NAME=`local` (collections: ON)
- Develop and test locally

**Phase 2: Integration Testing**

- ENV_NAME=`integration` (auth: ON, collections: OFF initially)
- Enable collections in `flags.json` for integration
- QA team tests collections on staging

**Phase 3: Production Rollout**

- ENV_NAME=`production` (collections: OFF)
- Enable collections in `flags.json` for production
- Deploy with collections enabled
- Monitor metrics, rollback if needed (just toggle flag)

## Verification

### Test Feature Flags After Deployment

1. **Check environment detection**:

   ```typescript
   // Add temporary debug endpoint (remove after verification)
   // app/api/debug/env/route.ts
   export async function GET() {
     return Response.json({
       ENV_NAME: process.env.ENV_NAME,
       flags: {
         "auth.login": isFeatureEnabled("auth.login"),
         "collections.visibility": isFeatureEnabled("collections.visibility"),
       },
     });
   }
   ```

2. **Test API guards**:

   ```bash
   # Should return 403 if feature is OFF
   curl -X POST https://your-app.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   ```

3. **Test UI visibility**:
   - Login to your app
   - Check if Collections link appears in header (based on `collections.visibility` flag)

### Common Issues

**Issue**: "ENV_NAME not set" warning in logs

- **Solution**: Verify ENV_NAME is added to environment variables
- **Fallback**: System defaults to `local` (all features ON)

**Issue**: Features not enabled despite ENV_NAME=local

- **Solution**: Check `flags.json` has correct configuration
- **Solution**: Ensure build includes updated `flags.json`

**Issue**: Build fails with "Cannot find module @/lib/features"

- **Solution**: Clear build cache and rebuild
- **Solution**: Verify all imports use correct path `@/lib/features`

## Troubleshooting

### Enable Debug Logging

Temporarily add logging to `get-environment.ts`:

```typescript
export function getEnvironment(): Environment {
  const envName = process.env.ENV_NAME;

  // DEBUG: Remove after verification
  console.log("[Feature Flags] ENV_NAME:", envName);

  if (!envName) {
    console.warn("[Feature Flags] ENV_NAME not set, falling back to local");
    return "local";
  }
  // ...
}
```

### Verify Flag Configuration

Check what flags are loaded:

```typescript
// Temporary debug
import flagsConfig from "@/lib/features/config/flags.json";
console.log("[Feature Flags] Config:", JSON.stringify(flagsConfig, null, 2));
```

## Security Notes

⚠️ **Important**:

- ENV_NAME is **NOT sensitive** (values: local/integration/production)
- Safe to expose in logs and debug endpoints
- Real security comes from API guards (`requireFeature()`) and RLS policies
- Client-side flags are for UX only - **never** for security

## Next Steps

After deployment:

1. ✅ Verify ENV_NAME is set correctly
2. ✅ Test API endpoints with feature flags
3. ✅ Test UI visibility (header links, buttons)
4. ✅ Monitor logs for any feature flag errors
5. ✅ Remove debug endpoints/logging
6. ✅ Document any environment-specific flag changes
