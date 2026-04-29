(function EchoVault() {
'use strict';

/* ── CONSTANTS ── */
const STORAGE_KEY = 'echovault_echoes_v2';
const USER_KEY    = 'echoUser';
const OB_KEY      = 'echoOnboarded';

/* ── SUPABASE ── */
const SUPABASE_URL = 'https://phfwaxuyauuyskzruqbk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZndheHV5YXV1eXNrenJ1cWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTgzODMsImV4cCI6MjA5MTEzNDM4M30.JWpdHd1g-HpUG7riWfv2qMHGe70ByVaHVcnkpcUaKuI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null; // set after auth

const MOOD_COLORS = {
  calm:'#5b8fa8', chaos:'#c44b4b', reflective:'#7c6fa0',
  anxious:'#c47a3a', joyful:'#7aab6e', empty:'#4a4a5a'
};
const MOOD_EMOJIS = {
  calm:'🌊', chaos:'⚡', reflective:'🌙',
  anxious:'🌀', joyful:'🌸', empty:'🪨'
};
const MOOD_COVER_EMOJI = {
  calm:'🌊', chaos:'⚡', reflective:'🌙', anxious:'🌀', joyful:'🌸', empty:'🌑'
};
const ARCHETYPE_NAMES = {
  calm:'The Still Lake', chaos:'The Electric Storm', reflective:'The Night Wanderer',
  anxious:'The Trembling Compass', joyful:'The Blooming Field', empty:'The Quiet Abyss'
};
const ARCHETYPE_DESCS = {
  calm:'You carry stillness like a gift. People feel safer around you.',
  chaos:'You burn bright. The world feels your electricity.',
  reflective:'You see depths others miss. The inner world is your true home.',
  anxious:"You feel everything twice. That's not weakness — it's signal.",
  joyful:'Something in you insists on light. Keep that.',
  empty:"You've been in the void. The void knows your name now."
};
const SOUNDPRINTS = {
  calm:[
    {song:'Motion Picture Soundtrack',artist:'Radiohead',reason:'It drifts like you do right now — in and out of the world.',spotify:'https://open.spotify.com/search/Motion%20Picture%20Soundtrack%20Radiohead',youtube:'https://www.youtube.com/results?search_query=Motion+Picture+Soundtrack+Radiohead'},
    {song:'Holocene',artist:'Bon Iver',reason:'The sound of feeling small in the most beautiful way.',spotify:'https://open.spotify.com/search/Holocene%20Bon%20Iver',youtube:'https://www.youtube.com/results?search_query=Holocene+Bon+Iver'},
    {song:'Gymnopédie No.1',artist:'Erik Satie',reason:'Pure stillness, distilled into notes.',spotify:'https://open.spotify.com/search/Gymnopedie%20Satie',youtube:'https://www.youtube.com/results?search_query=Gymnopedie+No+1+Satie'}
  ],
  chaos:[
    {song:'Idioteque',artist:'Radiohead',reason:'Controlled collapse. Beautiful and frantic, like you.',spotify:'https://open.spotify.com/search/Idioteque%20Radiohead',youtube:'https://www.youtube.com/results?search_query=Idioteque+Radiohead'},
    {song:'Running with the Wolves',artist:'Aurora',reason:'The electric sprint of feeling too much.',spotify:'https://open.spotify.com/search/Running%20with%20the%20Wolves%20Aurora',youtube:'https://www.youtube.com/results?search_query=Running+with+the+Wolves+Aurora'},
    {song:'Violent Shaking',artist:'Arca',reason:"Chaos doesn't need to make sense. Neither does this.",spotify:'https://open.spotify.com/search/Arca',youtube:'https://www.youtube.com/results?search_query=Arca+Violent+Shaking'}
  ],
  reflective:[
    {song:'Skinny Love',artist:'Bon Iver',reason:'The archaeology of self — digging through what was.',spotify:'https://open.spotify.com/search/Skinny%20Love%20Bon%20Iver',youtube:'https://www.youtube.com/results?search_query=Skinny+Love+Bon+Iver'},
    {song:'Silhouette',artist:'Aquilo',reason:'Memory wearing a coat of blue light.',spotify:'https://open.spotify.com/search/Silhouette%20Aquilo',youtube:'https://www.youtube.com/results?search_query=Silhouette+Aquilo'},
    {song:'Lua',artist:'Bright Eyes',reason:'Honest. A little broken. Deeply awake.',spotify:'https://open.spotify.com/search/Lua%20Bright%20Eyes',youtube:'https://www.youtube.com/results?search_query=Lua+Bright+Eyes'}
  ],
  anxious:[
    {song:'Portions for Foxes',artist:'Rilo Kiley',reason:"That restless frequency you can't name — this does.",spotify:'https://open.spotify.com/search/Portions%20for%20Foxes',youtube:'https://www.youtube.com/results?search_query=Portions+for+Foxes+Rilo+Kiley'},
    {song:'An Eagle in Your Mind',artist:'Boards of Canada',reason:'Loops within loops. Worry as soundscape.',spotify:'https://open.spotify.com/search/Boards%20of%20Canada',youtube:'https://www.youtube.com/results?search_query=An+Eagle+in+Your+Mind+Boards+of+Canada'},
    {song:'Dog Days Are Over',artist:'Florence + Machine',reason:'Panic and release held in the same breath.',spotify:'https://open.spotify.com/search/Dog%20Days%20Are%20Over',youtube:'https://www.youtube.com/results?search_query=Dog+Days+Are+Over+Florence+Machine'}
  ],
  joyful:[
    {song:'Dog Days Are Over',artist:'Florence + Machine',reason:"Joy that runs. Joy that doesn't apologize.",spotify:'https://open.spotify.com/search/Dog%20Days%20Are%20Over',youtube:'https://www.youtube.com/results?search_query=Dog+Days+Are+Over+Florence+Machine'},
    {song:'Sprawl II',artist:'Arcade Fire',reason:'Ecstasy as architecture. You live here now.',spotify:'https://open.spotify.com/search/Sprawl%20II%20Arcade%20Fire',youtube:'https://www.youtube.com/results?search_query=Sprawl+II+Arcade+Fire'},
    {song:"Can't Help Falling in Love",artist:'Kina Grannis',reason:'Gentle joy. The kind that stays.',spotify:'https://open.spotify.com/search/Kina%20Grannis%20Cant%20Help%20Falling',youtube:'https://www.youtube.com/results?search_query=Kina+Grannis+Cant+Help+Falling+in+Love'}
  ],
  empty:[
    {song:'Naked as We Came',artist:'Iron & Wine',reason:"Empty doesn't mean nothing. This song knows.",spotify:'https://open.spotify.com/search/Naked%20as%20We%20Came',youtube:'https://www.youtube.com/results?search_query=Naked+as+We+Came+Iron+Wine'},
    {song:'Street Spirit',artist:'Radiohead',reason:'The beautiful weight of feeling gone quiet.',spotify:'https://open.spotify.com/search/Street%20Spirit%20Radiohead',youtube:'https://www.youtube.com/results?search_query=Street+Spirit+Radiohead'},
    {song:'The Night Will Always Win',artist:'Manchester Orchestra',reason:'For when the hollow feeling has its own gravity.',spotify:'https://open.spotify.com/search/Manchester%20Orchestra',youtube:'https://www.youtube.com/results?search_query=The+Night+Will+Always+Win+Manchester+Orchestra'}
  ]
};

/* ── STATE ── */
let state = {
  echoes: [],
  selectedMood: null,
  voidMode: false,
  wrappedPeriod: 'week',
  currentView: 'home',
  focusedBubble: null,
  idleTimer: null,
  lastInteraction: Date.now(),
  tabHidden: false,
  lsWriteTimer: null
};

/* ══════════════════════════════════════════
   STORAGE — localStorage + Supabase hybrid
══════════════════════════════════════════ */
const Storage = (() => {

  /* Local helpers */
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch(e) { return []; }
  }
  function saveLocal(echoes) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(echoes)); }
    catch(e) { if(e.name==='QuotaExceededError') Toast.show('Storage full.',3500); }
  }

  /* Sync toast */
  function showSyncToast(msg, dur=2500) {
    const t = document.getElementById('sync-toast');
    const m = document.getElementById('sync-toast-msg');
    if(!t||!m) return;
    m.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), dur);
  }

  /* Load from DB if logged in, else local */
  async function load() {
    if (!currentUser) return loadLocal();
    try {
      const { data, error } = await sb
        .from('echoes').select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      const echoes = data || [];
      saveLocal(echoes); // mirror locally for offline
      return echoes;
    } catch(e) {
      console.warn('DB load failed, using local:', e.message);
      return loadLocal();
    }
  }

  /* Save one echo (upsert) */
  async function save(echoes) {
    saveLocal(echoes); // always local-first
    if (!currentUser || !echoes.length) return;
    clearTimeout(state.lsWriteTimer);
    state.lsWriteTimer = setTimeout(async () => {
      try {
        const row = { ...echoes[0], user_id: currentUser.id };
        await sb.from('echoes').upsert(row, { onConflict: 'id' });
      } catch(e) { console.warn('Echo sync failed:', e.message); }
    }, 400);
  }

  /* Bulk upsert (migration) */
  async function saveAll(echoes) {
    saveLocal(echoes);
    if (!currentUser || !echoes.length) return;
    try {
      const rows = echoes.map(e => ({ ...e, user_id: currentUser.id }));
      const { error } = await sb.from('echoes').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    } catch(e) { console.warn('Bulk sync failed:', e.message); }
  }

  /* Migrate localStorage echoes to DB after login */
  async function migrateLocalToDB() {
    const local = loadLocal();
    if (!local.length || !currentUser) return;
    showSyncToast('syncing your echoes to the cloud…', 3000);
    await saveAll(local);
    localStorage.removeItem(STORAGE_KEY);
    showSyncToast(`✓ ${local.length} echo${local.length!==1?'s':''} synced`, 2500);
  }

  function exportVault(echoes) {
    try {
      const blob = new Blob([JSON.stringify({version:2,echoes},null,2)],{type:'application/json'});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href=url; a.download='echovault-backup.json'; a.click();
      URL.revokeObjectURL(url);
      Toast.show('Vault exported ✓');
    } catch(e) { Toast.show('Export failed.'); }
  }

  function importVault(file, onSuccess) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const arr  = data.echoes || data;
        if (!Array.isArray(arr)) throw new Error('Invalid format');
        onSuccess(arr);
        await saveAll(arr);
        Toast.show(`Imported ${arr.length} echoes ✓`);
      } catch(err) { Toast.show('Import failed — invalid file.'); }
    };
    reader.readAsText(file);
  }

  /* Offline banner */
  window.addEventListener('online',  () => document.getElementById('offline-banner')?.classList.remove('show'));
  window.addEventListener('offline', () => document.getElementById('offline-banner')?.classList.add('show'));

  return { load, save, saveAll, migrateLocalToDB, exportVault, importVault };
})();

