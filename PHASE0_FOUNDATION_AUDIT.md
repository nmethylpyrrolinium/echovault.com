# EchoVault Phase 0 — Foundation Stabilization + Architecture Audit

## 1) Executive Summary
EchoVault has strong cinematic identity and broad feature coverage, but carries **high regression risk** because core systems are concentrated in a very large `script.js` monolith with many global listeners, multiple modal/overlay stacks, and several continuously-running animation paths. The biggest shared risk clusters are:
- scroll containment conflicts (fixed/fullscreen overlays + nested scroll areas),
- duplicated or lifecycle-unbounded listeners,
- mixed animation lifecycles across Universe/Timeline/Wrapped/Rituals,
- service worker freshness/offline edge cases,
- partial ritual implementations surfaced in production UI.

## 2) File Map
- `index.html`: all major app shells/views, navigation, modal roots, ritual cards, wrapped/timeline sections, PWA banner, replay drift stage.
- `styles.css`: global layout, nav/view spacing, fixed canvas stacks, modal/overlay styles, mobile/media behavior, scrollbars, reduced-motion fallbacks.
- `script.js`: primary app runtime (state, storage, auth, navigation, timeline, rituals, wrapped integration, special access, PWA prompt, SW registration, many animation loops).
- `wrapped-cinematic-module.js`: advanced Wrapped cinematic stage (own scene graph, touch/keyboard handlers, requestAnimationFrame loop).
- `sw.js`: install/activate/fetch caching strategy and push notifications.
- `manifest.json`: install metadata/start URL/icons.
- `phase2-emotional-intelligence.js`: analytics/insight helpers consumed by main runtime.
- `skills/echovault-ux-stabilizer/*`: static audit scripts and constraints used in this phase.

## 3) Feature Ownership Map
### Navigation
- DOM: `#nav-home`, `#nav-entry`, `#nav-timeline`, `#nav-wrapped`, `#nav-fun`, `#nav-logo-btn`.
- Runtime: `Nav.show(...)` and nav button listeners in `script.js`.
- View activation: `.view.active` CSS with per-view `min-height` and padding.

### Echo creation
- DOM: mood buttons (`.mood-btn`), `#intensity-slider`, silence slider, `#thought-input`, void toggle, submit button.
- Runtime: state fields `selectedMood`, `voidMode`; save path via `Storage.save` to `echovault_echoes_v2`.

### Universe / emotional museum
- DOM/canvas: `#cosmos-canvas`, `#ripple-canvas`, `#connection-canvas`, `#whip-canvas`, `#bubble-field`.
- Runtime: orb registration and pointer drag handlers in timeline/universe renderer paths.

### Timeline
- DOM: `#view-timeline`, `#timeline-season-card`, `#timeline-empty`, `#bubble-field`.
- Runtime: `Timeline.render()` + `ConnectionCanvas.render()` call on nav switch.

### Wrapped
- Inline wrapped view in `index.html` plus cinematic module via `wrapped-cinematic-module.js`.
- Runtime: `Wrapped.render()` for in-view cards + `window.CinematicWrapped.openIfAvailable()` path for full cinematic replay.

### Rituals
- DOM: `.fun-card[data-fun=...]`, `#fun-modal`, `#fun-modal-content`.
- Runtime: `Rituals.open(type)`, builder map, per-ritual init functions (e.g., lantern/storm/conflict).

### Echo Soundprint
- Data: `SOUNDPRINTS` in `script.js` + selector `getSoundprintForEcho(...)`.
- UI: wrapped/ritual card renderers generate Spotify/YouTube anchors.

### Special Access
- Runtime: `UserAccess` + `SpecialAccessPortal` + `hashCode(...)`/`validateHashedCode(...)` logic.
- Storage: local access object in `UserAccess.KEY` with tier/source/flags.

### PWA / SW
- PWA prompt runtime block with `beforeinstallprompt`, install/dismiss buttons, eligibility timer.
- SW registration in `script.js` and cache policy in `sw.js`.

