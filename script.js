(function EchoVault() {
'use strict';

/* ── CONSTANTS ── */
const STORAGE_KEY  = 'echovault_echoes_v2';
const USER_KEY     = 'echoUser';
const OB_KEY       = 'echoOnboarded';

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
  anxious:'You feel everything twice. That\'s not weakness — it\'s signal.',
  joyful:'Something in you insists on light. Keep that.',
  empty:'You\'ve been in the void. The void knows your name now.'
};
const SOUNDPRINTS = {
  calm:[
    {song:'Motion Picture Soundtrack',artist:'Radiohead',reason:'It drifts like you do right now — in and out of the world.',spotify:'https://open.spotify.com/search/Motion%20Picture%20Soundtrack%20Radiohead',youtube:'https://www.youtube.com/results?search_query=Motion+Picture+Soundtrack+Radiohead'},
    {song:'Holocene',artist:'Bon Iver',reason:'The sound of feeling small in the most beautiful way.',spotify:'https://open.spotify.com/search/Holocene%20Bon%20Iver',youtube:'https://www.youtube.com/results?search_query=Holocene+Bon+Iver'},
    {song:'Gymnopédie No.1',artist:'Erik Satie',reason:'Pure stillness, distilled into notes.',spotify:'https://open.spotify.com/search/Gymnopedie%20Satie',youtube:'https://www.youtube.com/results?search_query=Gymnop%C3%A9die+No+1+Satie'}
  ],
  chaos:[
    {song:'Idioteque',artist:'Radiohead',reason:'Controlled collapse. Beautiful and frantic, like you.',spotify:'https://open.spotify.com/search/Idioteque%20Radiohead',youtube:'https://www.youtube.com/results?search_query=Idioteque+Radiohead'},
    {song:'Running with the Wolves',artist:'Aurora',reason:'The electric sprint of feeling too much.',spotify:'https://open.spotify.com/search/Running%20with%20the%20Wolves%20Aurora',youtube:'https://www.youtube.com/results?search_query=Running+with+the+Wolves+Aurora'},
    {song:'Violent Shaking',artist:'Arca',reason:'Chaos doesn\'t need to make sense. Neither does this.',spotify:'https://open.spotify.com/search/Arca',youtube:'https://www.youtube.com/results?search_query=Arca+Violent+Shaking'}
  ],
  reflective:[
    {song:'Skinny Love',artist:'Bon Iver',reason:'The archaeology of self — digging through what was.',spotify:'https://open.spotify.com/search/Skinny%20Love%20Bon%20Iver',youtube:'https://www.youtube.com/results?search_query=Skinny+Love+Bon+Iver'},
    {song:'Silhouette',artist:'Aquilo',reason:'Memory wearing a coat of blue light.',spotify:'https://open.spotify.com/search/Silhouette%20Aquilo',youtube:'https://www.youtube.com/results?search_query=Silhouette+Aquilo'},
    {song:'Lua',artist:'Bright Eyes',reason:'Honest. A little broken. Deeply awake.',spotify:'https://open.spotify.com/search/Lua%20Bright%20Eyes',youtube:'https://www.youtube.com/results?search_query=Lua+Bright+Eyes'}
  ],
  anxious:[
    {song:'Portions for Foxes',artist:'Rilo Kiley',reason:'That restless frequency you can\'t name — this does.',spotify:'https://open.spotify.com/search/Portions%20for%20Foxes',youtube:'https://www.youtube.com/results?search_query=Portions+for+Foxes+Rilo+Kiley'},
    {song:'An Eagle in Your Mind',artist:'Boards of Canada',reason:'Loops within loops. Worry as soundscape.',spotify:'https://open.spotify.com/search/Boards%20of%20Canada',youtube:'https://www.youtube.com/results?search_query=An+Eagle+in+Your+Mind+Boards+of+Canada'},
    {song:'Dog Days Are Over',artist:'Florence + Machine',reason:'Panic and release held in the same breath.',spotify:'https://open.spotify.com/search/Dog%20Days%20Are%20Over',youtube:'https://www.youtube.com/results?search_query=Dog+Days+Are+Over+Florence+Machine'}
  ],
  joyful:[
    {song:'Dog Days Are Over',artist:'Florence + Machine',reason:'Joy that runs. Joy that doesn\'t apologize.',spotify:'https://open.spotify.com/search/Dog%20Days%20Are%20Over',youtube:'https://www.youtube.com/results?search_query=Dog+Days+Are+Over+Florence+Machine'},
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

/* ── STORAGE ── */
const Storage = (() => {
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch(e) { return []; }
  }
  function save(echoes) {
    clearTimeout(state.lsWriteTimer);
    state.lsWriteTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(echoes)); }
      catch(e) { if (e.name==='QuotaExceededError') Toast.show('Storage full.', 3500); }
    }, 300);
  }
  function exportVault(echoes) {
    try {
      const blob = new Blob([JSON.stringify({version:2,echoes}, null, 2)], {type:'application/json'});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'echovault-backup.json';
      a.click(); URL.revokeObjectURL(url);
      Toast.show('Vault exported ✓');
    } catch(e) { Toast.show('Export failed.'); }
  }
  function importVault(file, onSuccess) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const arr  = data.echoes || data;
        if (!Array.isArray(arr)) throw new Error('Invalid format');
        onSuccess(arr);
        Toast.show(`Imported ${arr.length} echoes ✓`);
      } catch(err) { Toast.show('Import failed — invalid file.'); }
    };
    reader.readAsText(file);
  }
  return {load, save, exportVault, importVault};
})();

/* ── TOAST ── */
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer;
  function show(msg, duration = 2200) {
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), duration);
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
      viewEls[v]?.classList.toggle('active', v === name);
      navBtns[v]?.classList.toggle('active',  v === name);
    });
    state.currentView = name;
    if (name === 'timeline') { Timeline.render(); setTimeout(ConnectionCanvas.render, 60); }
    if (name === 'wrapped')  Wrapped.render();
    if (name === 'home')     IdentityCore.update();
    // Smooth scroll to top of the view content, then to the active section
    window.scrollTo({top:0, behavior:'smooth'});
    // After the scroll, ensure the view's first meaningful content is in focus
    setTimeout(() => {
      const activeView = viewEls[name];
      if (!activeView) return;
      const firstFocusable = activeView.querySelector('.view-title, h2, .hero-title, .fun-grid, #bubble-field, #wrapped-content, .wrapped-card, .entry-container');
      if (firstFocusable) {
        const rect = firstFocusable.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.3) {
          firstFocusable.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    }, 80);
  }
  return {show};
})();

/* ── LOGIN SYSTEM ── */
const Login = (() => {
  const screen   = document.getElementById('login-screen');
  const lsOrb    = document.getElementById('ls-orb');
  const lsBreath = document.getElementById('ls-breath');
  const lsName   = document.getElementById('ls-name');
  const lsReturn = document.getElementById('ls-return');
  const stressOrb= document.getElementById('stress-orb');
  const nameInput= document.getElementById('name-input');
  const nameBtn  = document.getElementById('name-enter-btn');

  function showStep(el) {
    [lsOrb,lsBreath,lsName,lsReturn].forEach(s => s.classList.remove('active'));
    el.classList.add('active');
  }

  function enterApp(name) {
    screen.classList.add('hidden');
    setTimeout(() => {
      screen.style.display = 'none';
      // Show onboarding if new user
      if (!localStorage.getItem(OB_KEY)) {
        Onboarding.start();
      }
    }, 950);
  }

  function init() {
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedUser) {
      // Returning user
      document.getElementById('return-name').textContent = savedUser;
      showStep(lsReturn);
      document.getElementById('return-enter-btn').addEventListener('click', () => enterApp(savedUser));
      return;
    }

    // New user flow
    stressOrb.addEventListener('pointerdown', () => {
      stressOrb.classList.add('pressed');
    });
    ['pointerup','pointerleave'].forEach(ev =>
      stressOrb.addEventListener(ev, () => stressOrb.classList.remove('pressed')));

    let pressStart = 0;
    stressOrb.addEventListener('pointerdown', () => { pressStart = Date.now(); });
    stressOrb.addEventListener('pointerup', () => {
      if (Date.now() - pressStart > 80) {
        showStep(lsBreath);
        BreathAnim.start();
        setTimeout(() => { showStep(lsName); setTimeout(() => nameInput.focus(), 300); }, 4200);
      }
    });
    stressOrb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        stressOrb.dispatchEvent(new PointerEvent('pointerdown'));
        setTimeout(() => stressOrb.dispatchEvent(new PointerEvent('pointerup')), 200);
      }
    });

    nameInput.addEventListener('input', () => {
      nameBtn.classList.toggle('visible', nameInput.value.trim().length > 0);
    });
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && nameInput.value.trim()) enter();
    });
    nameBtn.addEventListener('click', enter);

    function enter() {
      const name = nameInput.value.trim();
      if (!name) return;
      localStorage.setItem(USER_KEY, name);
      enterApp(name);
    }
  }

  return {init};
})();

/* ── BREATH ANIMATION (login) ── */
const BreathAnim = (() => {
  const canvas = document.getElementById('breath-anim-canvas');
  const ctx    = canvas.getContext('2d');
  let phase = 0, raf = null, running = false;

  function start() {
    if (running) return;
    running = true;
    phase = 0;
    tick();
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0,0,200,200);
    phase += 0.018;
    const cx=100, cy=100;
    const baseR = 38;
    const pulsed = baseR + Math.sin(phase) * 18;
    const alpha  = 0.25 + Math.abs(Math.sin(phase)) * 0.35;

    // Outer soft ring
    for (let i=3; i>=0; i--) {
      const r = pulsed + i*18;
      const a = alpha * (1 - i*0.22);
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      grd.addColorStop(0,'transparent');
      grd.addColorStop(0.7,`rgba(201,168,76,${a*0.5})`);
      grd.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();
    }

    // Core orb
    const cg = ctx.createRadialGradient(cx-10,cy-10,0,cx,cy,pulsed);
    cg.addColorStop(0,`rgba(201,168,76,${0.7+Math.sin(phase)*.2})`);
    cg.addColorStop(0.6,`rgba(201,168,76,${0.35})`);
    cg.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,pulsed,0,Math.PI*2);
    ctx.fillStyle=cg; ctx.fill();

    raf = requestAnimationFrame(tick);
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
  const dots    = [0,1,2,3].map(i => document.getElementById('ob-d'+i));

  const steps = [
    {
      icon:'🌌',
      title:'This is your universe.',
      body:'Everything you feel becomes a memory orb — floating in your own private cosmos. <strong>Nothing is too small. Nothing is too much.</strong>'
    },
    {
      icon:'🫧',
      title:'These are your memories.',
      body:'Each orb holds a feeling, a moment, an intensity. <strong>Tap any orb</strong> to reveal what\'s inside. Drag them around — they drift like emotions do.'
    },
    {
      icon:'✦',
      title:'Tap here to create your first echo.',
      body:'Hit <strong>+ Echo</strong> in the nav above. Choose your mood, set your intensity, write a thought if you want. Or just feel it in silence.'
    },
    {
      icon:'🎭',
      title:'Rituals await you.',
      body:'Explore <strong>Rituals & Artifacts</strong> — your mood receipt, emotion DNA, crash report, and a stress ball for when it all gets too much. This universe is yours.'
    }
  ];

  let current = 0;

  function render() {
    const s = steps[current];
    iconEl.textContent  = s.icon;
    titleEl.textContent = s.title;
    bodyEl.innerHTML    = s.body;
    dots.forEach((d,i) => {
      d.classList.toggle('active', i === current);
      d.classList.toggle('done',   i < current);
    });
    backBtn.style.display = current > 0 ? 'block' : 'none';
    nextBtn.textContent   = current === steps.length-1 ? 'Enter Universe ✦' : 'Next →';
  }

  function start() {
    overlay.classList.add('open');
    current = 0;
    render();
  }

  function finish() {
    overlay.classList.remove('open');
    localStorage.setItem(OB_KEY, '1');
  }

  nextBtn.addEventListener('click', () => {
    if (current < steps.length-1) { current++; render(); }
    else finish();
  });
  backBtn.addEventListener('click', () => {
    if (current > 0) { current--; render(); }
  });
  skipBtn.addEventListener('click', finish);

  return {start};
})();

