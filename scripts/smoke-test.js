const fs = require('fs');
const crypto = require('crypto');

const failures = [];

['index.html','styles.css','script.js','phase2-emotional-intelligence.js','README.md','manifest.json','sw.js','version.js','wrapped-cinematic-module.js'].forEach((f) => {
  if (!fs.existsSync(f)) failures.push(`Missing required file: ${f}`);
});

const index = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');
const phase2 = fs.readFileSync('phase2-emotional-intelligence.js','utf8');
const style = fs.readFileSync('styles.css','utf8');
const wrappedCinematic = fs.readFileSync('wrapped-cinematic-module.js','utf8');
const readme = fs.readFileSync('README.md','utf8');
const pkg = fs.existsSync('package.json')
  ? JSON.parse(fs.readFileSync('package.json','utf8'))
  : { dependencies:{}, devDependencies:{} };
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const societyWeatherStart = script.indexOf('const SocietyWeather = (() => {');
const societyWeatherEnd = societyWeatherStart >= 0 ? script.indexOf('function getSocietyDistrictSuggestion', societyWeatherStart) : -1;
const societyWeatherSource = societyWeatherStart >= 0 && societyWeatherEnd > societyWeatherStart ? script.slice(societyWeatherStart, societyWeatherEnd) : '';
const societySignalsStart = script.indexOf('const SocietySignals = (() => {');
const societySignalsEnd = societySignalsStart >= 0 ? script.indexOf('const SocietySync = (() => {', societySignalsStart) : -1;
const societySignalsSource = societySignalsStart >= 0 && societySignalsEnd > societySignalsStart ? script.slice(societySignalsStart, societySignalsEnd) : '';

const userAccessStart = script.indexOf('const UserAccess = (() => {');

const voidStateStart = script.indexOf('function applyVoidState(next, opts={}) {');
const voidStateEnd = voidStateStart >= 0 ? script.indexOf('function toggleVoid(){', voidStateStart) : -1;
const voidStateSource = voidStateStart >= 0 && voidStateEnd > voidStateStart ? script.slice(voidStateStart, voidStateEnd) : '';
if (!voidStateSource) failures.push('applyVoidState block missing');
if (voidStateSource.includes("thoughtInput.value = ''")) failures.push('applyVoidState should not clear thoughtInput.value when toggling Void Entry');
const userAccessEnd = userAccessStart >= 0 ? script.indexOf('const WrappedCinematicLoader', userAccessStart) : -1;
const userAccessSource = userAccessStart >= 0 && userAccessEnd > userAccessStart ? script.slice(userAccessStart, userAccessEnd) : '';
function funCardSource(fun) {
  const marker = `data-fun="${fun}"`;
  const markerIndex = index.indexOf(marker);
  if (markerIndex < 0) return '';
  const starts = [...index.matchAll(/<div class="fun-card(?:"| )/g)].map((m) => m.index);
  const start = starts.filter((i) => i <= markerIndex).pop() ?? -1;
  const next = starts.find((i) => i > markerIndex + marker.length) ?? -1;
  return index.slice(start >= 0 ? start : markerIndex, next >= 0 ? next : markerIndex + 800);
}
function assertFunCard(label, fun, checks) {
  const card = funCardSource(fun);
  if (!card) {
    failures.push(`${label} card missing`);
    return;
  }
  checks(card);
}

// Phase 1 — Supabase/Auth/Profile/PWA checks
if (!index.includes('window.ECHOVAULT_CONFIG')) failures.push('index.html missing window.ECHOVAULT_CONFIG');
if (!index.includes('https://phfwaxuyauuyskzruqbk.supabase.co')) failures.push('index.html missing Supabase project URL');
if (!index.includes('sb_publishable_')) failures.push('index.html missing publishable key prefix');
if (!index.includes('avatars')) failures.push('index.html missing avatars bucket');

if (!script.includes('avatar-file-input')) failures.push('script.js missing avatar-file-input reference');
if (script.includes("getElementById('avatar-input')") || script.includes('"avatar-input"')) {
  failures.push('script.js still relies on avatar-input');
}
if (!script.includes('signInWithPassword')) failures.push('script.js missing signInWithPassword');
if (!script.includes('signUp')) failures.push('script.js missing signUp');
if (!script.includes('signInWithOtp')) failures.push('script.js missing signInWithOtp');
if (!script.includes('verifyOtp')) failures.push('script.js missing verifyOtp');
if (!script.includes('emailRedirectTo')) failures.push('script.js missing emailRedirectTo');
if (!script.includes('auth-local-btn')) failures.push('script.js missing auth-local-btn for Continue Locally');
if (!index.includes('stress-orb-wrap') || !index.includes('stress-continue-btn')) failures.push('login press/tap fallback controls missing');
if (!script.includes('function beginLoginIntro') || !script.includes('bindStressOrbStart') || !script.includes("target.addEventListener('click', start)") || !script.includes("target.addEventListener('keydown', start)") || !script.includes("target.addEventListener('pointerup', releaseAndStart)") || !script.includes("target.addEventListener('touchend', start")) failures.push('login orb start should support click, keyboard, pointer, and touch');
if (!style.includes('touch-action:manipulation') || !style.includes('.stress-continue-btn')) failures.push('login press controls missing mobile-friendly CSS');
if (!script.includes('getAuthRedirectUrl')) failures.push('script.js missing getAuthRedirectUrl helper');
if (script.includes('NewEcho.start()')) failures.push('new echo reset still calls undefined NewEcho.start');
if (!script.includes("document.getElementById('new-echo-btn')?.addEventListener('click', reset)")) failures.push('new echo confirmation button should safely reset the entry form');
if (!script.includes("if (action === 'new-echo') Nav.show('entry')")) failures.push('PWA New Echo shortcut action is not handled');
if (!script.includes("window.location.protocol === 'file:'") || script.includes("if (isLocalhost) return PRODUCTION_REDIRECT_URL")) failures.push('auth redirects should preserve localhost URLs while falling back for file previews');
if (!script.includes('https://nmethylpyrrolinium.github.io/echovault.com/')) {
  failures.push('script.js missing production auth redirect URL');
}
if (!script.includes('Email sent — use the code if shown, or open the magic link.')) {
  failures.push('script.js missing exact code/magic-link sent guidance text');
}
if (script.includes('profile.display_name = legacy;') && script.includes('write(profile);')) {
  failures.push('ProfileStore.read() still calls write(profile) during legacy migration');
}
if (!(script.includes('await Auth.init();') && script.indexOf('await Auth.init();') < script.indexOf('Login.init();'))) {
  failures.push('Auth.init is not awaited/chained before Login.init');
}

if (!script.includes("from('profiles')") && !script.includes('from("profiles")')) {
  failures.push('script.js missing profiles integration');
}
if (!script.includes('.storage.from(')) failures.push('script.js missing avatar storage upload logic');

if (!style.includes('#user-chip') || !style.includes('@media(max-width:768px)')) {
  failures.push('styles.css missing responsive user-chip handling');
}
if (!style.includes('env(safe-area-inset-top')) failures.push('styles.css missing safe-area top handling');
if (!style.includes('env(safe-area-inset-bottom')) failures.push('styles.css missing safe-area bottom handling');
if (!(style.includes('display-mode: standalone') || style.includes('is-standalone'))) {
  failures.push('styles.css missing standalone display-mode handling');
}

if (/id="avatar-file-input"[^>]*display\s*:\s*none/i.test(index)) {
  failures.push('avatar-file-input still uses display:none');
}

if (!readme.includes('phfwaxuyauuyskzruqbk.supabase.co') || !readme.includes('local mode')) {
  failures.push('README missing Supabase/local fallback notes');
}
if (!readme.includes('{{ .Token }}')) failures.push('README missing {{ .Token }} instructions');
if (!readme.includes('{{ .ConfirmationURL }}')) failures.push('README missing {{ .ConfirmationURL }} instructions');
if (!readme.includes('Magic Link')) failures.push('README missing Magic Link wording');
if (!readme.includes('Site URL')) failures.push('README missing Site URL setup instructions');
if (!readme.includes('redirect URL')) failures.push('README missing redirect URL setup instructions');
if (!readme.includes('Email OTP')) failures.push('README missing Email OTP wording');
if (!readme.includes('60 seconds')) failures.push('README missing 60 seconds rate limit note');

