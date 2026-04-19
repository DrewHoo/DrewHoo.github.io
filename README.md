# drewhoover.com

The index site for my data-visualization side projects. Each card on the homepage links to a standalone app that lives in its own repo and deploys independently to GitHub Pages. This repo is just the front door.

Built with [Astro](https://astro.build/) and deployed as a GitHub Pages **User Site** (`DrewHoo/DrewHoo.github.io`), with a custom domain.

## Adding a new project

1. Create `src/content/projects/<slug>.md`.
2. Fill in the frontmatter (see `src/content.config.ts` for the schema):

   ```yaml
   ---
   title: My New Thing
   blurb: A short description (max 280 chars).
   liveUrl: https://drewhoo.github.io/my-new-thing/
   repoUrl: https://github.com/DrewHoo/my-new-thing
   stack:
     - React
     - D3
   pinned: false
   order: 10            # higher = earlier in the list
   updated: 2026-04-19
   ---
   ```

3. Optionally add an MDX body under the frontmatter for a longer writeup — it will render at `/projects/<slug>/`.
4. `git push`. The GitHub Action rebuilds and redeploys.

## Blog content (headless Hashnode)

Blog posts live in [Hashnode](https://hashnode.com/) and are fetched at build time via their GraphQL API (`gql.hashnode.com`) — no migration, no local markdown files. Keep writing in the Hashnode editor; the next build/deploy picks up changes.

- Publication host is configured in [src/content.config.ts](src/content.config.ts) (defaults to `drewhoover.com`, overridable via `HASHNODE_PUBLICATION_HOST` env var).
- The loader lives at [src/loaders/hashnode.ts](src/loaders/hashnode.ts) and paginates through all published posts.
- Images (cover and inline) stay on Hashnode's CDN.
- To pick up new or edited posts, trigger a rebuild — either push any commit, or re-run the deploy workflow manually from the Actions tab.

## Local development

```bash
npm install
npm run dev       # localhost:4321
npm run build
npm run preview
```

## Hosting / deploy

- Repo: `DrewHoo/DrewHoo.github.io` (a GitHub **User Site** — name must match the username).
- GitHub Pages source: **GitHub Actions** (not "deploy from branch").
- Custom domain: `drewhoover.com`, committed in `public/CNAME`.
- Workflow: `.github/workflows/deploy.yml` uses the official `withastro/action` + `actions/deploy-pages`.

### DNS (one-time, when the domain is active)

Apex (`drewhoover.com`) — four `A` records to GitHub Pages' IPs:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www` — `CNAME` → `drewhoo.github.io`.

### Why the subpath routing just works

Any other repo owned by `DrewHoo` that has Pages enabled is automatically served under this domain as `drewhoover.com/<repo-name>/`. No per-project DNS needed. So `DrewHoo/space-rock` appears at `drewhoover.com/space-rock/` as soon as `drewhoover.com` is the custom domain on the User Site repo.

## "Back to the index" bar on project sites

`public/embed/back-bar.js` is a ~50-line standalone script that any project site can include to add a sticky top strip linking home. To wire it up in a sibling repo (e.g. `cfb-all-time-records`), add this to the project's HTML head:

```html
<script src="https://drewhoover.com/embed/back-bar.js" async></script>
```

To opt out on a specific page, add `data-dhv-back-bar="off"` to the `<html>` or `<body>` tag.

The actual integration in `DrewHoo/cfb-all-time-records` and `DrewHoo/space-rock` is a follow-up task in those repos; this repo only ships the snippet.

## Comments on project sites

`public/embed/giscus.js` mounts a [giscus](https://giscus.app/) comment thread on any sibling site. Comments are stored in this repo's GitHub Discussions (category: **Comments**), so moderation happens in one place regardless of which project a visitor comments on. Threads are keyed by `pathname`, so `drewhoover.com/space-rock/` and `drewhoover.com/cfb-all-time-records/` each get their own.

Usage in a sibling repo's HTML:

```html
<script src="https://drewhoover.com/embed/giscus.js" async></script>
```

Placement: if the page includes `<div id="comments">`, the widget mounts there. Otherwise it appends to the bottom of `<body>`. Opt out per-page with `data-dhv-giscus="off"` on `<html>` or `<body>`.

Theme follows `prefers-color-scheme` to match the rest of the ecosystem. Requires Discussions enabled on `DrewHoo/DrewHoo.github.io` and the [giscus GitHub app](https://github.com/apps/giscus) installed on it.

## Structure

```
src/
  components/   ProjectCard, ProjectGrid, Divider, Header, Footer, BaseHead, ...
  content/
    projects/   One markdown file per project card.
  loaders/
    hashnode.ts Custom Astro content loader — pulls blog posts from Hashnode's GraphQL API at build time.
  layouts/      BlogPost layout.
  pages/
    index.astro             Card grid.
    about.astro
    blog/index.astro        Post index.
    blog/[...slug].astro    Single post.
    projects/[...slug].astro  Per-project detail/writeup page.
    rss.xml.js              Blog RSS feed.
  styles/global.css         One hand-written stylesheet.
public/
  CNAME, favicon.svg, fonts/, embed/back-bar.js, embed/giscus.js
```

## Style / design notes

- Palette: warm cream paper, warm near-black ink, cadmium orange, ultramarine, a yellow-green highlight. Defined as CSS custom properties in `src/styles/global.css`.
- Typography: Space Mono for display, Atkinson Hyperlegible for body. Both self-hosted from `public/fonts/`.
- Dark mode is automatic via `prefers-color-scheme`; no manual toggle.
- Animations are minimal and respect `prefers-reduced-motion`.
- Hand-written CSS, no Tailwind — that's on purpose.

## License

MIT (see `LICENSE` when added). Content (blog posts, project writeups) © Drew Hoover.