/* ── TOAST ── */
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer;
  function show(msg, duration=2200) {
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(()=>el.classList.remove('show'), duration);
  }
  return {show};
})();

/* ── NAVIGATION ── */
const Nav = (() => {
  const views   = ['home','entry','timeline','wrapped','fun'];
  const navBtns = {}, viewEls = {};
  views.forEach(v => {
    navBtns[v] = document.getElementById('nav-' + v);
    viewEls[v] = document.getElementById('view-' + v);
    if (navBtns[v]) navBtns[v].addEventListener('click', () => show(v));
  });
  function show(name) {
    views.forEach(v => {
      viewEls[v]?.classList.toggle('active', v===name);
      navBtns[v]?.classList.toggle('active',  v===name);
    });
    state.currentView = name;
    if (name==='timeline') { Timeline.render(); setTimeout(ConnectionCanvas.render, 60); }
    if (name==='wrapped')  Wrapped.render();
    if (name==='home')     IdentityCore.update();
    window.scrollTo({top:0, behavior:'smooth'});
    setTimeout(() => {
      const activeView = viewEls[name];
      if (!activeView) return;
      const first = activeView.querySelector('.view-title, h2, .hero-title, .fun-grid, #bubble-field, #wrapped-content, .wrapped-card, .entry-container');
      if (first) {
        const rect = first.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.3) {
          first.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    }, 80);
  }
  return {show};
})();

/* ══════════════════════════════════════════
   USER CHIP — name shown top right
══════════════════════════════════════════ */
const UserChip = (() => {
  const chip    = document.getElementById('user-chip');
  const avatar  = document.getElementById('chip-avatar');
  const nameEl  = document.getElementById('chip-name');
  const dName   = document.getElementById('chip-dropdown-name');
  const dEmail  = document.getElementById('chip-dropdown-email');

  function show(user) {
    if (!user) return;
    const displayName = user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'you';
    const initials = displayName.slice(0,2).toUpperCase();

    avatar.textContent  = initials;
    nameEl.textContent  = displayName.toLowerCase();
    dName.textContent   = displayName;
    dEmail.textContent  = user.email || '';
    chip.classList.add('visible');
  }

  function hide() { chip.classList.remove('visible'); }

  // Export from chip dropdown
  document.getElementById('chip-export-btn')?.addEventListener('click', () => {
    Storage.exportVault(state.echoes);
  });

  // Sign out
  document.getElementById('chip-signout-btn')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('echoOnboarded');
    hide();
    location.reload();
  });

  // Keyboard accessibility
  chip.addEventListener('keydown', e => {
    if (e.key==='Enter'||e.key===' ') {
      e.preventDefault();
      chip.querySelector('.chip-dropdown').style.opacity =
        chip.querySelector('.chip-dropdown').style.opacity === '1' ? '0' : '1';
    }
  });

  return {show, hide};
})();