/* ── COSMOS CANVAS ── */
const Cosmos = (() => {
  const canvas = document.getElementById('cosmos-canvas');
  const ctx    = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    const max   = window.innerWidth < 600 ? 30 : 52;
    const count = Math.min(max, Math.floor(canvas.width * canvas.height / 20000));
    particles   = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + .35,
        vx:(Math.random()-.5) * .1,
        vy:(Math.random()-.5) * .1,
        a: Math.random() * .5 + .15,
        c: ['#5b8fa8','#7c6fa0','#c9a84c','#7aab6e'][Math.floor(Math.random()*4)]
      });
    }
  }

  function draw() {
    if (state.tabHidden) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellSize = 100;
    const grid = {};
    particles.forEach((p, i) => {
      p.x = (p.x + p.vx + canvas.width)  % canvas.width;
      p.y = (p.y + p.vy + canvas.height) % canvas.height;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.c + Math.floor(p.a*255).toString(16).padStart(2,'0');
      ctx.fill();
      const gx = Math.floor(p.x / cellSize), gy = Math.floor(p.y / cellSize);
      for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) {
        const key = `${gx+dx},${gy+dy}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(i);
      }
    });

    const checked = new Set();
    particles.forEach((p1, i) => {
      const gx = Math.floor(p1.x / cellSize), gy = Math.floor(p1.y / cellSize);
      const nearby = grid[`${gx},${gy}`] || [];
      nearby.forEach(j => {
        if (j <= i) return;
        const pk = i + '_' + j;
        if (checked.has(pk)) return;
        checked.add(pk);
        const p2 = particles[j];
        const dx = p1.x - p2.x, dy = p1.y - p2.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          const a = (1 - dist/100) * .05;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(201,168,76,${a})`;
          ctx.lineWidth = .4; ctx.stroke();
        }
      });
    });

    requestAnimationFrame(draw);
  }

  return {init, draw, resize};
})();

/* ── RIPPLE CANVAS ── */
const Ripple = (() => {
  const canvas = document.getElementById('ripple-canvas');
  const ctx    = canvas.getContext('2d');
  let rings = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function spawn(x, y, color, isVoid = false) {
    rings.push({x, y, r:0, maxR: isVoid ? 200 : 140, color,
      a:1, speed: isVoid ? 1.2 : 2, isVoid});
  }

  function tick() {
    if (state.tabHidden) { requestAnimationFrame(tick); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rings = rings.filter(r => r.a > 0.01);
    rings.forEach(ring => {
      ring.r += ring.speed;
      ring.a  = Math.max(0, 1 - ring.r / ring.maxR);
      if (ring.isVoid) {
        for (let i=0; i<3; i++) {
          const rr = ring.r - i*18;
          if (rr < 0) continue;
          ctx.beginPath(); ctx.arc(ring.x, ring.y, rr, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(74,74,90,${ring.a * .5})`;
          ctx.lineWidth = 1.5; ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI*2);
        ctx.strokeStyle = ring.color + Math.floor(ring.a * 80).toString(16).padStart(2,'0');
        ctx.lineWidth = 1.2; ctx.stroke();
      }
    });
    requestAnimationFrame(tick);
  }

  resize(); tick();
  return {spawn, resize};
})();

/* ── CONNECTION CANVAS — glowing lines between similar orbs ── */
const ConnectionCanvas = (() => {
  const canvas = document.getElementById('connection-canvas');
  const ctx    = canvas.getContext('2d');
  let orbData  = [];
  let phase    = 0;
  let animActive = false;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function setOrbs(data) { orbData = data; }

  function render() {
    if (state.currentView !== 'timeline') { animActive = false; return; }
    animActive = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    phase += 0.012;

    const field = document.getElementById('bubble-field');
    if (!field) return;
    const fieldRect = field.getBoundingClientRect();

    for (let i=0; i<orbData.length; i++) {
      for (let j=i+1; j<orbData.length; j++) {
        const a = orbData[i], b = orbData[j];
        if (a.mood !== b.mood) continue;
        const ax = a.x + fieldRect.left, ay = a.y + fieldRect.top;
        const bx = b.x + fieldRect.left, by = b.y + fieldRect.top;
        const dx = ax-bx, dy = ay-by;
        const dist = Math.sqrt(dx*dx+dy*dy);
        const maxDist = 220;
        if (dist > maxDist) continue;
        const alpha = (1 - dist/maxDist) * .22 * (0.7 + 0.3*Math.sin(phase + i));
        const color = MOOD_COLORS[a.mood];
        const grad = ctx.createLinearGradient(ax,ay,bx,by);
        grad.addColorStop(0, color + '00');
        grad.addColorStop(.5, color + Math.floor(alpha*255).toString(16).padStart(2,'0'));
        grad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4; ctx.stroke();
      }
    }
    requestAnimationFrame(() => { if(state.currentView==='timeline' && !state.tabHidden) render(); else animActive=false; });
  }

  resize();
  return {setOrbs, render, resize};
})();

/* ── BREATHING ── */
const Breathing = (() => {
  let phase = 0;
  function tick() {
    if (!state.tabHidden) {
      phase += 0.008;
      const intensity = state.echoes[0]?.intensity || 5;
      const amp = 0.008 + (intensity / 10) * 0.012;
      const scale = 1 + Math.sin(phase) * amp;
      document.documentElement.style.setProperty('--breath-scale', scale);
    }
    requestAnimationFrame(tick);
  }
  function start() { tick(); }
  return {start};
})();

/* ── WHIP CANVAS ── */
const Whip = (() => {
  const canvas = document.getElementById('whip-canvas');
  const ctx    = canvas.getContext('2d');
  const label  = document.getElementById('whip-idle-label');
  let running  = false;
  let idleMs   = 0, lastTime = Date.now();

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function resetIdle() {
    idleMs = 0; running = false;
    label.classList.remove('visible');
    canvas.style.opacity = '0';
  }

  function trigger() {
    if (running) return;
    running = true;
    canvas.style.opacity = '1';
    const cx = canvas.width/2, cy = canvas.height/2;
    let t = 0;
    function frame() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const progress = t/80;
      const alpha = Math.sin(progress*Math.PI) * .6;
      const waveAmp = 40 * Math.sin(progress*Math.PI);
      ctx.beginPath();
      for (let x=0; x<canvas.width; x+=4) {
        const y = cy + Math.sin((x/canvas.width)*Math.PI*4 + t*.1) * waveAmp;
        x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.strokeStyle = `rgba(201,168,76,${alpha*.7})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(201,168,76,.4)'; ctx.shadowBlur = 8;
      ctx.stroke(); ctx.shadowBlur = 0;
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,120);
      grd.addColorStop(0,`rgba(201,168,76,${alpha*.08})`); grd.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(cx,cy,120,0,Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();
      t++;
      if (t < 90) requestAnimationFrame(frame);
      else {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        canvas.style.opacity = '0'; running = false;
        setTimeout(resetIdle, 2000);
      }
    }
    frame();
  }

  resize(); resetIdle();
  ['mousemove','keydown','touchstart','click','scroll'].forEach(ev =>
    document.addEventListener(ev, resetIdle, {passive:true}));
  return {trigger, resize};
})();

/* ── SILENCE PARTICLES ── */
const SilenceParticles = (() => {
  const layer = document.getElementById('silence-layer');
  function spawn(silenceLevel) {
    const count = Math.floor(silenceLevel * 1.5);
    for (let i=0; i<count; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        p.className = 'sil-particle';
        const size = Math.random()*3+1;
        p.style.cssText = `
          width:${size}px;height:${size}px;background:rgba(124,111,160,.65);
          left:${Math.random()*100}%;bottom:${Math.random()*30}%;
          animation-duration:${3+Math.random()*3}s;animation-delay:${Math.random()}s;
        `;
        layer.appendChild(p);
        setTimeout(() => p.remove(), 7000);
      }, i * 120);
    }
  }
  return {spawn};
})();

/* ── GHOST LAYER ── */
const GhostLayer = (() => {
  const layer = document.getElementById('ghost-layer');
  function spawn(echo) {
    const color = MOOD_COLORS[echo.mood];
    const size  = 50 + echo.intensity * 14;
    const ghost = document.createElement('div');
    ghost.className = 'ghost-memory';
    const dur = 16 + Math.random()*18;
    ghost.style.cssText = `
      left:${Math.random()*82+9}%;width:${size}px;height:${size}px;
      background:${color};filter:blur(${size/4}px);
      animation-duration:${dur}s;animation-delay:${Math.random()*4}s;
    `;
    layer.appendChild(ghost);
    setTimeout(() => ghost.remove(), (dur+5)*1000);
  }
  function initFromEchoes(echoes) {
    echoes.slice(0,7).forEach((e,i) => setTimeout(() => spawn(e), i*1800));
  }
  return {spawn, initFromEchoes};
})();

/* ── RESIDUE & VOID PULSE ── */
function spawnResidue(x, y, color) {
  const r = document.createElement('div');
  const size = 60 + Math.random()*40;
  r.className = 'residue';
  r.style.cssText = `
    width:${size}px;height:${size}px;
    left:${x-size/2}px;top:${y-size/2}px;
    border:1.5px solid ${color}66;box-shadow:0 0 14px ${color}33;
  `;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 1500);
}

function spawnVoidPulse(x, y) {
  const size = 80, p = document.createElement('div');
  p.className = 'void-pulse';
  p.style.cssText = `width:${size}px;height:${size}px;left:${x-size/2}px;top:${y-size/2}px;`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 2200);
}

/* ── SPARKLE TRAIL ── */
function spawnSparkle(x, y, color) {
  const s = document.createElement('div');
  s.className = 'sparkle';
  const size = 3 + Math.random()*5;
  s.style.cssText = `
    width:${size}px;height:${size}px;
    left:${x-size/2}px;top:${y-size/2}px;
    background:${color};box-shadow:0 0 7px ${color};
  `;
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 800);
}

