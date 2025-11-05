# Cloudflare Pages - Environment Variables Configuration

## Where to configure

**Cloudflare Dashboard** → **Pages** → **Your Project** → **Settings** → **Environment variables**

---

## Required Variables

### Production Environment

| Variable                        | Value Source                                                                                  | Where to Set                       | Visibility  |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- | ----------- |
| `NEXT_PUBLIC_APP_URL`           | Your Cloudflare Pages URL<br>Example: `https://10xcards.pages.dev`                            | **Cloudflare Pages**<br>Production | Public      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Project Settings<br>Example: `https://xxxxxxxxxxxxx.supabase.co`                     | **Cloudflare Pages**<br>Production | Public      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings<br>→ API Settings → Project API keys → `anon` `public`              | **Cloudflare Pages**<br>Production | Public      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Project Settings<br>→ API Settings → Project API keys → `service_role` ⚠️ **SECRET** | **Cloudflare Pages**<br>Production | **Private** |
| `OPENROUTER_API_KEY`            | https://openrouter.ai/keys                                                                    | **Cloudflare Pages**<br>Production | **Private** |
| `NODE_ENV`                      | `production`                                                                                  | **Cloudflare Pages**<br>Production | Private     |

---

## Optional Variables (with defaults)

| Variable                     | Default Value        | Where to Set                       | Description                       |
| ---------------------------- | -------------------- | ---------------------------------- | --------------------------------- |
| `OPENROUTER_MODEL`           | `openai/gpt-4o-mini` | **Cloudflare Pages**<br>Production | AI model to use                   |
| `OPENROUTER_SITE_URL`        | Your app URL         | **Cloudflare Pages**<br>Production | For OpenRouter attribution        |
| `OPENROUTER_SITE_NAME`       | `10xCards`           | **Cloudflare Pages**<br>Production | For OpenRouter attribution        |
| `RATE_LIMIT_AI_GENERATIONS`  | `10`                 | **Cloudflare Pages**<br>Production | Max AI requests per hour per user |
| `MAX_FLASHCARDS_PER_REQUEST` | `10`                 | **Cloudflare Pages**<br>Production | Max flashcards per generation     |
| `NEXT_TELEMETRY_DISABLED`    | `1`                  | **Cloudflare Pages**<br>Production | Disable Next.js telemetry         |

---

## Preview Environment (optional)

You can configure separate variables for **Preview** deployments (branches, PRs):

- Use the same Supabase project or create a separate staging project
- Consider using a separate OpenRouter API key with lower rate limits
- Set `NEXT_PUBLIC_APP_URL` to match your preview URL pattern

---

## ⚠️ Security Notes

### **NEVER expose these variables publicly:**

- `SUPABASE_SERVICE_ROLE_KEY` - has admin privileges, bypasses RLS
- `OPENROUTER_API_KEY` - costs money per API call

### **Safe to expose (NEXT*PUBLIC*\*):**

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## How to Get Supabase Keys

1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon)
3. Navigate to **API** section
4. Copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️

---

## How to Get OpenRouter API Key

1. Go to https://openrouter.ai/keys
2. Sign up / Log in
3. Click **Create Key**
4. Add credits to your account
5. Copy the key → `OPENROUTER_API_KEY`

---

## Verification Checklist

After setting variables in Cloudflare Pages:

- [ ] All 6 required variables are set for Production
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual Cloudflare Pages URL
- [ ] Supabase keys are from the correct project (Production, not local)
- [ ] OpenRouter key has sufficient credits
- [ ] `NODE_ENV` is set to `production`
- [ ] No variables have trailing spaces or line breaks
- [ ] Redeploy the application after setting variables

---

## Common Issues

**Issue**: "Supabase client failed to initialize"

- **Fix**: Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

**Issue**: "OpenRouter API error"

- **Fix**: Verify `OPENROUTER_API_KEY` is valid and has credits

**Issue**: Changes not reflected

- **Fix**: Variables only apply to NEW deployments. Trigger a redeploy after changing env vars.

---

## Build Settings

Ensure your Cloudflare Pages build settings are:

```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Node version: 22 (or set via .nvmrc)
```