/* ══════════════════════════════════════════
   LOGIN SYSTEM — with Supabase auth
══════════════════════════════════════════ */
const Login = (() => {
  const screen   = document.getElementById('login-screen');
  const lsOrb    = document.getElementById('ls-orb');
  const lsBreath = document.getElementById('ls-breath');
  const lsAuth   = document.getElementById('ls-auth');
  const lsReturn = document.getElementById('ls-return');
  const stressOrb = document.getElementById('stress-orb');

  let isSignUp = true; // default tab

  function showStep(el) {
    [lsOrb, lsBreath, lsAuth, lsReturn].forEach(s => {
      if (!s) return;
      s.classList.remove('active');
      s.style.position = 'absolute';
      s.style.pointerEvents = 'none';
      s.style.opacity = '0';
    });
    el.classList.add('active');
    el.style.position = 'relative';
    el.style.pointerEvents = 'all';
    el.style.opacity = '1';
  }

  /* Enter app after successful auth */
  async function enterApp(user) {
    currentUser = user;
    const displayName = user.user_metadata?.name || user.email.split('@')[0];
    localStorage.setItem(USER_KEY, displayName);

    // Migrate any pre-login local echoes
    await Storage.migrateLocalToDB();

    // Load echoes from DB
    state.echoes = await Storage.load();

    // Show user chip
    UserChip.show(user);

    // Hide login screen
    screen.classList.add('hidden');
    setTimeout(() => {
      screen.style.display = 'none';
      if (!localStorage.getItem(OB_KEY)) Onboarding.start();
    }, 950);

    Weather.update(); IdentityOrb.update(); IdentityCore.update();
    GhostLayer.initFromEchoes(state.echoes);
  }

  /* Wire auth tabs */
  function setupTabs() {
    const tabSignup = document.getElementById('tab-signup');
    const tabSignin = document.getElementById('tab-signin');
    const headline  = document.getElementById('auth-headline');
    const sub       = document.getElementById('auth-sub');
    const submitBtn = document.getElementById('auth-submit-btn');

    tabSignup?.addEventListener('click', () => {
      isSignUp = true;
      tabSignup.classList.add('active');
      tabSignin.classList.remove('active');
      headline.textContent = 'Create your universe.';
      sub.textContent = 'Your echoes will follow you everywhere.';
      submitBtn.textContent = 'Enter My Universe';
      clearError();
    });
    tabSignin?.addEventListener('click', () => {
      isSignUp = false;
      tabSignin.classList.add('active');
      tabSignup.classList.remove('active');
      headline.textContent = "you're back.";
      sub.textContent = 'Your universe waited.';
      submitBtn.textContent = 'Return to My Universe';
      clearError();
    });
  }

  /* Error helpers */
  function setError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
  }
  function clearError() {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = ''; el.classList.remove('show');
  }

  /* Wire submit */
  function setupForm() {
    const submitBtn  = document.getElementById('auth-submit-btn');
    const emailInput = document.getElementById('auth-email');
    const passInput  = document.getElementById('auth-password');
    const forgotBtn  = document.getElementById('auth-forgot-btn');

    submitBtn?.addEventListener('click', handleSubmit);
    emailInput?.addEventListener('keydown', e => { if(e.key==='Enter') passInput?.focus(); });
    passInput?.addEventListener('keydown',  e => { if(e.key==='Enter') handleSubmit(); });

    async function handleSubmit() {
      clearError();
      const email = emailInput?.value.trim();
      const pass  = passInput?.value;
      if (!email) { setError('Enter your email.'); return; }
      if (!pass || pass.length < 6) { setError('Password must be at least 6 characters.'); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = isSignUp ? 'Creating…' : 'Entering…';

      if (isSignUp) {
        const { data, error } = await sb.auth.signUp({
          email, password: pass,
          options: { data: { name: email.split('@')[0] } }
        });
        if (error) { setError(error.message); submitBtn.disabled=false; submitBtn.textContent='Enter My Universe'; return; }
        if (data.session) {
          await enterApp(data.user);
        } else {
          // Email confirmation required
          document.getElementById('auth-form-wrap').style.display = 'none';
          const confirmState = document.getElementById('auth-confirm-state');
          const confirmMsg   = document.getElementById('auth-confirm-msg');
          if (confirmMsg) confirmMsg.innerHTML = `We sent a link to <strong>${email}</strong>.<br>Click it to activate your universe.`;
          confirmState?.classList.add('show');
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) { setError(error.message); submitBtn.disabled=false; submitBtn.textContent='Return to My Universe'; return; }
        await enterApp(data.user);
      }
    }

    forgotBtn?.addEventListener('click', async () => {
      const email = emailInput?.value.trim();
      if (!email) { setError('Enter your email first.'); return; }
      await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      Toast.show('Reset link sent — check your inbox.', 4000);
    });
  }

  async function init() {
    setupTabs();
    setupForm();

    // Check for existing Supabase session first
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      const user = session.user;
      const displayName = user.user_metadata?.name || user.email.split('@')[0];
      document.getElementById('return-name').textContent = displayName;
      showStep(lsReturn);
      document.getElementById('return-enter-btn').addEventListener('click', () => enterApp(user));
      return;
    }

    // New user — orb flow
    stressOrb?.addEventListener('pointerdown', () => stressOrb.classList.add('pressed'));
    ['pointerup','pointerleave'].forEach(ev =>
      stressOrb?.addEventListener(ev, () => stressOrb.classList.remove('pressed')));

    let pressStart = 0;
    stressOrb?.addEventListener('pointerdown', () => { pressStart = Date.now(); });
    stressOrb?.addEventListener('pointerup', () => {
      if (Date.now() - pressStart > 80) {
        showStep(lsBreath);
        BreathAnim.start();
        setTimeout(() => {
          showStep(lsAuth);
          setTimeout(() => document.getElementById('auth-email')?.focus(), 300);
        }, 4200);
      }
    });
    stressOrb?.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') {
        e.preventDefault();
        stressOrb.dispatchEvent(new PointerEvent('pointerdown'));
        setTimeout(() => stressOrb.dispatchEvent(new PointerEvent('pointerup')), 200);
      }
    });

    // Listen for auth state changes (e.g. email confirm in another tab)
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !currentUser) {
        await enterApp(session.user);
      }
    });
  }

  return { init };
})();