// PWA checks
if (!script.includes('beforeinstallprompt')) failures.push('script.js missing beforeinstallprompt handling');
if (!script.includes('pwa-dismiss-btn')) failures.push('script.js missing dismiss button wiring');
if (!(script.includes('serviceWorker.register') || index.includes('serviceWorker.register'))) failures.push('script.js or index missing service worker registration');
if (!script.includes("localStorage.setItem(DISMISS_KEY, '1')") || !script.includes('syncBannerSpace') || !script.includes("state.currentView !== 'home'")) failures.push('PWA banner dismissal, measured clearance, or non-blocking view guard missing');
if (!style.includes('.view{padding-bottom:calc(80px + var(--safe-bottom) + var(--pwa-space,0px))')) failures.push('Views missing PWA-aware bottom clearance');
if (!style.includes('::-webkit-scrollbar{width:12px;height:12px}') || !style.includes('scrollbar-color:rgba(201,168,76,.58)')) failures.push('Usable golden scrollbar regression');
if (!style.includes('.mood-btn{min-height:92px') || !style.includes('grid-template-columns:repeat(2,minmax(0,1fr));gap:12px')) failures.push('Mobile mood-card touch targets or spacing regression');
if (!script.includes('data-ritual-action="close"') || !script.includes("'ritual:delegated-close'")) failures.push('Crash Report delegated close action missing');

// Phase 2 — Emotional intelligence checks
if (!script.includes('PatternEngine')) failures.push('script.js missing PatternEngine');
if (!script.includes('ArchetypeEngine')) failures.push('script.js missing ArchetypeEngine');
if (!script.includes('ReceiptRenderer')) failures.push('script.js missing ReceiptRenderer');
if (!script.includes('averageIntensity')) failures.push('PatternEngine missing averageIntensity');
if (!script.includes('averageSilence')) failures.push('PatternEngine missing averageSilence');
if (!script.includes('volatilityScore')) failures.push('PatternEngine missing volatilityScore');
if (!script.includes('Wrapped') || !script.includes('PatternEngine')) {
  failures.push('Wrapped does not appear to reference PatternEngine');
}
if (!script.includes('populateArchetype') || !script.includes('ArchetypeEngine')) {
  failures.push('profile/settings does not appear to use ArchetypeEngine');
}
if (!script.includes('SOUNDPRINTS')) failures.push('Soundprint data missing');
if (!script.includes('echovault_echoes_v2')) failures.push('localStorage echo key missing');


// Phase 4 — Emotional museum checks
['RelicEngine','WeatherMap','ArtifactArchive','CinematicCardRenderer','CoordinateEngine','Emotional Museum','Void Lantern','Storm Jar','Soundprint Wall','Archetype Hall','echovault_artifacts_v1'].forEach((marker)=>{ if(!script.includes(marker) && !index.includes(marker)) failures.push(`Missing Phase 4 marker: ${marker}`);});
if (script.toLowerCase().includes('chatbot') || script.toLowerCase().includes('chat ai')) failures.push('Chatbot module detected but forbidden in phase 4');

// Phase 3B — runtime wiring hotfix checks
if (!script.includes('const MigrationFlow = (() => {')) failures.push('script.js missing MigrationFlow module');
if (!script.includes('return { init, close };')) failures.push('MigrationFlow missing init/close exports');
if (!script.includes('MigrationFlow.init();')) failures.push('script.js missing MigrationFlow.init startup call');

const iifeCloseIndex = script.lastIndexOf('})();');
['migration-sync-btn','migration-keep-btn','migration-export-btn'].forEach((id) => {
  const idx = script.indexOf(id);
  if (idx === -1) failures.push(`script.js missing ${id}`);
  if (idx > iifeCloseIndex) failures.push(`${id} handler appears after final IIFE closure`);
});

if (!script.includes('function refreshEchoDependentUI() {')) failures.push('script.js missing refreshEchoDependentUI helper');
if (!script.includes('refreshEchoDependentUI();')) failures.push('script.js missing refreshEchoDependentUI usage');
if (!script.includes("wrap.setAttribute('aria-label',`Open ${echo.mood} echo from ${new Date(echo.date).toLocaleDateString()}, intensity ${echo.intensity || 0}, silence ${echo.silence || 0}`);")) failures.push('Timeline aria label should use echo, not undefined event var');
if (!script.includes('timeline-fallback-card')) failures.push('Timeline fallback card renderer missing');
if (!script.includes("if (e.key !== 'Enter' && e.key !== ' ') return;")) failures.push('Timeline keyboard open handler missing');
if (!script.includes("document.getElementById('import-merge-btn')") || !script.includes('refreshEchoDependentUI();')) {
  failures.push('ImportFlow does not appear to refresh dependent UI');
}
if (!script.includes('const VaultPulse = (() => {')) failures.push('script.js missing VaultPulse module');
if (!(script.includes('const EchoSync = (() => {') || script.includes('syncLocalToCloud()'))) {
  failures.push('script.js missing EchoSync/syncLocalToCloud placeholder');
}

if (!script.includes('result?.ok')) failures.push('migration sync flow missing ok-check before marking synced');
if (!script.includes('Sign in to sync. Your local vault is still safe.')) {
  failures.push('migration sync flow missing local safety sign-in toast');
}
if (script.includes(".then(() => VaultPulse.set('synced', 'Vault Synced'))")) {
  failures.push('migration sync flow still unconditionally marks synced in promise chain');
}
if (!script.includes('auth-local-btn')) failures.push('script.js missing auth-local-btn');
if (!script.includes('signInWithOtp')) failures.push('script.js missing signInWithOtp');
if (!script.includes('beforeinstallprompt')) failures.push('script.js missing beforeinstallprompt');
if (!script.includes('echovault_echoes_v2')) failures.push('script.js missing echovault_echoes_v2 key');


if (!index.includes('<script src="version.js"></script>') || !script.includes('window.ECHOVAULT_RELEASE') || !fs.readFileSync('sw.js','utf8').includes("importScripts('version.js')")) failures.push('Shared release source is not loaded by both page and service worker');
if (fs.readFileSync('sw.js','utf8').includes("echovault-v3")) failures.push('sw.js still uses old echovault-v3 cache name');
if (!script.includes('AppEnvironment')) failures.push('script.js missing AppEnvironment');
if (!(style.includes('is-standalone') || style.includes('display-mode: standalone'))) failures.push('standalone CSS handling missing');
if (!style.includes('.nav-links{overflow-x:auto') && !style.includes('overflow-x: auto')) failures.push('nav links overflow-x auto missing');
if (!style.includes('#user-chip .chip-sync-label{display:none')) failures.push('mobile user chip sync label hide missing');
if (!(style.includes('auto-fit') && style.includes('min(260px'))) failures.push('fun-grid responsive auto-fit missing');
if (!(style.includes('.cinematic-modal') && style.includes('max-height') && style.includes('overflow-y:auto'))) failures.push('cinematic/fun modal max-height overflow missing');
if (!index.includes('Refresh App Cache') && !script.includes('refresh-app-cache-btn')) failures.push('Refresh App Cache control missing');


// Phase 1 game/community foundation checks
const sw = fs.readFileSync('sw.js','utf8');
const versionSource = fs.readFileSync('version.js','utf8');
if ((versionSource.match(/ECHOVAULT_RELEASE\s*=/g) || []).length !== 1) failures.push('version.js must contain exactly one release assignment');
if (script.includes('SW_CACHE_VERSION') || script.includes('const APP_VERSION') || sw.includes('const APP_VERSION')) failures.push('Duplicate legacy cache/app version constants remain');
if (!sw.includes('PRECACHE_CACHE') || !sw.includes('RUNTIME_CACHE')) failures.push('Service worker cache separation missing');
if (!index.includes('Refresh App Cache') && !script.includes('refresh-app-cache-btn')) failures.push('Refresh App Cache missing');