/* ── PARTICLE BURST ── */
function spawnBurst(x, y, color) {
  for (let i=0; i<14; i++) {
    const el = document.createElement('div');
    el.className = 'residue';
    const angle = (i/14)*Math.PI*2;
    const dist  = 30 + Math.random()*45;
    const size  = 4 + Math.random()*8;
    el.style.cssText = `
      width:${size}px;height:${size}px;
      left:${x + Math.cos(angle)*dist - size/2}px;
      top:${y + Math.sin(angle)*dist - size/2}px;
      background:${color};box-shadow:0 0 12px ${color};
      animation-duration:.9s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

/* ── DISSOLVE PARTICLES (orb collapse) ── */
function spawnDissolve(x, y, color) {
  for (let i=0; i<16; i++) {
    const el = document.createElement('div');
    el.className = 'dissolve-particle';
    const angle = (i/16)*Math.PI*2 + Math.random()*.3;
    const dist  = 40 + Math.random()*60;
    const size  = 3 + Math.random()*6;
    const dx = Math.cos(angle)*dist + (Math.random()-.5)*20;
    const dy = Math.sin(angle)*dist + (Math.random()-.5)*20;
    el.style.cssText = `
      width:${size}px;height:${size}px;
      left:${x-size/2}px;top:${y-size/2}px;
      background:${color};box-shadow:0 0 8px ${color}88;
      --dx:${dx}px;--dy:${dy}px;
      animation-duration:${.8+Math.random()*.5}s;
      animation-delay:${Math.random()*.12}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

/* ── IDENTITY CORE ── */
const IdentityCore = (() => {
  const canvas = document.getElementById('identity-core-canvas');
  const ctx    = canvas.getContext('2d');
  let phase    = 0, particles = [], rafId = null;

  function update() {
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2;

    if (!particles.length || Math.random() < .02) {
      particles = [];
      const mc = {};
      state.echoes.slice(0,20).forEach(e => { mc[e.mood] = (mc[e.mood]||0)+1; });
      const total = state.echoes.length || 1;
      Object.entries(mc).forEach(([mood, count], gi) => {
        const baseAngle = (gi / Object.keys(mc).length) * Math.PI*2;
        for (let k=0; k<Math.min(count*2, 10); k++) {
          const angle = baseAngle + (k/10) * Math.PI*.8 - Math.PI*.4;
          const r     = 30 + (count/total)*40 + Math.random()*25;
          particles.push({
            angle, r, baseAngle, mood,
            speed: 0.004 + Math.random()*0.003,
            size: 1.5 + Math.random()*2.5,
            alpha: 0.55 + Math.random()*.4
          });
        }
      });
      for (let i=0; i<8; i++) {
        const angle = (i/8)*Math.PI*2;
        particles.push({
          angle, r: 8+Math.random()*12, baseAngle:angle, mood:'gold',
          speed:0.008+Math.random()*0.006, size:1+Math.random()*1.5, alpha:.45+Math.random()*.3
        });
      }
    }

    if (state.tabHidden) { rafId = requestAnimationFrame(update); return; }

    ctx.clearRect(0,0,w,h);
    phase += 0.005;

    const domMood = state.echoes.length ? (() => {
      const mc2 = {};
      state.echoes.slice(0,12).forEach(e => mc2[e.mood]=(mc2[e.mood]||0)+1);
      return Object.entries(mc2).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'calm';
    })() : 'calm';
    const domColor = MOOD_COLORS[domMood];
    const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,22);
    grd.addColorStop(0,'rgba(201,168,76,.65)');
    grd.addColorStop(.5,domColor + '44');
    grd.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,22,0,Math.PI*2);
    ctx.fillStyle = grd; ctx.fill();

    const halo = ctx.createRadialGradient(cx,cy,18,cx,cy,28);
    halo.addColorStop(0,'rgba(201,168,76,.1)');
    halo.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,28,0,Math.PI*2);
    ctx.fillStyle = halo; ctx.fill();

    particles.forEach(p => {
      p.angle += p.speed;
      const px = cx + Math.cos(p.angle) * p.r;
      const py = cy + Math.sin(p.angle) * p.r;
      const color = p.mood === 'gold' ? '#c9a84c' : MOOD_COLORS[p.mood] || '#c9a84c';
      ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI*2);
      ctx.fillStyle = color + Math.floor(p.alpha*255).toString(16).padStart(2,'0');
      ctx.fill();
    });

    rafId = requestAnimationFrame(update);
  }

  update();
  return {update};
})();

/* ── IDENTITY ORB ── */
const IdentityOrb = (() => {
  const canvas = document.getElementById('identity-orb');
  const ctx    = canvas.getContext('2d');
  let phase    = 0;

  function update() {
    const w = canvas.width, h = canvas.height, cx = w/2, cy = h/2;
    ctx.clearRect(0,0,w,h);
    if (!state.echoes.length) {
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,30);
      grd.addColorStop(0,'rgba(201,168,76,.4)'); grd.addColorStop(1,'rgba(201,168,76,0)');
      ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      return;
    }
    const mc = {};
    state.echoes.slice(0,12).forEach(e => { mc[e.mood]=(mc[e.mood]||0)+1; });
    Object.entries(mc).forEach(([mood,count],i) => {
      const color = MOOD_COLORS[mood];
      const angle = (i/Object.keys(mc).length)*Math.PI*2 + phase;
      const ox = cx + Math.cos(angle)*7, oy = cy + Math.sin(angle)*7;
      const r  = 18 + count*4;
      const grd = ctx.createRadialGradient(ox,oy,0,ox,oy,r);
      grd.addColorStop(0,color+'cc'); grd.addColorStop(1,color+'00');
      ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2);
      ctx.fillStyle=grd; ctx.fill();
    });
    phase += .003;
  }

  function tick() {
    if (!state.tabHidden) update();
    requestAnimationFrame(tick);
  }
  tick();
  return {update};
})();

/* ── INTERACTIVE ORBS (physics + drift + collapse) ── */
const OrbInteraction = (() => {
  let orbs = [];
  let dragOrb = null;
  let dragOffX = 0, dragOffY = 0;
  let animId = null;

  function register(el, x, y, size, color, id) {
    const orb = { el, x, y, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
      baseX:x, baseY:y, size, color, id, held:false, lastTap:0, tapCount:0,
      scale:1, targetScale:1, pressed:false,
      driftPhase: Math.random()*Math.PI*2,
      driftSpeed: 0.003 + Math.random()*0.003 };
    orbs.push(orb);

    el.addEventListener('pointerdown', e => onDown(e, orb), {passive:true});
    el.addEventListener('dblclick',    e => onDblClick(e, orb));
    return orb;
  }

  function onDown(e, orb) {
    dragOrb = orb;
    dragOffX = e.clientX - orb.x;
    dragOffY = e.clientY - orb.y;
    orb.held = true;
    orb.pressed = true;
    orb.targetScale = 0.87;
    orb.vx = 0; orb.vy = 0;
    el_setTransform(orb);

    orb._holdTimer = setTimeout(() => {
      if (orb.held) { orb.targetScale = 0.72; }
    }, 400);

    const upFn = () => {
      clearTimeout(orb._holdTimer);
      orb.held = false; orb.pressed = false;
      dragOrb = null;
      const now = Date.now();
      if (now - orb.lastTap < 300) { orb.tapCount++; } else { orb.tapCount = 1; }
      orb.lastTap = now;
      orb.targetScale = 1.14;
      setTimeout(() => { orb.targetScale = 1; }, 220);
      const angle = Math.atan2(orb.vy, orb.vx) || Math.random()*Math.PI*2;
      orb.vx += Math.cos(angle)*1.5;
      orb.vy += Math.sin(angle)*1.5;
      document.removeEventListener('pointerup', upFn);
      document.removeEventListener('pointermove', moveFn);
    };
    const moveFn = (ev) => {
      if (!orb.held) return;
      const tx = ev.clientX - dragOffX;
      const ty = ev.clientY - dragOffY;
      orb.vx += (tx - orb.x) * 0.18;
      orb.vy += (ty - orb.y) * 0.18;
      orb.vx *= 0.6; orb.vy *= 0.6;
      if (Math.random() < .15) spawnSparkle(ev.clientX, ev.clientY, orb.color);
    };
    document.addEventListener('pointerup',   upFn,   {once:true});
    document.addEventListener('pointermove', moveFn, {passive:true});
  }

  function onDblClick(e, orb) {
    const rect = orb.el.getBoundingClientRect();
    spawnBurst(rect.left+rect.width/2, rect.top+rect.height/2, orb.color);
    orb.targetScale = 1.28;
    setTimeout(() => orb.targetScale = 1, 360);
  }

  function el_setTransform(orb) {
    orb.el.style.left = (orb.x - orb.size/2) + 'px';
    orb.el.style.top  = (orb.y - orb.size/2) + 'px';
    const bubble = orb.el.querySelector('.echo-bubble');
    if (bubble) {
      bubble.style.transform = `scale(${orb.scale})`;
      bubble.style.transition = orb.held ? 'transform .1s' : 'transform .35s var(--ease)';
    }
  }

  function checkMerge() {
    for (let i=0; i<orbs.length; i++) {
      for (let j=i+1; j<orbs.length; j++) {
        const a = orbs[i], b = orbs[j];
        if (a.held || b.held) continue;
        const dx = a.x-b.x, dy = a.y-b.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        const minD = (a.size+b.size)*0.3;
        if (dist < minD) {
          const force = (minD-dist)/minD * 0.8;
          const nx = dx/dist||0, ny = dy/dist||0;
          a.vx += nx*force; a.vy += ny*force;
          b.vx -= nx*force; b.vy -= ny*force;
        }
      }
    }
  }

  function tick() {
    const field = document.getElementById('bubble-field');
    if (!field || state.currentView !== 'timeline') {
      animId = requestAnimationFrame(tick); return;
    }
    const fw = field.offsetWidth, fh = field.offsetHeight;
    const rect = field.getBoundingClientRect();

    if (!state.tabHidden) {
      const t = Date.now() * 0.0005;
      orbs.forEach(orb => {
        if (orb.held) return;
        orb.vx *= 0.97; orb.vy *= 0.97;
        // Gentle drift using per-orb phase
        orb.driftPhase += orb.driftSpeed;
        orb.vx += Math.sin(orb.driftPhase * 0.7) * 0.014;
        orb.vy += Math.cos(orb.driftPhase * 0.5) * 0.014;
        orb.x += orb.vx; orb.y += orb.vy;
        const r = orb.size/2 + 4;
        if (orb.x - r < 0)     { orb.x = r;    orb.vx *= -.55; }
        if (orb.x + r > fw)    { orb.x = fw-r; orb.vx *= -.55; }
        if (orb.y - r < 0)     { orb.y = r;    orb.vy *= -.55; }
        if (orb.y + r > fh)    { orb.y = fh-r; orb.vy *= -.55; }
        orb.scale += (orb.targetScale - orb.scale) * 0.15;
        el_setTransform(orb);
      });
      checkMerge();
      ConnectionCanvas.setOrbs(orbs.map(o => ({x:o.x, y:o.y, mood:o._mood})));
    }
    animId = requestAnimationFrame(tick);
  }

  function clear() { orbs = []; if(animId) cancelAnimationFrame(animId); }
  function start() { tick(); }

  start();
  return {register, clear};
})();

