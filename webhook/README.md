# Hashnode → GitHub webhook trampoline

A tiny Netlify Function that receives Hashnode publish webhooks, verifies the HMAC signature, and triggers a GitHub Pages rebuild by calling the `repository_dispatch` API on `DrewHoo/DrewHoo.github.io`.

This exists because:

1. GitHub's `repository_dispatch` endpoint requires an `Authorization: Bearer <token>` header.
2. Hashnode webhooks don't let you configure custom headers.

So this function is the ~40-line middleman that adds the header.

## Architecture

```
Hashnode (post published)
  └─► POST /.netlify/functions/hashnode-rebuild   (signed with HMAC-SHA256)
        └─► verify signature
        └─► POST api.github.com/repos/.../dispatches   (Bearer token)
              └─► repository_dispatch event
                    └─► .github/workflows/deploy.yml runs
                          └─► Astro rebuilds, pulls fresh posts from gql.hashnode.com
                          └─► Deploys to GitHub Pages
```

## One-time setup

### 1. Create a GitHub fine-grained PAT

- https://github.com/settings/personal-access-tokens/new
- **Resource owner:** DrewHoo
- **Repository access:** Only select repositories → `DrewHoo/DrewHoo.github.io`
- **Repository permissions:** **Contents: Read and write** (this is what `repository_dispatch` checks)
- Copy the token (starts with `github_pat_...`).

### 2. Create a Netlify site from this repo

- https://app.netlify.com/start → pick `DrewHoo/DrewHoo.github.io`.
- **Base directory:** `webhook`
- **Build command:** leave empty
- **Publish directory:** `public` (already set in `netlify.toml`)
- Deploy. You'll get a URL like `https://<random-name>.netlify.app`.
  - (Optional) Rename to something like `drewhoover-webhook.netlify.app` in Site settings → Domain management.

### 3. Set Netlify environment variables

Site settings → Environment variables → Add:

| Key | Value |
|-----|-------|
| `GITHUB_DISPATCH_TOKEN` | the PAT from step 1 |
| `HASHNODE_WEBHOOK_SECRET` | *fill in after step 4* |
| `GITHUB_REPO` | `DrewHoo/DrewHoo.github.io` *(optional — this is the default)* |
| `GITHUB_EVENT_TYPE` | `hashnode-post-published` *(optional — matches the workflow trigger)* |

### 4. Create the Hashnode webhook

- Blog dashboard → Webhooks → Add new webhook.
- **URL:** `https://<your-netlify-site>.netlify.app/.netlify/functions/hashnode-rebuild`
- **Events:** `post_published`, `post_updated`, `post_deleted` (at minimum).
- Save. Copy the generated `whsec_...` secret.

### 5. Finish wiring

- Paste the `whsec_...` value into the `HASHNODE_WEBHOOK_SECRET` Netlify env var from step 3.
- Redeploy the Netlify site so the function picks up the new env var (Deploys → Trigger deploy → Deploy site).

### 6. Verify

- Hashnode webhook page → **Send test event**.
- Netlify → Functions → `hashnode-rebuild` → Logs: should show `202` (or surface a signature/dispatch error).
- GitHub → Actions: the `Deploy to GitHub Pages` workflow should fire with "repository_dispatch" as the trigger.

## Local testing

```bash
cd webhook
npx netlify dev    # requires `npm i -g netlify-cli`
```

Hit `http://localhost:8888/.netlify/functions/hashnode-rebuild` with a crafted signed POST, or use Hashnode's **Send test event** against an ngrok tunnel.

## Responses

| Status | Meaning |
|--------|---------|
| `202` | Signature verified, GitHub dispatch accepted. |
| `401` | Missing, malformed, stale, or invalid signature. |
| `405` | Not a POST. |
| `500` | Missing env vars. |
| `502` | GitHub API rejected the dispatch. |

## Security notes

- The function rejects timestamps more than 10 minutes old to blunt replay attacks.
- Signature compare uses `crypto.timingSafeEqual` to avoid leaking bytes.
- The PAT is scoped to **one repo** with **contents: write** — the minimum needed for `repository_dispatch`.
- If the webhook secret leaks, rotate it in Hashnode and update the Netlify env var; no redeploy of this repo needed.