// Scroll unlock regression checks
if (!sw.includes("key.startsWith(CACHE_PREFIX)") || !sw.includes('caches.delete(key)')) failures.push('Service worker old EchoVault cache cleanup missing');
if (!script.includes('function cleanupOverlays') || !script.includes("login.classList.add('hidden')") || !script.includes("login.style.pointerEvents = 'none'")) failures.push('cleanupOverlays does not force login screen hidden/non-interactive');
if (!script.includes('function finish()') || !script.includes("overlay.classList.remove('open')") || !script.includes('finally') || !script.includes('cleanupOverlays({ keepOnboarding:false })')) failures.push('Onboarding finish should remove .open and run cleanup in finally');
if (!script.includes("document.body.style.overflow = ''") || !script.includes("document.documentElement.style.overflow = ''")) failures.push('Overlay cleanup must restore body/html overflow');
if (!style.includes('max-height:calc(100dvh - 48px);overflow:auto') || !style.includes('#onboarding') || !style.includes('min-height:100dvh')) failures.push('Onboarding mobile dvh scrollability missing');
if (!sw.includes("fetch(request, { cache: 'no-store' })") || !sw.includes('isCodeAsset') || !sw.includes('networkFirst(request)')) failures.push('Service worker should network-refresh CSS/JS assets');
['EchoAvatar','echovault_avatar_v1','MaterialEngine','VaultInventory','echovault_inventory_v1','GentleQuests','echovault_quests_v1','Society Gate'].forEach((marker) => {
  if (!script.includes(marker) && !index.includes(marker)) failures.push(`Missing Phase 1 marker: ${marker}`);
});
['Void Lantern','Storm Jar','Emotional Museum','ArtifactArchive','signInWithOtp','auth-local-btn','beforeinstallprompt','echovault_echoes_v2','echovault_artifacts_v1'].forEach((marker) => {
  if (!script.includes(marker) && !index.includes(marker)) failures.push(`Required existing marker missing: ${marker}`);
});
if (/\b(leaderboard)\b/i.test(script)) failures.push('Forbidden social/community implementation wording detected');
if (script.toLowerCase().includes('chatbot')) failures.push('Chatbot added unexpectedly');
if (!index.includes('replay-drift-btn') || !index.includes('Drift Through Memory')) failures.push('Replay Drift CTA missing');
if (!index.includes('replay-drift-stage') || !index.includes('aria-modal="true"')) failures.push('Replay Drift accessible dialog shell missing');
['const ReplayDrift = (() => {','buildMemoryMap','buildSeasons','document.visibilityState','prefersReducedMotion()','AudioContext','renderer.dispose()'].forEach((marker) => {
  if (!script.includes(marker)) failures.push(`Replay Drift implementation missing marker: ${marker}`);
});
['.replay-drift-entry','.replay-drift-stage.reduced','@media(prefers-reduced-motion:reduce)'].forEach((marker) => {
  if (!style.includes(marker)) failures.push(`Replay Drift CSS missing marker: ${marker}`);
});
if (!script.includes('Profile Synced')) failures.push('Vault sync wording does not use Profile Synced');
if (script.includes('Vault Synced')) failures.push('Vault Synced wording still present despite placeholder echo sync');





// Phase 4 — cinematic interaction polish checks
[
  ['chamber navigation state', 'dataset.activeChamber'],
  ['reduced-motion-safe section navigation', 'shouldTransition = previous && previous !== name && !prefersReducedMotion()'],
  ['Soundprint internal preview metadata', 'track-preview-meta'],
  ['Soundprint external destination label', 'Open on YouTube ↗'],
  ['ritual transient layer cleanup', 'dismissRitualLayers'],
  ['new echo Universe confirmation', 'Echo released into the Universe.'],
  ['new Timeline echo reveal', 'newly-released'],
  ['Timeline touch drag threshold', 'orb._movedDistance > 10']
].forEach(([label, marker]) => {
  if (!script.includes(marker) && !style.includes(marker) && !index.includes(marker)) failures.push(`Phase 4 missing ${label}`);
});
if (!style.includes('@media(pointer:coarse){.bubble-wrap{touch-action:pan-y}')) failures.push('Timeline coarse-pointer touch scrolling/sensitivity safeguard missing');
if (!style.includes('.view.active.view-entering') || !style.includes('@media(prefers-reduced-motion:reduce)')) failures.push('Phase 4 chamber transition or reduced-motion fallback missing');

// Phase 3 — EchoSociety privacy-first foundation checks
[
  ['SocietySignals exists', 'const SocietySignals = (() => {'],
  ['SocietyWeather exists', 'const SocietyWeather = (() => {'],
  ['consent key exists', 'echovault_society_consent_v1'],
  ['signals key exists', 'echovault_society_signals_v1'],
  ['reactions key exists', 'echovault_society_reactions_v1'],
  ['Society Gate exists', 'Society Gate'],
  ['Lantern District exists', 'Lantern District'],
  ['Storm Works exists', 'Storm Works'],
  ['Bloom Market exists', 'Bloom Market'],
  ['Moon Archive exists', 'Moon Archive'],
  ['Weather Tower exists', 'Weather Tower'],
  ['Privacy Rules exists', 'Privacy Rules'],
  ['raw echo sharing is not default', 'raw_echo_shared:false'],
  ['EchoSociety Privacy settings exists', 'EchoSociety Privacy'],
  ['symbolic witnessed reaction exists', 'witnessed'],
  ['symbolic held reaction exists', 'held'],
  ['symbolic softened reaction exists', 'softened'],
  ['symbolic bloomed reaction exists', 'bloomed'],
  ['symbolic charged reaction exists', 'charged'],
  ['auth-local-btn still exists', 'auth-local-btn'],
  ['echovault_echoes_v2 still exists', 'echovault_echoes_v2'],
  ['EchoAvatar still exists', 'EchoAvatar'],
  ['VaultInventory still exists', 'VaultInventory']
].forEach(([label, marker]) => { if (!script.includes(marker) && !index.includes(marker)) failures.push(`Phase 3 check failed: ${label}`); });
if (!script.includes('Join EchoSociety first. Your vault is still private.')) failures.push('Society contribution consent guard text missing');
if (!script.includes('You stayed private.') || !script.includes('EchoSociety will not receive signals.')) failures.push('Private-mode society panel copy missing');
if (!script.includes('updateSocietyConsentUI({ privateState:true })') || !script.includes('city.hidden = !consent')) failures.push('society-stay-private-btn does not hide or disable society-city');
if (!/function createSignal[\s\S]*if \(!requireConsent\(\)\) return null;/.test(script)) failures.push('SocietySignals.createSignal missing consent guard before signal creation');
if (!/function addReaction[\s\S]*(requireConsent\(\)|SocietyPrivacy\.requireConsent\(\))/.test(script)) failures.push('SocietySignals.addReaction missing consent guard');
if (!script.includes('SocietySignals.revokeConsent(); populateSocietyPrivacy(); updateSocietyConsentUI')) failures.push('Settings revoke does not update active Society UI');
if (/\b(direct message|dm module|user search|like counts?|followers? module|leaderboard)\b/i.test(script)) failures.push('Forbidden EchoSociety social feature detected');
if (Object.keys(deps).some((d) => ['react','vue','angular','next','svelte','socket.io'].includes(d))) failures.push('Heavy dependency added unexpectedly for EchoSociety');