/* ── ENTRY FORM ── */
const EntryForm = (() => {
  let voidMode = false, selectedMood = null;
  const intensitySlider = document.getElementById('intensity-slider');
  const intensityVal    = document.getElementById('intensity-val');
  const silenceSlider   = document.getElementById('silence-slider');
  const silenceVal      = document.getElementById('silence-val');
  const thoughtInput    = document.getElementById('thought-input');
  const voidToggle      = document.getElementById('void-toggle');
  const formWrap        = document.getElementById('entry-form-wrap');
  const confirmEl       = document.getElementById('echo-confirm');

  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
      const rect = btn.getBoundingClientRect();
      spawnResidue(rect.left+rect.width/2, rect.top+rect.height/2, MOOD_COLORS[selectedMood]);
    });
  });

  intensitySlider.addEventListener('input', function() {
    intensityVal.textContent = this.value;
    this.setAttribute('aria-valuenow', this.value);
  });
  silenceSlider.addEventListener('input', function() {
    silenceVal.textContent = this.value;
    this.setAttribute('aria-valuenow', this.value);
    if (parseInt(this.value) >= 7) SilenceParticles.spawn(parseInt(this.value));
  });

  function toggleVoid() {
    voidMode = !voidMode;
    voidToggle.classList.toggle('active', voidMode);
    voidToggle.setAttribute('aria-checked', voidMode);
    thoughtInput.disabled = voidMode;
    thoughtInput.style.opacity = voidMode ? '.3' : '1';
    if (voidMode) thoughtInput.value = '';
  }
  voidToggle.addEventListener('click', toggleVoid);
  voidToggle.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleVoid();}});

  document.getElementById('submit-btn').addEventListener('click', submit);

  function submit() {
    if (!selectedMood) {
      const grid = document.querySelector('.mood-grid');
      grid.style.transition = 'none';
      grid.style.transform  = 'translateX(-5px)';
      setTimeout(() => { grid.style.transform = 'translateX(5px)'; setTimeout(() => { grid.style.transform=''; grid.style.transition=''; }, 80); }, 80);
      Toast.show('Choose an emotional resonance first.');
      return;
    }
    const echo = {
      id: Date.now(),
      mood: selectedMood,
      intensity: parseInt(intensitySlider.value),
      silence:   parseInt(silenceSlider.value),
      thought:   voidMode ? null : thoughtInput.value.trim() || null,
      void:      voidMode,
      date:      new Date().toISOString()
    };
    state.echoes.unshift(echo);
    Storage.save(state.echoes);

    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    Ripple.spawn(cx, cy, MOOD_COLORS[echo.mood], echo.void);
    if (echo.void) spawnVoidPulse(cx, cy);
    spawnBurst(cx, cy, MOOD_COLORS[echo.mood]);
    GhostLayer.spawn(echo);
    SilenceParticles.spawn(echo.silence);
    Weather.update(); IdentityOrb.update(); IdentityCore.update();
    RandomReflection.maybeSurface();

    const confirmCanvas = document.getElementById('confirm-orb');
    const cCtx = confirmCanvas.getContext('2d');
    const cc = 50, color = MOOD_COLORS[echo.mood];
    cCtx.clearRect(0,0,100,100);
    const grd = cCtx.createRadialGradient(cc,cc,0,cc,cc,cc);
    grd.addColorStop(0,color+'ee'); grd.addColorStop(1,color+'00');
    cCtx.beginPath(); cCtx.arc(cc,cc,cc,0,Math.PI*2);
    cCtx.fillStyle = grd; cCtx.fill();
    document.getElementById('confirm-sub').textContent = {
      calm:'A pocket of stillness, preserved forever.',
      chaos:'Your electric charge — crystallized.',
      reflective:'A mirror of your inner world, kept safe.',
      anxious:'The trembling, held gently in glass.',
      joyful:'Sunlight, caught and kept.',
      empty:'The silence, honored and real.'
    }[echo.mood] || 'Your feeling has been woven into the universe.';

    formWrap.style.display = 'none';
    confirmEl.classList.add('show');
  }

  function reset() {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    selectedMood = null; voidMode = false;
    intensitySlider.value = '5'; intensityVal.textContent = '5';
    silenceSlider.value   = '3'; silenceVal.textContent   = '3';
    thoughtInput.value = ''; thoughtInput.disabled = false; thoughtInput.style.opacity = '1';
    voidToggle.classList.remove('active'); voidToggle.setAttribute('aria-checked','false');
    formWrap.style.display = 'block'; confirmEl.classList.remove('show');
  }

  document.getElementById('new-echo-btn').addEventListener('click', () => { reset(); Nav.show('entry'); });
  return {reset};
})();

/* ── TIMELINE / BUBBLE SYSTEM ── */
const Timeline = (() => {
  const field    = document.getElementById('bubble-field');
  const emptyEl  = document.getElementById('timeline-empty');
  const subtitle = document.getElementById('timeline-subtitle');
  let focusedId  = null;

  function render() {
    field.innerHTML = '';
    OrbInteraction.clear();

    if (!state.echoes.length) {
      emptyEl.style.display = 'block'; field.style.display = 'none'; return;
    }
    emptyEl.style.display = 'none'; field.style.display = 'block';
    subtitle.textContent = `${state.echoes.length} echo${state.echoes.length!==1?'s':''} in your cosmos`;

    const fieldW = field.offsetWidth || window.innerWidth - 64;
    const fieldH = Math.max(560, state.echoes.length * 34);
    field.style.height = fieldH + 'px';

    const placed = [];

    state.echoes.forEach((echo, i) => {
      const color    = MOOD_COLORS[echo.mood];
      const baseSize = 74 + echo.intensity * 5;
      const ageFactor = Math.max(.5, 1 - i * .025);
      const size     = Math.round(baseSize * ageFactor);

      let x, y, tries = 0;
      do {
        x = Math.random() * (fieldW - size - 12) + size/2;
        y = Math.random() * (fieldH - size - 12) + size/2;
        tries++;
      } while (tries < 30 && placed.some(p => {
        const dx = p.x-x, dy = p.y-y;
        return Math.sqrt(dx*dx+dy*dy) < (p.r+size/2+14);
      }));
      placed.push({x, y, r:size/2, mood:echo.mood});

      // Gravity ring for top 3
      if (i < 3) {
        const ring = document.createElement('div');
        ring.className = 'gravity-ring';
        ring.style.cssText = `
          width:${size*2.3}px;height:${size*2.3}px;
          left:${x-size*1.15}px;top:${y-size*1.15}px;
          animation-delay:${i*.4}s;
        `;
        field.appendChild(ring);
      }

      const wrap = document.createElement('div');
      wrap.className = 'bubble-wrap';
      wrap.dataset.id = echo.id;
      wrap.style.cssText = `left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;`;

      const shadow = document.createElement('div');
      shadow.className = 'bubble-shadow';
      shadow.style.background = `radial-gradient(circle, ${color}66, transparent 70%)`;

      const bubble = document.createElement('div');
      bubble.className = 'echo-bubble';
      const floatIdx = i % 3;
      const opacity  = Math.max(.45, ageFactor);
      const depthScale = 0.87 + (ageFactor * 0.13);
      bubble.style.cssText = `
        width:${size}px;height:${size}px;
        background:radial-gradient(circle at 32% 32%, ${color}e0, ${color}60);
        box-shadow:0 0 ${echo.intensity*5}px ${color}55,inset 0 1px 0 rgba(255,255,255,.22);
        opacity:${opacity};
        animation:bubbleFloat${floatIdx} ${3+i%3}s ease-in-out infinite;
        animation-delay:${(i%8)*.25}s;
        transform:scale(${depthScale});
        transform-origin:center;
      `;
      if (i > 8) bubble.style.filter = `blur(${Math.min(2,(i-8)*.22)}px)`;

      bubble.innerHTML = `
        <div class="node-int">${echo.intensity}</div>
        <div class="node-mood">${echo.mood}</div>
        <div class="node-date">${formatDateShort(echo.date)}</div>
      `;

      wrap.appendChild(shadow);
      wrap.appendChild(bubble);

      wrap.addEventListener('click', (e) => {
        if (Math.abs(e.movementX||0) > 5 || Math.abs(e.movementY||0) > 5) return;
        const rect = wrap.getBoundingClientRect();
        spawnResidue(rect.left+rect.width/2, rect.top+rect.height/2, color);
        if (echo.void) spawnVoidPulse(rect.left+rect.width/2, rect.top+rect.height/2);
        openDetail(echo);
        handleFocus(wrap);
      });

      field.appendChild(wrap);

      const orb = OrbInteraction.register(wrap, x, y, size, color, echo.id);
      orb._mood = echo.mood;
    });

    // Feed connection canvas
    ConnectionCanvas.setOrbs(placed.map(p => ({x:p.x, y:p.y, mood:p.mood})));
    ConnectionCanvas.render();

    document.getElementById('timeline-tide-label').textContent =
      (() => { const h = new Date().getHours(); return (h>=22||h<5)?'🌊 memory tide active':''; })();
  }

  function handleFocus(clickedWrap) {
    const allWraps = field.querySelectorAll('.bubble-wrap');
    if (focusedId === clickedWrap.dataset.id) {
      allWraps.forEach(w => w.classList.remove('faded','focused'));
      focusedId = null;
    } else {
      allWraps.forEach(w => {
        w.classList.toggle('faded',  w !== clickedWrap);
        w.classList.toggle('focused', w === clickedWrap);
      });
      focusedId = clickedWrap.dataset.id;
    }
  }

  function openDetail(echo) {
    const panel = document.getElementById('node-detail');
    const color = MOOD_COLORS[echo.mood];
    document.getElementById('detail-badge').textContent = `${MOOD_EMOJIS[echo.mood]} ${echo.mood}`;
    document.getElementById('detail-badge').style.background = color;
    document.getElementById('detail-int').textContent = echo.intensity;
    document.getElementById('detail-int').style.color = color;
    const thoughtEl = document.getElementById('detail-thought');
    if (echo.void || !echo.thought) {
      thoughtEl.innerHTML = '<span class="detail-void-note">[ void entry — no words, only feeling ]</span>';
    } else {
      thoughtEl.textContent = `"${echo.thought}"`;
    }
    const silence = echo.silence || 1;
    document.getElementById('detail-meta').innerHTML = `
      ${formatDate(echo.date)}<br>
      Silence level: ${silence}/10 · ${echo.void ? 'void mode' : 'spoken'}
    `;
    panel.classList.add('open');
  }

  return {render};
})();

