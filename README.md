# EchoVault

> A cinematic, local-first emotional journal that turns private reflections into a personal universe of memories, patterns, and rituals.

[Open the live app](https://nmethylpyrrolinium.github.io/echovault.com/) · [Report a security issue](SECURITY.md)

EchoVault is designed for reflection without requiring an account. A visitor can write and revisit echoes, explore mood patterns, create visual receipts, and use the app offline. Optional Supabase configuration adds authentication and profile sync while the journal remains usable in local mode.

## Preview

EchoVault uses a dark, celestial interface built around emotional orbs, timelines, cinematic summaries, and small reflective rituals.

> Preview images are not currently committed. Add optimized screenshots to `assets/previews/` and reference them here when they are ready.

## What it does

- Stores journal entries locally in the browser by default.
- Presents memories through a timeline, emotional universe, patterns, and Wrapped-style summaries.
- Creates Mood Receipts, Echo Soundprints, and other lightweight reflection artifacts.
- Supports installable PWA behavior and offline use.
- Enables optional Supabase authentication, profile sync, and avatar storage when configured by the deployer.

EchoVault is a creative reflection tool, not a clinical or therapeutic service.

Special Access is an optional unlock system for a small set of extra rituals; it is not a payment or subscription flow.

## Features

- Cinematic, responsive visual identity
- Local-first journal storage and local export/import
- Emotional pattern and archetype summaries
- Interactive rituals and memory views
- Optional Supabase account features
- Progressive Web App support
- Static-hosting friendly deployment
- Accessibility and reduced-motion considerations

## Tech stack

- HTML, CSS, and vanilla JavaScript
- Three.js for cinematic scenes
- Supabase JavaScript client for optional account features
- Node.js smoke tests
- GitHub Pages for the live static deployment

## Repository structure

```text
.
├── index.html                    # Static deployment entry point
├── styles.css                    # Main visual system
├── script.js                     # Core application behavior
├── phase2-emotional-intelligence.js
├── wrapped-cinematic-module.js   # Wrapped cinematic experience
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker
├── icons/                        # Application icons
├── legacy-pages/                 # Archived earlier page versions
├── scripts/                      # Validation and smoke tests
├── docs/                         # Maintainer-facing repository notes
└── .github/workflows/            # Security and repository automation
```

The root-level entry point and assets are intentionally retained so existing static deployment paths continue to work.

## Run locally

Requirements: Node.js 18 or newer for the smoke tests. The app itself is static.

```bash
git clone https://github.com/nmethylpyrrolinium/echovault.com.git
cd echovault.com
npm install
npm test
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A local HTTP server is recommended because service workers and some browser APIs do not behave normally when opening `index.html` directly.

## Optional service configuration

EchoVault works without external credentials. When `window.ECHOVAULT_CONFIG` does not contain Supabase values, the app falls back to local mode.

Deployment maintainers can provide these values through a private deployment step or hosting-platform environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` — use only a browser-safe publishable/anonymous key; never a service-role key
- `SUPABASE_AVATAR_BUCKET`
- `ALAM_AI_ENDPOINT`
- `ACCESS_CODE_HASHES`

See [`.env.example`](.env.example) for placeholder names. Because this is a static frontend, do not place secrets in client-side code: anything delivered to the browser is public. Keep privileged operations and service-role credentials on a server.

## Deployment

The production site is a static GitHub Pages deployment. Keep `index.html`, `manifest.json`, `sw.js`, and their referenced root assets at their current paths.

To publish from GitHub Pages:

1. Push the reviewed changes to the deployment branch.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the intended branch and the repository root (`/`).
4. Confirm the generated Pages URL and run the smoke test against the deployed result.

Optional service configuration must be injected securely by the deployment process. Without it, the deployed app continues in local mode.

## Security

Never commit `.env` files, service-role keys, tokens, private endpoints, access codes, or personal journal exports. If a credential has ever been committed, remove it from active configuration and rotate it with its provider; deleting it from the latest commit is not enough.

Please follow [SECURITY.md](SECURITY.md) when reporting a vulnerability.

## Roadmap

- Add optimized repository preview images
- Continue accessibility and performance checks across mobile devices
- Expand local-first import/export reliability
- Document optional backend deployment patterns without exposing credentials

## License

This project is available under the terms in [LICENSE](LICENSE).