// Phase 1 hotfix/polish checks
if (!script.includes('function escapeHTML(value)')) failures.push('escapeHTML helper missing');
if (!(script.includes('escapeHTML(avatar.avatar_name)') && script.includes('escapeHTML(avatar.role)') && script.includes('escapeHTML(avatar.aura)') && script.includes('escapeHTML(avatar.outfit_hint)') && script.includes('escapeHTML(avatar.companion_symbol)'))) {
  failures.push('EchoAvatar render does not escape all avatar/profile fields');
}
if (script.includes('<h4>${avatar.avatar_name}</h4>') || script.includes('${avatar.role}</div><p>Aura: ${avatar.aura}')) {
  failures.push('EchoAvatar render still directly interpolates raw avatar fields');
}
if (!(script.includes('todayKey') && script.includes('completionKey') && script.includes('${id}:${dateKey}'))) {
  failures.push('GentleQuests completion does not appear keyed per local date');
}
if (!(script.includes('completed_at') || script.includes('todayKey'))) failures.push('GentleQuests missing completed_at/todayKey completion marker');
if (!(script.includes('Vault Holder') || script.includes('Cardholder'))) failures.push('Mood Receipt missing Vault Holder/Cardholder identity field');


// Mood Receipt fail-safe rendering checks
if (!script.includes('function safeGetReceiptData')) failures.push('safeGetReceiptData helper missing');
if (!(script.includes('safeGetReceiptData(safeMode)') || script.includes('safeGetReceiptData(mode'))) failures.push('buildReceipt does not use safeGetReceiptData');
if (!script.includes('Receipt failed to open')) failures.push('Receipt failure toast text missing');
if (script.includes('Auth.hasSupabase?.()')) failures.push('Auth.hasSupabase?.() regression detected');
if (!script.includes('receipt-error-card')) failures.push('receipt-error-card fallback missing');
if (!(script.includes("let charImgHTML = ''") || script.includes('let charImgHTML=""') || script.includes("var charImgHTML = ''") || script.includes("charImgHTML = ''"))) failures.push('charImgHTML safe default missing');
if (!/receipt\s*:\s*buildReceipt/.test(script)) failures.push('Ritual builders map missing receipt: buildReceipt');
if (!script.includes("modal.classList.add('open')")) failures.push('Ritual open path no longer opens fun modal');
if (!(script.includes('receiptClass') && script.includes('RECEIPT_CLASSES'))) failures.push('ReceiptRenderer missing receipt class generation');
if (!(style.includes('.museum-shell') && style.includes('overflow-y:auto') && style.includes('max-height:calc(100dvh'))) failures.push('museum layout missing max-height/overflow-y');
if (!(style.includes('.museum-tabs') && (style.includes('overflow-x:auto') || style.includes('grid-template-columns')))) failures.push('museum tabs missing overflow-x/responsive layout');
if (!(style.includes('.relic-grid') && style.includes('auto-fit'))) failures.push('relic grid missing responsive auto-fit');
if (!script.includes('echovault_inventory_v1')) failures.push('script.js missing echovault_inventory_v1 key');
if (!script.includes('echovault_quests_v1')) failures.push('script.js missing echovault_quests_v1 key');
if (/\b(chatbot|social feed|leaderboard)\b/i.test(script)) failures.push('Forbidden chatbot/social feed/leaderboard feature detected');



// Phase 2 private game loop checks
[
  ['RelicCrafting exists', 'const RelicCrafting = (() => {'],
  ['listRecipes exists', 'listRecipes'],
  ['canCraft exists', 'canCraft'],
  ['craft exists', 'craft(recipeId)'],
  ['spendMaterials exists', 'spendMaterials'],
  ['hasMaterials exists', 'hasMaterials'],
  ['VaultRooms exists', 'const VaultRooms = (() => {'],
  ['echovault_rooms_v1 exists', 'echovault_rooms_v1'],
  ['Crafting Table exists', 'Crafting Table'],
  ['room unlock rules exist', 'detectNewUnlocks'],
  ['EchoAvatar has level field', 'level'],
  ['EchoAvatar has role_xp field', 'role_xp'],
  ['EchoAvatar has role_title field', 'role_title'],
  ['EchoAvatar has addXP', 'addXP'],
  ['GentleQuests contains relic_crafted', 'relic_crafted'],
  ['GentleQuests contains room_unlocked', 'room_unlocked'],
  ['MaterialEngine.showMaterialBurst exists', 'showMaterialBurst'],
  ['VaultInventory still uses echovault_inventory_v1', 'echovault_inventory_v1'],
  ['ArtifactArchive still uses echovault_artifacts_v1', 'echovault_artifacts_v1'],
  ['Storage still uses echovault_echoes_v2', 'echovault_echoes_v2'],
  ['auth-local-btn still exists', 'auth-local-btn'],
  ['signInWithOtp still exists', 'signInWithOtp'],
  ['beforeinstallprompt still exists', 'beforeinstallprompt']
].forEach(([label, marker]) => { if (!script.includes(marker)) failures.push(`Phase 2 check failed: ${label}`); });
['weather_room','crafting_table','relic_hall','lantern_garden','storm_chamber','soundprint_wall','archive_shelf','society_gate'].forEach((roomId) => {
  if (!script.includes(roomId)) failures.push(`VaultRooms missing room unlock rule: ${roomId}`);
});
if (/\b(chatbot|leaderboard|social feed)\b/i.test(script)) failures.push('Forbidden chatbot/leaderboard/social feed feature detected');
if (Object.keys(deps).some((d) => ['react','vue','angular','next','svelte'].includes(d))) failures.push('Heavy framework dependency added unexpectedly');



// alam.ai standalone oracle checks
if (!/data-fun="alam"/.test(index) || !index.includes('alam.ai')) failures.push('alam.ai Rituals portal/card missing outside Emotional Museum');
if (!index.includes('alam-floating-portal')) failures.push('alam.ai floating standalone portal missing');
if (!script.includes('asking for my iman')) failures.push('alam.ai full bio missing');
if (!script.includes('Ask alam')) failures.push('Ask alam button copy missing');
if (!script.includes('Clear chat')) failures.push('Clear chat button copy missing');
if (script.includes('Keep it local')) failures.push('alam.ai panel should stay minimal without Keep it local button clutter');
if (!script.includes('const AlamPrivacy = (() => {')) failures.push('AlamPrivacy module missing');
['buildSafeContext','shouldIncludeLatestEcho','stripSensitiveContext','canUseRemote'].forEach((fn) => { if (!script.includes(fn)) failures.push(`AlamPrivacy missing ${fn}`); });
['isRemoteAvailable','sendMessage','localReply','openChat','closeChat','appendMessage','clearChat','loadMessages','saveMessages'].forEach((fn) => { if (!script.includes(fn)) failures.push(`AlamAI missing ${fn}`); });
if (!index.includes('alam.ai') || !script.includes('alam.ai')) failures.push('alam.ai visible branding missing');
if ((index + script + style).includes('alam.chat')) failures.push('alam.chat visible branding should be removed');
if ((index + script).includes('local oracle mode') || (index + script).includes('connected oracle mode')) failures.push('oracle mode labels should not be visible');
if ((index + script).includes('alam.ai is listening')) failures.push('alam.ai empty-state clutter should not be visible');
if (!script.includes('includeLatestEcho:false')) failures.push('latest echo summary should default OFF');
if (!script.includes('ALAM_AI_ENDPOINT') || !index.includes('ALAM_AI_ENDPOINT')) failures.push('ALAM_AI_ENDPOINT config marker missing');
if (/hf_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|OPENROUTER_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY|HUGGINGFACE_API_KEY/.test(script + index + readme)) failures.push('Hardcoded AI API key or secret marker detected');