/* ── WRAPPED ── */
const Wrapped = (() => {
  const contentEl = document.getElementById('wrapped-content');
  const emptyEl   = document.getElementById('wrapped-empty');
  const canvas    = document.getElementById('wrapped-cinematic-canvas');
  const sceneLabel= document.getElementById('wrapped-scene-label');
  const sceneTitle= document.getElementById('wrapped-scene-title');
  const sceneCopy = document.getElementById('wrapped-scene-copy');
  const miniStats = document.getElementById('wrapped-stats-mini');
  const soundtrackSpace = document.getElementById('wrapped-soundtrack-space');
  const replayBtn = document.getElementById('wrapped-replay-btn');
  const ctx = canvas.getContext('2d');
  let raf = null;
  let phase = 0;
  let startedAt = 0;
  let cinematicData = null;
  const duration = 36000;

  replayBtn.addEventListener('click', () => {
    if (!cinematicData) return;
    startedAt = performance.now();
  });

  function filterEchoes() {
    if (state.wrappedPeriod==='week')  return state.echoes.filter(e=>Date.now()-new Date(e.date)<7*86400000);
    if (state.wrappedPeriod==='month') return state.echoes.filter(e=>Date.now()-new Date(e.date)<30*86400000);
    return state.echoes;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function prepParticles(count, spread = 1) {
    return Array.from({length:count}, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * spread,
      size: 0.5 + Math.random() * 2.7
    }));
  }

  function drawSky(grad, t, sceneT) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, grad[0]);
    bg.addColorStop(1, grad[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,w,h);
    cinematicData.far.forEach((p,i) => {
      const z = (p.z + t * 0.015 + i * 0.0003) % 1;
      const speed = 0.12 + (1-z) * 0.9;
      const x = (p.x * w + Math.sin(t + i) * 12) % (w + 20);
      const y = (p.y * h + t * speed * 18) % (h + 20);
      ctx.fillStyle = `rgba(255,255,255,${0.16 + (1-z)*0.35})`;
      ctx.beginPath();
      ctx.arc(x,y,p.size * (2-z),0,Math.PI*2);
      ctx.fill();
    });
    ctx.fillStyle = `rgba(255,255,255,${0.22 + sceneT * 0.35})`;
    ctx.font = '500 20px Georgia, serif';
    ctx.fillText('you are moving, not switching', 20 + Math.sin(t*0.9)*6, h * 0.3);
  }

  function drawCoreEmotion(color, t, sceneT) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const cx = w * 0.5 + Math.sin(t * 0.45) * 24;
    const cy = h * 0.48 + Math.cos(t * 0.38) * 18;
    const r = 65 + Math.sin(t * 2.2) * 7 + sceneT * 10;
    const orb = ctx.createRadialGradient(cx - r*0.2, cy - r*0.25, r*0.12, cx, cy, r*1.65);
    orb.addColorStop(0, `${color}dd`);
    orb.addColorStop(0.65, `${color}55`);
    orb.addColorStop(1, 'rgba(20,20,30,.05)');
    ctx.fillStyle = orb;
    ctx.beginPath(); ctx.arc(cx, cy, r*1.5, 0, Math.PI * 2); ctx.fill();
    for (let i=0;i<32;i++) {
      const a = t * (0.3 + i*0.02) + i;
      const rr = r + 50 + (i % 4) * 9;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a*1.2) * rr * 0.65;
      ctx.fillStyle = `rgba(255,255,255,${0.1 + (i%5)/20})`;
      ctx.beginPath(); ctx.arc(px, py, 1.3 + (i%3), 0, Math.PI*2); ctx.fill();
    }
  }

  function drawIdentityFormation(t, sceneT) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const center = {x: w*0.35 + Math.sin(t*0.3)*16, y: h*0.52};
    const points = 52;
    for (let i=0;i<points;i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = 110 + Math.sin(i + t) * 30;
      const tx = center.x + Math.cos(angle) * radius * 0.65;
      const ty = center.y + Math.sin(angle) * radius * 0.95;
      const sx = (i * 27 % w);
      const sy = (i * 53 % h);
      const mix = Math.min(1, sceneT * 1.2);
      const px = sx * (1-mix) + tx * mix;
      const py = sy * (1-mix) + ty * mix;
      ctx.fillStyle = `rgba(201,168,76,${0.16 + mix * 0.5})`;
      ctx.beginPath(); ctx.arc(px, py, 1.5 + (i%4)*0.5,0,Math.PI*2); ctx.fill();
    }
  }

  function drawSoundtrackField(t, sceneT) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    cinematicData.tracks.slice(0,4).forEach((_, i) => {
      const depth = i / 4;
      const cardW = 130 - depth * 24;
      const cardH = 76 - depth * 10;
      const x = w * (0.62 + depth * 0.2) + Math.sin(t + i) * 12;
      const y = h * (0.25 + depth * 0.17) + Math.cos(t*1.4 + i) * 7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((-0.22 + i * 0.1) + Math.sin(t + i)*0.02);
      ctx.globalAlpha = 0.26 + sceneT * 0.5 - depth * 0.12;
      ctx.fillStyle = 'rgba(255,255,255,.13)';
      ctx.fillRect(-cardW/2, -cardH/2, cardW, cardH);
      ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.strokeRect(-cardW/2, -cardH/2, cardW, cardH);
      ctx.restore();
    });
  }

  function currentScene(progress) {
    if (progress < 0.25) return {id:'sky', index:0, local:progress/0.25};
    if (progress < 0.5)  return {id:'core', index:1, local:(progress-0.25)/0.25};
    if (progress < 0.75) return {id:'identity', index:2, local:(progress-0.5)/0.25};
    return {id:'soundtrack', index:3, local:(progress-0.75)/0.25};
  }

  function animate(now) {
    if (!cinematicData || state.currentView !== 'wrapped') return;
    if (!startedAt) startedAt = now;
    const elapsed = now - startedAt;
    const progress = (elapsed % duration) / duration;
    const scene = currentScene(progress);
    const t = now * 0.0018;
    phase += 0.01;
    drawSky(cinematicData.grad, t, scene.id === 'sky' ? scene.local : 0.12);
    drawCoreEmotion(cinematicData.color, t, scene.id === 'core' ? scene.local : 0.15);
    drawIdentityFormation(t, scene.id === 'identity' ? scene.local : 0.18);
    drawSoundtrackField(t, scene.id === 'soundtrack' ? scene.local : 0.1);

    const sceneMap = [
      ['Emotional Sky', 'Drifting through your emotional universe', `Dominant frequency: ${cinematicData.dominant}. Distant feelings move slowly, near feelings surge faster.`],
      ['Core Emotion', `${MOOD_EMOJIS[cinematicData.dominant]} ${cinematicData.dominant} is your center of gravity`, 'The core entity pulses and subtly distorts as your recent intensity rises and falls.'],
      ['Identity Formation', cinematicData.archetype, 'Fragments converge in layered depth, building a living identity in front of you.'],
      ['Soundtrack Space', 'Your emotional soundtrack in orbit', 'Tracks hover across foreground and background layers. Focus draws one card forward while others recede.']
    ];
    const [label,title,copy] = sceneMap[scene.index];
    sceneLabel.textContent = label;
    sceneTitle.textContent = title;
    sceneCopy.textContent = copy;

    raf = requestAnimationFrame(animate);
  }

  function renderSoundtrackCards(tracks) {
    soundtrackSpace.innerHTML = tracks.slice(0,4).map((track, i) => `
      <a class="soundtrack-card-3d" style="transform:translateZ(${30 - i*12}px) translateX(${i*6}px) rotateY(${-11 + i*6}deg);opacity:${1 - i*0.16}" href="${track.spotify}" target="_blank" rel="noopener noreferrer">
        <div class="soundtrack-meta">${track.artist}</div>
        <div class="soundtrack-song">${track.song}</div>
      </a>
    `).join('');
  }

  function render() {
    const filtered = filterEchoes();
    if (!filtered.length) {
      cancelAnimationFrame(raf);
      emptyEl.style.display='block'; contentEl.style.display='none'; return;
    }
    emptyEl.style.display='none'; contentEl.style.display='block';
    const moodCounts = {};
    let totalInt = 0;
    filtered.forEach(e => { moodCounts[e.mood]=(moodCounts[e.mood]||0)+1; totalInt+=e.intensity; });
    const sorted   = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1]);
    const dominant = sorted[0];
    const avgInt   = (totalInt/filtered.length).toFixed(1);
    const chaos    = Math.round(((moodCounts.chaos||0)+(moodCounts.anxious||0))/filtered.length*100);
    const voidCnt  = filtered.filter(e=>e.void).length;
    const dominantMood = dominant[0];
    const tracks = SOUNDPRINTS[dominantMood] || [];
    miniStats.innerHTML = `
      <div class="wrapped-stat-pill">${filtered.length} echoes</div>
      <div class="wrapped-stat-pill">avg intensity ${avgInt}</div>
      <div class="wrapped-stat-pill">${chaos}% chaos / ${100-chaos}% stability</div>
      <div class="wrapped-stat-pill">${voidCnt} void entries</div>
    `;
    renderSoundtrackCards(tracks);
    cinematicData = {
      dominant: dominantMood,
      archetype: getArchetype(moodCounts),
      color: MOOD_COLORS[dominantMood],
      grad: [
        `rgba(12,18,32,1)`,
        `${MOOD_COLORS[dominantMood]}22`
      ],
      far: prepParticles(70, 1),
      tracks
    };
    resizeCanvas();
    cancelAnimationFrame(raf);
    startedAt = performance.now();
    raf = requestAnimationFrame(animate);
  }

  function resize() {
    if (state.currentView === 'wrapped' && cinematicData) resizeCanvas();
  }

  return {render, resize};
})();

/* ── WEATHER ── */
const Weather = (() => {
  function update() {
    const h = new Date().getHours();
    const recent = state.echoes.slice(0,7);
    if (!recent.length) {
      const tw = h<6?['🌑','The void hour. Deep stillness.']:h<12?['🌤','Morning potential.']:h<17?['☀️','Midday clarity.']:h<21?['🌆','Golden hour feelings.']:['🌙','Night reflections.'];
      document.getElementById('weather-emoji').textContent = tw[0];
      document.getElementById('weather-text').textContent  = tw[1];
      return;
    }
    const mc = {}; let si = 0;
    recent.forEach(e => { mc[e.mood]=(mc[e.mood]||0)+1; si+=e.intensity; });
    const dom = Object.entries(mc).sort((a,b)=>b[1]-a[1])[0][0];
    const avg = si/recent.length;
    const map = {
      calm:      avg>6?['🌊','Deep calm — a still ocean.']:['🌫️','Soft fog and quiet thoughts.'],
      chaos:     avg>7?['⛈️',"Full storm. You're in it."]:['🌩️','Thunder in the distance.'],
      reflective:['🌙','Reflective skies. Turning inward.'],
      anxious:   avg>6?['🌀','Turbulence. Hold on.']:['💨','Restless winds.'],
      joyful:    ['🌸','Clear skies, soft light.'],
      empty:     ['🌑','The quiet dark. It passes.']
    };
    const w = map[dom]||['☁️','Processing…'];
    document.getElementById('weather-emoji').textContent = w[0];
    document.getElementById('weather-text').textContent  = w[1];
  }
  return {update};
})();

/* ── RANDOM REFLECTION DROP ── */
const RandomReflection = (() => {
  let el = null;

  function maybeSurface() {
    if (!state.echoes.length || state.echoes.length < 2) return;
    if (Math.random() > 0.4) return;
    const latest = state.echoes[0];
    const similar = state.echoes.slice(1).filter(e => e.mood === latest.mood);
    if (!similar.length) return;
    const past = similar[Math.floor(Math.random()*similar.length)];
    show(past);
  }

  function show(echo) {
    remove();
    el = document.createElement('div');
    el.className = 'reflection-drop';
    el.innerHTML = `
      <button class="reflection-drop-close" aria-label="Dismiss">×</button>
      <div class="reflection-drop-label">✦ past resonance — ${formatDateShort(echo.date)}</div>
      <div class="reflection-drop-text">${echo.thought ? `"${echo.thought.substring(0,80)}${echo.thought.length>80?'…':''}"` : `A ${echo.mood} moment, intensity ${echo.intensity}.`}</div>
    `;
    document.body.appendChild(el);
    el.querySelector('.reflection-drop-close').addEventListener('click', remove);
    el.addEventListener('click', () => { Nav.show('timeline'); remove(); });
    setTimeout(remove, 8000);
  }

  function remove() {
    if (el) { el.remove(); el = null; }
  }

  return {maybeSurface};
})();