/* ── BREATH ANIMATION (login) ── */
const BreathAnim = (() => {
  const canvas = document.getElementById('breath-anim-canvas');
  const ctx    = canvas?.getContext('2d');
  let phase = 0, running = false;
  function start() {
    if (running||!ctx) return;
    running = true; phase = 0; tick();
  }
  function tick() {
    if (!running) return;
    ctx.clearRect(0,0,200,200);
    phase += 0.018;
    const cx=100,cy=100,baseR=38;
    const pulsed = baseR + Math.sin(phase)*18;
    const alpha  = 0.25 + Math.abs(Math.sin(phase))*0.35;
    for (let i=3;i>=0;i--) {
      const r=pulsed+i*18, a=alpha*(1-i*0.22);
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      grd.addColorStop(0,'transparent');
      grd.addColorStop(0.7,`rgba(201,168,76,${a*0.5})`);
      grd.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fillStyle=grd; ctx.fill();
    }
    const cg=ctx.createRadialGradient(cx-10,cy-10,0,cx,cy,pulsed);
    cg.addColorStop(0,`rgba(201,168,76,${0.7+Math.sin(phase)*.2})`);
    cg.addColorStop(0.6,`rgba(201,168,76,.35)`);
    cg.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,pulsed,0,Math.PI*2);
    ctx.fillStyle=cg; ctx.fill();
    requestAnimationFrame(tick);
  }
  return {start};
})();