// EchoSociety World Expansion + alam.ai portal checks
[
  ['SocietySync exists', 'const SocietySync = (() => {'],
  ['SocietyPrivacy exists', 'const SocietyPrivacy = (() => {'],
  ['sanitizeSocietySignal exists', 'function sanitizeSocietySignal'],
  ['society_consents referenced', 'society_consents'],
  ['society_signals referenced', 'society_signals'],
  ['society_reactions referenced', 'society_reactions'],
  ['society_weather_daily referenced', 'society_weather_daily'],
  ['society_signals_public referenced', 'society_signals_public'],
  ['Live Society Weather exists', 'Live Society Weather'],
  ['Local Preview Weather exists', 'Local Preview Weather'],
  ['Signal Couriers’ Route exists', 'Signal Couriers’ Route'],
  ['alam.ai standalone portal exists', 'alam.ai'],
  ['Signal Courier exists', 'Signal Courier'],
  ['delivery_completed event exists', 'delivery_completed'],
  ['EchoWorldRenderer exists', 'const EchoWorldRenderer = (() => {'],
  ['Canvas 2D fallback exists', 'canvas2dFallback'],
  ['WebGL optional path is guarded', 'hasWebGL'],
  ['AlamAI exists', 'const AlamAI = (() => {'],
  ['alam.ai text exists', 'alam.ai'],
  ['Alam bio exists', 'what in the fiqh'],
  ['ALAM_AI_ENDPOINT exists', 'ALAM_AI_ENDPOINT'],
  ['Alam chat key exists', 'echovault_alam_ai_chat_v1'],
  ['localReply exists', 'localReply'],
  ['alam.ai fallback toast exists', 'alam.ai is ready.'],
  ['EchoSociety standalone overlay exists', 'echosociety-overlay'],
  ['EchoSociety content shell exists', 'echosociety-shell'],
  ['auth-local-btn still exists', 'auth-local-btn'],
  ['echovault_echoes_v2 still exists', 'echovault_echoes_v2'],
  ['echovault_society_consent_v1 still exists', 'echovault_society_consent_v1'],
  ['echovault_society_signals_v1 still exists', 'echovault_society_signals_v1'],
  ['echovault_society_reactions_v1 still exists', 'echovault_society_reactions_v1']
].forEach(([label, marker]) => { if (!script.includes(marker) && !index.includes(marker)) failures.push(`Expansion check failed: ${label}`); });
if (!societyWeatherSource) failures.push('SocietyWeather source block not found');
['SocietySync.fetchDailyWeather()','SocietySync.fetchPublicSignals()','SocietySync.fetchReactionCounts()'].forEach((marker) => {
  if (!societyWeatherSource.includes(marker)) failures.push(`SocietyWeather missing cloud fetch: ${marker}`);
});
if (societyWeatherSource.includes('Live Society Weather') && !/const \[daily, publicSignals, reactionRows\][\s\S]*SocietySync\.fetchDailyWeather\(\)[\s\S]*SocietySync\.fetchPublicSignals\(\)[\s\S]*SocietySync\.fetchReactionCounts\(\)[\s\S]*label:'Live Society Weather'/.test(societyWeatherSource)) {
  failures.push('SocietyWeather may label live before using fetched cloud data');
}
if (!societyWeatherSource.includes('Live society unavailable — showing local preview.')) failures.push('SocietyWeather missing live-unavailable local fallback note');
if (!societyWeatherSource.includes("label:'Local Preview Weather'")) failures.push('SocietyWeather missing Local Preview Weather fallback label');
['contributeWeather','contributeLantern','contributeStorm','contributeBloom','contributeArchiveLine'].forEach((fn) => {
  const re = new RegExp(`${fn}[\\s\\S]{0,360}guardDistrictContribution`);
  if (!re.test(societySignalsSource)) failures.push(`${fn} missing district contribution guard`);
});
if (!/function guardDistrictContribution[\s\S]{0,260}SocietyPrivacy\.requireSpecialAccess\(\)[\s\S]{0,260}SocietyPrivacy\.requireConsent\(\)[\s\S]{0,260}SocietyPrivacy\.requireSafeSignalPayload\(payload\)/.test(societySignalsSource)) failures.push('District contribution guard must check Special Access, consent, and safe signal payload');
if (!/function addReaction[\s\S]{0,320}(SocietySignals\.getConsent\(\)|SocietyPrivacy\.requireConsent\(\))/.test(societySignalsSource)) failures.push('addReaction missing explicit society consent guard');
if (!script.includes('society-stay-private-btn') || !(script.includes('updateSocietyConsentUI({ privateState:true })') || script.includes('city.hidden = !consent'))) failures.push('society-stay-private-btn handler does not route through private state UI');

if (!(script.includes('SocietySync.fetchDailyWeather()') || script.includes('SocietySync.fetchPublicSignals()'))) failures.push('SocietyWeather does not fetch cloud data before live weather');
['contributeWeather','contributeLantern','contributeStorm','contributeBloom','contributeArchiveLine'].forEach((fn) => {
  const re = new RegExp(`${fn}[\\s\\S]{0,360}guardDistrictContribution`);
  if (!re.test(script)) failures.push(`${fn} missing district action guard`);
});
if (!script.includes('society-stay-private-btn') || !(script.includes('city.hidden=true') || script.includes('updateSocietyConsentUI({ privateState:true })'))) failures.push('society-stay-private-btn handler does not immediately hide/disable society-city');
['Ask alam','alam.ai'].forEach((marker) => { if (!script.includes(marker) && !index.includes(marker)) failures.push(`alam.ai UI marker missing: ${marker}`); });