/* ── MIDNIGHT MODE ── */
const MidnightMode = (() => {
  const hintEl = document.getElementById('midnight-hint');
  function check() {
    const h = new Date().getHours();
    const on = h >= 22 || h < 4;
    document.body.classList.toggle('midnight', on);
    hintEl.textContent = on ? '🌙 midnight mind — the honest hour' : '';
  }
  check(); setInterval(check, 60000);
  return {check};
})();

/* ── SHATTER SOFTLY ── */
const ShatterSoftly = (() => {
  let canvas, ctx, cracks = [], shattered = false, tapCount = 0;
  const W = 240, H = 240;

  function init() {
    canvas = document.getElementById('shatter-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    cracks = []; shattered = false; tapCount = 0;
    draw();

    canvas.addEventListener('pointerdown', onTap);
    canvas.addEventListener('touchstart', e => e.preventDefault(), {passive:false});

    document.getElementById('shatter-reset-btn')?.addEventListener('click', () => {
      cracks = []; shattered = false; tapCount = 0;
      document.getElementById('shatter-aftermath').classList.remove('show');
      document.getElementById('shatter-hint').style.display = '';
      draw();
    });
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Object surface — ceramic plate look
    const progress = Math.min(tapCount / 12, 1);
    const surfaceAlpha = 0.92 - progress * 0.3;

    // Background glow
    const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.52);
    glow.addColorStop(0, `rgba(200,190,255,${0.06 - progress*0.04})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Main plate
    const plateGrd = ctx.createRadialGradient(W/2 - 20, H/2 - 20, 0, W/2, H/2, W * 0.44);
    plateGrd.addColorStop(0, `rgba(230,225,245,${surfaceAlpha})`);
    plateGrd.addColorStop(0.55, `rgba(200,195,225,${surfaceAlpha * 0.9})`);
    plateGrd.addColorStop(1, `rgba(160,150,200,${surfaceAlpha * 0.7})`);
    ctx.beginPath();
    ctx.ellipse(W/2, H/2, 90, 85, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = plateGrd;
    ctx.fill();

    // Plate rim
    ctx.beginPath();
    ctx.ellipse(W/2, H/2, 90, 85, -0.1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 - progress * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner highlight
    ctx.beginPath();
    ctx.ellipse(W/2 - 18, H/2 - 18, 38, 32, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.18 - progress * 0.12})`;
    ctx.fill();

    // Draw cracks
    cracks.forEach(crack => {
      drawCrack(crack);
    });

    // Shatter dissolve
    if (shattered) {
      drawShatter();
    }
  }

  function drawCrack(crack) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(crack.x, crack.y);
    let cx = crack.x, cy = crack.y;
    crack.segments.forEach(seg => {
      cx += seg.dx; cy += seg.dy;
      ctx.lineTo(cx, cy);
    });
    const alpha = 0.6 + crack.depth * 0.2;
    ctx.strokeStyle = `rgba(80,60,120,${alpha})`;
    ctx.lineWidth = 0.8 + crack.depth * 0.4;
    ctx.shadowColor = 'rgba(100,80,160,0.5)';
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.restore();

    // Branch cracks
    if (crack.branches) {
      crack.branches.forEach(b => drawCrack(b));
    }
  }

  function drawShatter() {
    const progress = Math.min((Date.now() - shattered) / 2200, 1);
    // Fragments drifting and fading
    cracks.slice(0, 8).forEach((crack, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const drift = progress * (30 + i * 8);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress * 1.3);
      ctx.translate(
        W/2 + Math.cos(angle) * drift,
        H/2 + Math.sin(angle) * drift
      );
      ctx.rotate(angle * 0.3 + progress * 0.5);
      const size = 18 - progress * 14;
      if (size > 0) {
        const fg = ctx.createRadialGradient(0,0,0,0,0,size);
        fg.addColorStop(0, 'rgba(210,205,240,0.9)');
        fg.addColorStop(1, 'rgba(180,170,220,0.3)');
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = fg;
        ctx.fill();
      }
      ctx.restore();
    });
    if (progress < 1) requestAnimationFrame(draw);
  }

  function makeCrack(ox, oy, depth, spread) {
    const segs = [];
    let angle = Math.random() * Math.PI * 2;
    const len = 18 + Math.random() * 24;
    const steps = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < steps; i++) {
      angle += (Math.random() - 0.5) * 0.7;
      const segLen = len / steps;
      segs.push({ dx: Math.cos(angle) * segLen, dy: Math.sin(angle) * segLen });
    }
    const crack = { x: ox, y: oy, segments: segs, depth: depth || 1 };
    if (depth < 2 && Math.random() > 0.4) {
      const branchCount = 1 + Math.floor(Math.random() * 2);
      crack.branches = [];
      for (let b = 0; b < branchCount; b++) {
        const prog = Math.floor(Math.random() * segs.length);
        let bx = ox, by = oy;
        for (let s = 0; s < prog; s++) { bx += segs[s].dx; by += segs[s].dy; }
        crack.branches.push(makeCrack(bx, by, depth + 1, spread * 0.6));
      }
    }
    return crack;
  }

  function onTap(e) {
    if (shattered) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Only crack within the plate area
    const dx = px - W/2, dy = py - H/2;
    const inPlate = (dx*dx)/(90*90) + (dy*dy)/(85*85) <= 1.2;

    if (!inPlate) {
      // Still add a crack from center direction
      const angle = Math.atan2(dy, dx);
      const ex = W/2 + Math.cos(angle) * 60, ey = H/2 + Math.sin(angle) * 60;
      cracks.push(makeCrack(ex, ey, 1));
    } else {
      cracks.push(makeCrack(px, py, 1));
      // Extra cracks from center for held taps
      if (tapCount > 4) {
        const angle2 = Math.random() * Math.PI * 2;
        const r = Math.random() * 50;
        cracks.push(makeCrack(W/2 + Math.cos(angle2)*r, H/2 + Math.sin(angle2)*r, 1));
      }
    }

    tapCount++;
    const hint = document.getElementById('shatter-hint');
    if (hint) {
      if (tapCount === 1) hint.textContent = 'keep going…';
      else if (tapCount < 5) hint.textContent = 'let it crack…';
      else if (tapCount < 10) hint.textContent = 'almost…';
      else hint.textContent = 'one more…';
    }

    draw();

    if (tapCount >= 12) {
      triggerShatter();
    }
  }

  function triggerShatter() {
    shattered = Date.now();
    const hint = document.getElementById('shatter-hint');
    if (hint) hint.style.display = 'none';
    draw();
    setTimeout(() => {
      ctx.clearRect(0, 0, W, H);
      const aftermath = document.getElementById('shatter-aftermath');
      if (aftermath) aftermath.classList.add('show');
      // Show song suggestion
      const songEl = document.getElementById('shatter-song-here');
      if (songEl) {
        const mood = state.echoes[0]?.mood || 'reflective';
        const tracks = SOUNDPRINTS[mood];
        const track = tracks[Math.floor(Math.random() * tracks.length)];
        const color = MOOD_COLORS[mood];
        songEl.innerHTML = `
          <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;opacity:.8">✦ something to listen to</div>
          <div style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;align-items:stretch;max-width:380px;margin:0 auto">
            <div style="width:64px;flex-shrink:0;background:linear-gradient(135deg,${color}55,${color}18);display:flex;align-items:center;justify-content:center;font-size:28px">${MOOD_COVER_EMOJI[mood]}</div>
            <div style="padding:14px 16px;flex:1;text-align:left">
              <div style="font-size:15px;color:var(--text);font-weight:600;margin-bottom:2px">${track.song}</div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">${track.artist}</div>
              <div style="display:flex;gap:8px">
                <a href="${track.spotify}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;font-family:var(--font-mono);font-size:9px;text-decoration:none;letter-spacing:.08em;color:#1db954;border:1px solid rgba(29,185,84,.45);background:rgba(29,185,84,.1)">▶ Spotify</a>
                <a href="${track.youtube}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;font-family:var(--font-mono);font-size:9px;text-decoration:none;letter-spacing:.08em;color:#ff5555;border:1px solid rgba(255,68,68,.4);background:rgba(255,68,68,.08)">▶ YouTube</a>
              </div>
            </div>
          </div>`;
      }
    }, 2200);
  }

  return { init };
})();

