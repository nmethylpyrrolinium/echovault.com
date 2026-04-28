/* ═══════════════════════════════════════════════════════════════════
   ECHOVAULT — CINEMATIC WRAPPED MODULE
   
   Drop-in replacement for the existing Wrapped module.
   Add this entire block to script.js, replacing the existing Wrapped module.
   Works with the same state.echoes and MOOD_COLORS constants.
   ═══════════════════════════════════════════════════════════════════ */

/* ── CINEMATIC WRAPPED (replaces old Wrapped module) ── */
const CinematicWrapped = (() => {

  // ── SCENE DEFINITIONS ──
  const SCENES = ['sky','core','identity','sound','final'];
  let currentScene = 0;
  let animFrame    = null;
  let phase        = 0;
  let renderer, threeScene, camera;
  let orbGroup, particleGroups = [];
  let camTargetZ = 80, camCurrentZ = 80;
  let camTargetX = 0,  camCurrentX = 0;
  let camTargetY = 0,  camCurrentY = 0;

  const SCENE_CAM = [
    {z:82,x:0,y:0},
    {z:52,x:0,y:0},
    {z:66,x:5,y:-3},
    {z:60,x:-4,y:2},
    {z:92,x:0,y:-5},
  ];

  // ── DATA ──
  let wrappedData = null;
  let wrappedPeriodLocal = 'week';

  function computeWrappedData() {
    const cutoff = wrappedPeriodLocal==='week'?7*86400000:wrappedPeriodLocal==='month'?30*86400000:Infinity;
    const echoes = state.echoes.filter(e=>Date.now()-new Date(e.date)<cutoff);
    if(!echoes.length) return null;
    const mc={};let totalInt=0;
    echoes.forEach(e=>{mc[e.mood]=(mc[e.mood]||0)+1;totalInt+=e.intensity;});
    const sorted=Object.entries(mc).sort((a,b)=>b[1]-a[1]);
    const total=echoes.length, dom=sorted[0][0];
    const avg=(totalInt/total).toFixed(1);
    const chaos=Math.round(((mc.chaos||0)+(mc.anxious||0))/total*100);
    const voidCnt=echoes.filter(e=>e.void).length;
    return {echoes,sorted,total,dom,avg,chaos,voidCnt,mc};
  }

  // ── BUILD OVERLAY ──
  function buildOverlay() {
    const existing = document.getElementById('cw-stage');
    if(existing) existing.remove();

    const stage = document.createElement('div');
    stage.id = 'cw-stage';
    stage.style.cssText = `
      position:fixed;inset:0;z-index:600;background:#000;overflow:hidden;
      opacity:0;transition:opacity .7s cubic-bezier(.16,1,.3,1);
    `;

    stage.innerHTML = `
      <canvas id="cw-canvas" style="position:absolute;inset:0;z-index:0"></canvas>

      <!-- Depth vignette -->
      <div style="position:absolute;inset:0;z-index:5;pointer-events:none;
        background:radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(0,0,0,.65) 100%)"></div>

      <!-- Scene wipe -->
      <div id="cw-wipe" style="position:absolute;inset:0;z-index:50;pointer-events:none;
        background:rgba(5,5,8,1);opacity:0;transition:opacity .5s"></div>

      <!-- Progress bar -->
      <div id="cw-progress" style="position:absolute;top:0;left:0;height:2px;z-index:30;
        background:linear-gradient(to right,#c9a84c,rgba(201,168,76,.4));
        transition:width .9s cubic-bezier(.16,1,.3,1);width:20%;pointer-events:none"></div>

      <!-- Period selector -->
      <div id="cw-period" style="position:absolute;top:18px;left:50%;transform:translateX(-50%);z-index:30;
        background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
        border-radius:20px;display:flex;overflow:hidden">
        <button class="cw-pb active" data-period="week">Week</button>
        <button class="cw-pb" data-period="month">Month</button>
        <button class="cw-pb" data-period="all">All Time</button>
      </div>

      <!-- Close -->
      <button id="cw-close" style="position:absolute;top:16px;right:16px;z-index:30;
        width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);font-size:18px;
        display:flex;align-items:center;justify-content:center;cursor:pointer;
        transition:all .25s">×</button>

      <!-- UI Container -->
      <div id="cw-ui" style="position:absolute;inset:0;z-index:10;pointer-events:none;
        display:flex;align-items:center;justify-content:center">

        <!-- SCENE 1: Emotional Sky -->
        <div class="cw-scene active" id="cws-1" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 28px">
          <div id="cw-s1-emoji" style="font-size:clamp(48px,10vw,80px);margin-bottom:20px;filter:drop-shadow(0 0 30px currentColor);animation:cwFloat 1.2s cubic-bezier(.16,1,.3,1) both">🌌</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.4em;color:#c9a84c;text-transform:uppercase;margin-bottom:24px;animation:cwFloat 1.2s .1s cubic-bezier(.16,1,.3,1) both">Your emotional season</div>
          <div id="cw-s1-headline" style="font-family:'Cinzel Decorative',serif;font-size:clamp(22px,5vw,46px);color:rgba(255,255,255,.92);line-height:1.15;margin-bottom:16px;animation:cwFloat 1.2s .2s cubic-bezier(.16,1,.3,1) both">You felt everything</div>
          <div id="cw-s1-sub" style="font-size:clamp(14px,2.5vw,18px);font-style:italic;color:rgba(255,255,255,.6);line-height:1.75;max-width:400px;animation:cwFloat 1.2s .3s cubic-bezier(.16,1,.3,1) both">across <strong id="cw-s1-count">0</strong> echoes, your inner universe kept expanding.</div>
        </div>

        <!-- SCENE 2: Core Orb -->
        <div class="cw-scene" id="cws-2" style="display:none;flex-direction:column;align-items:center;text-align:center;padding:40px 28px;gap:20px">
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.35em;color:#c9a84c;text-transform:uppercase;animation:cwFloat 1s cubic-bezier(.16,1,.3,1) both">dominant resonance</div>
          <div style="position:relative">
            <canvas id="cw-core-canvas" width="180" height="180" style="display:block;animation:cwFloat 1s .1s cubic-bezier(.16,1,.3,1) both"></canvas>
          </div>
          <div>
            <div id="cw-s2-arch" style="font-family:'Playfair Display',serif;font-size:clamp(22px,4vw,36px);color:rgba(255,255,255,.95);margin-bottom:10px;animation:cwFloat 1s .2s cubic-bezier(.16,1,.3,1) both">The Still Lake</div>
            <div id="cw-s2-desc" style="font-size:clamp(13px,2vw,16px);font-style:italic;color:rgba(255,255,255,.6);max-width:360px;line-height:1.75;animation:cwFloat 1s .32s cubic-bezier(.16,1,.3,1) both">You carry stillness like a gift.</div>
          </div>
        </div>

        <!-- SCENE 3: Identity -->
        <div class="cw-scene" id="cws-3" style="display:none;flex-direction:column;align-items:center;text-align:center;padding:40px 28px;gap:28px;width:100%;max-width:500px">
          <div style="font-family:'Cinzel Decorative',serif;font-size:clamp(14px,3vw,22px);color:#c9a84c;letter-spacing:.1em;animation:cwFloat 1s cubic-bezier(.16,1,.3,1) both">Your emotional composition</div>
          <div id="cw-s3-bars" style="width:100%;display:flex;flex-direction:column;gap:12px;animation:cwFloat 1s .12s cubic-bezier(.16,1,.3,1) both"></div>
          <div style="display:flex;gap:36px;animation:cwFloat 1s .28s cubic-bezier(.16,1,.3,1) both">
            <div style="text-align:center">
              <div id="cw-s3-avg" style="font-family:'Playfair Display',serif;font-size:32px;color:#c9a84c">—</div>
              <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.12em;margin-top:4px">avg intensity</div>
            </div>
            <div style="text-align:center">
              <div id="cw-s3-chaos" style="font-family:'Playfair Display',serif;font-size:32px;color:#c9a84c">—</div>
              <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.12em;margin-top:4px">turbulence</div>
            </div>
            <div style="text-align:center">
              <div id="cw-s3-void" style="font-family:'Playfair Display',serif;font-size:32px;color:#c9a84c">—</div>
              <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.12em;margin-top:4px">void entries</div>
            </div>
          </div>
        </div>

        <!-- SCENE 4: Soundtrack -->
        <div class="cw-scene" id="cws-4" style="display:none;flex-direction:column;align-items:center;text-align:center;padding:40px 28px;gap:20px;width:100%;max-width:480px">
          <div style="font-family:'Cinzel Decorative',serif;font-size:clamp(14px,3vw,22px);color:#c9a84c;letter-spacing:.1em;animation:cwFloat 1s cubic-bezier(.16,1,.3,1) both">Your frequency in sound</div>
          <div id="cw-s4-tracks" style="width:100%;display:flex;flex-direction:column;gap:12px;pointer-events:all;animation:cwFloat 1s .12s cubic-bezier(.16,1,.3,1) both"></div>
        </div>

        <!-- SCENE 5: Final -->
        <div class="cw-scene" id="cws-5" style="display:none;flex-direction:column;align-items:center;text-align:center;padding:40px 28px;gap:0">
          <div style="font-family:'Cinzel Decorative',serif;font-size:clamp(18px,4vw,34px);color:#c9a84c;letter-spacing:.08em;margin-bottom:16px;line-height:1.3;animation:cwFloat 1.2s cubic-bezier(.16,1,.3,1) both">You were here.<br>That matters.</div>
          <div id="cw-s5-sub" style="font-size:clamp(14px,2.4vw,19px);font-style:italic;color:rgba(255,255,255,.6);max-width:400px;line-height:1.75;margin-bottom:44px;animation:cwFloat 1.2s .15s cubic-bezier(.16,1,.3,1) both">Every echo was real. This universe is yours.</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;pointer-events:all;animation:cwFloat 1.2s .3s cubic-bezier(.16,1,.3,1) both">
            <button id="cw-replay" style="background:#c9a84c;color:#000;border:none;padding:13px 34px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;border-radius:3px;cursor:pointer;transition:all .3s">↩ Replay</button>
            <button id="cw-exit" style="background:transparent;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.2);padding:13px 34px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;border-radius:3px;cursor:pointer;transition:all .3s">Close</button>
          </div>
        </div>

        <!-- Empty -->
        <div id="cw-empty" style="display:none;flex-direction:column;align-items:center;text-align:center;padding:40px">
          <div style="font-size:56px;margin-bottom:20px;opacity:.35">🌌</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:22px;color:rgba(255,255,255,.45);letter-spacing:.05em;margin-bottom:10px">No echoes yet</div>
          <div style="font-size:15px;font-style:italic;color:rgba(255,255,255,.22)">Create some echoes to see your Wrapped.</div>
        </div>

      </div><!-- /cw-ui -->

      <!-- Nav -->
      <div id="cw-nav" style="position:absolute;bottom:32px;left:50%;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:16px;pointer-events:all">
        <button id="cw-prev" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.65);padding:8px 18px;border-radius:20px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:all .25s">←</button>
        <div id="cw-dots" style="display:flex;gap:7px;align-items:center"></div>
        <button id="cw-next" style="background:#c9a84c;border:1px solid #c9a84c;color:#000;padding:8px 18px;border-radius:20px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:all .25s;font-weight:500">Next →</button>
      </div>

      <style>
        @keyframes cwFloat{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .cw-scene{position:absolute;inset:0;display:none!important;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 1s cubic-bezier(.16,1,.3,1)}
        .cw-scene.active{display:flex!important;opacity:1}
        .cw-pb{background:none;border:none;color:rgba(255,255,255,.5);padding:6px 15px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:all .25s}
        .cw-pb.active{background:#c9a84c;color:#000}
        #cw-close:hover{background:rgba(255,255,255,.14);color:rgba(255,255,255,.95)}
        .cw-track{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:center;cursor:pointer;transition:all .3s;text-align:left}
        .cw-track:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.2);transform:translateX(4px)}
        .cw-track-cover{width:48px;height:48px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px}
        .cw-track-song{font-size:14px;color:rgba(255,255,255,.92);font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cw-track-artist{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}
        .cw-link{display:inline-flex;align-items:center;gap:3px;padding:4px 9px;border-radius:12px;font-family:'DM Mono',monospace;font-size:8px;text-decoration:none;letter-spacing:.08em;border:1px solid;transition:all .2s}
        .cw-link.sp{color:#1db954;border-color:rgba(29,185,84,.35);background:rgba(29,185,84,.07)}
        .cw-link.yt{color:#ff5555;border-color:rgba(255,68,68,.3);background:rgba(255,68,68,.05)}
        .cw-bar-row{display:flex;align-items:center;gap:12px}
        .cw-bar-name{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;color:rgba(255,255,255,.5);text-transform:uppercase;width:72px;text-align:right;flex-shrink:0}
        .cw-bar-track{flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
        .cw-bar-fill{height:100%;border-radius:3px;transform:scaleX(0);transform-origin:left;transition:transform 1.4s cubic-bezier(.16,1,.3,1)}
        .cw-bar-pct{font-family:'DM Mono',monospace;font-size:9px;color:#c9a84c;width:30px;flex-shrink:0}
        .cw-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);cursor:pointer;transition:all .4s}
        .cw-dot.active{background:#c9a84c;width:16px;border-radius:3px}
        #cw-replay:hover{background:#d4b45a;transform:translateY(-1px)}
        #cw-exit:hover{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.05)}
        #cw-prev:hover,#cw-next:hover{opacity:.8}
      </style>
    `;

    document.body.appendChild(stage);

    // Build dots
    const dotsEl = stage.querySelector('#cw-dots');
    for(let i=0;i<SCENES.length;i++){
      const d=document.createElement('div');
      d.className='cw-dot'+(i===0?' active':'');
      d.addEventListener('click',()=>goScene(i));
      dotsEl.appendChild(d);
    }

    // Wire controls
    stage.querySelector('#cw-close').addEventListener('click',close);
    stage.querySelector('#cw-exit').addEventListener('click',close);
    stage.querySelector('#cw-replay').addEventListener('click',()=>goScene(0));
    stage.querySelector('#cw-next').addEventListener('click',()=>{
      if(currentScene===SCENES.length-1) goScene(0);
      else goScene(currentScene+1);
    });
    stage.querySelector('#cw-prev').addEventListener('click',()=>{
      if(currentScene>0) goScene(currentScene-1);
    });
    stage.querySelectorAll('.cw-pb').forEach(btn=>{
      btn.addEventListener('click',function(){
        stage.querySelectorAll('.cw-pb').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        wrappedPeriodLocal = this.dataset.period;
        wrappedData = computeWrappedData();
        populateScenes(stage);
        goScene(0,true);
      });
    });

    // Keyboard / swipe
    const kHandler = e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowDown') goScene(currentScene+1);
      if(e.key==='ArrowLeft'||e.key==='ArrowUp')    goScene(currentScene-1);
      if(e.key==='Escape') close();
    };
    document.addEventListener('keydown',kHandler);
    stage._kHandler=kHandler;

    let tx=0;
    const ts=e=>{tx=e.touches[0].clientX};
    const te=e=>{
      const dx=e.changedTouches[0].clientX-tx;
      if(Math.abs(dx)>50){dx<0?goScene(currentScene+1):goScene(currentScene-1);}
    };
    stage.addEventListener('touchstart',ts,{passive:true});
    stage.addEventListener('touchend',te,{passive:true});

    return stage;
  }

  // ── THREE.JS ──
  function initThree(canvas) {
    if(renderer) { destroyThree(); }
    renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(0x020206,1);
    threeScene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(65,window.innerWidth/window.innerHeight,0.1,2000);
    camera.position.set(0,0,80);
    camCurrentZ=80; camTargetZ=82;

    buildStars();
    buildNebula();

    orbGroup = new THREE.Group();
    threeScene.add(orbGroup);

    window._cwResizeHandler = ()=>{
      camera.aspect=window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth,window.innerHeight);
    };
    window.addEventListener('resize',window._cwResizeHandler,{passive:true});
    renderLoop();
  }

  function buildStars() {
    [[600,500,0.5,0.5,0x7788bb],[280,320,1.0,0.6,0xaaaadd],[100,180,1.6,0.7,0xc9a84c]].forEach(([cnt,spread,sz,speed,col],li)=>{
      const geo=new THREE.BufferGeometry();
      const pos=new Float32Array(cnt*3);
      for(let i=0;i<cnt;i++){
        pos[i*3]=(Math.random()-.5)*spread;
        pos[i*3+1]=(Math.random()-.5)*spread;
        pos[i*3+2]=(Math.random()-.5)*spread*.5;
      }
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      const mat=new THREE.PointsMaterial({color:col,size:sz,transparent:true,opacity:speed,sizeAttenuation:true});
      const pts=new THREE.Points(geo,mat);
      pts.userData.li=li;
      threeScene.add(pts);
      particleGroups.push(pts);
    });
  }

  function buildNebula() {
    const colors=[0x2a1050,0x0d2540,0x3d1515,0x102828];
    for(let i=0;i<7;i++){
      const geo=new THREE.SphereGeometry(55+Math.random()*75,5,5);
      const mat=new THREE.MeshBasicMaterial({color:colors[i%4],transparent:true,opacity:.05+Math.random()*.04});
      const m=new THREE.Mesh(geo,mat);
      m.position.set((Math.random()-.5)*280,(Math.random()-.5)*180,(Math.random()-.5)*200-120);
      m.rotation.set(Math.random(),Math.random(),Math.random());
      threeScene.add(m);
    }
  }

  function buildOrbsForScene(idx) {
    while(orbGroup.children.length) orbGroup.remove(orbGroup.children[0]);
    if(!wrappedData) return;

    if(idx===0) {
      wrappedData.sorted.forEach(([mood,count],i)=>{
        const col=new THREE.Color(MOOD_COLORS[mood]);
        const geo=new THREE.SphereGeometry(3+count*1.5,10,10);
        const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.55});
        const m=new THREE.Mesh(geo,mat);
        const angle=(i/wrappedData.sorted.length)*Math.PI*2;
        m.position.set(Math.cos(angle)*32,Math.sin(angle)*22,-18+Math.random()*8);
        m.userData={drift:angle,driftSpeed:.003+Math.random()*.002,driftR:32,driftRY:22};
        orbGroup.add(m);
        const rGeo=new THREE.TorusGeometry(4+count*1.5,.35,6,20);
        const rMat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.18});
        const ring=new THREE.Mesh(rGeo,rMat);
        ring.position.copy(m.position);ring.rotation.x=Math.PI/3;
        ring.userData={twin:m};
        orbGroup.add(ring);
      });
    } else if(idx===1) {
      const col=new THREE.Color(MOOD_COLORS[wrappedData.dom]);
      for(let i=0;i<3;i++){
        const geo=new THREE.SphereGeometry(13-i*2.5,20,20);
        const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.1+i*.08,wireframe:i===2});
        const m=new THREE.Mesh(geo,mat);
        m.userData={rot:new THREE.Vector3(Math.random(),1,Math.random()).normalize(),spd:.004+i*.003};
        orbGroup.add(m);
      }
      for(let i=0;i<36;i++){
        const geo=new THREE.SphereGeometry(.5+Math.random()*.7,5,5);
        const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.55+Math.random()*.3});
        const m=new THREE.Mesh(geo,mat);
        const theta=Math.random()*Math.PI*2,phi=Math.random()*Math.PI,r=20+Math.random()*14;
        m.position.set(r*Math.sin(phi)*Math.cos(theta),r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi));
        m.userData={orbA:theta,orbPhi:phi,orbR:r,orbSpd:.006+Math.random()*.006,orbAx:Math.random()>.5?1:-1};
        orbGroup.add(m);
      }
    } else if(idx===2) {
      for(let i=0;i<55;i++){
        const mood=wrappedData.sorted[i%wrappedData.sorted.length][0];
        const col=new THREE.Color(MOOD_COLORS[mood]);
        const geo=new THREE.TetrahedronGeometry(1.2+Math.random()*1.8,0);
        const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.4+Math.random()*.35,wireframe:Math.random()>.5});
        const m=new THREE.Mesh(geo,mat);
        const a=(i/55)*Math.PI*2,r=26+Math.random()*18;
        m.position.set(Math.cos(a)*r,Math.sin(a)*r*.55,(Math.random()-.5)*36);
        m.userData={bp:m.position.clone(),ph:Math.random()*Math.PI*2,spd:.004+Math.random()*.003};
        orbGroup.add(m);
      }
    } else if(idx===3) {
      const col=new THREE.Color(MOOD_COLORS[wrappedData.dom]);
      for(let i=0;i<3;i++){
        const geo=new THREE.PlaneGeometry(20,12);
        const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.1,side:THREE.DoubleSide});
        const m=new THREE.Mesh(geo,mat);
        m.position.set((i-1)*28,(Math.random()-.5)*6,-18+i*7);
        m.rotation.y=(i-1)*0.14; m.rotation.x=0.04;
        m.userData={baseY:m.position.y,ph:i*Math.PI*.66,spd:.004};
        orbGroup.add(m);
        const eGeo=new THREE.EdgesGeometry(geo);
        const eMat=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.38});
        const edge=new THREE.LineSegments(eGeo,eMat);
        edge.position.copy(m.position); edge.rotation.copy(m.rotation);
        orbGroup.add(edge);
      }
    } else if(idx===4) {
      wrappedData.sorted.forEach(([mood,count],mi)=>{
        const col=new THREE.Color(MOOD_COLORS[mood]);
        for(let k=0;k<Math.min(count,6);k++){
          const geo=new THREE.SphereGeometry(1.8+Math.random()*2.5,7,7);
          const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.3+Math.random()*.3});
          const m=new THREE.Mesh(geo,mat);
          const a=Math.random()*Math.PI*2,r=18+Math.random()*48;
          m.position.set(Math.cos(a)*r,(Math.random()-.5)*36,(Math.random()-.5)*55);
          m.userData={drift:a,driftSpd:.002+Math.random()*.003,driftR:r,rise:(Math.random()-.5)*.015};
          orbGroup.add(m);
        }
      });
    }
  }

  function renderLoop() {
    animFrame=requestAnimationFrame(renderLoop);
    if(!renderer||!threeScene||!camera) return;
    phase+=.006;

    camCurrentZ+=(camTargetZ-camCurrentZ)*.03;
    camCurrentX+=(camTargetX-camCurrentX)*.03;
    camCurrentY+=(camTargetY-camCurrentY)*.03;
    camera.position.z=camCurrentZ;
    camera.position.x=camCurrentX+Math.sin(phase*.3)*1.4;
    camera.position.y=camCurrentY+Math.cos(phase*.2)*1.1;

    particleGroups.forEach((p,i)=>{ p.rotation.y=phase*(0.01+i*.01); p.rotation.x=phase*.006; });

    orbGroup.children.forEach(obj=>{
      const ud=obj.userData;
      if(ud.drift!==undefined && ud.driftR!==undefined){
        ud.drift+=ud.driftSpd||.002;
        obj.position.x=Math.cos(ud.drift)*ud.driftR;
        if(ud.driftRY) obj.position.y=Math.sin(ud.drift)*ud.driftRY;
        if(ud.rise) obj.position.y+=ud.rise;
        if(ud.twin) { ud.twin.position.x=obj.position.x; ud.twin.position.y=obj.position.y; }
      }
      if(ud.rot && ud.spd) obj.rotateOnAxis(ud.rot,ud.spd);
      if(ud.orbA!==undefined){
        ud.orbA+=ud.orbSpd*ud.orbAx;
        const phi=ud.orbPhi+phase*.003,r=ud.orbR;
        obj.position.set(r*Math.sin(phi)*Math.cos(ud.orbA),r*Math.sin(phi)*Math.sin(ud.orbA),r*Math.cos(phi));
      }
      if(ud.bp && ud.ph!==undefined){
        const t=phase+ud.ph;
        obj.position.y=ud.bp.y+Math.sin(t)*2.5;
        obj.position.x=ud.bp.x+Math.cos(t*.7)*1.8;
        obj.rotation.x+=.007; obj.rotation.y+=.005;
      }
      if(ud.baseY!==undefined) obj.position.y=ud.baseY+Math.sin(phase+ud.ph)*1.8;
    });

    renderer.render(threeScene,camera);
  }

  function destroyThree() {
    cancelAnimationFrame(animFrame);
    animFrame=null;
    if(renderer){ renderer.dispose(); renderer=null; }
    threeScene=null; camera=null;
    particleGroups=[];
    if(window._cwResizeHandler){ window.removeEventListener('resize',window._cwResizeHandler); }
  }

  // ── CORE ORB 2D ──
  function animateCoreCanvas() {
    const canvas=document.getElementById('cw-core-canvas');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const w=180,h=180,cx=90,cy=90;
    const color=MOOD_COLORS[wrappedData?.dom]||'#7c6fa0';
    let a=0;
    function frame(){
      if(currentScene!==1||!document.getElementById('cw-core-canvas')){ return; }
      ctx.clearRect(0,0,w,h); a+=.009;
      for(let i=0;i<4;i++){
        const r=36+i*11+Math.sin(a+i)*4;
        const al=(0.16-i*.04)*Math.abs(Math.sin(a*.5+i));
        const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        grd.addColorStop(0,'transparent');
        grd.addColorStop(.7,color+Math.floor(al*255).toString(16).padStart(2,'0'));
        grd.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      }
      const pulse=26+Math.sin(a)*5;
      const cg=ctx.createRadialGradient(cx-10,cy-12,0,cx,cy,pulse);
      cg.addColorStop(0,color+'ff'); cg.addColorStop(.5,color+'99'); cg.addColorStop(1,color+'00');
      ctx.beginPath(); ctx.arc(cx,cy,pulse,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
      for(let i=0;i<8;i++){
        const a2=a*1.2+(i/8)*Math.PI*2,r2=42+Math.sin(a+i)*5;
        const px=cx+Math.cos(a2)*r2,py=cy+Math.sin(a2)*r2*.7;
        const sz=1.8+Math.sin(a*2+i)*.7;
        ctx.beginPath(); ctx.arc(px,py,sz,0,Math.PI*2); ctx.fillStyle=color+'bb'; ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  // ── POPULATE SCENES ──
  function populateScenes(stage) {
    if(!wrappedData) {
      stage.querySelector('#cw-empty').style.display='flex';
      stage.querySelector('#cw-nav').style.display='none';
      return;
    }
    const {dom,sorted,total,avg,chaos,voidCnt,mc}=wrappedData;
    const domColor=MOOD_COLORS[dom];
    const MOOD_EMOJIS_LOCAL={calm:'🌊',chaos:'⚡',reflective:'🌙',anxious:'🌀',joyful:'🌸',empty:'🪨'};
    const COVER_EMOJI={calm:'🌊',chaos:'⚡',reflective:'🌙',anxious:'🌀',joyful:'🌸',empty:'🌑'};

    // Scene 1
    stage.querySelector('#cw-s1-emoji').textContent = MOOD_EMOJIS_LOCAL[dom]||'🌌';
    stage.querySelector('#cw-s1-headline').innerHTML = `You felt<br><em style="color:${domColor};font-style:inherit">${dom}</em>`;
    stage.querySelector('#cw-s1-count').textContent  = total;

    // Scene 2
    stage.querySelector('#cw-s2-arch').textContent = ARCHETYPE_NAMES[dom]||'The Unknown';
    stage.querySelector('#cw-s2-desc').textContent  = ARCHETYPE_DESCS[dom]||'Still becoming.';

    // Scene 3
    const barsEl=stage.querySelector('#cw-s3-bars');
    barsEl.innerHTML='';
    sorted.slice(0,5).forEach(([mood,count])=>{
      const pct=Math.round(count/total*100);
      const row=document.createElement('div');
      row.className='cw-bar-row';
      row.innerHTML=`
        <div class="cw-bar-name">${mood}</div>
        <div class="cw-bar-track"><div class="cw-bar-fill" style="background:${MOOD_COLORS[mood]}"></div></div>
        <div class="cw-bar-pct">${pct}%</div>`;
      row.querySelector('.cw-bar-fill').dataset.pct=pct;
      barsEl.appendChild(row);
    });
    stage.querySelector('#cw-s3-avg').textContent   = avg;
    stage.querySelector('#cw-s3-chaos').textContent  = chaos+'%';
    stage.querySelector('#cw-s3-void').textContent   = voidCnt;

    // Scene 4
    const tracks=(SOUNDPRINTS[dom]||SOUNDPRINTS.reflective).slice(0,3);
    const tracksEl=stage.querySelector('#cw-s4-tracks');
    tracksEl.innerHTML='';
    tracks.forEach((t,i)=>{
      const el=document.createElement('div');
      el.className='cw-track';
      el.innerHTML=`
        <div class="cw-track-cover" style="background:linear-gradient(135deg,${domColor}55,${domColor}18)">${COVER_EMOJI[dom]||'🎵'}</div>
        <div style="flex:1;min-width:0">
          <div class="cw-track-song">${t.song}</div>
          <div class="cw-track-artist">${t.artist}</div>
          <div style="display:flex;gap:6px">
            <a class="cw-link sp" href="${t.spotify}" target="_blank" rel="noopener noreferrer">▶ Spotify</a>
            <a class="cw-link yt" href="${t.youtube}" target="_blank" rel="noopener noreferrer">▶ YouTube</a>
          </div>
        </div>`;
      tracksEl.appendChild(el);
    });

    // Scene 5
    const finalLines={
      calm:'You moved gently. That takes its own kind of strength.',
      chaos:"You burned. You're still here. The universe noticed.",
      reflective:'You looked inward more than most ever dare.',
      anxious:"You felt it all and didn't disappear. That's everything.",
      joyful:"You kept finding light. Don't stop.",
      empty:'The quiet was real. So were you.'
    };
    stage.querySelector('#cw-s5-sub').textContent=finalLines[dom]||'Every echo was real. This universe is yours.';
  }

  // ── SCENE NAV ──
  function goScene(idx, instant=false) {
    const stage=document.getElementById('cw-stage');
    if(!stage||idx<0||idx>=SCENES.length) return;
    const scenes=stage.querySelectorAll('.cw-scene');
    const dots=stage.querySelectorAll('.cw-dot');

    function doSwitch() {
      scenes.forEach((s,i)=>s.classList.toggle('active',i===idx));
      dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
      stage.querySelector('#cw-progress').style.width=`${((idx+1)/SCENES.length)*100}%`;
      currentScene=idx;
      buildOrbsForScene(idx);
      const cfg=SCENE_CAM[idx]||SCENE_CAM[0];
      camTargetZ=cfg.z; camTargetX=cfg.x; camTargetY=cfg.y;
      const nextBtn=stage.querySelector('#cw-next');
      nextBtn.textContent=idx===SCENES.length-1?'↩ Replay':'Next →';
      nextBtn.style.background=idx<SCENES.length-1?'#c9a84c':'rgba(255,255,255,.08)';
      nextBtn.style.color=idx<SCENES.length-1?'#000':'rgba(255,255,255,.7)';
      nextBtn.style.borderColor=idx<SCENES.length-1?'#c9a84c':'rgba(255,255,255,.12)';

      // Bars animation
      if(idx===2){
        setTimeout(()=>{
          document.querySelectorAll('#cw-s3-bars .cw-bar-fill').forEach(f=>{
            f.style.transform=`scaleX(${parseFloat(f.dataset.pct)/100})`;
          });
        },350);
      }
      // Core orb
      if(idx===1) setTimeout(animateCoreCanvas,80);
    }

    if(instant){doSwitch();return;}
    const wipe=stage.querySelector('#cw-wipe');
    wipe.style.opacity='1';
    setTimeout(()=>{ doSwitch(); setTimeout(()=>{wipe.style.opacity='0';},350); },300);
  }

  // ── OPEN / CLOSE ──
  function open() {
    wrappedData = computeWrappedData();
    currentScene = 0; phase = 0;
    particleGroups = [];

    const stage = buildOverlay();

    // Check for Three.js
    if(typeof THREE === 'undefined') {
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload=()=>{ initThree(stage.querySelector('#cw-canvas')); buildOrbsForScene(0); };
      document.head.appendChild(s);
    } else {
      setTimeout(()=>{ initThree(stage.querySelector('#cw-canvas')); buildOrbsForScene(0); },50);
    }

    populateScenes(stage);

    requestAnimationFrame(()=>{
      stage.style.opacity='1';
    });
  }

  function close() {
    const stage=document.getElementById('cw-stage');
    if(!stage) return;
    if(stage._kHandler) document.removeEventListener('keydown',stage._kHandler);
    stage.style.opacity='0';
    setTimeout(()=>{ destroyThree(); stage.remove(); },750);
  }

  return {open,close};
})();

/* ── WIRE NAV BUTTON ──
   REPLACE the existing nav-wrapped event listener in Nav module.
   Find: navBtns['wrapped'].addEventListener('click', () => show('wrapped'))
   Replace with: navBtns['wrapped'].addEventListener('click', () => CinematicWrapped.open())
   
   Or add this after the Nav module:
*/
// Override the wrapped nav button to open cinematic mode
setTimeout(()=>{
  const navWrapped = document.getElementById('nav-wrapped');
  if(navWrapped) {
    // Remove old listener by cloning
    const newBtn = navWrapped.cloneNode(true);
    navWrapped.parentNode.replaceChild(newBtn, navWrapped);
    newBtn.addEventListener('click', () => CinematicWrapped.open());
  }
}, 100);
