# EchoVault

Single-page web app for journaling emotional “echoes” with interactive visual rituals.

## Run locally

Because this is a static site, you can open `index.html` directly or serve it with any static server:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

## Project structure

- `index.html` — app shell and semantic markup.
- `assets/styles.css` — all visual styles and animation keyframes.
- `assets/app.js` — application logic (state, storage, rendering, rituals).

## Data model (echo)

Each echo is normalized to:

```json
{
  "id": "string",
  "mood": "calm|chaos|reflective|anxious|joyful|empty",
  "intensity": "1-10",
  "silence": "1-10",
  "thought": "string",
  "void": "boolean",
  "date": "ISO-8601"
}
```

## Security and reliability notes

- Import payloads are sanitized before saving or rendering.
- Runtime CSP is set in `index.html`.
- Receipt image capture depends on `html2canvas` being present globally.