/* ── ONBOARDING ── */
const Onboarding = (() => {
  const overlay = document.getElementById('onboarding');
  const iconEl  = document.getElementById('ob-icon');
  const titleEl = document.getElementById('ob-title');
  const bodyEl  = document.getElementById('ob-body');
  const nextBtn = document.getElementById('ob-next');
  const backBtn = document.getElementById('ob-back');
  const skipBtn = document.getElementById('ob-skip');
  const dots    = [0,1,2,3].map(i=>document.getElementById('ob-d'+i));
  const steps   = [
    {icon:'🌌',title:'This is your universe.',body:'Everything you feel becomes a memory orb — floating in your own private cosmos. <strong>Nothing is too small. Nothing is too much.</strong>'},
    {icon:'🫧',title:'These are your memories.',body:'Each orb holds a feeling, a moment, an intensity. <strong>Tap any orb</strong> to reveal what\'s inside. Drag them around — they drift like emotions do.'},
    {icon:'✦',title:'Tap here to create your first echo.',body:'Hit <strong>+ Echo</strong> in the nav above. Choose your mood, set your intensity, write a thought if you want. Or just feel it in silence.'},
    {icon:'🎭',title:'Rituals await you.',body:'Explore <strong>Rituals & Artifacts</strong> — your mood receipt, emotion DNA, crash report, and more. This universe is yours.'}
  ];
  let current=0;
  function render() {
    const s=steps[current];
    iconEl.textContent=s.icon; titleEl.textContent=s.title; bodyEl.innerHTML=s.body;
    dots.forEach((d,i)=>{d.classList.toggle('active',i===current);d.classList.toggle('done',i<current);});
    backBtn.style.display=current>0?'block':'none';
    nextBtn.textContent=current===steps.length-1?'Enter Universe ✦':'Next →';
  }
  function start() { overlay.classList.add('open'); current=0; render(); }
  function finish() { overlay.classList.remove('open'); localStorage.setItem(OB_KEY,'1'); }
  nextBtn.addEventListener('click',()=>{if(current<steps.length-1){current++;render();}else finish();});
  backBtn.addEventListener('click',()=>{if(current>0){current--;render();}});
  skipBtn.addEventListener('click',finish);
  return {start};
})();