## 4) Root Cause Groups
1. **Scroll architecture**: fixed overlays + `100vh/100dvh` + nested `overflow:auto` containers cause trapped or unreachable content in Wrapped/Rituals/modals.
2. **Event listener lifecycle**: many listeners added during init/open paths with inconsistent teardown; high risk of duplicate interactions after repeated modal opens.
3. **Modal lifecycle fragmentation**: multiple independent close/open patterns (overlay click, Escape, explicit buttons) not centralized; focus trap/return inconsistent.
4. **Animation lifecycle**: several RAF loops across systems; some pause on `document.hidden`, others rely on view checks only.
5. **SW cache freshness**: mixed cache-first/network-first patterns reduce stale risk for JS/CSS but still allow stale shell scenarios during deploy transitions.
6. **Accessibility debt**: many custom button-like divs and dense icon/action controls rely heavily on visuals; keyboard/focus semantics uneven.
7. **Mobile interaction pressure**: narrow scrollbars + deep overlays + heavy visuals create tap/scroll friction and jank risk.
8. **Ritual maturity mismatch**: visible cards include mixed completion states; some builders absent or partially staged.

## 5) Critical Risk List
- `script.js` monolith change risk (single-file coupling across nav, storage, rituals, wrapped, pwa, sw).
- Scroll/fixed-position architecture in `styles.css` + overlay-heavy DOM.
- Wrapped cinematic module scene lifecycle and its own event stack.
- Service worker + cache version choreography during rapid deployments.
- LocalStorage schema compatibility (`echovault_echoes_v2` and access/profile keys).

## 6) Phase Readiness (recommended)
- **Phase 1**: Navigation/event lifecycle stabilization (no visual redesign).
- **Phase 2**: Scroll architecture repairs (Wrapped/Rituals/Timeline/modals).
- **Phase 3**: Ritual completeness gating + safe fallbacks for partial rituals.
- **Phase 4**: Wrapped resilience (progress/freeze/skip/retry + no-echo fallback hardening).
- **Phase 5**: Mobile + PWA install UX + service-worker deployment safety.
- **Phase 6**: Performance lifecycle (RAF throttling, offscreen pausing, particle budgets).
- **Phase 7**: Accessibility hardening (labels, keyboard, focus traps, reduced motion parity).

## 7) No-Touch Areas
- Cinematic visual identity tokens/copy metaphors.
- Emotional mood taxonomy and soundprint concept.
- Core storage keys without migration.
- Wrapped and Rituals as product pillars (repair, don’t remove).

## 8) Regression Test Plan
Before/after every future phase:
1. Fresh load with empty localStorage.
2. Create echo (mood/intensity/silence/void/thought) and verify save + timeline appearance.
3. Navigate all top tabs repeatedly (20+ switches) for listener duplication.
4. Open/close each modal type (node detail, fun modal, settings, special access, migration/import preview, replay drift).
5. Run Wrapped with zero echoes and many echoes; test skip/exit/reopen.
6. Open rituals near bottom of list on mobile viewport; verify full content reachability.
7. Test Soundprint external links (single tap open on mobile).
8. Test install banner timing/dismiss persistence and standalone mode suppression.
9. Simulate offline reload (SW controlled) and verify non-blank shell.
10. Re-open app after visibility changes/backgrounding and verify no runaway animation.

## 9) Recommended PR Strategy
- PR A: Listener and nav lifecycle guardrails.
- PR B: Scroll container and modal overflow fixes.
- PR C: Ritual gating/completion-state clarity (no feature removals).
- PR D: Wrapped stability + fallback robustness.
- PR E: PWA + SW deploy-safe freshness/offline behavior.
- PR F: Performance lifecycle throttling.
- PR G: Accessibility sweep.

## 10) Open Questions
- Should `wrapped-cinematic.html` remain an active path or be treated as legacy beside in-app wrapped experiences?
- Which rituals are intentionally premium-hidden vs accidentally exposed incomplete variants?