/* ── FUN RITUALS ── */
const Rituals = (() => {
  const modal   = document.getElementById('fun-modal');
  const content = document.getElementById('fun-modal-content');
  let receiptTheme = 'classic';

  function open(type) {
    const builders = {receipt:buildReceipt, dna:buildDNA, crash:buildCrash, sound:buildSound, vsvs:buildConflict, shatter:buildShatter};
    const fn = builders[type];
    if (fn) { content.innerHTML = fn(); modal.classList.add('open'); postBuild(type); }
  }

  const RITUAL_OB_SHOWN_KEY = 'echoRitualOb';

  function getRitualOb(type) {
    try { return JSON.parse(localStorage.getItem(RITUAL_OB_SHOWN_KEY) || '{}'); } catch(e) { return {}; }
  }
  function markRitualObShown(type) {
    const shown = getRitualOb();
    shown[type] = true;
    localStorage.setItem(RITUAL_OB_SHOWN_KEY, JSON.stringify(shown));
  }

  const RITUAL_OB_DATA = {
    receipt:  { icon:'🧾', title:'Your Mood Receipt', body:'This is a <strong>receipt of your emotions</strong> — itemized, timestamped, and totally yours. Pick a theme, then save or share your emotional bill.' },
    dna:      { icon:'🧬', title:'Your Emotion DNA', body:'This card reveals your <strong>emotional archetype</strong> — the pattern woven through all your echoes. It shifts as you do.' },
    crash:    { icon:'💻', title:'Crash Report', body:'When feelings overflow, systems crash. This is your <strong>emotional stack trace</strong> — absurd, honest, and very real.' },
    sound:    { icon:'🎧', title:'Echo Soundprint', body:'Music matched to your current emotional frequency. <strong>Tap Spotify or YouTube</strong> to open the song. Breathe with the orb below.' },
    shatter:  { icon:'🪞', title:'Shatter Softly', body:'A quiet ritual of release. <strong>Tap the surface</strong> to begin cracking it. Hold to spread the fractures. Let it break when you\'re ready.<br><br>This is not a game. It\'s a ceremony.' },
    vsvs:     { icon:'⚔️', title:'Inner Conflict', body:'Your past self meets your present self. <strong>Drag the orbs</strong> to push them apart or let them collide. Watch what happens between them.' }
  };

  function showRitualOnboarding(type, onStart) {
    const data = RITUAL_OB_DATA[type];
    if (!data) { onStart(); return; }
    const overlay = document.createElement('div');
    overlay.className = 'ritual-ob-overlay';
    overlay.innerHTML = `
      <div class="ritual-ob-card">
        <span class="ritual-ob-icon">${data.icon}</span>
        <div class="ritual-ob-title">${data.title}</div>
        <div class="ritual-ob-body">${data.body}</div>
        <button class="ritual-ob-start" id="rob-start">Begin →</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#rob-start').addEventListener('click', () => {
      overlay.remove();
      markRitualObShown(type);
      onStart();
    });
  }

  function open(type) {
    const builders = {receipt:buildReceipt, dna:buildDNA, crash:buildCrash, sound:buildSound, vsvs:buildConflict, shatter:buildShatter};
    const fn = builders[type];
    if (!fn) return;
    const shown = getRitualOb();
    const doOpen = () => { content.innerHTML = fn(); modal.classList.add('open'); postBuild(type); };
    if (!shown[type]) {
      showRitualOnboarding(type, doOpen);
    } else {
      doOpen();
    }
  }

  function postBuild(type) {
    if (type === 'vsvs')    setTimeout(startConflictAnimation, 100);
    if (type === 'shatter') setTimeout(() => ShatterSoftly.init(), 80);
    if (type === 'sound') {
      const relieverOrb = document.getElementById('reliever-orb');
      if (relieverOrb) {
        let breathing = false;
        relieverOrb.addEventListener('click', () => {
          breathing = !breathing;
          relieverOrb.style.animationPlayState = breathing ? 'running' : 'paused';
          if (breathing) {
            relieverOrb.style.boxShadow = '0 0 32px rgba(201,168,76,.3)';
            setTimeout(() => { relieverOrb.style.boxShadow = ''; }, 2000);
          }
        });
      }
    }
    if (type === 'receipt') {
      const replayBtn = document.createElement('button');
      replayBtn.className = 'ritual-ob-replay';
      replayBtn.textContent = '? how to use';
      replayBtn.addEventListener('click', () => showRitualOnboarding('receipt', () => {}));
      content.appendChild(replayBtn);
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          receiptTheme = btn.dataset.theme;
          document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const mainArea = document.querySelector('.receipt-main-area');
          if (mainArea) mainArea.innerHTML = buildReceiptCore();
        });
      });
      document.querySelector(`.theme-btn[data-theme="${receiptTheme}"]`)?.classList.add('active');
      document.getElementById('receipt-download-btn')?.addEventListener('click', downloadReceipt);
      document.getElementById('receipt-share-btn')?.addEventListener('click', shareReceipt);
    }
    // Add replay button to all rituals
    if (['dna','crash','sound','shatter','vsvs'].includes(type)) {
      const replayBtn = document.createElement('button');
      replayBtn.className = 'ritual-ob-replay';
      replayBtn.style.cssText='display:block;margin:14px auto 0;';
      replayBtn.textContent = '? how to use';
      replayBtn.addEventListener('click', () => showRitualOnboarding(type, () => {}));
      content.appendChild(replayBtn);
    }
  }

  function close() { modal.classList.remove('open'); }

  /* Character image pool */
  const CHAR_IMGS = [
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894015/IMG-20260423-WA0059_bz1ohb.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894015/IMG-20260423-WA0060_pifgne.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894022/IMG-20260423-WA0050_tae532.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894023/IMG-20260423-WA0051_c6weox.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894023/IMG-20260423-WA0048_wa1llc.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894024/IMG-20260423-WA0046_wvwgih.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894023/IMG-20260423-WA0047_pvaiyt.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894028/IMG-20260423-WA0039_kgdhkf.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894036/IMG-20260423-WA0030_jgq4fu.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894035/IMG-20260423-WA0029_grxw4f.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894039/IMG-20260423-WA0027_ebzfqh.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894040/IMG-20260423-WA0023_hcoixa.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894040/IMG-20260423-WA0024_ydfk93.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894044/IMG-20260423-WA0020_zub07i.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894045/IMG-20260423-WA0018_qibyfe.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894045/IMG-20260423-WA0016_nnwwed.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894046/IMG-20260423-WA0013_pvaura.jpg",
    "https://res.cloudinary.com/dg4vourvl/image/upload/v1776894049/IMG-20260423-WA0014_kqoquc.jpg"
  ];

  function pickCharImgs() {
    const pool = [...CHAR_IMGS];
    const count = Math.random() < 0.5 ? 1 : 2;
    const picked = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  }

  function buildCharImgHTML(imgs) {
    if (!imgs.length) return '';
    const positions = ['pos-tr', 'pos-br', 'pos-bl'];
    // always place first at top-right, second (if any) at bottom-left
    const placements = [positions[0], positions[2]];
    return imgs.map((src, i) => {
      const posClass = placements[i] || positions[1];
      const smallClass = i === 1 ? ' small' : '';
      return `<img class="receipt-char-img ${posClass}${smallClass}" src="${src}" alt="" aria-hidden="true" crossorigin="anonymous">`;
    }).join('');
  }

  function buildReceiptCore() {
    const total    = state.echoes.length;
    const avgInt   = total ? (state.echoes.reduce((a,e)=>a+e.intensity,0)/total).toFixed(1) : '0.0';
    const voidCnt  = state.echoes.filter(e=>e.void).length;
    const mc = {}; state.echoes.forEach(e=>{ mc[e.mood]=(mc[e.mood]||0)+1; });
    const dominant = Object.entries(mc).sort((a,b)=>b[1]-a[1])[0];
    const now = new Date();
    const charImgs = pickCharImgs();
    const charImgHTML = buildCharImgHTML(charImgs);

    return `<div class="receipt ${receiptTheme}" id="receipt-el" style="position:relative">
      <div class="receipt-paper">
        <div class="receipt-header">
          <div class="receipt-store">ECHOVAULT™</div>
          <div class="receipt-tagline">Emotional Surplus Store · Est. Today</div>
        </div>
        <hr class="receipt-divider">
        <div class="receipt-line"><span>Total echoes</span><span>${total}</span></div>
        <div class="receipt-line"><span>Avg intensity</span><span>${avgInt}/10</span></div>
        <div class="receipt-line"><span>Void entries</span><span>${voidCnt}</span></div>
        ${dominant?`<div class="receipt-line"><span>Dominant emotion</span><span>${dominant[0].toUpperCase()}</span></div>`:''}
        <div class="receipt-line"><span>Feelings unexpressed</span><span>∞</span></div>
        <div class="receipt-line"><span>Times you almost said it</span><span>several</span></div>
        <hr class="receipt-divider">
        <div class="receipt-line bold"><span>TOTAL DUE TO SELF</span><span>everything</span></div>
        <div class="receipt-barcode">|||||||||||||||||||||||||||</div>
        <div class="receipt-footer">Thank you for feeling.<br>${now.toLocaleDateString()} · ${now.toLocaleTimeString()}<br><br>Returns not accepted. Growth is final.</div>
      </div>
      ${charImgHTML}
    </div>`;
  }

  function buildReceipt() {
    const themes = [
      {id:'classic',label:'Classic'},
      {id:'dreamy',label:'Dreamy'},
      {id:'dark-minimal',label:'Dark'},
      {id:'romantic',label:'Romantic'}
    ];
    const themeBar = `<div class="receipt-themes">
      ${themes.map(t=>`<button class="theme-btn ${t.id===receiptTheme?'active':''}" data-theme="${t.id}">${t.label}</button>`).join('')}
    </div>`;
    return `${themeBar}
    <div class="receipt-main-area">${buildReceiptCore()}</div>
    <div class="receipt-actions">
      <button class="receipt-action-btn" id="receipt-download-btn">⬇ Save Image</button>
      <button class="receipt-action-btn" id="receipt-share-btn">↗ Share</button>
    </div>`;
  }

  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) { resolve(window.html2canvas); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload  = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(s);
    });
  }

  async function captureReceiptImage() {
    const el = document.getElementById('receipt-el');
    if (!el) throw new Error('No receipt element');
    const h2c = await loadHtml2Canvas();
    const canvas = await h2c(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      removeContainer: true
    });
    return canvas;
  }

  async function downloadReceipt() {
    try {
      Toast.show('Preparing image…');
      const canvas = await captureReceiptImage();
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mood-receipt.png';
      a.click();
      Toast.show('Receipt saved ✓');
    } catch(e) {
      Toast.show('Download failed — try again');
    }
  }

  async function shareReceipt() {
    try {
      Toast.show('Preparing image…');
      const canvas = await captureReceiptImage();
      canvas.toBlob(async (blob) => {
        if (!blob) { Toast.show('Could not create image'); return; }
        const file = new File([blob], 'mood-receipt.png', {type:'image/png'});
        if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
          try {
            await navigator.share({title:'My EchoVault Mood Receipt', files:[file]});
          } catch(e) {
            if (e.name !== 'AbortError') fallbackDownload(canvas);
          }
        } else {
          fallbackDownload(canvas);
        }
      }, 'image/png');
    } catch(e) {
      Toast.show('Share failed — saving instead');
    }
  }

  function fallbackDownload(canvas) {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = 'mood-receipt.png'; a.click();
    Toast.show('Saved as image ✓');
  }

  function buildDNA() {
    const mc = {}; state.echoes.forEach(e=>{ mc[e.mood]=(mc[e.mood]||0)+1; });
    const total  = state.echoes.length || 1;
    const sorted = Object.entries(mc).sort((a,b)=>b[1]-a[1]);
    const arch   = getArchetype(mc);
    const desc   = getArchetypeDesc(mc);
    const traits = [];
    if (mc.reflective) traits.push('introspective');
    if (mc.calm)       traits.push('grounded');
    if (mc.chaos)      traits.push('electric');
    if (mc.anxious)    traits.push('hyper-aware');
    if (mc.joyful)     traits.push('radiant');
    if (mc.empty)      traits.push('depth-seeker');
    if (!traits.length) traits.push('undefined','becoming','open');
    const domEmoji = MOOD_EMOJIS[sorted[0]?.[0]] || '✨';
    return `<div class="dna-card">
      <div class="dna-title">Emotion DNA — v${state.echoes.length}</div>
      <div class="dna-emoji-row">${domEmoji}${domEmoji}${domEmoji}</div>
      <div class="dna-archetype">${arch}</div>
      <div class="dna-archetype-sub">${desc}</div>
      <div class="dna-traits">${traits.map(t=>`<span class="dna-trait">${t}</span>`).join('')}</div>
      <div class="dna-bars">${sorted.slice(0,5).map(([mood,count])=>{
        const pct=Math.round(count/total*100);
        return `<div class="dna-bar-row">
          <div class="dna-bar-name">${mood}</div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width:${pct}%;background:${MOOD_COLORS[mood]}"></div></div>
          <div class="dna-bar-pct">${pct}%</div>
        </div>`;
      }).join('')}</div>
      <div class="dna-footer">EchoVault · Your Emotional Sequence</div>
    </div>`;
  }

  function buildCrash() {
    const recent = state.echoes[0];
    return `<div class="crash-report">
      <div class="crash-header">💥 PROCESS TERMINATED: EMOTIONAL_OVERFLOW</div>
      <div class="crash-line"><span class="crash-key">timestamp:</span> <span class="crash-val">${new Date().toISOString()}</span></div>
      <div class="crash-line"><span class="crash-key">error_code:</span> <span class="crash-val">FEELINGS_EXCEEDED_CAPACITY</span></div>
      <div class="crash-line"><span class="crash-key">echoes_logged:</span> <span class="crash-val">${state.echoes.length}</span></div>
      ${recent?`<div class="crash-line"><span class="crash-key">last_emotion:</span> <span class="crash-val">${recent.mood} (intensity ${recent.intensity})</span></div>`:''}
      <div class="crash-line"><span class="crash-key">memory_usage:</span> <span class="crash-val">97.3% (mostly you)</span></div>
      <div class="crash-line"><span class="crash-key">recovery_mode:</span> <span class="crash-val">therapy / time / rest</span></div>
      <div class="crash-stack">Stack trace:<br>&nbsp;&nbsp;at Human.feel() [feelings.js:${Math.floor(Math.random()*9999)}]<br>&nbsp;&nbsp;at Human.suppress() [coping.js:${Math.floor(Math.random()*9999)}]<br>&nbsp;&nbsp;at Human.tryAgain() [resilience.js:${Math.floor(Math.random()*999)}]<br>&nbsp;&nbsp;at Universe.continue() [existence.js:1]</div>
      <button class="crash-btn" id="crash-close">ignore &amp; continue</button>
    </div>`;
  }

  function buildSound() {
    const recent = state.echoes[0];
    const mood   = recent?.mood || 'reflective';
    const tracks = SOUNDPRINTS[mood] || SOUNDPRINTS.reflective;
    const color  = MOOD_COLORS[mood];
    const coverEmoji = MOOD_COVER_EMOJI[mood] || '🎵';

    const relieverMessages = {
      calm:'You carried your stillness here. Stay a moment longer.',
      chaos:'The noise needed somewhere to go. Let this hold it.',
      reflective:'The quiet inside deserves this kind of company.',
      anxious:"Breathe with this. You don't have to solve anything right now.",
      joyful:'Some feelings deserve to be heard out loud.',
      empty:'Even the void has a sound. This is yours.'
    };
    const relieverEmojis = {calm:'🌊',chaos:'⚡',reflective:'🌙',anxious:'🫁',joyful:'🌸',empty:'◯'};

    return `<div class="soundprint-card">
      <div class="soundprint-title">Echo Soundprint</div>
      <div class="soundprint-sub">Resonating with your ${MOOD_EMOJIS[mood]} <strong style="color:var(--text);font-style:normal">${mood}</strong> frequency</div>
      <div class="track-list">${tracks.map((t,i)=>`
        <div class="track-item">
          <div class="track-cover" style="background:linear-gradient(135deg,${color}55,${color}1a)">
            <div class="track-cover-glow" style="background:${color}"></div>
            <div class="track-cover-emoji">${coverEmoji}</div>
          </div>
          <div class="track-body">
            <div>
              <div class="track-num">0${i+1}</div>
              <div class="track-song">${t.song}</div>
              <div class="track-artist">${t.artist}</div>
            </div>
            <div class="track-reason">${t.reason}</div>
            <div class="track-links">
              <a class="track-link spotify" href="${t.spotify}" target="_blank" rel="noopener noreferrer">Spotify</a>
              <a class="track-link youtube" href="${t.youtube}" target="_blank" rel="noopener noreferrer">YouTube</a>
            </div>
          </div>
        </div>`).join('')}
      </div>
      <div class="soundprint-reliever">
        <div class="reliever-label">✦ a moment for you</div>
        <div class="reliever-text">${relieverMessages[mood] || relieverMessages.reflective}</div>
        <div class="reliever-breath" id="reliever-orb" role="button" aria-label="Breathing orb — tap and breathe">
          <div class="reliever-breath-ring"></div>
          ${relieverEmojis[mood] || '◯'}
        </div>
        <div class="reliever-breath-hint">tap · breathe · release</div>
      </div>
    </div>`;
  }

  function buildShatter() {
    return `<div class="shatter-stage">
      <div class="shatter-title">Shatter Softly</div>
      <div class="shatter-sub">A quiet ceremony of release.<br>Tap to begin cracking the surface.</div>
      <div class="shatter-canvas-wrap">
        <canvas id="shatter-canvas" width="240" height="240" aria-label="Shatter surface — tap to crack"></canvas>
      </div>
      <div class="shatter-hint" id="shatter-hint">tap gently to begin</div>
      <div class="shatter-aftermath" id="shatter-aftermath">
        <div class="shatter-release-line">"you didn't need<br>to carry that"</div>
        <div class="shatter-song-suggestion" id="shatter-song-here"></div>
        <button class="shatter-back" id="shatter-reset-btn">← begin again</button>
      </div>
    </div>`;
  }

  function buildConflict() {
    return `<div class="conflict-arena">
      <div class="conflict-canvas-wrap">
        <canvas id="conflict-canvas"></canvas>
      </div>
      <div class="conflict-instruction">drag to influence · watch them collide</div>
      <div class="conflict-labels">
        <div class="conflict-label past">${state.echoes.length > 1 ? state.echoes[state.echoes.length-1].mood : 'past'}</div>
        <div class="conflict-label present">${state.echoes[0]?.mood || 'present'}</div>
      </div>
    </div>`;
  }

  function startConflictAnimation() {
    const canvas = document.getElementById('conflict-canvas');
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    const pastMood    = state.echoes.length > 1 ? state.echoes[state.echoes.length-1].mood : 'reflective';
    const presentMood = state.echoes[0]?.mood || 'chaos';
    const pastColor   = MOOD_COLORS[pastMood];
    const presColor   = MOOD_COLORS[presentMood];

    let entities = [
      {x:w*.3, y:h/2, vx:.8, vy:0, r:40, color:pastColor, label:'past', mass:1},
      {x:w*.7, y:h/2, vx:-.8, vy:0, r:40, color:presColor, label:'present', mass:1}
    ];

    let dragging = null;

    canvas.addEventListener('pointerdown', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      entities.forEach(en => {
        const dx = mx-en.x, dy = my-en.y;
        if (Math.sqrt(dx*dx+dy*dy) < en.r+10) dragging = en;
      });
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      dragging.vx = (e.clientX - rect.left - dragging.x) * 0.2;
      dragging.vy = (e.clientY - rect.top  - dragging.y) * 0.2;
    });
    canvas.addEventListener('pointerup', () => { dragging = null; });

    let phase = 0;
    function frame() {
      if (!document.getElementById('conflict-canvas')) return;
      ctx.clearRect(0,0,w,h);
      phase += 0.012;

      entities.forEach(en => {
        en.vx *= 0.98; en.vy *= 0.98;
        en.x += en.vx; en.y += en.vy;
        if (en.x - en.r < 0) { en.x = en.r; en.vx *= -.7; }
        if (en.x + en.r > w) { en.x = w-en.r; en.vx *= -.7; }
        if (en.y - en.r < 0) { en.y = en.r; en.vy *= -.7; }
        if (en.y + en.r > h) { en.y = h-en.r; en.vy *= -.7; }
      });

      const a = entities[0], b = entities[1];
      const dx = a.x-b.x, dy = a.y-b.y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const minD = a.r+b.r;
      if (dist < minD && dist > 0) {
        const nx = dx/dist, ny = dy/dist;
        const relV = (a.vx-b.vx)*nx + (a.vy-b.vy)*ny;
        const imp  = relV * 1.0;
        a.vx -= imp*nx; a.vy -= imp*ny;
        b.vx += imp*nx; b.vy += imp*ny;
        const overlap = (minD-dist)*0.5;
        a.x += nx*overlap; a.y += ny*overlap;
        b.x -= nx*overlap; b.y -= ny*overlap;
        const cx2 = (a.x+b.x)/2, cy2 = (a.y+b.y)/2;
        const grd = ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,32);
        grd.addColorStop(0,'rgba(255,255,255,.28)');
        grd.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(cx2,cy2,32,0,Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();
      }

      if (dist < minD*2.5) {
        const alpha = Math.max(0, 1-(dist/(minD*2.5))) * .32;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1; ctx.stroke();
      }

      entities.forEach(en => {
        const pulse = 1 + Math.sin(phase)*0.06;
        const grd = ctx.createRadialGradient(en.x,en.y,0,en.x,en.y,en.r*pulse);
        grd.addColorStop(0,en.color+'cc');
        grd.addColorStop(.6,en.color+'44');
        grd.addColorStop(1,en.color+'00');
        ctx.beginPath(); ctx.arc(en.x, en.y, en.r*pulse, 0, Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(en.x,en.y,en.r*pulse,0,Math.PI*2);
        ctx.strokeStyle = en.color + '66'; ctx.lineWidth=1.5; ctx.stroke();
      });

      requestAnimationFrame(frame);
    }
    frame();
  }

  document.querySelectorAll('.fun-card').forEach(card => {
    card.addEventListener('click',   () => open(card.dataset.fun));
    card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();open(card.dataset.fun);}});
  });
  document.getElementById('fun-modal-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if(e.target===modal) close(); });
  content.addEventListener('click', e => { if(e.target.id==='crash-close') close(); });

  return {open};
})();

/* ── HELPER FUNCTIONS ── */
function getArchetype(mc) {
  const max = Object.entries(mc).sort((a,b)=>b[1]-a[1])[0]?.[0];
  return ARCHETYPE_NAMES[max] || 'The Unknown';
}
function getArchetypeDesc(mc) {
  const max = Object.entries(mc).sort((a,b)=>b[1]-a[1])[0]?.[0];
  return ARCHETYPE_DESCS[max] || 'Still becoming.';
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

/* ── WIRE EVENTS ── */
document.getElementById('nav-logo-btn').addEventListener('click', e => { e.preventDefault(); Nav.show('home'); });
document.getElementById('home-create-btn').addEventListener('click', () => Nav.show('entry'));
document.getElementById('home-enter-btn').addEventListener('click',  () => Nav.show('timeline'));
document.getElementById('timeline-create-btn').addEventListener('click', () => Nav.show('entry'));
document.getElementById('view-uni-btn').addEventListener('click', () => Nav.show('timeline'));
document.getElementById('detail-close-btn').addEventListener('click', () =>
  document.getElementById('node-detail').classList.remove('open'));
document.getElementById('node-detail').addEventListener('click', e => {
  if (e.target.id==='node-detail') document.getElementById('node-detail').classList.remove('open');
});
document.getElementById('period-week').addEventListener('click',  function(){ setPeriod('week',this);  });
document.getElementById('period-month').addEventListener('click', function(){ setPeriod('month',this); });
document.getElementById('period-all').addEventListener('click',   function(){ setPeriod('all',this);   });
function setPeriod(p, btn) {
  state.wrappedPeriod = p;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  Wrapped.render();
}
document.getElementById('export-btn').addEventListener('click', () => Storage.exportVault(state.echoes));
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', function() {
  if (this.files[0]) {
    Storage.importVault(this.files[0], (arr) => {
      state.echoes = arr;
      Storage.save(state.echoes);
      Weather.update(); IdentityOrb.update(); IdentityCore.update(); GhostLayer.initFromEchoes(state.echoes);
    });
  }
  this.value = '';
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('node-detail').classList.remove('open');
    document.getElementById('fun-modal').classList.remove('open');
    document.getElementById('onboarding').classList.remove('open');
  }
});

document.addEventListener('visibilitychange', () => { state.tabHidden = document.hidden; });

window.addEventListener('resize', () => {
  Cosmos.resize(); Ripple.resize(); ConnectionCanvas.resize(); Whip.resize(); Wrapped.resize();
  if (state.currentView === 'timeline') Timeline.render();
}, {passive:true});

/* ── INIT ── */
function init() {
  state.echoes = Storage.load();
  Cosmos.init();
  Cosmos.draw();
  Breathing.start();
  Weather.update();
  GhostLayer.initFromEchoes(state.echoes);
  IdentityCore.update();
  Login.init();
}

init();

})();