/* ── COSMOS CANVAS ── */
const Cosmos = (() => {
  const canvas = document.getElementById('cosmos-canvas');
  const ctx    = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  function init() {
    resize();
    const max=window.innerWidth<600?30:52;
    const count=Math.min(max,Math.floor(canvas.width*canvas.height/20000));
    particles=[];
    for(let i=0;i<count;i++) {
      particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,
        r:Math.random()*1.4+.35,vx:(Math.random()-.5)*.1,vy:(Math.random()-.5)*.1,
        a:Math.random()*.5+.15,c:['#5b8fa8','#7c6fa0','#c9a84c','#7aab6e'][Math.floor(Math.random()*4)]});
    }
  }
  function draw() {
    if(state.tabHidden){requestAnimationFrame(draw);return;}
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cellSize=100,grid={};
    particles.forEach((p,i)=>{
      p.x=(p.x+p.vx+canvas.width)%canvas.width;
      p.y=(p.y+p.vy+canvas.height)%canvas.height;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c+Math.floor(p.a*255).toString(16).padStart(2,'0');ctx.fill();
      const gx=Math.floor(p.x/cellSize),gy=Math.floor(p.y/cellSize);
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
        const key=`${gx+dx},${gy+dy}`;if(!grid[key])grid[key]=[];grid[key].push(i);
      }
    });
    const checked=new Set();
    particles.forEach((p1,i)=>{
      const gx=Math.floor(p1.x/cellSize),gy=Math.floor(p1.y/cellSize);
      (grid[`${gx},${gy}`]||[]).forEach(j=>{
        if(j<=i)return;const pk=i+'_'+j;if(checked.has(pk))return;checked.add(pk);
        const p2=particles[j],dx=p1.x-p2.x,dy=p1.y-p2.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<100){
          const a=(1-dist/100)*.05;
          ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);
          ctx.strokeStyle=`rgba(201,168,76,${a})`;ctx.lineWidth=.4;ctx.stroke();
        }
      });
    });
    requestAnimationFrame(draw);
  }
  return {init,draw,resize};
})();