// Society Gate state-machine checks
if (!script.includes('function getSocietyGateState()')) failures.push('getSocietyGateState missing');
['no_special_access','locked_progress','ready_needs_consent','active_local_preview','active_live','live_unavailable'].forEach((gateState) => {
  if (!script.includes(`'${gateState}'`) && !script.includes(`society-state-${gateState}`)) failures.push(`Society Gate state missing: ${gateState}`);
});
if (!script.includes('Special Access opens this city.')) failures.push('no_special_access copy missing');
['Create an Echo Avatar','Create ${5 - echoCount} more echo','Save or craft 1 artifact'].forEach((copy) => {
  if (!script.includes(copy)) failures.push(`locked_progress missing requirement copy: ${copy}`);
});
if (!/gateState === 'ready_needs_consent'[\s\S]{0,900}Enter EchoSociety[\s\S]{0,900}Stay Private[\s\S]{0,900}Privacy Rules/.test(script)) failures.push('ready_needs_consent copy/actions missing');
if (/gateState === 'ready_needs_consent'[\s\S]{0,900}society-district-grid/.test(script)) failures.push('Society Gate shows districts before consent');
if (!/function buildSocietyCity[\s\S]*society-district-grid/.test(script) || !/gateState === 'ready_needs_consent'[\s\S]*return `[\s\S]*buildSocietyCity/.test(script)) {
  // The ready state must return before the city builder is appended.
  if (!/if \(gateState === 'ready_needs_consent'\)[\s\S]*return `[\s\S]*`;/ .test(script)) failures.push('Society Gate city/district rendering is not isolated behind consent state');
}
if (!/function getSocietyGateState[\s\S]*!authUser[\s\S]*'active_local_preview'/.test(script) || !script.includes('Local Preview')) failures.push('Local Preview state/copy missing for logged-out Society Gate');
if (!/allCloudFetchesSucceeded[\s\S]*liveStatus = 'live'[\s\S]*label:'Live Society Weather'/.test(societyWeatherSource)) failures.push('Live Society Weather should only render after Supabase fetch success');
if (!script.includes('Live Society Weather is unavailable — showing local preview fallback.')) failures.push('live_unavailable copy missing');
if (!/const guardDistrictAction[\s\S]{0,240}SocietyPrivacy\.requireSpecialAccess\(\)[\s\S]{0,240}SocietyPrivacy\.requireConsent\(\)/.test(script)) failures.push('district actions must check Special Access and consent');
if (!script.includes('Emotional Museum')) failures.push('Emotional Museum marker missing after Society Gate changes');
if (!script.includes('redeemAccessCode') || !script.includes('SpecialAccessPortal')) failures.push('Special Access code path marker missing after Society Gate changes');

if (/hf_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}/.test(script + index)) failures.push('Hardcoded AI API key detected');
['bro this is not a crisis arc','your silence is doing pushups','you’re not empty, you’re buffering','put the thought down like a heavy bag'].forEach((sample) => { if ((index + readme).includes(sample)) failures.push(`Canned local reply example should not be present in README/index static text: ${sample}`); });
['public diary feed implementation','follower system implementation','leaderboard implementation','DM implementation','comment box implementation','user-to-user chat implementation','group chat implementation','community chat tables'].forEach((marker) => {
  if ((script + index).includes(marker)) failures.push(`Forbidden community implementation present: ${marker}`);
});
if (/\b(followers module|leaderboard module|direct message module|dm module|public diary feed implementation|comment box implementation|user search)\b/i.test(script + index)) failures.push('Forbidden social/community implementation detected');
['public diary feed implementation','follower system implementation','leaderboard implementation','DM implementation','comment box implementation'].forEach((marker) => {
  if ((script + index).includes(marker)) failures.push(`Forbidden community implementation present: ${marker}`);
});

// Keep dependency footprint small
if (Object.keys(deps).some((d) => ['react','vue','angular','next','svelte'].includes(d))) {
  failures.push('Heavy framework dependency added unexpectedly');
}

// Special Access checks
[
  ['UserAccess module exists', 'const UserAccess = (() => {'],
  ['access storage key exists', 'echovault_access_v1'],
  ['premium tiers include founder', 'founder'],
  ['premium tiers include alpha', 'alpha'],
  ['free export not gated', 'export_vault'],
  ['free import not gated', 'import_vault'],
  ['free local mode not gated', 'local_mode'],
  ['premium alam_chat feature exists', 'alam_chat'],
  ['premium society gate feature exists', 'society_gate'],
  ['premium code redemption exists', 'redeemAccessCode'],
  ['Special Access text exists', 'Special Access'],
  ['Special Access subtitle exists', 'for the girls who fw alam'],
  ['special code input exists', 'special code'],
  ['unlock button exists', 'Unlock'],
  ['Supabase RPC referenced', 'redeem_premium_code'],
  ['PremiumCodes exists', 'PremiumCodes'],
  ['welcome sequence exists', 'special-access-welcome'],
  ['Welcome copy exists', 'Welcome,'],
  ['original kawaii dancing cat fallback exists', 'original kawaii dancing cat mascot'],
  ['Inner Conflict remains free', 'inner_conflict'],
  ['Soundprint remains free', 'soundprint'],
  ['old Rituals remain free', 'old_rituals'],
  ['alam.ai gated for non-special users', "requirePremium('alam_chat"],
  ['no payment copy exists', 'not a payment']
].forEach(([label, marker]) => { if (!script.includes(marker) && !index.includes(marker) && !readme.includes(marker)) failures.push(`Special Access check failed: ${label}`); });
if (/\b(stripe|razorpay|paypal|checkout|pricing page|subscription)\b/i.test(script.replace(/No checkout/gi, '').replace(/no checkout/gi, ''))) failures.push('Forbidden payment implementation detected in script');


// Special Access hashed-code redemption checks
const starterCodes = [
  ['ECHO-FOUNDERS-2026', 'founder'],
  ['VAULT-ALPHA', 'alpha'],
  ['NIGHT-ARCHIVIST', 'premium'],
  ['NIGHT_ARCHIVIST', 'premium']
];
const normalizeStarterCode = (code) => String(code || '').trim().toUpperCase().replace(/[\s_-]+/g, '');
starterCodes.forEach(([code, tier]) => {
  const digest = crypto.createHash('sha256').update(normalizeStarterCode(code)).digest('hex');
  if (!index.includes(digest)) failures.push(`ACCESS_CODE_HASHES missing ${tier} starter hash`);
  if (!new RegExp(`"${digest}"\\s*:\\s*\\{[^}]*tier:\\s*"${tier}"`).test(index)) failures.push(`ACCESS_CODE_HASHES ${tier} hash missing tier payload`);
  if (script.includes(code)) failures.push(`Plaintext starter code leaked into script.js: ${code}`);
  if (index.includes(code)) failures.push(`Plaintext starter code leaked into index.html client config: ${code}`);
});
if (!/ACCESS_CODE_HASHES:\s*\{\s*"[a-f0-9]{64}"/.test(index)) failures.push('ACCESS_CODE_HASHES should not be empty');
if (!/ACCESS_CODES:\s*\[\s*\]/.test(index)) failures.push('ACCESS_CODES should remain empty to avoid plaintext client codes');
if (!userAccessSource.includes('async function lookupLocalHash(code)')) failures.push('PremiumCodes.lookupLocalHash missing');
if (!userAccessSource.includes('hasLocalHashConfig')) failures.push('PremiumCodes should expose local hash configuration detection');
if (!userAccessSource.includes('hashes[digest]') || !userAccessSource.includes('hashCode(normalized)')) failures.push('Local code unlock path should validate SHA-256 digest against ACCESS_CODE_HASHES');
if (!userAccessSource.includes('Special codes are not configured for local unlock. Sign in to redeem through Supabase.')) failures.push('Missing empty local hash config guidance');
if (!userAccessSource.includes('That code didn’t open this room.')) failures.push('Missing invalid special code copy');
if (!/Auth\.user\s*&&\s*Auth\.client[\s\S]{0,220}\.rpc\('redeem_premium_code'/.test(userAccessSource)) failures.push('Logged-in Supabase RPC redemption path missing');
if (/service_role|supabase_service|private[_-]?key|sb_secret_/i.test(script + index)) failures.push('Service role/private key marker detected');


// UserAccess visibility regression checks for free Rituals after Special Access gating
['old_rituals','inner_conflict','soundprint','basic_receipt','basic_wrapped','emotion_dna','crash_report','shatter_softly','basic_profile','create_echo','timeline','universe','local_mode','export_vault','import_vault'].forEach((feature) => {
  if (!userAccessSource.includes(`'${feature}'`)) failures.push(`Free feature list missing ${feature}`);
});
['emotional_museum_full','alam_chat','alam_ai','echosociety','society_gate','society_districts','signal_courier','relic_crafting','crafting_table','vault_rooms','advanced_receipts','cinematic_export_cards','artifact_archive','premium_weather_map','advanced_world_features','premium_rituals','void_lantern','storm_jar'].forEach((feature) => {
  if (!userAccessSource.includes(`'${feature}'`)) failures.push(`Special-only feature list missing ${feature}`);
});
const freeFeatureBlock = userAccessSource.slice(userAccessSource.indexOf('const FREE_FEATURES'), userAccessSource.indexOf('const PREMIUM_FEATURES'));
const premiumFeatureBlock = userAccessSource.slice(userAccessSource.indexOf('const PREMIUM_FEATURES'), userAccessSource.indexOf('const FEATURE_ACCESS'));
['void_lantern','storm_jar'].forEach((feature) => {
  if (freeFeatureBlock.includes(`'${feature}'`)) failures.push(`${feature} must not be in free features`);
  if (!premiumFeatureBlock.includes(`'${feature}'`)) failures.push(`${feature} must be in Special Access features`);
});
if (!script.includes('function applyFeatureVisibility()')) failures.push('UserAccess.applyFeatureVisibility missing');
if (!script.includes('applyFeatureVisibility();')) failures.push('refresh/update flow should apply feature visibility');
if (!script.includes('applyFeatureVisibility, redeemAccessCode')) failures.push('UserAccess.applyFeatureVisibility should be exported');
if (!script.includes("getFeatureAccess(feature) === 'free' || specialUnlocked")) failures.push('Feature visibility should show free features and reveal special features only after unlock');
if (!script.includes("if (!featureKey) return 'free'")) failures.push('Cards without data-feature should default to visible');
if (!script.includes("return 'free';") || !script.includes('const PremiumCodes')) failures.push('Unknown data-feature keys should default visible unless explicitly special-only');
if (!script.includes('const state = applyPremiumState') || !script.includes('refreshAccessState();')) failures.push('Special Access unlock should refresh access state without reload');
if (!script.includes("lantern:'void_lantern'") || !script.includes("stormjar:'storm_jar'")) failures.push('Void Lantern and Storm Jar builders should be gated behind Special Access feature keys');
assertFunCard('Mood Receipt', 'receipt', (card) => {
  if (!card.includes('data-feature="basic_receipt"')) failures.push('Mood Receipt card is not marked as a free basic_receipt feature');
  if (/premium|special/i.test(card)) failures.push('Mood Receipt card should not contain visible premium/special clutter');
});
assertFunCard('Soundprint', 'sound', (card) => {
  if (!card.includes('data-feature="soundprint"')) failures.push('Soundprint card should remain a free soundprint feature');
  if (/\shidden\b|premium_rituals|advanced_soundprint/i.test(card)) failures.push('Soundprint card is hidden or gated for free users');
});
assertFunCard('Inner Conflict', 'vsvs', (card) => {
  if (!card.includes('data-feature="inner_conflict"')) failures.push('Inner Conflict card should remain a free inner_conflict feature');
  if (/\shidden\b|premium_rituals/i.test(card)) failures.push('Inner Conflict card is hidden or gated for free users');
});
assertFunCard('Shatter Softly', 'shatter', (card) => {
  if (!card.includes('data-feature="shatter_softly"')) failures.push('Shatter Softly card should remain visible as a free shatter_softly feature');
  if (/\shidden\b|premium_rituals|void_lantern|storm_jar/i.test(card)) failures.push('Shatter Softly card is hidden or gated for free users');
});
assertFunCard('Void Lantern', 'lantern', (card) => {
  if (!card.includes('data-feature="void_lantern"')) failures.push('Void Lantern should be gated by the void_lantern Special Access feature');
  if (card.includes('data-feature="old_rituals"')) failures.push('Void Lantern must not be free/old_rituals');
  if (!card.includes('hidden')) failures.push('Void Lantern should be hidden from free users by default');
  if (/premium badge|locked premium|special badge/i.test(card)) failures.push('Void Lantern card should be hidden, not decorated with locked premium clutter');
});
assertFunCard('Storm Jar', 'stormjar', (card) => {
  if (!card.includes('data-feature="storm_jar"')) failures.push('Storm Jar should be gated by the storm_jar Special Access feature');
  if (card.includes('data-feature="old_rituals"')) failures.push('Storm Jar must not be free/old_rituals');
  if (!card.includes('hidden')) failures.push('Storm Jar should be hidden from free users by default');
  if (/premium badge|locked premium|special badge/i.test(card)) failures.push('Storm Jar card should be hidden, not decorated with locked premium clutter');
});
assertFunCard('Emotion DNA', 'dna', (card) => {
  if (!card.includes('data-feature="emotion_dna"')) failures.push('Emotion DNA card should remain visible as a free emotion_dna feature');
});
assertFunCard('Crash Report', 'crash', (card) => {
  if (!card.includes('data-feature="crash_report"')) failures.push('Crash Report card should remain visible as a free crash_report feature');
});
assertFunCard('Emotional Museum full', 'museum', (card) => {
  if (!card.includes('data-feature="emotional_museum_full"')) failures.push('Emotional Museum full should be special-only for non-special users');
});
assertFunCard('alam.ai', 'alam', (card) => {
  if (!card.includes('data-feature="alam_chat"')) failures.push('alam.ai should be special-only for non-special users');
});
if (!index.includes('data-feature="echosociety"') && !script.includes("UserAccess.canUse('society_gate')")) failures.push('EchoSociety should be hidden/gated for non-special users');
if (!script.includes("requirePremium('signal_courier")) failures.push('Signal Courier should be hidden/gated for non-special users');
assertFunCard('Special Access portal', 'special-access', (card) => {
  if (!card.includes('Special Access')) failures.push('Special Access portal should remain visible');
  if (card.includes('data-feature=')) failures.push('Special Access portal should not be hidden by feature gating');
});
const funGridStart = index.indexOf('<div class="fun-grid">');
const funGridEnd = funGridStart >= 0 ? index.indexOf('</section>', funGridStart) : -1;
const funGridSource = funGridStart >= 0 && funGridEnd > funGridStart ? index.slice(funGridStart, funGridEnd) : '';
if (/Premium/.test(funGridSource)) failures.push('Visible Premium clutter added to Ritual cards');
assertFunCard('EchoSociety standalone', 'echosociety', (card) => {
  if (!card.includes('data-feature="echosociety"')) failures.push('EchoSociety card should use feature key echosociety');
  if (!card.includes('A shared city built from anonymous signals.')) failures.push('EchoSociety card description missing');
});
const museumBlockForSeparationStart = script.indexOf('function buildMuseum');
const museumBlockForSeparationEnd = script.indexOf('function startConflictAnimation', museumBlockForSeparationStart);
const museumBlockForSeparation = museumBlockForSeparationStart >= 0 && museumBlockForSeparationEnd > museumBlockForSeparationStart ? script.slice(museumBlockForSeparationStart, museumBlockForSeparationEnd) : '';
['Society Gate','Signal Courier','alam.ai Observatory'].forEach((marker) => {
  if (museumBlockForSeparation.includes(marker)) failures.push(`Emotional Museum no longer allowed to contain ${marker}`);
});
if (!index.includes('data-fun="echosociety"')) failures.push('EchoSociety standalone card missing');
if (!script.includes('id="echosociety-overlay"') && !script.includes('echosociety-overlay')) failures.push('echosociety-overlay missing');
if (!script.includes('echosociety-shell')) failures.push('echosociety-shell missing');
if (!script.includes('mission-selection-panel')) failures.push('Signal Courier mission selection missing');
if (!script.includes('courier-district-map') || !script.includes('courier-canvas')) failures.push('Signal Courier district map/canvas missing');
if (!script.includes('delivery_completed')) failures.push('Signal Courier delivery_completed event missing');
const courierStart = script.indexOf('const SignalCourierRoute = (() => {');
const courierEnd = courierStart >= 0 ? script.indexOf('const AlamPrivacy', courierStart) : -1;
const courierSource = courierStart >= 0 && courierEnd > courierStart ? script.slice(courierStart, courierEnd) : '';
if (!courierSource.includes('Carry the feeling somewhere safer.')) failures.push('Signal Courier calming mission copy missing');
if (!courierSource.includes('Tap steady when you’re ready.')) failures.push('Signal Courier steady pacing copy missing');
if (!courierSource.includes('id=\"courier-steady-btn\"') || !courierSource.includes('Steady')) failures.push('Signal Courier Steady button missing');
if (script.includes('Signal Grounding Mode')) failures.push('Do not add Signal Grounding Mode');
if (/cure anxiety|treat anxiety|therapy|mental health treatment|diagnos/i.test(courierSource)) failures.push('Signal Courier contains prohibited medical/therapy language');
if (!courierSource.includes('Not this district. Follow the glowing route.')) failures.push('Signal Courier wrong-district gentle message missing');
if (!courierSource.includes('localDeliveryWithoutConsent:true') || !script.includes('society-delivery-launcher-local')) failures.push('Signal Courier local delivery without society consent missing');
if (!courierSource.includes('SocietySignals.getConsent() ? SocietySignals.contributeDelivery(done) : null') || !courierSource.includes('Signal shared anonymously.')) failures.push('Signal Courier sharing must still require consent');
if (!script.includes("requirePremium('signal_courier")) failures.push('Signal Courier must remain Special Access gated');
if (!index.includes('data-fun="alam"') || !script.includes('renderPortal')) failures.push('alam.ai standalone portal/card missing');

// Runtime reliability checks for rituals, Wrapped, and Soundprints
if (!/function buildMuseum\s*\(/.test(script) || !script.includes('museum:buildMuseum')) failures.push('Emotional Museum builder missing or not mapped from data-fun="museum"');
if (!script.includes('museumFallbackHTML') || script.includes('<h3>Ritual unavailable</h3>')) failures.push('Museum should not use generic Ritual unavailable fallback');
if (script.includes('Museum room recovering')) failures.push('Museum should not use vague room recovering fallback copy');
if (!script.includes('[Museum] building room:') || !script.includes('[Museum] failed room:')) failures.push('Museum debug room-level logging missing');
if (!script.includes('const roomBuilders = {') || !script.includes('const renderRoom =')) failures.push('Museum rooms should be rendered through independent builders');
const museumBlockStart = script.indexOf('function buildMuseum');
const museumBlockEnd = script.indexOf('function startConflictAnimation', museumBlockStart);
const museumBlock = museumBlockStart >= 0 && museumBlockEnd > museumBlockStart ? script.slice(museumBlockStart, museumBlockEnd) : '';
const roomDefIds = [...museumBlock.matchAll(/\{ id:'([^']+)', panel:'([^']+)', label:'([^']+)' \}/g)].map((m) => m[1]);
roomDefIds.forEach((roomId) => {
  if (!museumBlock.includes(`${roomId}: () =>`)) failures.push(`Museum room list missing builder for ${roomId}`);
});
['weather_room','archetype_hall','soundprint_wall','relic_hall','archive_shelf','lantern_garden','crafting_table','materials_room'].forEach((roomId) => {
  if (!roomDefIds.includes(roomId)) failures.push(`Museum room list missing ${roomId}`);
});
['society_gate','Signal Courier','alam.ai Observatory','EchoSociety'].forEach((forbidden) => {
  if (museumBlock.includes(forbidden)) failures.push(`Emotional Museum still contains ${forbidden}`);
});
['No artifacts archived here yet.','No soundprint entries yet.','No relics archived here yet.','Create more echoes to fill this wing.','This room has no saved material yet.'].forEach((copy) => {
  if (!museumBlock.includes(copy)) failures.push(`Museum empty-state copy missing: ${copy}`);
});
if (!museumBlock.includes('try {') || !museumBlock.includes('catch(error)') || !museumBlock.includes('Missing museum room builder')) failures.push('Museum should isolate failed room builders');
if (!script.includes("museum:'emotional_museum_full'") || !script.includes("UserAccess.requirePremium(premiumRitualMap[type]")) failures.push('Emotional Museum Special Access unlock path missing');
if (!script.includes('hasBuilder(type)') || !script.includes('Rituals.hasBuilder')) failures.push('Ritual card gating should verify builders exist');
if (!script.includes('WrappedCinematicLoader') || !script.includes('ensureLoaded') || !script.includes('openIfAvailable')) failures.push('Wrapped cinematic loader/guard missing');
if (!script.includes('Wrapped.render();') || !script.includes('falling back to standard Wrapped')) failures.push('Wrapped fallback render missing');
if (!script.includes('moodFamily') || !wrappedCinematic.includes('moodFamily(e.mood)') || !wrappedCinematic.includes('moodColor(mood)')) failures.push('Wrapped cinematic should normalize expanded moods before rendering colors');
if (!wrappedCinematic.includes('getSoundprintForEcho') || !wrappedCinematic.includes('escapeHTML(t.song)')) failures.push('Wrapped cinematic should use guarded soundprint selection and escaped track markup');
if (!index.includes('nav-wrapped')) failures.push('nav-wrapped missing');
if (!script.includes('getSoundprintForEcho')) failures.push('getSoundprintForEcho missing');
if (!phase2.includes('analyzeSeason') || !phase2.includes('buildConstellationLinks')) failures.push('Phase 2 intelligence helper missing season or constellation logic');
const soundBlock = script.slice(script.indexOf('const SOUNDPRINTS = {'), script.indexOf('function getSoundprintForEcho'));
['calm','chaos','reflective','anxious','joyful','empty'].forEach((family, idx, arr) => {
  const start = soundBlock.indexOf(`${family}:[`);
  const nextFamily = arr[idx + 1];
  const end = nextFamily ? soundBlock.indexOf(`${nextFamily}:[`, start + family.length) : soundBlock.length;
  const familySource = start >= 0 && end > start ? soundBlock.slice(start, end) : '';
  const count = (familySource.match(/song:/g) || []).length;
  if (count < 10) failures.push(`SOUNDPRINTS.${family} should include at least 10 songs`);
});
['purpose:', 'intensity:', 'silence:'].forEach((marker) => { if (!soundBlock.includes(marker)) failures.push(`Soundprint song objects missing ${marker}`); });

const newMoods = ['numb','overwhelmed','lonely','hopeful','angry','guilty','restless','soft','detached','confused','burnt out','grieving','romantic','content','ashamed','longing','pressured','safe','irritated','dreamy'];
newMoods.forEach((mood) => {
  if (!index.includes(`data-mood="${mood}"`) || !(script.includes(`${mood}:`) || script.includes(`'${mood}':`) || script.includes(`"${mood}":`))) failures.push(`Emotional Resonance missing new mood or family mapping: ${mood}`);
});
if (!script.includes('MOOD_FAMILIES') || !script.includes('function moodFamily')) failures.push('mood family mapping exists check failed');
if (/hello\s*kitty|sanrio/i.test(script + index + style)) failures.push('Copyrighted Hello Kitty/Sanrio asset reference detected');
if (/\b(stripe|razorpay|paypal|payment dependency|checkout|pricing page|subscription)\b/i.test(JSON.stringify(deps))) failures.push('Forbidden payment dependency detected');
if (/stripe|razorpay|paypal|payment dependency|checkout|pricing page|subscription/i.test(JSON.stringify(deps))) failures.push('Forbidden payment dependency detected');
if (Object.keys(deps).some((d) => ['react','vue','angular','next','svelte','tailwindcss','three'].includes(d))) failures.push('Heavy framework dependency added unexpectedly');



const manifest = JSON.parse(fs.readFileSync('manifest.json','utf8'));
if (manifest.start_url !== './' || manifest.scope !== './') failures.push('Manifest start_url/scope must remain GitHub Pages relative');
if (manifest.theme_color !== '#0a0a12' || manifest.background_color !== '#050508' || !index.includes('<meta name="theme-color" content="#0a0a12">')) failures.push('Manifest/index premium dark theme colors are inconsistent');
(manifest.icons || []).forEach((icon) => { if (!fs.existsSync(icon.src)) failures.push(`Manifest icon missing: ${icon.src}`); });
if (!(manifest.icons || []).some((icon) => icon.src === 'icons/icon.svg' && icon.sizes === 'any' && icon.type === 'image/svg+xml' && icon.purpose.includes('any') && icon.purpose.includes('maskable'))) failures.push('Manifest source-only SVG install icon is incomplete');
if (/\.png(?:["'])/.test(JSON.stringify(manifest.icons || [])) || index.includes('apple-touch-icon') || sw.includes('icons/icon-192.png')) failures.push('Binary install icon reference reintroduced');
if (!sw.includes("request.method !== 'GET'") || !sw.includes("url.origin !== self.location.origin")) failures.push('Service worker unsupported/non-GET request guards missing');
if (!sw.includes('canCache(response)') || !sw.includes('response.ok')) failures.push('Service worker may cache failed responses');

if (!sw.includes("new Response('', { status: 503, statusText: 'Offline' })")) failures.push('service worker network/cache fallbacks must always return a Response');
if (!sw.includes("event.data?.text()")) failures.push('service worker push handler should tolerate non-JSON payloads');
if (!script.includes('safeParseLocalJSON') || !script.includes('backupCorruptLocalValue') || !script.includes('normalizeEchoes')) failures.push('Safe localStorage echo recovery helpers missing');
if (!script.includes("const parsed = safeParseLocalJSON(KEY, {}, { backup:true });")) failures.push('Preference loading does not use safe backed-up JSON parsing');

if (failures.length) {
  console.error('Smoke test failed:');
  failures.forEach((f) => console.error('- ' + f));
  process.exit(1);
}

console.log('Smoke test passed.');