/* ── RIPPLE CANVAS ── */
const Ripple = (() => {
  const canvas=document.getElementById('ripple-canvas');
  const ctx=canvas.getContext('2d');
  let rings=[];
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  function spawn(x,y,color,isVoid=false){
    rings.push({x,y,r:0,maxR:isVoid?200:140,color,a:1,speed:isVoid?1.2:2,isVoid});
  }
  function tick(){
    if(state.tabHidden){requestAnimationFrame(tick);return;}
    ctx.clearRect(0,0,canvas.width,canvas.height);
    rings=rings.filter(r=>r.a>0.01);
    rings.forEach(ring=>{
      ring.r+=ring.speed;ring.a=Math.max(0,1-ring.r/ring.maxR);
      if(ring.isVoid){
        for(let i=0;i<3;i++){const rr=ring.r-i*18;if(rr<0)continue;
          ctx.beginPath();ctx.arc(ring.x,ring.y,rr,0,Math.PI*2);
          ctx.strokeStyle=`rgba(74,74,90,${ring.a*.5})`;ctx.lineWidth=1.5;ctx.stroke();}
      }else{
        ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r,0,Math.PI*2);
        ctx.strokeStyle=ring.color+Math.floor(ring.a*80).toString(16).padStart(2,'0');
        ctx.lineWidth=1.2;ctx.stroke();
      }
    });
    requestAnimationFrame(tick);
  }
  resize();tick();
  return {spawn,resize};
})();

/* ── CONNECTION CANVAS ── */
const ConnectionCanvas = (() => {
  const canvas=document.getElementById('connection-canvas');
  const ctx=canvas.getContext('2d');
  let orbData=[],phase=0;
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  function setOrbs(data){orbData=data;}
  function render(){
    if(state.currentView!=='timeline')return;
    ctx.clearRect(0,0,canvas.width,canvas.height);phase+=0.012;
    const field=document.getElementById('bubble-field');
    if(!field)return;
    const fieldRect=field.getBoundingClientRect();
    for(let i=0;i<orbData.length;i++){
      for(let j=i+1;j<orbData.length;j++){
        const a=orbData[i],b=orbData[j];
        if(a.mood!==b.mood)continue;
        const ax=a.x+fieldRect.left,ay=a.y+fieldRect.top;
        const bx=b.x+fieldRect.left,by=b.y+fieldRect.top;
        const dx=ax-bx,dy=ay-by,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>220)continue;
        const alpha=(1-dist/220)*.22*(0.7+0.3*Math.sin(phase+i));
        const color=MOOD_COLORS[a.mood];
        const grad=ctx.createLinearGradient(ax,ay,bx,by);
        grad.addColorStop(0,color+'00');
        grad.addColorStop(.5,color+Math.floor(alpha*255).toString(16).padStart(2,'0'));
        grad.addColorStop(1,color+'00');
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);
        ctx.strokeStyle=grad;ctx.lineWidth=1.4;ctx.stroke();
      }
    }
    requestAnimationFrame(()=>{if(state.currentView==='timeline'&&!state.tabHidden)render();});
  }
  resize();
  return {setOrbs,render,resize};
})();

/* ── BREATHING ── */
const Breathing = (() => {
  let phase=0;
  function tick(){
    if(!state.tabHidden){
      phase+=0.008;
      const intensity=state.echoes[0]?.intensity||5;
      const scale=1+Math.sin(phase)*(0.008+(intensity/10)*0.012);
      document.documentElement.style.setProperty('--breath-scale',scale);
    }
    requestAnimationFrame(tick);
  }
  return {start:tick};
})();

/* ── WHIP CANVAS ── */
const Whip = (() => {
  const canvas=document.getElementById('whip-canvas');
  const ctx=canvas.getContext('2d');
  const label=document.getElementById('whip-idle-label');
  let running=false;
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  function resetIdle(){running=false;label.classList.remove('visible');canvas.style.opacity='0';}
  function trigger(){
    if(running)return;running=true;canvas.style.opacity='1';
    const cx=canvas.width/2,cy=canvas.height/2;let t=0;
    function frame(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const progress=t/80,alpha=Math.sin(progress*Math.PI)*.6,waveAmp=40*Math.sin(progress*Math.PI);
      ctx.beginPath();
      for(let x=0;x<canvas.width;x+=4){
        const y=cy+Math.sin((x/canvas.width)*Math.PI*4+t*.1)*waveAmp;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(201,168,76,${alpha*.7})`;ctx.lineWidth=1.5;
      ctx.shadowColor='rgba(201,168,76,.4)';ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,120);
      grd.addColorStop(0,`rgba(201,168,76,${alpha*.08})`);grd.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(cx,cy,120,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
      t++;
      if(t<90)requestAnimationFrame(frame);
      else{ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.opacity='0';running=false;setTimeout(resetIdle,2000);}
    }
    frame();
  }
  resize();resetIdle();
  ['mousemove','keydown','touchstart','click','scroll'].forEach(ev=>
    document.addEventListener(ev,resetIdle,{passive:true}));
  return {trigger,resize};
})();

/* ── SILENCE PARTICLES ── */
const SilenceParticles = (() => {
  const layer=document.getElementById('silence-layer');
  function spawn(silenceLevel){
    const count=Math.floor(silenceLevel*1.5);
    for(let i=0;i<count;i++){
      setTimeout(()=>{
        const p=document.createElement('div');p.className='sil-particle';
        const size=Math.random()*3+1;
        p.style.cssText=`width:${size}px;height:${size}px;background:rgba(124,111,160,.65);left:${Math.random()*100}%;bottom:${Math.random()*30}%;animation-duration:${3+Math.random()*3}s;animation-delay:${Math.random()}s;`;
        layer.appendChild(p);setTimeout(()=>p.remove(),7000);
      },i*120);
    }
  }
  return {spawn};
})();

/* ── GHOST LAYER ── */
const GhostLayer = (() => {
  const layer=document.getElementById('ghost-layer');
  function spawn(echo){
    const color=MOOD_COLORS[echo.mood],size=50+echo.intensity*14;
    const ghost=document.createElement('div');ghost.className='ghost-memory';
    const dur=16+Math.random()*18;
    ghost.style.cssText=`left:${Math.random()*82+9}%;width:${size}px;height:${size}px;background:${color};filter:blur(${size/4}px);animation-duration:${dur}s;animation-delay:${Math.random()*4}s;`;
    layer.appendChild(ghost);setTimeout(()=>ghost.remove(),(dur+5)*1000);
  }
  function initFromEchoes(echoes){
    echoes.slice(0,7).forEach((e,i)=>setTimeout(()=>spawn(e),i*1800));
  }
  return {spawn,initFromEchoes};
})();

/* ── HELPERS ── */
function spawnResidue(x,y,color){
  const r=document.createElement('div'),size=60+Math.random()*40;
  r.className='residue';
  r.style.cssText=`width:${size}px;height:${size}px;left:${x-size/2}px;top:${y-size/2}px;border:1.5px solid ${color}66;box-shadow:0 0 14px ${color}33;`;
  document.body.appendChild(r);setTimeout(()=>r.remove(),1500);
}
function spawnVoidPulse(x,y){
  const p=document.createElement('div');p.className='void-pulse';
  p.style.cssText=`width:80px;height:80px;left:${x-40}px;top:${y-40}px;`;
  document.body.appendChild(p);setTimeout(()=>p.remove(),2200);
}
function spawnSparkle(x,y,color){
  const s=document.createElement('div');s.className='sparkle';
  const size=3+Math.random()*5;
  s.style.cssText=`width:${size}px;height:${size}px;left:${x-size/2}px;top:${y-size/2}px;background:${color};box-shadow:0 0 7px ${color};`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),800);
}
function spawnBurst(x,y,color){
  for(let i=0;i<14;i++){
    const el=document.createElement('div');el.className='residue';
    const angle=(i/14)*Math.PI*2,dist=30+Math.random()*45,size=4+Math.random()*8;
    el.style.cssText=`width:${size}px;height:${size}px;left:${x+Math.cos(angle)*dist-size/2}px;top:${y+Math.sin(angle)*dist-size/2}px;background:${color};box-shadow:0 0 12px ${color};animation-duration:.9s;`;
    document.body.appendChild(el);setTimeout(()=>el.remove(),1000);
  }
}
function spawnDissolve(x,y,color){
  for(let i=0;i<16;i++){
    const el=document.createElement('div');el.className='dissolve-particle';
    const angle=(i/16)*Math.PI*2+Math.random()*.3,dist=40+Math.random()*60,size=3+Math.random()*6;
    const dx=Math.cos(angle)*dist+(Math.random()-.5)*20,dy=Math.sin(angle)*dist+(Math.random()-.5)*20;
    el.style.cssText=`width:${size}px;height:${size}px;left:${x-size/2}px;top:${y-size/2}px;background:${color};box-shadow:0 0 8px ${color}88;--dx:${dx}px;--dy:${dy}px;animation-duration:${.8+Math.random()*.5}s;animation-delay:${Math.random()*.12}s;`;
    document.body.appendChild(el);setTimeout(()=>el.remove(),1500);
  }
}
