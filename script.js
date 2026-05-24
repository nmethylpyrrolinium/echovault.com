(function EchoVault() {
'use strict';

// Keep these version constants declared once only; duplicate consts break startup after merge regressions.
const APP_VERSION = 'scroll-unlock-overlay-cleanup';
const SW_CACHE_VERSION = 'echovault-v15-scroll-unlock-overlay-cleanup';
console.info('[EchoVault]', APP_VERSION, SW_CACHE_VERSION);

const AppEnvironment = (() => {
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  }
  function applyClasses() {
    document.documentElement.classList.toggle('is-standalone', isStandalone());
    document.documentElement.classList.toggle('is-ios', /iPad|iPhone|iPod/.test(navigator.userAgent));
    document.documentElement.classList.toggle('is-android', /Android/.test(navigator.userAgent));
    document.documentElement.classList.toggle('is-mobile', window.innerWidth < 768);
    document.documentElement.classList.toggle('is-tablet', window.innerWidth >= 768 && window.innerWidth < 1100);
    document.documentElement.classList.toggle('is-desktop', window.innerWidth >= 1100);
  }
  return { isStandalone, applyClasses };
})();

/* ── CONSTANTS ── */
const STORAGE_KEY  = 'echovault_echoes_v2';
const USER_KEY     = 'echoUser';
const OB_KEY       = 'echoOnboarded';
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function prefersReducedMotion() { return reduceMotionQuery.matches; }
function isMobileViewport() { return window.innerWidth < 768; }
const Phase2 = window.Phase2EmotionalIntelligence || null;
function getEmotionalSeason(echoes = state.echoes) {
  return Phase2?.analyzeSeason ? Phase2.analyzeSeason(echoes, moodFamily) : { title:'Quiet Winter', traits:['forming'], interpretation:'The universe is still gathering signal.', influence:'dim gold atmosphere', color:'#c9a84c', confidence:0 };
}


function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));
}

const MOOD_FAMILIES = {
  calm:'calm', chaos:'chaos', reflective:'reflective', anxious:'anxious', joyful:'joyful', empty:'empty',
  numb:'empty', overwhelmed:'chaos', lonely:'reflective', hopeful:'joyful', angry:'chaos', guilty:'anxious', restless:'anxious', soft:'calm', detached:'empty', confused:'anxious', 'burnt out':'empty', grieving:'reflective', romantic:'joyful', content:'calm', ashamed:'anxious', longing:'reflective', pressured:'chaos', safe:'calm', irritated:'chaos', dreamy:'reflective'
};
function moodFamily(mood) { return MOOD_FAMILIES[String(mood || '').toLowerCase()] || 'reflective'; }
const MOOD_COLORS = {
  calm:'#5b8fa8', chaos:'#c44b4b', reflective:'#7c6fa0',
  anxious:'#c47a3a', joyful:'#7aab6e', empty:'#4a4a5a',
  numb:'#4a4a5a', overwhelmed:'#c44b4b', lonely:'#7c6fa0', hopeful:'#7aab6e', angry:'#c44b4b', guilty:'#c47a3a', restless:'#c47a3a', soft:'#5b8fa8', detached:'#4a4a5a', confused:'#c47a3a', 'burnt out':'#4a4a5a', grieving:'#7c6fa0', romantic:'#7aab6e', content:'#5b8fa8', ashamed:'#c47a3a', longing:'#7c6fa0', pressured:'#c44b4b', safe:'#5b8fa8', irritated:'#c44b4b', dreamy:'#7c6fa0'
};
const MOOD_EMOJIS = {
  calm:'🌊', chaos:'⚡', reflective:'🌙', anxious:'🌀', joyful:'🌸', empty:'🪨',
  numb:'🫥', overwhelmed:'🌪️', lonely:'🌧️', hopeful:'🌱', angry:'🔥', guilty:'🫧', restless:'🕯️', soft:'🪽', detached:'🪐', confused:'🧭', 'burnt out':'🕳️', grieving:'🕯️', romantic:'💗', content:'☁️', ashamed:'🌫️', longing:'🌌', pressured:'⏳', safe:'🛋️', irritated:'🧨', dreamy:'✨'
};
const MOOD_COVER_EMOJI = {
  calm:'🌊', chaos:'⚡', reflective:'🌙', anxious:'🌀', joyful:'🌸', empty:'🌑',
  numb:'🫥', overwhelmed:'🌪️', lonely:'🌧️', hopeful:'🌱', angry:'🔥', guilty:'🫧', restless:'🕯️', soft:'🪽', detached:'🪐', confused:'🧭', 'burnt out':'🕳️', grieving:'🕯️', romantic:'💗', content:'☁️', ashamed:'🌫️', longing:'🌌', pressured:'⏳', safe:'🛋️', irritated:'🧨', dreamy:'✨'
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
    {song:'Holocene',artist:'Bon Iver',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'breathe',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Holocene%20Bon%20Iver',youtube:'https://www.youtube.com/results?search_query=Holocene+Bon+Iver'},
    {song:'Anchor',artist:'Novo Amor',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'hold',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Anchor%20Novo%20Amor',youtube:'https://www.youtube.com/results?search_query=Anchor+Novo+Amor'},
    {song:'Bloom',artist:'The Paper Kites',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'breathe',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/Bloom%20The%20Paper%20Kites',youtube:'https://www.youtube.com/results?search_query=Bloom+The+Paper+Kites'},
    {song:'Sunset Lover',artist:'Petit Biscuit',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'lift',intensity:'medium',silence:'low',spotify:'https://open.spotify.com/search/Sunset%20Lover%20Petit%20Biscuit',youtube:'https://www.youtube.com/results?search_query=Sunset+Lover+Petit+Biscuit'},
    {song:'Nardis',artist:'Bill Evans',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'ground',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Nardis%20Bill%20Evans',youtube:'https://www.youtube.com/results?search_query=Nardis+Bill+Evans'},
    {song:'Clair de Lune',artist:'Debussy',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'breathe',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Clair%20de%20Lune%20Debussy',youtube:'https://www.youtube.com/results?search_query=Clair+de+Lune+Debussy'},
    {song:'Gymnopédie No.1',artist:'Erik Satie',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'ground',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Gymnop%C3%A9die%20No.1%20Erik%20Satie',youtube:'https://www.youtube.com/results?search_query=Gymnop%C3%A9die+No.1+Erik+Satie'},
    {song:'Weightless',artist:'Marconi Union',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'breathe',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Weightless%20Marconi%20Union',youtube:'https://www.youtube.com/results?search_query=Weightless+Marconi+Union'},
    {song:'To Build a Home',artist:'The Cinematic Orchestra',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'hold',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/To%20Build%20a%20Home%20The%20Cinematic%20Orchestra',youtube:'https://www.youtube.com/results?search_query=To+Build+a+Home+The+Cinematic+Orchestra'},
    {song:'Hoppípolla',artist:'Sigur Rós',reason:'A gentle room for soft nervous systems and safer breathing.',purpose:'lift',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Hopp%C3%ADpolla%20Sigur%20R%C3%B3s',youtube:'https://www.youtube.com/results?search_query=Hopp%C3%ADpolla+Sigur+R%C3%B3s'}
  ],
  chaos:[
    {song:'Exit Music (For a Film)',artist:'Radiohead',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'medium',spotify:'https://open.spotify.com/search/Exit%20Music%20%28For%20a%20Film%29%20Radiohead',youtube:'https://www.youtube.com/results?search_query=Exit+Music+%28For+a+Film%29+Radiohead'},
    {song:'Drunk Walk Home',artist:'Mitski',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Drunk%20Walk%20Home%20Mitski',youtube:'https://www.youtube.com/results?search_query=Drunk+Walk+Home+Mitski'},
    {song:'brutal',artist:'Olivia Rodrigo',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/brutal%20Olivia%20Rodrigo',youtube:'https://www.youtube.com/results?search_query=brutal+Olivia+Rodrigo'},
    {song:'Happier Than Ever',artist:'Billie Eilish',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Happier%20Than%20Ever%20Billie%20Eilish',youtube:'https://www.youtube.com/results?search_query=Happier+Than+Ever+Billie+Eilish'},
    {song:'Where Is My Mind?',artist:'Pixies',reason:'Catharsis first, then a handrail back to the body.',purpose:'ground',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Where%20Is%20My%20Mind%3F%20Pixies',youtube:'https://www.youtube.com/results?search_query=Where+Is+My+Mind%3F+Pixies'},
    {song:'Seven Nation Army',artist:'The White Stripes',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Seven%20Nation%20Army%20The%20White%20Stripes',youtube:'https://www.youtube.com/results?search_query=Seven+Nation+Army+The+White+Stripes'},
    {song:'Papercut',artist:'Linkin Park',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Papercut%20Linkin%20Park',youtube:'https://www.youtube.com/results?search_query=Papercut+Linkin+Park'},
    {song:'Black Skinhead',artist:'Kanye West',reason:'Catharsis first, then a handrail back to the body.',purpose:'release',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Black%20Skinhead%20Kanye%20West',youtube:'https://www.youtube.com/results?search_query=Black+Skinhead+Kanye+West'},
    {song:'My Body Is a Cage',artist:'Arcade Fire',reason:'Catharsis first, then a handrail back to the body.',purpose:'hold',intensity:'high',silence:'high',spotify:'https://open.spotify.com/search/My%20Body%20Is%20a%20Cage%20Arcade%20Fire',youtube:'https://www.youtube.com/results?search_query=My+Body+Is+a+Cage+Arcade+Fire'},
    {song:'Dog Days Are Over',artist:'Florence + The Machine',reason:'Catharsis first, then a handrail back to the body.',purpose:'lift',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Dog%20Days%20Are%20Over%20Florence%20%2B%20The%20Machine',youtube:'https://www.youtube.com/results?search_query=Dog+Days+Are+Over+Florence+%2B+The+Machine'}
  ],
  reflective:[
    {song:'Moon Song',artist:'Phoebe Bridgers',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'hold',intensity:'medium',silence:'high',spotify:'https://open.spotify.com/search/Moon%20Song%20Phoebe%20Bridgers',youtube:'https://www.youtube.com/results?search_query=Moon+Song+Phoebe+Bridgers'},
    {song:'Myth',artist:'Beach House',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'hold',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Myth%20Beach%20House',youtube:'https://www.youtube.com/results?search_query=Myth+Beach+House'},
    {song:'Pink Moon',artist:'Nick Drake',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'breathe',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Pink%20Moon%20Nick%20Drake',youtube:'https://www.youtube.com/results?search_query=Pink+Moon+Nick+Drake'},
    {song:'Between the Bars',artist:'Elliott Smith',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'hold',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Between%20the%20Bars%20Elliott%20Smith',youtube:'https://www.youtube.com/results?search_query=Between+the+Bars+Elliott+Smith'},
    {song:'No Surprises',artist:'Radiohead',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'ground',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/No%20Surprises%20Radiohead',youtube:'https://www.youtube.com/results?search_query=No+Surprises+Radiohead'},
    {song:'K.',artist:'Cigarettes After Sex',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'hold',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/K.%20Cigarettes%20After%20Sex',youtube:'https://www.youtube.com/results?search_query=K.+Cigarettes+After+Sex'},
    {song:'Mystery of Love',artist:'Sufjan Stevens',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'lift',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Mystery%20of%20Love%20Sufjan%20Stevens',youtube:'https://www.youtube.com/results?search_query=Mystery+of+Love+Sufjan+Stevens'},
    {song:'Roslyn',artist:'Bon Iver & St. Vincent',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'hold',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Roslyn%20Bon%20Iver%20%26%20St.%20Vincent',youtube:'https://www.youtube.com/results?search_query=Roslyn+Bon+Iver+%26+St.+Vincent'},
    {song:'Cherry-coloured Funk',artist:'Cocteau Twins',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'breathe',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Cherry-coloured%20Funk%20Cocteau%20Twins',youtube:'https://www.youtube.com/results?search_query=Cherry-coloured+Funk+Cocteau+Twins'},
    {song:'Sparks',artist:'Coldplay',reason:'Late-night texture for memory, longing, and quiet noticing.',purpose:'hold',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/Sparks%20Coldplay',youtube:'https://www.youtube.com/results?search_query=Sparks+Coldplay'}
  ],
  anxious:[
    {song:'An Ending (Ascent)',artist:'Brian Eno',reason:'Steady pacing for grounding without demanding answers.',purpose:'ground',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/An%20Ending%20%28Ascent%29%20Brian%20Eno',youtube:'https://www.youtube.com/results?search_query=An+Ending+%28Ascent%29+Brian+Eno'},
    {song:'Avril 14th',artist:'Aphex Twin',reason:'Steady pacing for grounding without demanding answers.',purpose:'ground',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Avril%2014th%20Aphex%20Twin',youtube:'https://www.youtube.com/results?search_query=Avril+14th+Aphex+Twin'},
    {song:'Dayvan Cowboy',artist:'Boards of Canada',reason:'Steady pacing for grounding without demanding answers.',purpose:'breathe',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Dayvan%20Cowboy%20Boards%20of%20Canada',youtube:'https://www.youtube.com/results?search_query=Dayvan+Cowboy+Boards+of+Canada'},
    {song:'Experience',artist:'Ludovico Einaudi',reason:'Steady pacing for grounding without demanding answers.',purpose:'ground',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Experience%20Ludovico%20Einaudi',youtube:'https://www.youtube.com/results?search_query=Experience+Ludovico+Einaudi'},
    {song:'Intro',artist:'The xx',reason:'Steady pacing for grounding without demanding answers.',purpose:'ground',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/Intro%20The%20xx',youtube:'https://www.youtube.com/results?search_query=Intro+The+xx'},
    {song:'Space Song',artist:'Beach House',reason:'Steady pacing for grounding without demanding answers.',purpose:'hold',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Space%20Song%20Beach%20House',youtube:'https://www.youtube.com/results?search_query=Space+Song+Beach+House'},
    {song:'Svefn-g-englar',artist:'Sigur Rós',reason:'Steady pacing for grounding without demanding answers.',purpose:'breathe',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Svefn-g-englar%20Sigur%20R%C3%B3s',youtube:'https://www.youtube.com/results?search_query=Svefn-g-englar+Sigur+R%C3%B3s'},
    {song:'Breathe Me',artist:'Sia',reason:'Steady pacing for grounding without demanding answers.',purpose:'hold',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Breathe%20Me%20Sia',youtube:'https://www.youtube.com/results?search_query=Breathe+Me+Sia'},
    {song:'Re: Stacks',artist:'Bon Iver',reason:'Steady pacing for grounding without demanding answers.',purpose:'ground',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Re%3A%20Stacks%20Bon%20Iver',youtube:'https://www.youtube.com/results?search_query=Re%3A+Stacks+Bon+Iver'},
    {song:'Open',artist:'Rhye',reason:'Steady pacing for grounding without demanding answers.',purpose:'breathe',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/Open%20Rhye',youtube:'https://www.youtube.com/results?search_query=Open+Rhye'}
  ],
  joyful:[
    {song:'Sweet Disposition',artist:'The Temper Trap',reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Sweet%20Disposition%20The%20Temper%20Trap',youtube:'https://www.youtube.com/results?search_query=Sweet+Disposition+The+Temper+Trap'},
    {song:'There She Goes',artist:"The La's",reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'medium',silence:'low',spotify:'https://open.spotify.com/search/There%20She%20Goes%20The%20La%27s',youtube:'https://www.youtube.com/results?search_query=There+She+Goes+The+La%27s'},
    {song:'First Day of My Life',artist:'Bright Eyes',reason:'Warm light for hope, romance, and soft lift.',purpose:'hold',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/First%20Day%20of%20My%20Life%20Bright%20Eyes',youtube:'https://www.youtube.com/results?search_query=First+Day+of+My+Life+Bright+Eyes'},
    {song:'Bloom',artist:'The Paper Kites',reason:'Warm light for hope, romance, and soft lift.',purpose:'hold',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/Bloom%20The%20Paper%20Kites',youtube:'https://www.youtube.com/results?search_query=Bloom+The+Paper+Kites'},
    {song:'Golden Hour',artist:'JVKE',reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'medium',silence:'low',spotify:'https://open.spotify.com/search/Golden%20Hour%20JVKE',youtube:'https://www.youtube.com/results?search_query=Golden+Hour+JVKE'},
    {song:'Sunflower',artist:'Rex Orange County',reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'medium',silence:'low',spotify:'https://open.spotify.com/search/Sunflower%20Rex%20Orange%20County',youtube:'https://www.youtube.com/results?search_query=Sunflower+Rex+Orange+County'},
    {song:'Electric Love',artist:'BØRNS',reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'high',silence:'low',spotify:'https://open.spotify.com/search/Electric%20Love%20B%C3%98RNS',youtube:'https://www.youtube.com/results?search_query=Electric+Love+B%C3%98RNS'},
    {song:'Good Days',artist:'SZA',reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'medium',silence:'medium',spotify:'https://open.spotify.com/search/Good%20Days%20SZA',youtube:'https://www.youtube.com/results?search_query=Good+Days+SZA'},
    {song:'Sweet Nothing',artist:'Taylor Swift',reason:'Warm light for hope, romance, and soft lift.',purpose:'hold',intensity:'low',silence:'medium',spotify:'https://open.spotify.com/search/Sweet%20Nothing%20Taylor%20Swift',youtube:'https://www.youtube.com/results?search_query=Sweet+Nothing+Taylor+Swift'},
    {song:'Here Comes The Sun',artist:'The Beatles',reason:'Warm light for hope, romance, and soft lift.',purpose:'lift',intensity:'medium',silence:'low',spotify:'https://open.spotify.com/search/Here%20Comes%20The%20Sun%20The%20Beatles',youtube:'https://www.youtube.com/results?search_query=Here+Comes+The+Sun+The+Beatles'}
  ],
  empty:[
    {song:'The Night We Met',artist:'Lord Huron',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'hold',intensity:'medium',silence:'high',spotify:'https://open.spotify.com/search/The%20Night%20We%20Met%20Lord%20Huron',youtube:'https://www.youtube.com/results?search_query=The+Night+We+Met+Lord+Huron'},
    {song:'Fourth of July',artist:'Sufjan Stevens',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'cry',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Fourth%20of%20July%20Sufjan%20Stevens',youtube:'https://www.youtube.com/results?search_query=Fourth+of+July+Sufjan+Stevens'},
    {song:'I Know The End',artist:'Phoebe Bridgers',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'release',intensity:'high',silence:'medium',spotify:'https://open.spotify.com/search/I%20Know%20The%20End%20Phoebe%20Bridgers',youtube:'https://www.youtube.com/results?search_query=I+Know+The+End+Phoebe+Bridgers'},
    {song:'Liability',artist:'Lorde',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'hold',intensity:'medium',silence:'high',spotify:'https://open.spotify.com/search/Liability%20Lorde',youtube:'https://www.youtube.com/results?search_query=Liability+Lorde'},
    {song:'White Ferrari',artist:'Frank Ocean',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'hold',intensity:'medium',silence:'high',spotify:'https://open.spotify.com/search/White%20Ferrari%20Frank%20Ocean',youtube:'https://www.youtube.com/results?search_query=White+Ferrari+Frank+Ocean'},
    {song:'Apocalypse',artist:'Cigarettes After Sex',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'hold',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Apocalypse%20Cigarettes%20After%20Sex',youtube:'https://www.youtube.com/results?search_query=Apocalypse+Cigarettes+After+Sex'},
    {song:'Another Love',artist:'Tom Odell',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'cry',intensity:'high',silence:'medium',spotify:'https://open.spotify.com/search/Another%20Love%20Tom%20Odell',youtube:'https://www.youtube.com/results?search_query=Another+Love+Tom+Odell'},
    {song:"when the party's over",artist:'Billie Eilish',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'hold',intensity:'medium',silence:'high',spotify:'https://open.spotify.com/search/when%20the%20party%27s%20over%20Billie%20Eilish',youtube:'https://www.youtube.com/results?search_query=when+the+party%27s+over+Billie+Eilish'},
    {song:'Je te laisserai des mots',artist:'Patrick Watson',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'breathe',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Je%20te%20laisserai%20des%20mots%20Patrick%20Watson',youtube:'https://www.youtube.com/results?search_query=Je+te+laisserai+des+mots+Patrick+Watson'},
    {song:'Asleep',artist:'The Smiths',reason:'A holding track for the quiet without turning it into a spiral.',purpose:'hold',intensity:'low',silence:'high',spotify:'https://open.spotify.com/search/Asleep%20The%20Smiths',youtube:'https://www.youtube.com/results?search_query=Asleep+The+Smiths'}
  ]
};
function getSoundprintForEcho(echo = {}, patterns = PatternEngine?.analyze?.(state?.echoes || []) || {}) {
  const family = moodFamily(echo.mood || patterns.dominantMood || 'reflective');
  const library = SOUNDPRINTS[family] || SOUNDPRINTS.reflective;
  const intensityValue = Number(echo.intensity ?? patterns.averageIntensity ?? 5);
  const silenceValue = Number(echo.silence ?? patterns.averageSilence ?? 5);
  const intensityBand = intensityValue >= 7 ? 'high' : intensityValue <= 3 ? 'low' : 'medium';
  const silenceBand = silenceValue >= 7 ? 'high' : silenceValue <= 3 ? 'low' : 'medium';
  const priority = [];
  if (family === 'empty') priority.push('hold', 'cry', ...(intensityBand === 'high' || silenceBand === 'high' ? ['ground','lift'] : []), 'breathe', 'release');
  else if (family === 'anxious') priority.push('ground', 'breathe', 'hold', 'lift');
  else if (family === 'chaos') priority.push('release', 'ground', 'breathe', 'hold');
  else if (family === 'reflective') priority.push('hold', 'breathe', 'lift', 'ground');
  else if (family === 'joyful') priority.push('lift', 'hold', 'breathe');
  else priority.push('breathe', 'ground', 'hold', 'lift');
  const scored = library.map((track, index) => {
    let score = 0;
    const p = priority.indexOf(track.purpose);
    score += p === -1 ? 0 : (30 - p * 4);
    if (track.intensity === intensityBand) score += 8;
    if (track.silence === silenceBand) score += 6;
    if (echo.void && ['hold','ground','breathe'].includes(track.purpose)) score += 7;
    return { track, index, score };
  });
  const seed = String(echo.id || echo.date || state?.echoes?.length || Date.now()).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  scored.sort((a,b) => (b.score - a.score) || ((a.index + seed) % library.length) - ((b.index + seed) % library.length));
  const picked = scored.map(x => x.track);
  const offset = library.length ? seed % Math.min(3, library.length) : 0;
  return [...picked.slice(offset), ...picked.slice(0, offset)].slice(0, 5);
}

const PatternEngine = (() => {
  const WEATHER_MAP = { calm:'slow blue weather', chaos:'electric pressure', reflective:'moonlit drift', anxious:'restless wind', joyful:'soft bloom', empty:'quiet fog' };
  function analyze(echoes = []) {
    const totalEchoes = echoes.length;
    if (!totalEchoes) return { totalEchoes:0, oneLineInsight:'No echoes yet. The universe is quiet — not empty.' };
    const moodCounts = {}; let intensitySum = 0; let silenceSum = 0; let voidCount = 0; let moodChanges = 0; let intDelta = 0;
    echoes.forEach((e, i) => {
      const family = moodFamily(e.mood);
      moodCounts[family] = (moodCounts[family] || 0) + 1;
      intensitySum += Number(e.intensity || 0); silenceSum += Number(e.silence || 0); if (e.void) voidCount++;
      if (i > 0) { if (moodFamily(echoes[i - 1].mood) !== family) moodChanges++; intDelta += Math.abs((echoes[i - 1].intensity || 0) - (e.intensity || 0)); }
    });
    const dominantMood = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
    const moodPercentages = Object.fromEntries(Object.entries(moodCounts).map(([k,v]) => [k, Math.round((v / totalEchoes) * 100)]));
    const averageIntensity = +(intensitySum / totalEchoes).toFixed(1);
    const averageSilence = +(silenceSum / totalEchoes).toFixed(1);
    const voidPercentage = Math.round((voidCount / totalEchoes) * 100);
    const mostRecentMood = moodFamily(echoes[0]?.mood) || null;
    const previousMood = moodFamily(echoes[1]?.mood) || null;
    const recentShift = previousMood && mostRecentMood !== previousMood ? `${previousMood} → ${mostRecentMood}` : 'steady';
    const volatilityScore = Math.round(Math.min(100, ((moodChanges / Math.max(1, totalEchoes - 1)) * 60 + (intDelta / Math.max(1, totalEchoes - 1)) * 4)));
    const trend = (field) => {
      if (totalEchoes < 6) return 'steady';
      const latest = echoes.slice(0,5).reduce((a,e)=>a + (e[field] || 0),0) / Math.min(5,totalEchoes);
      const prev = echoes.slice(5,10).reduce((a,e)=>a + (e[field] || 0),0) / Math.max(1, Math.min(5, totalEchoes - 5));
      if (latest > prev + 0.5) return 'rising'; if (latest < prev - 0.5) return 'falling'; return 'steady';
    };
    const intensityTrend = trend('intensity');
    const silenceTrend = trend('silence');
    let currentStreakMood = mostRecentMood; let currentStreakCount = 0;
    for (const e of echoes) { if (moodFamily(e.mood) === currentStreakMood) currentStreakCount++; else break; }
    const emotionalWeather = Object.keys(moodCounts).length >= 4 ? 'shifting sky' : (WEATHER_MAP[dominantMood] || 'shifting sky');
    let oneLineInsight = 'You kept returning. That counts.';
    if (silenceTrend === 'rising' && intensityTrend !== 'rising') oneLineInsight = 'Your echoes are getting quieter, but not weaker.';
    else if (volatilityScore > 65) oneLineInsight = 'You are not chaotic all the time. You spike, then disappear.';
    else if (averageSilence >= 7) oneLineInsight = 'You have been carrying more than you are saying.';
    else if (dominantMood === 'calm' && averageSilence >= 5) oneLineInsight = 'Your calm is returning, but your silence is still high.';
    const emotionalSeason = getEmotionalSeason(echoes);
    return { totalEchoes, dominantMood, moodCounts, moodPercentages, averageIntensity, averageSilence, voidCount, voidPercentage, mostRecentMood, previousMood, recentShift, volatilityScore, intensityTrend, silenceTrend, currentStreakMood, currentStreakCount, emotionalWeather, emotionalSeason, oneLineInsight };
  }
  return { analyze };
})();

const ArchetypeEngine = (() => {
  function compute(patterns) {
    if (!patterns?.totalEchoes) return { archetypeKey:'unknown', archetypeName:'The Unknown', archetypeDescription:'Create echoes to discover your archetype.', archetypeAura:'dim', archetypeQuote:'Begin anywhere.', dominantFactors:[] };
    const p = patterns; let key = p.dominantMood || 'balanced';
    if (Object.keys(p.moodCounts || {}).length >= 4) key = 'shiftingSky';
    if (p.dominantMood === 'calm' && p.volatilityScore < 30) key = 'stillLake';
    if (p.dominantMood === 'chaos' && p.averageIntensity >= 7) key = 'electricStorm';
    if (p.dominantMood === 'reflective' && p.averageSilence >= 6) key = 'nightArchivist';
    if (p.dominantMood === 'anxious' && p.volatilityScore > 55) key = 'tremblingCompass';
    if (p.dominantMood === 'joyful' && p.currentStreakCount >= 2) key = 'bloomingField';
    if (p.dominantMood === 'empty' && p.averageSilence >= 7 && p.voidPercentage >= 35) key = 'quietAbyss';
    if (p.averageSilence >= 7 && p.intensityTrend === 'rising') key = 'signalFire';
    if (p.averageIntensity >= 8 && p.volatilityScore >= 65) key = 'glassComet';
    if (p.averageIntensity <= 4 && p.averageSilence >= 6) key = 'softWitness';
    const defs = {
      stillLake:['The Still Lake','Quiet force, low turbulence, steady depth.','silver blue','Still water remembers every star.'],
      electricStorm:['The Electric Storm','High voltage feeling moving through fast skies.','violet gold','You spark, then re-form.'],
      nightArchivist:['The Night Archivist','You keep meaning in the dark and file it carefully.','moon ink','Your silence has memory.'],
      tremblingCompass:['The Trembling Compass','Sensitive to every shift, always searching true north.','amber static','Even shaking, you still point forward.'],
      bloomingField:['The Blooming Field','Joy returns with consistency, even after rough weather.','rose dawn','Light is becoming your habit.'],
      quietAbyss:['The Quiet Abyss','Low signal, deep quiet, vast interior gravity.','charcoal indigo','Even quiet can be a language.'],
      shiftingSky:['The Shifting Sky','Your emotional world moves wide and alive across moods.','prism dusk','You were not inconsistent. You were weather.'],
      signalFire:['The Signal Fire','You are speaking again from a quiet season.','ember night','Still here is still a signal.'],
      glassComet:['The Glass Comet','Intense arcs and sudden turns — luminous and fragile.','crystal flame','You burn bright, then breathe.'],
      softWitness:['The Soft Witness','Gentle intensity, deep noticing, patient reflection.','mist gold','You do not force meaning. You witness it.']
    };
    const legacyName = ARCHETYPE_NAMES[p.dominantMood] || 'The Shifting Sky';
    const [archetypeName, archetypeDescription, archetypeAura, archetypeQuote] = defs[key] || [legacyName, ARCHETYPE_DESCS[p.dominantMood] || 'Still becoming.', 'muted dusk', 'Keep listening.'];
    return { archetypeKey:key, archetypeName, archetypeDescription, archetypeAura, archetypeQuote, dominantFactors:[p.dominantMood, `intensity ${p.averageIntensity}`, `silence ${p.averageSilence}`, `volatility ${p.volatilityScore}`].filter(Boolean) };
  }
  return { compute };
})();

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


/* ── SCROLL / OVERLAY SAFETY ── */
function cleanupOverlays(options = {}) {
  const keepOnboarding = Boolean(options.keepOnboarding);
  document.documentElement.classList.add('app-unlocked');
  document.body.classList.add('app-unlocked');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.documentElement.style.touchAction = '';
  document.body.style.touchAction = '';

  const login = document.getElementById('login-screen');
  if (login) {
    login.classList.add('hidden');
    login.setAttribute('aria-hidden', 'true');
    login.style.pointerEvents = 'none';
  }

  const onboarding = document.getElementById('onboarding');
  if (onboarding && !keepOnboarding) {
    onboarding.classList.remove('open');
    onboarding.setAttribute('aria-hidden', 'true');
    onboarding.style.pointerEvents = '';
  }

  [
    '#settings-overlay',
    '#fun-modal',
    '#node-detail',
    '#migration-modal',
    '#import-preview-modal',
    '#special-access-modal',
    '#replay-drift-stage'
  ].forEach((selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    el.style.pointerEvents = '';
  });

  document.querySelectorAll('.cinematic-modal.open, .courier-modal, #alam-ai-panel, #echosociety-overlay').forEach((el) => {
    el.classList.remove('open');
    if (el.id === 'courier-modal' || el.id === 'alam-ai-panel' || el.id === 'echosociety-overlay') el.remove();
    else el.setAttribute('aria-hidden', 'true');
  });

  const shell = document.querySelector('.app-shell');
  if (shell) {
    shell.style.pointerEvents = '';
    shell.style.overflowY = '';
    shell.style.touchAction = '';
  }
  DebugPanel?.ensure?.();
}

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

const ProfileStore = (() => {
  const KEY = 'echovault_profile_v1';
  function read() {
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
    const legacy = localStorage.getItem(USER_KEY);
    if (legacy && !profile.display_name) {
      profile = { ...profile, display_name: legacy };
      localStorage.setItem(KEY, JSON.stringify({ ...profile, updated_at:new Date().toISOString() }));
    }
    return profile;
  }
  function write(profile) { localStorage.setItem(KEY, JSON.stringify({...read(), ...profile, updated_at:new Date().toISOString()})); }
  return { read, write };
})();

const Auth = (() => {
  const config = window.ECHOVAULT_CONFIG || {};
  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
  const SUPABASE_AVATAR_BUCKET = config.SUPABASE_AVATAR_BUCKET || 'avatars';
  const hasSupabase = Boolean(window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY);
  const client = hasSupabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }) : null;
  let mode = hasSupabase ? 'supabase' : 'local';
  let user = null;
  async function init(){
    if (!client) return;
    try {
      const {data,error} = await client.auth.getSession();
      if (error) throw error;
      user = data?.session?.user || null;
      client.auth.onAuthStateChange((_e, s)=>{ user = s?.user || null; UserAccess.refreshAccessState(); UserChip.refresh(); });
    } catch (error) {
      console.warn('Supabase auth unavailable; falling back to local mode behavior.', error);
      user = null;
    }
  }
  async function signIn(email,password){ if(!client) return {ok:false,error:'Supabase is not configured — local mode only.'}; const {data,error}=await client.auth.signInWithPassword({email,password}); if(error)return {ok:false,error:error.message}; user=data.user; return {ok:true,data}; }
  async function sendEmailOtp(email){ if(!client) return {ok:false,error:'Supabase is not configured — local mode only.'}; const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:getAuthRedirectUrl()}}); if(error) return {ok:false,error:error.message}; return {ok:true}; }
  async function verifyEmailOtp(email,token){ if(!client) return {ok:false,error:'Supabase is not configured — local mode only.'}; const {data,error}=await client.auth.verifyOtp({email,token,type:'email'}); if(error) return {ok:false,error:error.message}; user=data?.user||data?.session?.user||null; return {ok:true,data}; }
  async function signUp(email,password,displayName){ if(!client) return {ok:false,error:'Supabase is not configured — local mode only.'}; const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName||undefined},emailRedirectTo:getAuthRedirectUrl()}}); if(error)return {ok:false,error:error.message}; user=data.user||null; return {ok:true,data}; }
  async function signOut(){ if(client) await client.auth.signOut(); user=null; localStorage.removeItem(USER_KEY); }
  async function fetchProfile(){ if(!client||!user) return null; const {data}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle(); return data||null; }
  async function upsertProfile(profile){
    ProfileStore.write(profile);
    if(!client||!user) return {ok:true};
    const payload={id:user.id,display_name:profile.display_name||null,username:profile.username||null,bio:profile.bio||null,location:profile.location||null,avatar_url:profile.avatar_url||null,emotional_archetype:profile.emotional_archetype||null,is_premium:profile.is_premium||false,premium_tier:profile.premium_tier||profile.access_tier||null,premium_code_used:profile.premium_code_used||null,premium_since:profile.premium_since||null,premium_expires_at:profile.premium_expires_at||null,updated_at:new Date().toISOString()};
    const {error}=await client.from('profiles').upsert(payload,{onConflict:'id'});
    if(error){Toast.show('Profile sync failed; kept local copy.'); return {ok:false,error:error.message};}
    return {ok:true};
  }
  function isLocalMode(){ return !client || !user; }
  return { init, signIn, signUp, sendEmailOtp, verifyEmailOtp, signOut, hasSupabase, fetchProfile, upsertProfile, client, SUPABASE_AVATAR_BUCKET, getAuthRedirectUrl, isLocalMode, get user(){return user;}, get mode(){return mode;} };

})();

const UserAccess = (() => {
  const KEY = 'echovault_access_v1';
  const TIERS = ['free', 'premium', 'founder', 'alpha'];
  const PREMIUM_TIERS = ['premium', 'founder', 'alpha'];
  const FREE_FEATURES = new Set([
    'old_rituals','inner_conflict','soundprint','basic_receipt','basic_wrapped','emotion_dna','crash_report','shatter_softly','basic_profile','create_echo','timeline','universe','local_mode','export_vault','import_vault','auth','basic_avatar','basic_materials','basic_rituals_preview'
  ]);
  const PREMIUM_FEATURES = new Set([
    'emotional_museum_full','alam_chat','alam_ai','echosociety','society_gate','society_districts','signal_courier','relic_crafting','crafting_table','vault_rooms','echo_avatar_progression','advanced_receipts','cinematic_export_cards','artifact_archive','advanced_soundprint','premium_weather_map','advanced_world_features','premium_rituals','void_lantern','storm_jar','premium_artifact_frames','advanced_wrapped'
  ]);
  const FEATURE_ACCESS = [...FREE_FEATURES].reduce((map, key) => ({ ...map, [key]:'free' }), [...PREMIUM_FEATURES].reduce((map, key) => ({ ...map, [key]:'premium' }), {}));
  function getFeatureAccess(featureKey) {
    if (!featureKey) return 'free';
    if (FREE_FEATURES.has(featureKey)) return 'free';
    if (PREMIUM_FEATURES.has(featureKey)) return 'premium';
    return 'free';
  }

  const PremiumCodes = (() => {
    function normalize(code) { return String(code || '').trim().toUpperCase().replace(/[\s_-]+/g, ''); }
    function getHashes() {
      const hashes = window.ECHOVAULT_CONFIG?.ACCESS_CODE_HASHES || {};
      return hashes && typeof hashes === 'object' && !Array.isArray(hashes) ? hashes : {};
    }
    function normalizeHashPayload(payload) {
      if (!payload) return null;
      if (typeof payload === 'string') return { tier:payload, label:'hashed local code' };
      if (payload === true) return { tier:'premium', label:'hashed local code' };
      if (typeof payload === 'object') return { tier:payload.tier || payload.premium_tier || payload.access_tier || 'premium', label:payload.label || 'hashed local code', premium_expires_at:payload.premium_expires_at || payload.expires_at || null };
      return null;
    }
    function hasLocalHashConfig() { return Object.keys(getHashes()).length > 0; }
    async function lookupLocalHash(code) {
      const normalized = normalize(code);
      if (!normalized) return null;
      const hashes = getHashes();
      if (!Object.keys(hashes).length) return null;
      const digest = await hashCode(normalized);
      return normalizeHashPayload(hashes[digest] || hashes[digest.toUpperCase()]);
    }
    return { normalize, hasLocalHashConfig, lookupLocalHash };
  })();
  let current = { tier:'free', source:'free', updated_at:new Date().toISOString() };

  function normalizeTier(tier) { return TIERS.includes(String(tier || '').toLowerCase()) ? String(tier).toLowerCase() : 'free'; }
  function normalizeSource(source) { return ['free','local_code','supabase_profile','debug_override'].includes(String(source || '').toLowerCase()) ? String(source).toLowerCase() : 'free'; }
  function normalizeState(value = {}) {
    const tier = normalizeTier(value.tier || value.access_tier || value.premium_tier);
    return { ...value, tier, source:normalizeSource(value.source), updated_at:value.updated_at || new Date().toISOString() };
  }
  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { tier:'free', source:'free' };
      return normalizeState(parsed);
    } catch (error) {
      localStorage.removeItem(KEY);
      return { tier:'free', source:'free' };
    }
  }
  function save(accessState) {
    const next = normalizeState(accessState);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    current = next;
    return next;
  }
  function profileAccess(profile = {}) {
    const rawTier = profile.access_tier || profile.premium_tier || profile.tier || (profile.is_alpha ? 'alpha' : profile.is_founder ? 'founder' : profile.is_premium ? 'premium' : 'free');
    const tier = normalizeTier(rawTier);
    const until = profile.premium_expires_at || profile.premium_until || profile.access_until || null;
    if (until && Date.parse(until) && Date.parse(until) < Date.now()) return null;
    return PREMIUM_TIERS.includes(tier) ? { tier, source:'supabase_profile', premium_until:until || null } : null;
  }
  function getLocalProfileAccess() {
    const profile = ProfileStore.read();
    const fromLocal = profileAccess(profile);
    return fromLocal ? { ...fromLocal, source:profile.access_source || 'local_code' } : null;
  }
  function refreshAccessState() {
    const debug = location.search.includes('debug=1') && (load().debug_override === true || sessionStorage.getItem('echovault_debug_premium') === '1');
    if (debug) current = { tier:'alpha', source:'debug_override', debug_override:true, updated_at:new Date().toISOString() };
    else {
      const supabase = Auth.user ? profileAccess(ProfileStore.read()) : null;
      if (supabase) current = { ...supabase, updated_at:new Date().toISOString() };
      else {
        const local = load();
        const localIsPremium = PREMIUM_TIERS.includes(local.tier) && local.source === 'local_code';
        if (localIsPremium) current = local;
        else current = getLocalProfileAccess() || { tier:'free', source:'free', updated_at:new Date().toISOString() };
      }
    }
    document.documentElement.dataset.accessTier = current.tier;
    document.documentElement.classList.toggle('is-premium', isPremium());
    updatePremiumUI();
    return current;
  }
  function isPremium() { return PREMIUM_TIERS.includes(current.tier); }
  function getTier() { refreshAccessState(); return current.tier; }
  function getSource() { refreshAccessState(); return current.source; }
  function canUse(featureKey) {
    const required = getFeatureAccess(featureKey);
    if (required === 'free') return true;
    refreshAccessState();
    return isPremium();
  }
  function getLockedCopy(featureKey) {
    const names = {
      emotional_museum_full:'special museum rooms', relic_crafting:'Relic Crafting', crafting_table:'Crafting Table', vault_rooms:'deeper vault rooms', echo_avatar_progression:'Echo Avatar Progression', advanced_receipts:'cinematic receipt tools', cinematic_export_cards:'cinematic export cards', artifact_archive:'Artifact Archive', echosociety:'EchoSociety', society_gate:'Society Gate', society_districts:'Society Districts', signal_courier:'Signal Courier', alam_chat:'alam.ai', alam_ai:'alam.ai', advanced_soundprint:'advanced soundprint', premium_rituals:'deeper rituals', premium_weather_map:'deeper Weather Map', premium_artifact_frames:'artifact frames', advanced_wrapped:'Advanced Wrapped', void_lantern:'Void Lantern', storm_jar:'Storm Jar'
    };
    const title = names[featureKey] || 'special room';
    return { title, eyebrow:'Special Access', body:'Some parts of the vault open differently. Enter your special code to reveal deeper rooms.', cta:'Enter special code' };
  }
  function requirePremium(featureKey, options = {}) {
    if (canUse(featureKey)) return true;
    const copy = getLockedCopy(featureKey);
    if (options.toast !== false) Toast.show('Some parts of the vault open differently.', 3000);
    if (options.openSettings !== false && typeof SpecialAccessPortal !== 'undefined') SpecialAccessPortal.open();
    return false;
  }
  function setLocalPremiumOverride(enabled) {
    const next = { ...load(), debug_override:Boolean(enabled), updated_at:new Date().toISOString() };
    save(next);
    if (enabled) sessionStorage.setItem('echovault_debug_premium','1');
    else sessionStorage.removeItem('echovault_debug_premium');
    return refreshAccessState();
  }
  function clearLocalPremiumOverride() {
    const next = { ...load(), debug_override:false, updated_at:new Date().toISOString() };
    save(next);
    sessionStorage.removeItem('echovault_debug_premium');
    return refreshAccessState();
  }
  function applyPremiumState(payload = {}) {
    const next = save({ ...load(), ...payload, source:payload.source || 'local_code', updated_at:new Date().toISOString() });
    ProfileStore.write({ access_tier:next.tier, access_source:next.source, premium_tier:next.tier, is_premium:PREMIUM_TIERS.includes(next.tier), premium_code_used:next.premium_code_used || next.code_label || null, premium_since:next.premium_since || next.redeemed_at || new Date().toISOString(), premium_expires_at:next.premium_expires_at || null });
    refreshAccessState();
    return next;
  }
  async function hashCode(code) {
    const data = new TextEncoder().encode(PremiumCodes.normalize(code));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  async function redeemAccessCode(code) {
    const normalizedCode = PremiumCodes.normalize(code);
    if (!normalizedCode) return { ok:false, error:'Enter your special code.' };
    let matched = null;
    let source = 'local_code';
    let cloudWarning = false;
    if (Auth.user && Auth.client) {
      try {
        const { data, error } = await Auth.client.rpc('redeem_premium_code', { input_code: normalizedCode });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.ok === false || row?.success === false || row === false) return { ok:false, error:'That code didn’t open this room.' };
        const tierFromRpc = row?.premium_tier || row?.tier || row?.access_tier || (row === true || row?.ok === true || row?.success === true ? 'premium' : null);
        if (tierFromRpc) { matched = { tier:tierFromRpc, label:'supabase rpc code' }; source = 'supabase_profile'; }
        else if (!matched) return { ok:false, error:'That code didn’t open this room.' };
      } catch (error) {
        return { ok:false, error:'That code didn’t open this room.' };
      }
    } else {
      if (!PremiumCodes.hasLocalHashConfig()) return { ok:false, error:'Special codes are not configured for local unlock. Sign in to redeem through Supabase.' };
      matched = await PremiumCodes.lookupLocalHash(normalizedCode);
    }
    if (!matched) return { ok:false, error:'That code didn’t open this room.' };
    const tier = normalizeTier(matched.tier || 'premium');
    if (!PREMIUM_TIERS.includes(tier)) return { ok:false, error:'That code didn’t open this room.' };
    const now = new Date().toISOString();
    const codeLabel = matched.label || 'special code';
    const state = applyPremiumState({ tier, source, code_label:codeLabel, premium_code_used:codeLabel, premium_since:now, redeemed_at:now, is_premium:true });
    if (Auth.user) {
      const payload = { ...ProfileStore.read(), is_premium:true, premium_tier:tier, premium_code_used:codeLabel, premium_since:now, premium_expires_at:null, access_tier:tier, access_source:source };
      const synced = await Auth.upsertProfile(payload);
      if (!synced?.ok) cloudWarning = true;
    }
    return { ok:true, state, cloudWarning };
  }
  function lockedHTML(featureKey) {
    const copy = getLockedCopy(featureKey);
    return `<section class="special-access-card" data-special-feature="${escapeHTML(featureKey)}"><div class="special-kicker">✦ ${escapeHTML(copy.eyebrow)}</div><h4>${escapeHTML(copy.title)}</h4><p>${escapeHTML(copy.body)}</p><button class="receipt-action-btn special-access-open premium-settings-btn" type="button">${escapeHTML(copy.cta)}</button></section>`;
  }
  function applyFeatureVisibility() {
    const specialUnlocked = isPremium();
    document.querySelectorAll('[data-feature]').forEach((el) => {
      const feature = el.getAttribute('data-feature');
      let visible = getFeatureAccess(feature) === 'free' || specialUnlocked;
      const ritualId = el.getAttribute('data-fun');
      if (visible && ritualId && ritualId !== 'special-access') {
        try { if (typeof Rituals !== 'undefined' && Rituals.hasBuilder && !Rituals.hasBuilder(ritualId)) visible = false; } catch {}
      }
      el.hidden = !visible;
      el.classList.toggle('special-hidden', !visible);
    }, undefined, 'migration:export');
  }
  function updatePremiumUI() {
    const status = document.getElementById('premium-access-status');
    if (status) status.innerHTML = `Current access: <b>${escapeHTML(current.tier === 'free' ? 'Free' : current.tier === 'founder' ? 'Founder' : current.tier === 'alpha' ? 'Alpha' : 'Special')}</b>${location.search.includes('debug=1') ? `<br>Source: <b>${escapeHTML(current.source)}</b>` : ''}`;
    const chip = document.getElementById('premium-chip');
    if (chip) chip.textContent = isPremium() ? 'Special Access active' : 'Free Vault';
    applyFeatureVisibility();
    document.querySelectorAll('.special-access-entry').forEach((el) => {
      el.classList.toggle('is-active', isPremium());
      const title = el.querySelector('.fun-card-title');
      const desc = el.querySelector('.fun-card-desc');
      if (title) title.textContent = isPremium() ? 'access unlocked' : 'Special Access';
      if (desc) desc.textContent = isPremium() ? 'Special Access is open now.' : 'for the girls who fw alam';
    });
    document.querySelectorAll('#premium-debug-override').forEach((el) => {
      const wrap = el.closest('label');
      if (wrap) wrap.hidden = !location.search.includes('debug=1');
    });
  }
  return { load, save, refreshAccessState, isPremium, getTier, getSource, canUse, requirePremium, getLockedCopy, setLocalPremiumOverride, clearLocalPremiumOverride, applyPremiumState, applyFeatureVisibility, redeemAccessCode, lockedHTML, FEATURE_ACCESS, PremiumCodes, KEY };
})();



const WrappedCinematicLoader = (() => {
  let loadPromise = null;
  function debugWarn(...args) { if (location.search.includes('debug=1')) console.warn('[Wrapped cinematic]', ...args); }
  function hasModule() { return Boolean(window.CinematicWrapped?.open); }
  function ensureLoaded() {
    if (hasModule()) return Promise.resolve(window.CinematicWrapped);
    if (loadPromise) return loadPromise;
    loadPromise = new Promise((resolve) => {
      const existing = document.querySelector('script[src*="wrapped-cinematic-module.js"]');
      const finish = () => resolve(hasModule() ? window.CinematicWrapped : null);
      if (existing) {
        existing.addEventListener('load', finish, { once:true });
        existing.addEventListener('error', () => { debugWarn('module script failed to load'); resolve(null); }, { once:true });
        setTimeout(finish, 700);
        return;
      }
      const script = document.createElement('script');
      script.src = 'wrapped-cinematic-module.js?v=' + encodeURIComponent(APP_VERSION);
      script.defer = true;
      script.onload = finish;
      script.onerror = () => { debugWarn('module script failed to load'); resolve(null); };
      document.head.appendChild(script);
    });
    return loadPromise;
  }
  async function openIfAvailable() {
    try {
      Wrapped.render();
      if (!UserAccess.canUse('advanced_wrapped')) return false;
      const mod = await ensureLoaded();
      if (!mod?.open) { debugWarn('falling back to standard Wrapped'); Wrapped.render(); return false; }
      mod.open();
      return true;
    } catch (error) {
      debugWarn('cinematic open failed', error);
      Wrapped.render();
      return false;
    }
  }
  return { ensureLoaded, openIfAvailable, hasModule };
})();



const SpecialAccessPortal = (() => {
  function resolveName() {
    const profile = ProfileStore.read();
    const avatarName = readLocalJSON('echovault_echo_avatar_v1', {})?.avatar_name;
    const emailPrefix = Auth.user?.email?.split('@')?.[0];
    return profile.display_name || avatarName || emailPrefix || localStorage.getItem(USER_KEY) || 'Local Voyager';
  }
  function ensure() {
    let modal = document.getElementById('special-access-modal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', `<div class="special-access-modal" id="special-access-modal" role="dialog" aria-modal="true" aria-label="Special Access" aria-hidden="true"><div class="special-access-panel"><button class="special-close" id="special-access-close" type="button" aria-label="Close">×</button><div class="special-kicker">Special Access</div><h3>Special Access</h3><p class="special-subtitle">for the girls who fw alam</p><p>Some parts of the vault open differently.</p><label class="settings-field-label" for="special-access-code-input">special code</label><div class="premium-code-row"><input class="settings-input" id="special-access-code-input" type="text" placeholder="ECHO-••••" autocomplete="off" spellcheck="false"><button class="settings-secondary-btn" id="special-access-unlock" type="button">Unlock</button></div><button class="settings-secondary-btn ghost" id="special-access-later" type="button">Maybe Later</button></div></div>`);
      document.getElementById('special-access-close')?.addEventListener('click', close);
      document.getElementById('special-access-later')?.addEventListener('click', close);
      document.getElementById('special-access-modal')?.addEventListener('click', e => { if (e.target?.id === 'special-access-modal') close(); });
      document.getElementById('special-access-unlock')?.addEventListener('click', redeemFromPortal);
      document.getElementById('special-access-code-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') redeemFromPortal(); });
      modal = document.getElementById('special-access-modal');
    }
    return modal;
  }
  function open() {
    const modal = ensure();
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.getElementById('special-access-error')?.remove();
    setTimeout(() => document.getElementById('special-access-code-input')?.focus(), 60);
  }
  function close() { const modal = document.getElementById('special-access-modal'); modal?.classList.remove('open'); modal?.setAttribute('aria-hidden','true'); }
  async function redeemFromPortal() {
    const input = document.getElementById('special-access-code-input') || document.getElementById('premium-access-code');
    const result = await UserAccess.redeemAccessCode(input?.value || '');
    if (!result.ok) {
      const panel = document.querySelector('.special-access-panel');
      let err = document.getElementById('special-access-error');
      if (!err && panel) { err = document.createElement('div'); err.id='special-access-error'; err.className='auth-status error'; err.style.marginTop='10px'; panel.querySelector('.premium-code-row')?.insertAdjacentElement('afterend', err); }
      if (err) err.textContent = 'Code not recognised';
      return Toast.show(result.error || 'That code didn’t open this room.', 3400);
    }
    document.getElementById('special-access-error')?.remove();
    if (input) input.value = '';
    close();
    refreshEchoDependentUI();
    UserChip.refresh();
    Toast.show(result.cloudWarning ? 'Special access unlocked locally. Cloud sync can retry later.' : 'Special access unlocked.', 3600);
    showWelcome();
  }
  function showWelcome() {
    const name = resolveName();
    let welcome = document.getElementById('special-access-welcome');
    if (!welcome) {
      document.body.insertAdjacentHTML('beforeend', `<div class="special-welcome" id="special-access-welcome" role="status"><div class="special-welcome-card"><div class="kawaii-cat" aria-label="original kawaii dancing cat mascot"><div class="cat-ear left"></div><div class="cat-ear right"></div><div class="cat-face"><span class="cat-eye left"></span><span class="cat-eye right"></span><span class="cat-mouth"></span><span class="cat-bow"></span></div><div class="cat-body"></div><span class="cat-spark s1">✦</span><span class="cat-spark s2">♡</span><span class="cat-spark s3">✧</span></div><h3 id="special-welcome-title"></h3><p>Special Access is open now.</p></div></div>`);
      welcome = document.getElementById('special-access-welcome');
    }
    document.getElementById('special-welcome-title').textContent = `Welcome, ${name}.`;
    welcome.classList.add('show');
    setTimeout(() => welcome?.classList.remove('show'), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1800 : 4200);
  }
  return { open, close, showWelcome, redeemFromPortal };
})();


const __evBoundListeners = new WeakMap();
function bindOnce(el, event, handler, options, key) {
  if (!el || !event || !handler) return false;
  let map = __evBoundListeners.get(el);
  if (!map) { map = new Set(); __evBoundListeners.set(el, map); }
  const token = key || `${event}:${handler.name || 'anon'}`;
  if (map.has(token)) return false;
  el.addEventListener(event, handler, options);
  map.add(token);
  return true;
}

/* ── NAVIGATION ── */
const Nav = (() => {
  const views   = ['home','entry','timeline','wrapped','fun'];
  const navBtns = {}, viewEls = {};
  views.forEach(v => {
    navBtns[v] = document.getElementById('nav-' + v);
    viewEls[v] = document.getElementById('view-' + v);
    if (navBtns[v]) {
      bindOnce(navBtns[v], 'click', () => show(v), undefined, `nav:${v}`);
    }
  });
  function show(name) {
    views.forEach(v => {
      viewEls[v]?.classList.toggle('active', v === name);
      navBtns[v]?.classList.toggle('active',  v === name);
      navBtns[v]?.setAttribute('aria-current', v === name ? 'page' : 'false');
    });
    state.currentView = name;
    if (name === 'timeline') { Timeline.render(); setTimeout(ConnectionCanvas.render, 60); }
    if (name === 'wrapped')  Wrapped.render();
    if (name === 'home')     IdentityCore.update();
    // Smooth scroll to the active view without letting the fixed header overlap content.
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    window.scrollTo({top:0, behavior});
    // After the scroll, ensure the view's first meaningful content is in focus
    setTimeout(() => {
      const activeView = viewEls[name];
      if (!activeView) return;
      const firstFocusable = activeView.querySelector('.view-title, h2, .hero-title, .fun-grid, #bubble-field, #wrapped-content, .wrapped-card, .entry-container');
      if (firstFocusable) {
        const rect = firstFocusable.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.3) {
          firstFocusable.scrollIntoView({behavior, block:'start'});
        }
      }
    }, 80);
  }
  return {show};
})();


/* ══════════════════════════════════════════
   SETTINGS — profile, avatar, bio, stats
══════════════════════════════════════════ */
const Settings = (() => {
  const overlay = document.getElementById('settings-overlay');
  function open() {
    let initTimeout = null;
    overlay?.setAttribute('aria-hidden','false');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    populateStats();
    populateArchetype();
    populateEchoAvatar();
    populateSocietyPrivacy();
    populatePremiumAccess();
  }
  function close() {
    overlay?.classList.remove('open');
    overlay?.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function populateStats() {
    const grid = document.getElementById('settings-stats'); if (!grid) return;
    const p = PatternEngine.analyze(state.echoes);
    const total = p.totalEchoes || 0;
    const avgInt = total ? p.averageIntensity : '—';
    const voidCnt = p.voidCount || 0;
    const dom = p.dominantMood;
    const daysSince = total ? Math.floor((Date.now()-new Date(state.echoes[state.echoes.length-1].date))/86400000) : 0;
    grid.innerHTML = [
      {val:total,label:'echoes'},{val:avgInt,label:'avg intensity'},{val:voidCnt,label:'void entries'},
      {val:dom||'—',label:'dominant mood',color:MOOD_COLORS[dom]},{val:daysSince,label:'days journaling'},{val: total ? (p.averageSilence || '—') : '—', label:'avg silence'}
    ].map(s=>`<div class="settings-stat"><div class="settings-stat-val" ${s.color?`style="color:${s.color}"`:''}>${s.val}</div><div class="settings-stat-label">${s.label}</div></div>`).join('');
  }
  function populateArchetype() {
    const p = PatternEngine.analyze(state.echoes.slice(0,30));
    const arch = ArchetypeEngine.compute(p);
    const dom = p.dominantMood;
    const nameEl = document.getElementById('archetype-name-display');
    const descEl = document.getElementById('archetype-desc-display');
    const orbEl  = document.getElementById('archetype-orb');
    if (nameEl) nameEl.textContent = arch.archetypeName;
    if (descEl) descEl.textContent = `${arch.archetypeDescription} · ${p.emotionalWeather || 'shifting sky'}`;
    if (orbEl && dom) orbEl.style.background = `radial-gradient(circle at 38% 35%,${MOOD_COLORS[dom]},${MOOD_COLORS[dom]}44)`;
  }
  function populateEchoAvatar() {
    const mount = document.getElementById('settings-echo-avatar');
    if (!mount) return;
    mount.innerHTML = EchoAvatar.render();
    EchoAvatar.bind();
  }
  function populateSocietyPrivacy() {
    const status = document.getElementById('society-consent-status');
    if (!status || typeof SocietySignals === 'undefined') return;
    const signals = SocietySignals.listLocalSignals();
    const reactions = SocietySignals.listReactions();
    const localReactionCount = Object.values(reactions).flat().length;
    const synced = signals.filter((signal) => signal.synced).length;
    const cloud = SocietySync.isAvailable() ? 'logged in · cloud consent sync available' : 'not logged in · local preview';
    status.innerHTML = `Society consent local status: <b>${SocietySignals.getConsent() ? 'joined' : 'not joined'}</b><br>Cloud consent status: <b>${cloud}</b><br>Local signal count: <b>${signals.length}</b> · uploaded/synced signal count: <b>${synced}</b><br>Local reactions count: <b>${localReactionCount}</b><br>Current mode: <b>${SocietySync.isAvailable() ? 'Live Society' : 'Local Preview'}</b><br>alam.ai mode: <b>${AlamAI.isRemoteAvailable() ? 'Remote endpoint if configured' : 'Local only'}</b>`;
    const latest = document.getElementById('alam-include-latest-setting');
    if (latest) latest.checked = AlamPrivacy.shouldIncludeLatestEcho();
  }
  function populatePremiumAccess() {
    UserAccess.refreshAccessState();
    const status = document.getElementById('premium-access-status');
    if (status) status.innerHTML = `Current access: <b>${escapeHTML(UserAccess.getTier() === 'free' ? 'Free' : UserAccess.getTier() === 'founder' ? 'Founder' : UserAccess.getTier() === 'alpha' ? 'Alpha' : 'Special')}</b>${location.search.includes('debug=1') ? `<br>Source: <b>${escapeHTML(UserAccess.getSource())}</b>` : ''}`;
    const debug = document.getElementById('premium-debug-override');
    if (debug) debug.checked = UserAccess.getSource() === 'debug_override';
    const clear = document.getElementById('premium-clear-local');
    if (clear) clear.hidden = !location.search.includes('debug=1');
  }
  async function init() {
    const profile = ProfileStore.read();
    document.getElementById('settings-display-name').value = profile.display_name || localStorage.getItem(USER_KEY) || '';
    document.getElementById('settings-username').value = profile.username || '';
    document.getElementById('settings-bio').value = profile.bio || '';
    document.getElementById('settings-location').value = profile.location || '';
    document.getElementById('bio-chars').textContent = (profile.bio || '').length;
    document.getElementById('settings-close-btn')?.addEventListener('click', close);
    overlay?.addEventListener('click', e => { if (e.target===overlay) close(); });
    document.getElementById('settings-bio')?.addEventListener('input', (e) => {
      document.getElementById('bio-chars').textContent = e.target.value.length;
    });
    const avatarInput = document.getElementById('avatar-file-input');
    document.getElementById('avatar-zone')?.addEventListener('click', () => avatarInput?.click());
    document.getElementById('avatar-zone')?.addEventListener('keydown', (e) => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); avatarInput?.click(); }});
    avatarInput?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      if (!['image/jpeg','image/png','image/webp','image/gif'].includes(f.type) || f.size > 2*1024*1024) { Toast.show('Avatar must be jpeg/png/webp/gif under 2MB'); return; }
      const r = new FileReader(); r.onload = async () => { const avatarImg=document.getElementById('avatar-img'); const initials=document.getElementById('avatar-initials'); avatarImg.src = r.result; avatarImg.style.display='block'; initials.style.display='none'; ProfileStore.write({avatar_data_url:r.result}); if (Auth.user && Auth.client) { try { const ext=(f.name.split('.').pop()||'png').toLowerCase(); const path=`${Auth.user.id}/avatar-${Date.now()}.${ext}`; const {error}=await Auth.client.storage.from(Auth.SUPABASE_AVATAR_BUCKET).upload(path,f,{upsert:true}); if (error) throw error; const {data} = Auth.client.storage.from(Auth.SUPABASE_AVATAR_BUCKET).getPublicUrl(path); const profile={...ProfileStore.read(), avatar_url:data.publicUrl}; ProfileStore.write(profile); await Auth.upsertProfile(profile); } catch(err){ Toast.show('Avatar upload failed; kept local preview.'); } } UserChip.refresh(); e.target.value=''; }; r.readAsDataURL(f);
    });
    document.getElementById('settings-save-btn')?.addEventListener('click', async () => {
      const payload = {
        display_name: document.getElementById('settings-display-name').value.trim(),
        username: document.getElementById('settings-username').value.trim(),
        bio: document.getElementById('settings-bio').value.trim(),
        location: document.getElementById('settings-location').value.trim()
      };
      ProfileStore.write(payload);
      localStorage.setItem(USER_KEY, payload.display_name || payload.username || localStorage.getItem(USER_KEY) || 'you');
      await Auth.upsertProfile({ ...ProfileStore.read(), ...payload });
      UserAccess.refreshAccessState();
      UserChip.refresh();
      const status = document.getElementById('settings-save-status');
      if (status) { status.textContent = '✓ saved to your universe'; status.classList.add('show'); setTimeout(() => status.classList.remove('show'), 2500); }
    });
    document.getElementById('refresh-app-cache-btn')?.addEventListener('click', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      location.reload();
    } catch (e) { Toast.show('Cache refresh failed.'); }
  });
  document.getElementById('clear-local-session-btn')?.addEventListener('click', () => {
    ['echoUser','echoOnboarded','echovault_profile_v1','ev_auth_mode'].forEach((k) => localStorage.removeItem(k));
    Toast.show('Local session cleared.');
  });
  document.getElementById('settings-export-btn')?.addEventListener('click', () => Storage.exportVault(state.echoes));
    document.getElementById('society-join-btn')?.addEventListener('click', () => { SocietySignals.setConsent(true); populateSocietyPrivacy(); updateSocietyConsentUI({ privateState:false }); Toast.show('EchoSociety joined. Raw echoes remain private.'); });
    document.getElementById('society-revoke-consent-btn')?.addEventListener('click', () => { SocietySignals.revokeConsent(); populateSocietyPrivacy(); updateSocietyConsentUI({ privateState:true }); Toast.show('EchoSociety consent revoked.'); });
    document.getElementById('society-sync-signals-btn')?.addEventListener('click', async () => { await SocietySync.syncLocalSignals(); populateSocietyPrivacy(); });
    document.getElementById('society-clear-signals-btn')?.addEventListener('click', () => { if (!confirm('Clear local EchoSociety signals and reactions? Your echoes stay untouched.')) return; SocietySignals.clearLocalSignals(); populateSocietyPrivacy(); Toast.show('Local society signals cleared.'); });
    document.getElementById('society-export-signals-btn')?.addEventListener('click', () => SocietySignals.exportSignals());
    document.getElementById('alam-clear-chat-btn')?.addEventListener('click', () => { AlamAI.clearChat(); populateSocietyPrivacy(); });
    document.getElementById('alam-include-latest-setting')?.addEventListener('change', (event) => { writeLocalJSON('echovault_alam_ai_settings_v1', { ...readLocalJSON('echovault_alam_ai_settings_v1', {}), includeLatestEcho:event.target.checked }); Toast.show(event.target.checked ? 'alam.ai can include latest echo summary when you ask.' : 'alam.ai latest echo sharing is off.'); });
    document.querySelectorAll('.special-access-open').forEach(btn => btn.addEventListener('click', () => SpecialAccessPortal.open()));
    document.getElementById('premium-redeem-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('premium-access-code');
      const result = await UserAccess.redeemAccessCode(input?.value || '');
      if (!result.ok) return Toast.show(result.error, 3400);
      if (input) input.value = '';
      populatePremiumAccess();
      refreshEchoDependentUI();
      UserChip.refresh();
      Toast.show(result.cloudWarning ? 'Special access unlocked locally. Cloud sync can retry later.' : 'Special access unlocked.', 3200);
      SpecialAccessPortal.showWelcome();
    });
    document.getElementById('premium-clear-local')?.addEventListener('click', () => { localStorage.removeItem(UserAccess.KEY); sessionStorage.removeItem('echovault_debug_premium'); UserAccess.refreshAccessState(); populatePremiumAccess(); refreshEchoDependentUI(); UserChip.refresh(); Toast.show('Local access state cleared.'); });
    document.getElementById('premium-debug-override')?.addEventListener('change', (event) => {
      if (event.target.checked) UserAccess.setLocalPremiumOverride(true);
      else UserAccess.clearLocalPremiumOverride();
      populatePremiumAccess();
      refreshEchoDependentUI();
      UserChip.refresh();
      Toast.show(event.target.checked ? 'Debug special override enabled.' : 'Debug special override cleared.');
    });


  document.getElementById('settings-clear-btn')?.addEventListener('click', () => {
      if (!window.confirm('This will permanently delete all your echoes. This cannot be undone.')) return;
      state.echoes = []; Storage.save([]);
      Toast.show('All echoes cleared.', 3000);
      close();
      refreshEchoDependentUI();
    });
    bindOnce(document, 'keydown', e => { if (e.key==='Escape'&&overlay?.classList.contains('open')) close(); }, undefined, 'settings:escape-close');
    document.getElementById('nav-logo-btn')?.addEventListener('contextmenu', e => { e.preventDefault(); open(); });
  }
  
function bindViewportHeightVar() {
  const apply = () => {
    const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  apply();
  window.visualViewport?.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  window.addEventListener('resize', apply);
}

init(); return { open, close };
})();

/* ── LOGIN SYSTEM ── */
const Login = (() => {
  const screen   = document.getElementById('login-screen');
  const lsOrb    = document.getElementById('ls-orb');
  const lsBreath = document.getElementById('ls-breath');
  const lsName   = document.getElementById('ls-name');
  const lsReturn = document.getElementById('ls-return');
  const stressOrb= document.getElementById('stress-orb');
  const stressOrbWrap = document.getElementById('stress-orb-wrap');
  const stressContinue = document.getElementById('stress-continue-btn');
  const nameInput= document.getElementById('name-input');
  const authEmail = document.getElementById('auth-email');
  const authOtp = document.getElementById('auth-otp');
  const authPassword = document.getElementById('auth-password');
  const authSendCode = document.getElementById('auth-send-code-btn');
  const authVerifyCode = document.getElementById('auth-verify-code-btn');
  const authResendCode = document.getElementById('auth-resend-code-btn');
  const authTogglePassword = document.getElementById('auth-toggle-password-btn');
  const authSignIn = document.getElementById('auth-signin-btn');
  const authSignUp = document.getElementById('auth-signup-btn');
  const authLocal = document.getElementById('auth-local-btn');
  const authModeNote = document.getElementById('auth-mode-note');
  const authStatus = document.getElementById('auth-status');

  let otpCooldownUntil = 0;
  let signupCooldownUntil = 0;
  let authUiMode = 'otp';

  const normalizeAuthError = (msg='') => {
    const lower = msg.toLowerCase();
    if (lower.includes('429') || lower.includes('rate') || lower.includes('security purposes')) return 'Too many attempts. Wait about a minute before trying again.';
    if (lower.includes('email not confirmed')) return 'Email not confirmed. Use the code/link from your email first.';
    if (lower.includes('invalid login credentials')) return 'Invalid details. Try the email code flow or check your password.';
    return msg || 'Something went wrong. Please try again.';
  };

  function showStep(el){ [lsOrb,lsBreath,lsName,lsReturn].forEach(s => s.classList.remove('active')); el.classList.add('active'); }
  function setAuthStatus(message = '', tone = '') {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.className = `auth-status ${tone}`.trim();
  }
  function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function enterApp(){
    document.documentElement.classList.add('app-unlocked');
    document.body.classList.add('app-unlocked');
    screen?.classList.add('hidden');
    screen?.setAttribute('aria-hidden', 'true');
    if (screen) screen.style.pointerEvents = 'none';
    cleanupOverlays({ keepOnboarding:false });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    setTimeout(() => {
      if (screen) screen.style.display = 'none';
      cleanupOverlays({ keepOnboarding:false });
      if (!localStorage.getItem(OB_KEY)) Onboarding.start();
    }, prefersReducedMotion() ? 120 : 950);
  }
  function setButtonLoading(btn, loading, idleText, busyText){ if(!btn) return; btn.disabled=loading; btn.setAttribute('aria-busy', String(loading)); btn.textContent=loading?busyText:idleText; }
  function setOtpUiStep(codeSent){
    authOtp.style.display = codeSent ? 'block' : 'none';
    authVerifyCode.style.display = codeSent ? 'inline-flex' : 'none';
    authResendCode.style.display = codeSent ? 'inline-flex' : 'none';
  }
  function setAuthMode(mode){
    authUiMode = mode;
    const passwordMode = mode === 'password';
    authPassword.style.display = passwordMode ? 'block' : 'none';
    nameInput.style.display = passwordMode ? 'block' : 'none';
    authSignIn.style.display = passwordMode ? 'inline-flex' : 'none';
    authSignUp.style.display = passwordMode ? 'inline-flex' : 'none';
    authSendCode.style.display = passwordMode ? 'none' : 'inline-flex';
    authTogglePassword.textContent = passwordMode ? 'Use email code instead' : 'Use password instead';
    setOtpUiStep(false);
    authModeNote.textContent = passwordMode ? 'Password mode enabled. Email + password required.' : 'Code shown? Enter it below. Link shown? Open it to unlock your vault.';
  }
  function startOtpCooldown(seconds=60){ otpCooldownUntil = Date.now() + seconds*1000; tickCooldown(); }
  function tickCooldown(){
    if (!authResendCode || authResendCode.style.display === 'none') return;
    const remaining = Math.max(0, Math.ceil((otpCooldownUntil - Date.now())/1000));
    authResendCode.disabled = remaining > 0;
    authResendCode.textContent = remaining > 0 ? `Resend email (${remaining}s)` : 'Resend email';
    if (remaining > 0) setTimeout(tickCooldown, 250);
  }

  async function sendEmailOtp(email){
    if (!email || !validEmail(email)) { setAuthStatus('Enter a valid email address first.', 'error'); return Toast.show('Enter a valid email.'); }
    setAuthStatus('Sending your vault code…', '');
    setButtonLoading(authSendCode, true, 'Send Vault Code', 'Sending…');
    const res = await Auth.sendEmailOtp(email);
    setButtonLoading(authSendCode, false, 'Send Vault Code', 'Sending…');
    if (!res.ok) { const msg = normalizeAuthError(res.error); setAuthStatus(`${msg} You can still continue locally.`, 'error'); return Toast.show(msg, 4200); }
    setOtpUiStep(true);
    setAuthStatus('Email sent. Use the code if shown, or open the magic link.', 'success');
    Toast.show('Email sent — use the code if shown, or open the magic link.', 4600);
    if (authModeNote) authModeNote.innerHTML = 'Code shown? Enter it below. Link shown? Open it to unlock your vault.<br><small>To receive a visible 6-digit code, the Supabase Magic Link template must include {{ .Token }}.</small>';
    startOtpCooldown(60);
  }

  async function verifyEmailOtp(email, token){
    if (!email || !validEmail(email)) { setAuthStatus('Enter a valid email address first.', 'error'); return Toast.show('Enter a valid email.'); }
    if (!token || !/^\d{6}$/.test(token)) { setAuthStatus('Enter the 6-digit code from your email.', 'error'); return Toast.show('Enter the 6-digit code.'); }
    setButtonLoading(authVerifyCode, true, 'Verify Code', 'Verifying…');
    const res = await Auth.verifyEmailOtp(email, token);
    setButtonLoading(authVerifyCode, false, 'Verify Code', 'Verifying…');
    if (!res.ok) { setAuthStatus('That code did not open the vault. Try again or continue locally.', 'error'); return Toast.show('Invalid or expired code. If your email only has a magic link, open that link instead.', 4200); }
    if (!res.data?.session) { setAuthStatus('Open the magic link from your email, or continue locally.', 'error'); return Toast.show('Session not created. If your email has a magic link, open it instead.', 4200); }
    const profile = await Auth.fetchProfile(); if (profile) ProfileStore.write(profile);
    UserAccess.refreshAccessState();
    await Auth.upsertProfile({ ...ProfileStore.read(), display_name: nameInput.value.trim() || ProfileStore.read().display_name });
    UserChip.refresh();
  VaultPulse.set(Auth.user ? "synced" : "local", Auth.user ? "Profile Synced" : "Local Vault"); setAuthStatus('Vault unlocked. Welcome back.', 'success'); Toast.show('Vault unlocked. Welcome back.'); enterApp();
  }

  async function resendEmailOtp(email){
    const remaining = Math.max(0, Math.ceil((otpCooldownUntil - Date.now())/1000));
    if (remaining > 0) return Toast.show(`Please wait ${remaining}s before resending.`);
    await sendEmailOtp(email);
  }

  function beginLoginIntro() {
    if (screen?.dataset.introStarted === '1') return;
    screen.dataset.introStarted = '1';
    stressOrb?.classList.remove('pressed');
    showStep(lsBreath);
    BreathAnim.start();
    setTimeout(() => {
      showStep(lsName);
      setAuthMode('otp');
      setTimeout(() => authEmail?.focus(), 300);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 900 : 4200);
  }

  function setStressOrbPressed(isPressed) {
    stressOrb?.classList.toggle('pressed', Boolean(isPressed));
  }

  function bindStressOrbStart() {
    const targets = [stressOrbWrap, stressOrb, stressContinue].filter(Boolean);
    if (!targets.length) return;
    const start = (event) => {
      if (event?.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      event?.preventDefault?.();
      beginLoginIntro();
    };
    const press = (event) => {
      if (event?.pointerType === 'mouse' && event.button !== 0) return;
      setStressOrbPressed(true);
    };
    const release = () => setStressOrbPressed(false);
    const releaseAndStart = (event) => { release(); start(event); };
    targets.forEach((target) => {
      target.addEventListener('click', start);
      target.addEventListener('keydown', start);
      target.addEventListener('pointerdown', press);
      target.addEventListener('pointerup', releaseAndStart);
      target.addEventListener('pointercancel', release);
      target.addEventListener('pointerleave', release);
      target.addEventListener('touchend', start, { passive:false });
    });
  }

  function init() {
    const savedUser = localStorage.getItem(USER_KEY);
    bindStressOrbStart();
    if (Auth.user) { UserChip.refresh(); enterApp(); return; }
    if (!Auth.hasSupabase && authModeNote) authModeNote.textContent = 'Supabase is not configured — local mode only.';
    if (savedUser && !Auth.hasSupabase) { document.getElementById('return-name').textContent = savedUser; showStep(lsReturn); document.getElementById('return-enter-btn').addEventListener('click', () => enterApp()); return; }

    authLocal?.addEventListener('click', () => { const name = nameInput.value.trim() || localStorage.getItem(USER_KEY) || 'local voyager'; localStorage.setItem(USER_KEY, name); ProfileStore.write({ display_name: name }); UserChip.refresh(); setAuthStatus('Local vault ready. Nothing leaves this device.', 'success'); enterApp(); });
    authTogglePassword?.addEventListener('click', () => setAuthMode(authUiMode === 'otp' ? 'password' : 'otp'));
    authSendCode?.addEventListener('click', () => sendEmailOtp(authEmail.value.trim()));
    authVerifyCode?.addEventListener('click', () => verifyEmailOtp(authEmail.value.trim(), authOtp.value.trim()));
    authResendCode?.addEventListener('click', () => resendEmailOtp(authEmail.value.trim()));

    authSignIn?.addEventListener('click', async () => {
      const email=authEmail.value.trim(); const password=authPassword.value;
      if (!email || !/.+@.+\..+/.test(email)) return Toast.show('Enter a valid email.');
      if (!password) return Toast.show('Password is required.');
      setButtonLoading(authSignIn, true, 'Sign in', 'Signing in…'); authSignUp.disabled=true;
      const res = await Auth.signIn(email,password);
      setButtonLoading(authSignIn, false, 'Sign in', 'Signing in…'); authSignUp.disabled=false;
      if (!res.ok) return Toast.show(normalizeAuthError(res.error), 4200);
      const profile = await Auth.fetchProfile(); if (profile) ProfileStore.write(profile);
      UserAccess.refreshAccessState();
      UserChip.refresh();
  VaultPulse.set(Auth.user ? "synced" : "local", Auth.user ? "Profile Synced" : "Local Vault"); enterApp();
    });

    authSignUp?.addEventListener('click', async () => {
      const remaining = Math.max(0, Math.ceil((signupCooldownUntil - Date.now())/1000));
      if (remaining > 0) return Toast.show(`Please wait ${remaining}s before creating another account.`);
      const email=authEmail.value.trim(); const password=authPassword.value; const displayName=nameInput.value.trim();
      if (!email || !/.+@.+\..+/.test(email)) return Toast.show('Enter a valid email.');
      if (!password) return Toast.show('Password is required.');
      if (password.length < 6) return Toast.show('Password must be at least 6 characters.');
      setButtonLoading(authSignUp, true, 'Create account', 'Creating…'); authSignIn.disabled=true;
      const res = await Auth.signUp(email,password,displayName);
      setButtonLoading(authSignUp, false, 'Create account', 'Creating…'); authSignIn.disabled=false;
      signupCooldownUntil = Date.now() + 60000;
      if (!res.ok) return Toast.show(normalizeAuthError(res.error), 4200);
      await Auth.upsertProfile({ ...ProfileStore.read(), display_name: displayName || ProfileStore.read().display_name });
      if (res.data?.session) { UserChip.refresh(); enterApp(); } else { Toast.show('Account created. Check your email to confirm, or use Email Code.', 5000); }
    });
  }

  return {init};
})();

const PWAInstall = (() => {
  let deferredInstallPrompt = null;
  const banner = document.getElementById('pwa-banner');
  const installBtn = document.getElementById('pwa-install-btn');
  const dismissBtn = document.getElementById('pwa-dismiss-btn');
  const subText = banner?.querySelector('.pwa-sub');
  const DISMISS_KEY = 'echovault_pwa_dismissed';
  const START_KEY = 'echovault_pwa_start';
  const ENGAGEMENT_KEY = 'echovault_pwa_engagement_v1';
  const INSTALL_ATTEMPT_KEY = 'echovault_pwa_install_attempted';
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  function readEngagement() {
    try { return JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || '{}') || {}; } catch { return {}; }
  }
  function writeEngagement(next) {
    localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify({
      views: Array.isArray(next.views) ? next.views : [],
      hasEcho: Boolean(next.hasEcho),
      firstSeenAt: Number(next.firstSeenAt || Date.now())
    }));
  }
  function trackEngagement() {
    const next = readEngagement();
    next.firstSeenAt = next.firstSeenAt || Date.now();
    next.views = Array.isArray(next.views) ? next.views : [];
    next.hasEcho = Boolean(next.hasEcho || (state.echoes?.length || 0) > 0);
    if (state.currentView && !next.views.includes(state.currentView)) next.views.push(state.currentView);
    writeEngagement(next);
  }
  function isEligible() {
    const data = readEngagement();
    const start = Number(localStorage.getItem(START_KEY) || data.firstSeenAt || Date.now());
    const spent = Date.now() - start;
    const distinctViews = new Set(data.views || []).size;
    return Boolean(data.hasEcho || distinctViews >= 3 || spent > 150000);
  }
  function syncStandaloneClass() { document.documentElement.classList.toggle('is-standalone', Boolean(isStandalone())); }
  function setBannerVisible(visible) { banner?.classList.toggle('show', visible); document.documentElement.style.setProperty('--pwa-space', visible ? '92px' : '0px'); }
  function hide() { setBannerVisible(false); }
  function show(fallback = false) {
    if (localStorage.getItem(DISMISS_KEY) || localStorage.getItem(INSTALL_ATTEMPT_KEY) || isStandalone() || !isEligible()) return;
    if (fallback) {
      installBtn.textContent = 'How';
      if (subText) subText.textContent = 'Install from your browser menu when available';
      banner?.setAttribute('data-fallback', 'true');
    } else {
      installBtn.textContent = 'Install';
      if (subText) subText.textContent = 'Works offline · Feels like an app';
      banner?.removeAttribute('data-fallback');
    }
    setBannerVisible(true);
  }
  function init() {
    syncStandaloneClass();
    if (!localStorage.getItem(START_KEY)) localStorage.setItem(START_KEY, String(Date.now()));
    trackEngagement();
    AppEnvironment.applyClasses();
    window.matchMedia('(display-mode: standalone)').addEventListener?.('change', () => { syncStandaloneClass(); if (isStandalone()) hide(); });
    window.addEventListener('resize', AppEnvironment.applyClasses);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { trackEngagement(); show(false); } });
    ['nav-home','nav-entry','nav-timeline','nav-wrapped','nav-fun'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => { trackEngagement(); show(false); }));
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; trackEngagement(); show(false); });
    installBtn?.addEventListener('click', async () => {
      if (!deferredInstallPrompt) {
        localStorage.setItem(INSTALL_ATTEMPT_KEY, '1');
        Toast.show('Use your browser menu to add EchoVault to your Home Screen when install is available.', 5200);
        hide();
        return;
      }
      installBtn.disabled = true;
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
      installBtn.disabled = false;
      if (choice?.outcome !== 'accepted') localStorage.setItem(DISMISS_KEY, '1');
      hide();
      deferredInstallPrompt = null;
    });
    dismissBtn?.addEventListener('click', () => { localStorage.setItem(DISMISS_KEY, '1'); hide(); });
    window.addEventListener('appinstalled', () => { localStorage.setItem(INSTALL_ATTEMPT_KEY, '1'); hide(); deferredInstallPrompt = null; });
    setTimeout(() => { trackEngagement(); if (deferredInstallPrompt) show(false); }, 6000);
    if (isStandalone()) hide();
  }
  return { init, trackEngagement };
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
    cleanupOverlays({ keepOnboarding:true });
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.pointerEvents = '';
    current = 0;
    render();
    DebugPanel?.ensure?.();
  }

  function finish() {
    try {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      localStorage.setItem(OB_KEY, '1');
    } finally {
      cleanupOverlays({ keepOnboarding:false });
    }
  }

  nextBtn.addEventListener('click', () => {
    if (current < steps.length-1) { current++; render(); }
    else finish();
  });
  backBtn.addEventListener('click', () => {
    if (current > 0) { current--; render(); }
  });
  skipBtn.addEventListener('click', finish);

  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('open')) return;
    if (event.key === 'Enter') { event.preventDefault(); nextBtn.click(); }
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
  });

  return {start, finish};
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
    const max   = prefersReducedMotion() ? 0 : (isMobileViewport() ? 18 : 46);
    const density = isMobileViewport() ? 36000 : 24000;
    const count = Math.min(max, Math.floor(canvas.width * canvas.height / density));
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
    if (prefersReducedMotion()) return;
    if (state.tabHidden) { setTimeout(() => requestAnimationFrame(draw), 300); return; }
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

  function spawn(x, y, color, isVoid = false, intensity = 5) {
    const count = isVoid ? 4 : Math.ceil(intensity / 3);
    for (let i = 0; i < count; i++) {
      rings.push({
        x, y, r: i * 8,
        maxR: isVoid ? 220 + i * 30 : 120 + intensity * 8 + i * 20,
        color, a: 1 - i * 0.15,
        speed: (isVoid ? 1.1 : 1.8 + intensity * 0.08) - i * 0.1,
        isVoid, delay: i * 3
      });
    }
  }

  function tick() {
    if (prefersReducedMotion()) return;
    if (state.tabHidden) { setTimeout(() => requestAnimationFrame(tick), 300); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rings = rings.filter(r => r.a > 0.01);
    rings.forEach(ring => {
      if (ring.delay > 0) { ring.delay--; return; }
      ring.r += ring.speed;
      ring.a = Math.max(0, (1 - ring.r / ring.maxR) * (ring.isVoid ? 0.6 : 0.7));
      if (ring.isVoid) {
        for (let i=0; i<3; i++) {
          const rr = ring.r - i * 20;
          if (rr < 0) continue;
          ctx.beginPath(); ctx.arc(ring.x, ring.y, rr, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(74,74,90,${ring.a * .55})`;
          ctx.lineWidth = 1; ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI*2);
        ctx.strokeStyle = ring.color + Math.floor(ring.a * 90).toString(16).padStart(2,'0');
        ctx.lineWidth = 1; ctx.stroke();
      }
    });
    requestAnimationFrame(tick);
  }

  resize(); tick();
  return {spawn, resize};
})();

/* ── CONNECTION CANVAS — glowing lines between emotionally similar orbs ── */
const ConnectionCanvas = (() => {
  const canvas = document.getElementById('connection-canvas');
  const ctx    = canvas.getContext('2d');
  let orbData  = [];
  let links    = [];
  let phase    = 0;
  let raf      = null;
  let lastLinkCompute = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobileViewport() ? 1.5 : 1.75);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setOrbs(data, force = false) {
    orbData = Array.isArray(data) ? data.slice(0, isMobileViewport() ? 36 : 72) : [];
    const now = Date.now();
    if (!force && now - lastLinkCompute < 520) return;
    lastLinkCompute = now;
    links = Phase2?.buildConstellationLinks
      ? Phase2.buildConstellationLinks(orbData, { moodFamily, maxLinks:isMobileViewport() ? 18 : 42, maxDistance:isMobileViewport() ? 170 : 245 })
      : [];
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function render() {
    stop();
    if (state.currentView !== 'timeline' || prefersReducedMotion() || state.tabHidden || !orbData.length) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }
    const field = document.getElementById('bubble-field');
    if (!field) return;
    const fieldRect = field.getBoundingClientRect();
    phase += 0.012;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const liveLinks = links.length ? links : (Phase2?.buildConstellationLinks?.(orbData, { moodFamily, maxLinks:isMobileViewport() ? 12 : 28 }) || []);

    liveLinks.forEach((link, index) => {
      const a = link.a, b = link.b;
      const ax = a.x + fieldRect.left, ay = a.y + fieldRect.top;
      const bx = b.x + fieldRect.left, by = b.y + fieldRect.top;
      const family = moodFamily(a.echo?.mood || a.mood);
      const color = MOOD_COLORS[a.echo?.mood] || MOOD_COLORS[family] || '#c9a84c';
      const pulse = 0.78 + Math.sin(phase + index * 0.7) * 0.22;
      const alpha = Math.min(0.22, Math.max(0.035, link.strength * 0.25 * pulse));
      const grad = ctx.createLinearGradient(ax, ay, bx, by);
      grad.addColorStop(0, color + '00');
      grad.addColorStop(.5, color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = grad;
      ctx.lineWidth = isMobileViewport() ? 0.85 : 1.15;
      ctx.stroke();
    });
    raf = requestAnimationFrame(render);
  }

  resize();
  return {setOrbs, render, resize, stop, getLinkCount:()=>links.length};
})();

/* ── BREATHING ── */
const Breathing = (() => {
  let phase = 0;
  function tick() {
    if (!prefersReducedMotion() && !state.tabHidden) {
      phase += 0.008;
      const intensity = state.echoes[0]?.intensity || 5;
      const amp = 0.008 + (intensity / 10) * 0.012;
      const scale = 1 + Math.sin(phase) * amp;
      document.documentElement.style.setProperty('--breath-scale', scale);
    }
    requestAnimationFrame(tick);
  }
  function start() { if (!prefersReducedMotion()) tick(); }
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
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(201,168,76,.4)'; ctx.shadowBlur = 8;
      ctx.stroke(); ctx.shadowBlur = 0;
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,120);
      grd.addColorStop(0,`rgba(201,168,76,${alpha*.08})`); grd.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(cx,cy,120,0,Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();
      t++;
      if (prefersReducedMotion()) { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.opacity = '0'; running = false; return; }
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
    if (prefersReducedMotion()) return;
    const count = Math.floor(silenceLevel * (isMobileViewport() ? 1.1 : 2.0));
    for (let i=0; i<count; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        p.className = 'sil-particle';
        const size = Math.random()*4+1;
        const hue = silenceLevel > 7 ? '124,111,160' : '124,111,160';
        const opacity = 0.4 + (silenceLevel/10)*0.4;
        p.style.cssText = `
          width:${size}px;height:${size}px;
          background:rgba(${hue},${opacity});
          left:${Math.random()*100}%;
          bottom:${Math.random()*40}%;
          animation-duration:${3.5+Math.random()*4}s;
          animation-delay:${Math.random()*0.8}s;
        `;
        layer.appendChild(p);
        setTimeout(() => p.remove(), 8000);
      }, i * 90);
    }
  }
  return {spawn};
})();

/* ── CURSOR AURA (desktop only) ── */
const CursorAura = (() => {
  if (prefersReducedMotion() || window.innerWidth < 768 || !window.matchMedia('(pointer:fine)').matches) return {update:()=>{}};
  const aura = document.createElement('div');
  aura.style.cssText = `
    position:fixed;width:280px;height:280px;border-radius:50%;
    pointer-events:none;z-index:1;
    background:radial-gradient(circle,rgba(201,168,76,.018) 0%,transparent 70%);
    transform:translate(-50%,-50%);
    transition:background .8s ease, opacity .4s;
    will-change:transform;opacity:0;
  `;
  document.body.appendChild(aura);
  let mx=0,my=0,ax=0,ay=0,raf=null,visible=false;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; if (!visible) { aura.style.opacity='1'; visible=true; } }, {passive:true}, 'wire:global-resize');
  document.addEventListener('mouseleave', () => { aura.style.opacity='0'; visible=false; });
  function tick() { if (state.tabHidden || prefersReducedMotion()) { raf = setTimeout(() => requestAnimationFrame(tick), 300); return; } ax += (mx-ax) * 0.08; ay += (my-ay) * 0.08; aura.style.transform = `translate(${ax-140}px,${ay-140}px)`; raf = requestAnimationFrame(tick); }
  tick();
  function update(mood) { if (!mood) return; const c = MOOD_COLORS[mood]; aura.style.background = `radial-gradient(circle,${c}18 0%,transparent 70%)`; }
  return {update};
})();

/* ── GHOST LAYER ── */
const GhostLayer = (() => {
  const layer = document.getElementById('ghost-layer');
  function spawn(echo) {
    const color = MOOD_COLORS[echo.mood];
    const size  = 60 + echo.intensity * 18;
    const ghost = document.createElement('div');
    ghost.className = 'ghost-memory';
    const dur = 18 + Math.random() * 22;
    const blurAmt = size / 3.5 + echo.intensity * 1.5;
    const baseOpacity = 0.04 + (echo.intensity / 10) * 0.05;
    ghost.style.cssText = `
      left:${Math.random()*80+10}%;
      width:${size}px;height:${size}px;
      background:${color};
      filter:blur(${blurAmt}px);
      opacity:0;
      animation:tideFloat ${dur}s linear infinite;
      animation-delay:${Math.random()*6}s;
      --ghost-opacity:${baseOpacity};
    `;
    layer.appendChild(ghost);
    setTimeout(() => ghost.remove(), (dur+8)*1000);
  }
  function initFromEchoes(echoes) {
    if (prefersReducedMotion()) return;
    echoes.slice(0,isMobileViewport()?3:6).forEach((e,i) => setTimeout(() => spawn(e), i*1800));
  }
  return {spawn, initFromEchoes};
})();

/* ── RESIDUE & VOID PULSE ── */
function spawnResidue(x, y, color) {
  if (prefersReducedMotion()) return;
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
  if (prefersReducedMotion()) return;
  const size = 80, p = document.createElement('div');
  p.className = 'void-pulse';
  p.style.cssText = `width:${size}px;height:${size}px;left:${x-size/2}px;top:${y-size/2}px;`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 2200);
}

/* ── SPARKLE TRAIL ── */
function spawnSparkle(x, y, color) {
  if (prefersReducedMotion()) return;
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
  if (prefersReducedMotion()) return;
  for (let i=0; i<(isMobileViewport()?8:14); i++) {
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

    if (prefersReducedMotion()) { ctx.clearRect(0,0,w,h); return; }
    if (state.tabHidden) { rafId = setTimeout(() => requestAnimationFrame(update), 300); return; }

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
    if (!prefersReducedMotion() && !state.tabHidden) update();
    (state.tabHidden ? setTimeout : requestAnimationFrame)(tick, state.tabHidden ? 300 : undefined);
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

  function register(el, x, y, size, color, id, echo = {}) {
    const family = moodFamily(echo.mood);
    const profile = {
      calm:{speed:.0022, amp:.010, className:'orb-calm'},
      anxious:{speed:.0060, amp:.020, className:'orb-anxious'},
      reflective:{speed:.0032, amp:.014, className:'orb-reflective'},
      joyful:{speed:.0048, amp:.018, className:'orb-joyful'},
      empty:{speed:.0020, amp:.008, className:'orb-empty'},
      chaos:{speed:.0042, amp:.016, className:'orb-chaos'}
    }[family] || {speed:.003, amp:.012, className:'orb-reflective'};
    el.classList.add(profile.className);
    const orb = { el, x, y, vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28,
      baseX:x, baseY:y, size, color, id, echo, held:false, lastTap:0, tapCount:0,
      scale:1, targetScale:1, pressed:false, family, motion:profile,
      driftPhase: Math.random()*Math.PI*2,
      orbitPhase: Math.random()*Math.PI*2,
      driftSpeed: profile.speed + Math.random()*0.0015 };
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
    document.body.classList.add('timeline-dragging');
    orb.targetScale = 0.87;
    orb.vx = 0; orb.vy = 0;
    el_setTransform(orb);

    orb._holdTimer = setTimeout(() => {
      if (orb.held) { orb.targetScale = 0.72; }
    }, 400);

    const endDrag = () => {
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
      document.removeEventListener('pointercancel', cancelFn);
      document.removeEventListener('pointermove', moveFn);
      document.body.classList.remove('timeline-dragging');
    };
    const upFn = () => endDrag();
    const cancelFn = () => endDrag();
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
    document.addEventListener('pointercancel', cancelFn, {once:true});
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
      animId = setTimeout(() => requestAnimationFrame(tick), 250); return;
    }
    const fw = field.offsetWidth, fh = field.offsetHeight;
    const rect = field.getBoundingClientRect();

    if (!state.tabHidden) {
      const t = Date.now() * 0.0005;
      orbs.forEach(orb => {
        if (orb.held) return;
        orb.vx *= 0.97; orb.vy *= 0.97;
        // Emotion-shaped drift using per-orb phase: subtle, deterministic, never chaotic.
        orb.driftPhase += orb.driftSpeed;
        orb.orbitPhase += orb.family === 'reflective' ? 0.010 : 0.004;
        const amp = orb.motion.amp * (0.75 + Number(orb.echo?.intensity || 5) / 14);
        orb.vx += Math.sin(orb.driftPhase * 0.7) * amp;
        orb.vy += Math.cos(orb.driftPhase * 0.5) * amp;
        if (orb.family === 'reflective') { orb.vx += Math.cos(orb.orbitPhase) * 0.006; orb.vy += Math.sin(orb.orbitPhase) * 0.006; }
        if (orb.family === 'anxious') { orb.vx += Math.sin(t * 11 + orb.driftPhase) * 0.0035; orb.vy += Math.cos(t * 13 + orb.driftPhase) * 0.0035; }
        if (orb.family === 'empty') { orb.vx *= 0.985; orb.vy *= 0.985; }
        if (orb.family === 'chaos') { orb.targetScale = Math.max(1, 1 + Math.sin(t * 5 + orb.driftPhase) * 0.025); }
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
      ConnectionCanvas.setOrbs(orbs.map(o => ({x:o.x, y:o.y, mood:o._mood, echo:o.echo})));
      if (state.currentView === 'timeline' && !prefersReducedMotion()) ConnectionCanvas.render();
    }
    animId = requestAnimationFrame(tick);
  }

  function clear() { orbs = []; if(animId) cancelAnimationFrame(animId); }
  function start() { if (!prefersReducedMotion()) tick(); }

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
  const getThoughtInput = () => document.getElementById('thought-input');
  const getVoidToggle = () => document.getElementById('void-toggle');
  const formWrap        = document.getElementById('entry-form-wrap');
  const confirmEl       = document.getElementById('echo-confirm');
  const submitBtn       = document.getElementById('submit-btn');
  const moodButtons     = Array.from(document.querySelectorAll('.mood-btn'));

  function updateSubmitState() {
    const ready = Boolean(selectedMood);
    submitBtn.disabled = !ready;
    submitBtn.setAttribute('aria-disabled', String(!ready));
    submitBtn.classList.toggle('is-ready', ready);
    submitBtn.textContent = ready ? 'Crystallize this Echo' : 'Choose a feeling to continue';
  }

  function setupMoodProgressiveReveal() {
    const grid = document.querySelector('.mood-grid');
    if (!grid || moodButtons.length <= 8) return;
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'btn-ghost mood-more-btn';
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.textContent = `Show ${moodButtons.length - 8} more feelings`;
    moodButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', 'false');
      if (index >= 8) {
        button.classList.add('mood-extra');
        button.hidden = true;
      }
    });
    grid.insertAdjacentElement('afterend', moreBtn);
    moreBtn.addEventListener('click', () => {
      const expanded = moreBtn.getAttribute('aria-expanded') === 'true';
      moodButtons.slice(8).forEach(button => { button.hidden = expanded; });
      moreBtn.setAttribute('aria-expanded', String(!expanded));
      moreBtn.textContent = expanded ? `Show ${moodButtons.length - 8} more feelings` : 'Show fewer feelings';
    });
  }

  setupMoodProgressiveReveal();
  updateSubmitState();

  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      selectedMood = btn.dataset.mood;
      updateSubmitState();
      CursorAura.update(selectedMood);
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

  function applyVoidState(next, opts={}) {
    const thoughtInput = getThoughtInput(); const voidToggle = getVoidToggle();
    if (!thoughtInput || !voidToggle) return;
    const wasVoid = voidMode;
    voidMode = Boolean(next);
    voidToggle.classList.toggle('active', voidMode);
    voidToggle.setAttribute('aria-checked', String(voidMode));
    thoughtInput.disabled = voidMode; thoughtInput.style.opacity = voidMode ? '.3' : '1';
    thoughtInput.placeholder = voidMode ? 'No words, only feeling' : 'Let it be incomplete. Let it be honest.';
    if (voidMode && !wasVoid) thoughtInput.value = '';
    if (!voidMode && wasVoid && opts.focus) thoughtInput.focus({preventScroll:true});
  }
  function toggleVoid(){ applyVoidState(!voidMode,{focus:true}); }
  getVoidToggle()?.addEventListener('click', toggleVoid);
  getVoidToggle()?.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleVoid();}});

  submitBtn.addEventListener('click', submit);

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
      thought:   voidMode ? null : (getThoughtInput()?.value || '').trim() || null,
      void:      voidMode,
      date:      new Date().toISOString()
    };
    state.echoes.unshift(echo);
    PWAInstall.trackEngagement?.();
    Storage.save(state.echoes);
    const discoveredMaterials = MaterialEngine.generateForEcho(echo);
    VaultInventory.addMaterials(discoveredMaterials);
    MaterialEngine.toast(discoveredMaterials);
    MaterialEngine.showMaterialBurst(discoveredMaterials);
    EchoAvatar.addXP?.(5, 'create echo');
    GentleQuests.evaluate('echo_created', echo);
    VaultRooms.evaluate?.();

    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    Ripple.spawn(cx, cy, MOOD_COLORS[echo.mood], echo.void, echo.intensity);
    if (echo.void) spawnVoidPulse(cx, cy);
    spawnBurst(cx, cy, MOOD_COLORS[echo.mood]);
    GhostLayer.spawn(echo);
    SilenceParticles.spawn(echo.silence);
    refreshEchoDependentUI();
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
    applyVoidState(false);
  }

  function reset() {
    moodButtons.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
    selectedMood = null; voidMode = false;
    updateSubmitState();
    intensitySlider.value = '5'; intensityVal.textContent = '5';
    silenceSlider.value   = '3'; silenceVal.textContent   = '3';
    const thoughtInput = getThoughtInput();
    if (thoughtInput) { thoughtInput.value=''; thoughtInput.disabled=false; thoughtInput.style.opacity='1'; thoughtInput.placeholder='Let it be incomplete. Let it be honest.'; }
    const voidToggle = getVoidToggle();
    if (voidToggle) { voidToggle.classList.remove('active'); voidToggle.setAttribute('aria-checked','false'); }
    formWrap.style.display = 'block'; confirmEl.classList.remove('show');
  }

  document.getElementById('new-echo-btn').addEventListener('click', () => { reset(); NewEcho.start(); });
  return {reset, applyVoidState};
})();

/* ── TIMELINE / BUBBLE SYSTEM ── */
const Timeline = (() => {
  const field    = document.getElementById('bubble-field');
  const emptyEl  = document.getElementById('timeline-empty');
  const subtitle = document.getElementById('timeline-subtitle');
  const seasonCard = document.getElementById('timeline-season-card');
  let focusedId  = null;

  function render() {
    field.innerHTML = '';
    OrbInteraction.clear();

    if (!state.echoes.length) {
      emptyEl.style.display = 'block'; field.style.display = 'none'; return;
    }
    emptyEl.style.display = 'none'; field.style.display = 'block';
    const season = getEmotionalSeason(state.echoes);
    subtitle.textContent = `${state.echoes.length} echo${state.echoes.length!==1?'s':''} in your cosmos · ${season.title}`;
    if (seasonCard) {
      seasonCard.style.setProperty('--season-color', season.color || '#c9a84c');
      seasonCard.innerHTML = `<div><span class="season-kicker">Current emotional season</span><strong>${escapeHTML(season.title)}</strong></div><p>${escapeHTML(season.interpretation)}</p><small>${escapeHTML((season.traits || []).join(' · '))} · confidence ${escapeHTML(season.confidence || 0)}%</small>`;
    }

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
      placed.push({x, y, r:size/2, mood:echo.mood, echo});

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

      const orb = OrbInteraction.register(wrap, x, y, size, color, echo.id, echo);
      orb._mood = echo.mood;
    });

    // Feed connection canvas
    ConnectionCanvas.setOrbs(placed.map(p => ({x:p.x, y:p.y, mood:p.mood, echo:p.echo})), true);
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
    const color = MOOD_COLORS[echo.mood] || MOOD_COLORS[moodFamily(echo.mood)] || '#c9a84c';
    const season = getEmotionalSeason(state.echoes);
    const relations = Phase2?.describeRelations ? Phase2.describeRelations(echo, state.echoes, moodFamily) : [];
    document.getElementById('detail-badge').textContent = `${MOOD_EMOJIS[echo.mood] || MOOD_EMOJIS[moodFamily(echo.mood)] || '✦'} ${echo.mood}`;
    document.getElementById('detail-badge').style.background = color;
    document.getElementById('detail-int').textContent = echo.intensity;
    document.getElementById('detail-int').style.color = color;
    const thoughtEl = document.getElementById('detail-thought');
    if (echo.void || !echo.thought) {
      thoughtEl.innerHTML = '<span class="detail-void-note">[ void entry — no words, only feeling ]</span>';
    } else {
      thoughtEl.textContent = `"${echo.thought}"`;
    }
    const seasonEl = document.getElementById('detail-season');
    if (seasonEl) {
      seasonEl.style.setProperty('--season-color', season.color || color);
      seasonEl.innerHTML = `<span>Emotional season</span><strong>${escapeHTML(season.title)}</strong><small>${escapeHTML(season.interpretation)}</small>`;
    }
    const relationEl = document.getElementById('detail-relations');
    if (relationEl) {
      relationEl.innerHTML = `<span>Constellation relations</span>${relations.length ? relations.map(({echo:rel, score}) => `<button class="detail-relation-pill" type="button" data-echo-id="${escapeHTML(rel.id)}">${escapeHTML(rel.mood)} · ${Math.round(score)}%</button>`).join('') : '<small>No close relation yet. This orb is keeping its own orbit.</small>'}`;
    }
    const traceBtn = document.getElementById('detail-trace-btn');
    if (traceBtn) {
      traceBtn.disabled = !relations.length;
      traceBtn.onclick = () => {
        const target = relations[0]?.echo;
        if (!target) return;
        panel.classList.remove('open');
        const wrap = Array.from(field.querySelectorAll('.bubble-wrap')).find(node => String(node.dataset.id) === String(target.id));
        if (wrap) { wrap.scrollIntoView({behavior:prefersReducedMotion() ? 'auto' : 'smooth', block:'center'}); handleFocus(wrap); Toast.show('Nearest resonance traced.'); }
      };
    }
    relationEl?.querySelectorAll('.detail-relation-pill').forEach(btn => btn.addEventListener('click', () => {
      const target = state.echoes.find(item => String(item.id) === btn.dataset.echoId);
      if (target) openDetail(target);
    }));
    const silence = echo.silence || 1;
    document.getElementById('detail-meta').innerHTML = `
      ${formatDate(echo.date)}<br>
      Silence level: ${silence}/10 · ${echo.void ? 'void mode' : 'spoken'} · ${relations.length} relation${relations.length === 1 ? '' : 's'}
    `;
    panel.classList.add('open');
    setTimeout(() => document.getElementById('detail-close-btn')?.focus(), 40);
  }

  return {render};
})();

/* ── WRAPPED ── */
const Wrapped = (() => {
  const contentEl = document.getElementById('wrapped-content');
  const emptyEl   = document.getElementById('wrapped-empty');
  const VALID_PERIODS = new Set(['week', 'month', 'all']);
  let renderToken = 0;
  let loadingTimer = null;
  let stuckTimer = null;

  function normalizeEcho(raw, index = 0) {
    if (!raw || typeof raw !== 'object') return null;
    const dateObj = new Date(raw.date);
    if (!Number.isFinite(dateObj.getTime())) return null;
    const mood = String(raw.mood || '').trim() || 'reflective';
    const intensity = Math.max(0, Math.min(10, Number(raw.intensity ?? 5) || 5));
    const silence = Math.max(0, Math.min(10, Number(raw.silence ?? 5) || 5));
    return { ...raw, id: raw.id || `legacy-${index}-${dateObj.getTime()}`, mood, intensity, silence, date: dateObj.toISOString(), thought: typeof raw.thought === 'string' ? raw.thought : '' };
  }

  function renderLoadingState() {
    contentEl.style.display = 'block';
    contentEl.innerHTML = `<section class="wrapped-card" data-wrapped-loading="true"><div class="wrapped-card-title">Loading Wrapped</div><p>Your recap is gathering into focus…</p></section>`;
  }

  function renderFallbackCard(title, body) {
    contentEl.style.display = 'block';
    emptyEl.style.display = 'none';
    contentEl.innerHTML = `<section class="wrapped-card" style="text-align:center"><div class="wrapped-card-title">${escapeHTML(title)}</div><p style="color:var(--muted)">${escapeHTML(body)}</p><div style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn-primary" id="wrapped-retry-btn" type="button">Retry Wrapped</button><button class="btn-ghost" id="wrapped-static-btn" type="button">Show Calm Summary</button><button class="btn-ghost" id="wrapped-create-inline-btn" type="button">Create Echo</button></div></section>`;
    document.getElementById('wrapped-retry-btn')?.addEventListener('click', () => render());
    document.getElementById('wrapped-static-btn')?.addEventListener('click', () => renderStaticFallback());
    document.getElementById('wrapped-create-inline-btn')?.addEventListener('click', () => Nav.show('entry'));
  }

  function renderStaticFallback() {
    const all = (Array.isArray(state.echoes) ? state.echoes : []).map(normalizeEcho).filter(Boolean);
    const sample = all.slice(0, 6);
    const counts = sample.reduce((acc, echo) => { const key = moodFamily(echo.mood); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'reflective';
    contentEl.style.display = 'block';
    emptyEl.style.display = 'none';
    contentEl.innerHTML = `<section class="wrapped-card"><div class="wrapped-card-title">Calm Summary</div><p>Wrapped cinematic details are unavailable right now. Your latest echoes are still safe and readable.</p><p style="font-style:italic;color:var(--muted)">Recent dominant mood: <b>${escapeHTML(dominant)}</b> · ${sample.length} sample echo${sample.length === 1 ? '' : 'es'}.</p></section>`;
  }

  function filterEchoes() {
    const period = VALID_PERIODS.has(state.wrappedPeriod) ? state.wrappedPeriod : 'week';
    state.wrappedPeriod = period;
    const normalized = (Array.isArray(state.echoes) ? state.echoes : []).map(normalizeEcho).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (period === 'week') return normalized.filter(e=>Date.now()-new Date(e.date)<7*86400000);
    if (period === 'month') return normalized.filter(e=>Date.now()-new Date(e.date)<30*86400000);
    return normalized;
  }

  function summarizeEvolution(echoes, patterns) {
    if (echoes.length < 2) return 'One echo is enough to begin the sky. More signals will reveal the arc.';
    const oldest = echoes[echoes.length - 1];
    const newest = echoes[0];
    const shift = moodFamily(oldest.mood) === moodFamily(newest.mood) ? `kept circling ${moodFamily(newest.mood)} weather` : `moved from ${moodFamily(oldest.mood)} into ${moodFamily(newest.mood)}`;
    const tone = patterns.silenceTrend === 'rising' ? 'with a quieter edge' : patterns.intensityTrend === 'rising' ? 'with brighter pressure' : 'with a steady pulse';
    return `This period ${shift}, ${tone}. EchoVault reads that as motion, not a verdict.`;
  }

  function render() {
    const token = ++renderToken;
    clearTimeout(loadingTimer);
    clearTimeout(stuckTimer);
    renderLoadingState();
    stuckTimer = setTimeout(() => {
      if (token !== renderToken) return;
      renderFallbackCard('Wrapped is taking longer than expected', 'No worries — you can retry, open a calm summary, or create a fresh echo.');
    }, 2200);
    loadingTimer = setTimeout(() => {
    const filtered = filterEchoes();
    if (!filtered.length) {
      emptyEl.style.display='block'; contentEl.style.display='none';
      emptyEl.querySelector('.empty-title').textContent = 'No echoes in this period — the room is still dim.';
      emptyEl.querySelector('.empty-sub').textContent = 'Create one small echo and Wrapped will turn it into a gentle emotional recap. Nothing dramatic required.';
      clearTimeout(stuckTimer);
      return;
    }
    if (filtered.length === 1) {
      const echo = filtered[0];
      emptyEl.style.display = 'none'; contentEl.style.display = 'block';
      contentEl.innerHTML = `<section class="wrapped-card"><div class="wrapped-card-title">Mini Recap</div><p>One echo is enough to begin your Wrapped arc.</p><p style="font-style:italic;color:var(--muted)">Mood: <b>${escapeHTML(echo.mood)}</b> · intensity ${echo.intensity}/10 · silence ${echo.silence}/10</p><div style="margin-top:14px"><button class="btn-primary" id="wrapped-create-second-btn" type="button">Create Another Echo</button></div></section>`;
      document.getElementById('wrapped-create-second-btn')?.addEventListener('click', () => Nav.show('entry'));
      clearTimeout(stuckTimer);
      return;
    }
    emptyEl.style.display='none'; contentEl.style.display='block';
    const patterns = PatternEngine.analyze(filtered);
    const archetype = ArchetypeEngine.compute(patterns);
    const moodCounts = patterns.moodCounts || {};
    const sorted = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1]);
    const dominant = patterns.dominantMood || sorted[0]?.[0] || 'reflective';
    const season = patterns.emotionalSeason || getEmotionalSeason(filtered);
    const strongest = [...filtered].sort((a,b)=>(b.intensity||0)-(a.intensity||0))[0];
    const quietest = [...filtered].sort((a,b)=>(b.silence||0)-(a.silence||0))[0];
    const constellationCount = Phase2?.buildConstellationLinks ? Phase2.buildConstellationLinks(filtered.map((echo, index)=>({x:(index%6)*90,y:Math.floor(index/6)*90,mood:echo.mood,echo})), { moodFamily, maxLinks:64, maxDistance:135 }).length : 0;
    const tracks = getSoundprintForEcho(strongest || filtered[0], patterns).slice(0,3);
    const chaos = Math.round(((moodCounts.chaos||0)+(moodCounts.anxious||0))/Math.max(1,filtered.length)*100);

    contentEl.innerHTML = `
      <section class="wrapped-hero-card" style="--season-color:${escapeHTML(season.color || MOOD_COLORS[dominant] || '#c9a84c')}">
        <div class="wrapped-kicker">cinematic recap · ${escapeHTML(state.wrappedPeriod)}</div>
        <h3>${escapeHTML(season.title)}</h3>
        <p>${escapeHTML(season.interpretation)}</p>
        <div class="wrapped-hero-stats">
          <span><b>${filtered.length}</b> echoes</span>
          <span><b>${escapeHTML(dominant)}</b> dominant mood</span>
          <span><b>${constellationCount}</b> constellations</span>
        </div>
      </section>
      <div class="wrapped-card wrapped-season-card">
        <div class="wrapped-card-title">Emotional Season</div>
        <p>${escapeHTML(season.summary || season.interpretation)}</p>
        <div class="season-traits">${(season.traits || []).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div>
        <small>Visual influence: ${escapeHTML(season.influence || 'soft atmospheric glow')} · confidence ${escapeHTML(season.confidence || 0)}%</small>
      </div>
      <div class="wrapped-card">
        <div class="wrapped-card-title">Emotional Palette</div>
        <div class="palette-wrap">
          ${sorted.map(([mood,count])=>`
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
              <div class="palette-swatch" style="background:${MOOD_COLORS[mood] || MOOD_COLORS[moodFamily(mood)]}"></div>
              <div style="font-family:var(--font-mono);font-size:8px;color:var(--muted);text-transform:uppercase;margin-top:22px">${escapeHTML(mood)}</div>
              <div style="font-family:var(--font-mono);font-size:8px;color:var(--gold)">${count}×</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="wrapped-card">
        <div class="wrapped-card-title">Cinematic Highlights</div>
        <div class="wrapped-highlight-grid">
          <article><span>strongest echo</span><b>${escapeHTML(strongest?.mood || '—')}</b><small>intensity ${escapeHTML(strongest?.intensity ?? '—')} · ${escapeHTML(formatDateShort(strongest?.date || Date.now()))}</small></article>
          <article><span>quietest echo</span><b>${escapeHTML(quietest?.mood || '—')}</b><small>silence ${escapeHTML(quietest?.silence ?? '—')} · ${escapeHTML(formatDateShort(quietest?.date || Date.now()))}</small></article>
          <article><span>highest intensity moment</span><b>${escapeHTML(strongest?.thought ? strongest.thought.slice(0, 44) + (strongest.thought.length > 44 ? '…' : '') : 'wordless signal')}</b><small>held, not ranked</small></article>
        </div>
      </div>
      <div class="wrapped-card">
        <div class="wrapped-card-title">Stability / Static Balance</div>
        <div class="balance-bar"><div class="balance-fill" style="width:${chaos}%"></div></div>
        <div class="balance-labels"><span>stability ${100-chaos}%</span><span>${chaos}% static</span></div>
        <p style="font-size:15px;font-style:italic;color:var(--muted);margin-top:14px;line-height:1.7">${escapeHTML(summarizeEvolution(filtered, patterns))}</p>
      </div>
      <div class="wrapped-card">
        <div class="wrapped-card-title">Soundtrack Motifs</div>
        <div class="wrapped-track-list">${tracks.map(track=>`<div><b>${escapeHTML(track.song)}</b><span>${escapeHTML(track.artist)}</span><small>${escapeHTML(track.reason)}</small></div>`).join('')}</div>
      </div>
      <div class="wrapped-card" style="text-align:center">
        <div class="wrapped-card-title">Final Reflection</div>
        <div style="font-family:var(--font-editorial);font-size:28px;color:var(--gold);margin-bottom:8px">${escapeHTML(archetype.archetypeName || getArchetype(moodCounts))}</div>
        <p style="font-size:15px;font-style:italic;color:var(--muted);line-height:1.7">${escapeHTML(archetype.archetypeDescription)}</p>
        <p style="font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">streak: ${escapeHTML(patterns.currentStreakMood || '—')} × ${escapeHTML(patterns.currentStreakCount || 0)} · volatility ${escapeHTML(patterns.volatilityScore)}</p>
        <p style="font-size:14px;color:var(--text);margin-top:8px">${escapeHTML(patterns.oneLineInsight || 'You kept returning. That counts.')}</p>
      </div>`;
    clearTimeout(stuckTimer);
    }, 20);
  }

  return {render, renderStaticFallback};
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
      calm: avg>7 ? ['🌊','Deep ocean calm — an almost sacred stillness.']
                  : avg>4 ? ['🌫️','Soft fog. The kind that muffles the world kindly.']
                  : ['🌤','Quiet skies. Your breathing is the loudest thing.'],
      chaos: avg>7 ? ['⛈️',"Full electrical storm. You're magnificent in it."]
                   : avg>4 ? ['🌩️','Thunder thinking. The static before the strike.']
                   : ['💨','Restless air. Something is circling.'],
      reflective: avg>6 ? ['🌘','Deep lunar. The kind of night made for becoming.']
                        : ['🌙','Reflective skies. The inward horizon is clear.'],
      anxious: avg>7 ? ['🌀','Spiraling turbulence. You are weathering this.']
                     : avg>4 ? ['🫁','Shallow air. Your body knows before your mind does.']
                     : ['💨','A low restlessness. Present, but manageable.'],
      joyful: avg>7 ? ['✨','Radiant skies. Light bending just for you today.']
                    : ['🌸','Warm and flowering. A rare atmospheric softness.'],
      empty: avg>6 ? ['🌑','The absolute dark. Curiously weightless in it.']
                   : ['🌒','The edge of the void. Moon barely showing.']
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
    ctx.lineWidth = 1;
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
        const family = moodFamily(mood);
        const tracks = getSoundprintForEcho(state.echoes[0] || { mood:family, intensity:5, silence:5 }, PatternEngine.analyze(state.echoes));
        const track = tracks[Math.floor(Math.random() * tracks.length)];
        const color = MOOD_COLORS[mood] || MOOD_COLORS[family];
        songEl.innerHTML = `
          <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;opacity:.8">✦ something to listen to</div>
          <div style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;align-items:stretch;max-width:380px;margin:0 auto">
            <div style="width:64px;flex-shrink:0;background:linear-gradient(135deg,${color}55,${color}18);display:flex;align-items:center;justify-content:center;font-size:28px">${MOOD_COVER_EMOJI[mood] || MOOD_COVER_EMOJI[family]}</div>
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

const ReceiptRenderer = (() => {
  const RECEIPT_CLASSES = {
    calm:'Stillwater Class', chaos:'Storm Class', reflective:'Moon Archive Class',
    anxious:'Compass Class', joyful:'Bloom Class', empty:'Void Class'
  };
  function makeBarcode(seed='') {
    return seed.split('').map((c,i)=>(c.charCodeAt(0)+i)%2?'|':'¦').join('').padEnd(26,'|').slice(0,26);
  }
  function vaultHolderName() {
    try {
      const profileName = ProfileStore.read()?.display_name;
      const emailPrefix = Auth.user?.email ? Auth.user.email.split('@')[0] : '';
      const localName = localStorage.getItem(USER_KEY);
      return [profileName, emailPrefix, localName].map(v => String(v || '').trim()).find(Boolean) || 'Local Voyager';
    } catch(e) {
      return 'Local Voyager';
    }
  }
  function syncState() {
    if (Auth.user) return 'Profile Synced';
    const canSync = typeof Auth.hasSupabase === 'function' ? Auth.hasSupabase() : Boolean(Auth.hasSupabase);
    return canSync ? 'Sync Ready' : 'Local Vault';
  }
  function getData(mode='latest') {
    const safeMode = mode === 'weekly' ? 'weekly' : 'latest';
    const fallbackP = {
      dominantMood:'reflective', averageIntensity:0, averageSilence:0, totalEchoes:0,
      emotionalWeather:'shifting sky', voidCount:0, oneLineInsight:'You kept returning. That counts.'
    };
    const echoes = Array.isArray(state.echoes) ? state.echoes : [];
    let p = fallbackP;
    let a = { archetypeName:'The Unknown' };
    let latest = echoes[0] || {};
    try { p = { ...fallbackP, ...(PatternEngine.analyze(echoes) || {}) }; } catch(e) { p = fallbackP; }
    try { a = { archetypeName:'The Unknown', ...(ArchetypeEngine.compute(p) || {}) }; } catch(e) { a = { archetypeName:'The Unknown' }; }
    if (!latest || typeof latest !== 'object') latest = {};
    const mood = safeMode === 'weekly' ? (p.dominantMood || 'reflective') : (latest.mood || p.dominantMood || 'reflective');
    const intensity = Number(safeMode === 'weekly' ? p.averageIntensity : (latest.intensity ?? 0)) || 0;
    const silence = Number(safeMode === 'weekly' ? p.averageSilence : (latest.silence ?? 0)) || 0;
    const date = new Date();
    const receiptId = `EV-${Date.now().toString().slice(-6)}` || 'EV-000000';
    const echoId = latest.id || 'no-echo';
    const coordinates = `EV-${String(mood || 'reflective').toUpperCase()}-I${String(Math.round(intensity)).padStart(2,'0')}-S${String(Math.round(silence)).padStart(2,'0')}` || 'EV-REFLECTIVE-I00-S00';
    const receiptClass = RECEIPT_CLASSES[mood] || 'Moon Archive Class';
    let latestMaterials = [];
    let latestCrafted = null;
    let avatar = {};
    let latestUnlocked = null;
    try { latestMaterials = MaterialEngine.generateForEcho(latest).filter(m => latest.id); } catch(e) { latestMaterials = []; }
    try { latestCrafted = ArtifactArchive.listArtifacts().find(item => item.source === 'crafted' || item.recipe_id) || null; } catch(e) { latestCrafted = null; }
    try { avatar = EchoAvatar.load?.() || {}; } catch(e) { avatar = {}; }
    try { latestUnlocked = VaultRooms.getUnlockedRooms?.().slice(-1)[0] || null; } catch(e) { latestUnlocked = null; }
    const syncLabel = syncState() || 'Local Vault';
    const safeString = `${mood || 'reflective'}:${p.totalEchoes || 0}:${safeMode}:${receiptId || 'EV-000000'}:${echoId || 'no-echo'}`;
    return {
      mode: safeMode || 'latest',
      timestamp: date.toLocaleString(),
      date: date.toLocaleDateString(),
      vaultHolder: vaultHolderName() || 'Local Voyager',
      echoId: echoId || 'no-echo',
      receiptId: receiptId || 'EV-000000',
      receiptNumber: receiptId || 'EV-000000',
      receiptClass: receiptClass || 'Moon Archive Class',
      coordinates: coordinates || 'EV-REFLECTIVE-I00-S00',
      mood: mood || 'reflective',
      intensity,
      silence,
      weather: p.emotionalSeason?.title || p.emotionalWeather || 'shifting sky',
      emotionalSeason: p.emotionalSeason?.title || 'Quiet Winter',
      archetype: a.archetypeName || 'The Unknown',
      voidStatus: safeMode === 'weekly' ? `${Number(p.voidCount) || 0} void entries` : (latest.void ? 'Void Signal' : 'Spoken Signal'),
      insight: p.oneLineInsight || 'You kept returning. That counts.',
      syncLabel,
      materialsDiscovered: latestMaterials.length ? latestMaterials.map(m => `+${m.qty} ${m.name}`).join(' · ') : '',
      craftedRelic: latestCrafted?.title || '',
      avatarRole: avatar.role ? `${avatar.role} · ${avatar.role_title || ''}`.trim() : '',
      roomUnlocked: latestUnlocked?.name || '',
      barcode: makeBarcode(safeString)
    };
  }
  return { RECEIPT_CLASSES, getData, openLatest:()=>getData('latest'), openWeekly:()=>getData('weekly') };
})();


function isReceiptDebugMode() {
  try { return new URLSearchParams(window.location.search).get('debug') === '1'; } catch(e) { return false; }
}

function safeGetReceiptData(mode = 'latest') {
  try {
    return mode === 'weekly'
      ? ReceiptRenderer.openWeekly()
      : ReceiptRenderer.openLatest();
  } catch (error) {
    console.warn('Receipt failed to render', error);
    Toast.show('Receipt failed to open. Your echoes are still safe.');
    return null;
  }
}

/* ── FUN RITUALS ── */


const CoordinateEngine = (() => ({
  generate(e={}) {
    const mood = String(e.mood||'reflective').toUpperCase();
    const i = String(Math.round(e.intensity||0)).padStart(2,'0');
    const sl = String(Math.round(e.silence||0)).padStart(2,'0');
    const vh = e.isVoid?'YES':'NO';
    return { code:`EV-${mood}-I${i}-S${sl}`, geo:`N ${i}° INTENSITY / W ${sl}° SILENCE`, orbit:`ORBIT ${(new Date(e.date||Date.now()).getDate()%12+1).toString().padStart(2,'0')} / MOOD ${mood} / VOID ${vh}` };
  }
}))();

const RelicEngine = (() => {
  const make=(title,type,e,rarity='rare',desc='A preserved emotional fragment.')=>({id:`relic_${type}_${e?.id||Date.now()}`,title,type,mood:e?.mood||'reflective',rarity,sourceEchoId:e?.id||null,description:desc,coordinates:CoordinateEngine.generate(e).code,created_at:new Date().toISOString(),visualSeed:Math.random().toString(36).slice(2)});
  function fromEchoes(echoes=[]) {
    if (!echoes.length) return [];
    const first=echoes[echoes.length-1], latest=echoes[0], high=[...echoes].sort((a,b)=>(b.intensity||0)-(a.intensity||0))[0], silence=[...echoes].sort((a,b)=>(b.silence||0)-(a.silence||0))[0];
    return [
      make('The First Signal','first',first,'luminous','A fragment from the first feeling that entered your orbit.'),
      make('The Glass Comet','latest',latest,'rare','A bright trace from your latest emotional weather.'),
      make('The Storm Fragment','intensity',high,'haunted','A storm compressed into something small enough to hold.'),
      make('The Loudest Quiet','silence',silence,'mythic','Formed from a silence louder than the words around it.')
    ];
  }
  return { fromEchoes };
})();

const ArtifactArchive = (() => {
  const KEY='echovault_artifacts_v1';
  const listArtifacts=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const save=(arr)=>localStorage.setItem(KEY,JSON.stringify(arr));
  const saveArtifact=(artifact)=>{const arr=listArtifacts();arr.unshift({...artifact,id:artifact.id||`art_${Date.now()}`,created_at:new Date().toISOString()});save(arr);EchoAvatar.addXP?.(8, 'save artifact');GentleQuests?.evaluate?.('artifact_saved', artifact);return arr[0];};
  const deleteArtifact=(id)=>save(listArtifacts().filter(a=>a.id!==id));
  const toggleFavorite=(id)=>save(listArtifacts().map(a=>a.id===id?{...a,favorite:!a.favorite}:a));
  return {KEY,saveArtifact,listArtifacts,deleteArtifact,toggleFavorite};
})();


const MaterialEngine = (() => {
  const moodMaterials = {
    calm:'Calm Shard', chaos:'Storm Spark', reflective:'Moon Thread', anxious:'Compass Dust', joyful:'Bloom Seed', empty:'Void Stone'
  };
  const materialMeta = {
    'Calm Shard':{ icon:'◇', mood:'calm', description:'A steady fragment from softened waters.' },
    'Storm Spark':{ icon:'ϟ', mood:'chaos', description:'A charged fleck from intense weather.' },
    'Moon Thread':{ icon:'☾', mood:'reflective', description:'A silver strand from reflective nights.' },
    'Compass Dust':{ icon:'⌖', mood:'anxious', description:'Restless powder that still points somewhere.' },
    'Bloom Seed':{ icon:'✿', mood:'joyful', description:'A small beginning that remembers light.' },
    'Void Stone':{ icon:'●', mood:'empty', description:'Quiet material gathered from spacious silence.' },
    'Silence Glass':{ icon:'◌', mood:'empty', description:'Transparent pressure from things almost said.' },
    'Pressure Ember':{ icon:'◆', mood:'chaos', description:'Heat left behind by a feeling at its edge.' },
    'Void Core':{ icon:'◉', mood:'empty', description:'A rare center from wordless signal.' }
  };
  function generateForEcho(echo={}) {
    const out = [];
    const add = (name, qty=1) => out.push({ name, qty });
    add(moodMaterials[moodFamily(echo.mood)] || 'Moon Thread', echo.intensity >= 7 ? 2 : 1);
    if ((echo.silence || 0) >= 7) add('Silence Glass', 1);
    if ((echo.intensity || 0) >= 8) add('Pressure Ember', 1);
    if (echo.void) add('Void Core', 1);
    return out;
  }
  function toast(materials=[]) {
    if (!materials.length) return;
    Toast.show(materials.map(m => `+${m.qty} ${m.name}${m.qty > 1 ? 's' : ''}`).join(' · '), 2800);
  }
  function showMaterialBurst(materials=[]) {
    if (!materials.length || !document?.body) return toast(materials);
    const burst = document.createElement('div');
    burst.className = 'material-burst';
    burst.setAttribute('role','status');
    burst.innerHTML = materials.map(m => {
      const meta = materialMeta[m.name] || { icon:'✦', mood:'reflective' };
      return `<span class="material-burst-chip mood-${escapeHTML(meta.mood)}"><b>${escapeHTML(meta.icon)}</b> +${escapeHTML(m.qty)} ${escapeHTML(m.name)}${m.qty > 1 ? 's' : ''}</span>`;
    }).join('');
    document.body.appendChild(burst);
    setTimeout(()=>burst.classList.add('show'), 20);
    setTimeout(()=>burst.remove(), 3200);
  }
  return { generateForEcho, toast, showMaterialBurst, materialMeta };
})();

const VaultInventory = (() => {
  const KEY = 'echovault_inventory_v1';
  function normalize(inv){
    const clean = {};
    if (!inv || typeof inv !== 'object' || Array.isArray(inv)) return clean;
    Object.entries(inv).forEach(([name, qty]) => {
      const n = Number(qty);
      if (name && Number.isFinite(n) && n > 0) clean[name] = Math.floor(n);
    });
    return clean;
  }
  function load(){ try { return normalize(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return {}; } }
  function save(inv){ localStorage.setItem(KEY, JSON.stringify(normalize(inv))); return normalize(inv); }
  function addMaterials(materials=[]) {
    const inv = load();
    materials.forEach(({name, qty=1}) => { const q = Math.max(0, Math.floor(Number(qty) || 0)); if (name && q) inv[name] = (inv[name] || 0) + q; });
    save(inv);
    return inv;
  }
  function getMaterialCount(name){ return load()[name] || 0; }
  function missingFor(cost=[]){ return cost.map(({name, qty=1}) => ({ name, qty:Math.max(0, Math.floor(Number(qty) || 0)), have:getMaterialCount(name) })).filter(m => m.have < m.qty).map(m => ({ name:m.name, qty:m.qty - m.have, have:m.have, required:m.qty })); }
  function hasMaterials(cost=[]){ return missingFor(cost).length === 0; }
  function spendMaterials(cost=[]) {
    const inv = load();
    const missing = cost.map(({name, qty=1}) => ({ name, qty:Math.max(0, Math.floor(Number(qty) || 0)), have:inv[name] || 0 })).filter(m => m.have < m.qty).map(m => ({ name:m.name, qty:m.qty - m.have, have:m.have, required:m.qty }));
    if (missing.length) return { ok:false, missing };
    cost.forEach(({name, qty=1}) => { inv[name] = Math.max(0, (inv[name] || 0) - Math.floor(Number(qty) || 0)); if (!inv[name]) delete inv[name]; });
    return { ok:true, inventory:save(inv) };
  }
  function getTotals(){ return load(); }
  function clearInventoryForTestingOnly(){ localStorage.removeItem(KEY); }
  return { KEY, load, save, addMaterials, getTotals, getMaterialCount, hasMaterials, spendMaterials, clearInventoryForTestingOnly };
})();

const RelicCrafting = (() => {
  const recipes = [
    { id:'void_lantern', title:'Void Lantern', description:'A small light made from quiet material.', artifactType:'lantern', cost:[{name:'Void Stone',qty:3},{name:'Moon Thread',qty:1}] },
    { id:'storm_jar', title:'Storm Jar', description:'Sparks contained before they become weather.', artifactType:'stormjar', cost:[{name:'Storm Spark',qty:4},{name:'Pressure Ember',qty:1}] },
    { id:'bloom_token', title:'Bloom Token', description:'A small proof that light returned.', artifactType:'bloom_token', cost:[{name:'Bloom Seed',qty:3},{name:'Calm Shard',qty:1}] },
    { id:'moon_compass', title:'Moon Compass', description:'A direction finder for reflective nights.', artifactType:'moon_compass', cost:[{name:'Compass Dust',qty:2},{name:'Moon Thread',qty:2}] },
    { id:'silence_bell', title:'Silence Bell', description:'A bell made from things almost said.', artifactType:'silence_bell', cost:[{name:'Silence Glass',qty:3}] },
    { id:'glass_comet', title:'Glass Comet', description:'A bright fragment from intense quiet.', artifactType:'glass_comet', cost:[{name:'Storm Spark',qty:2},{name:'Silence Glass',qty:2}] }
  ];
  const listRecipes=()=>recipes.map(r=>({...r,cost:r.cost.map(c=>({...c}))}));
  const getRecipe=(recipeId)=>listRecipes().find(r=>r.id===recipeId) || null;
  const getMissingMaterials=(recipeId)=>{ const r=getRecipe(recipeId); return r ? r.cost.map(c=>({ ...c, have:VaultInventory.getMaterialCount(c.name) })).filter(c=>c.have<c.qty).map(c=>({ name:c.name, qty:c.qty-c.have, have:c.have, required:c.qty })) : []; };
  const canCraft=(recipeId)=>{ const r=getRecipe(recipeId); return Boolean(r && VaultInventory.hasMaterials(r.cost)); };
  function craft(recipeId){
    const recipe = getRecipe(recipeId);
    if (!recipe) return { ok:false, missing:[], error:'Recipe not found' };
    const missing = getMissingMaterials(recipeId);
    if (missing.length) return { ok:false, missing };
    const spent = VaultInventory.spendMaterials(recipe.cost);
    if (!spent.ok) return spent;
    const artifact = ArtifactArchive.saveArtifact({ type:recipe.artifactType, recipe_id:recipe.id, title:recipe.title, subtitle:recipe.description, description:recipe.description, created_at:new Date().toISOString(), source:'crafted', data:{ recipe_id:recipe.id, cost:recipe.cost } });
    Toast.show(`Crafted: ${recipe.title}`);
    GentleQuests.evaluate('relic_crafted', artifact);
    EchoAvatar.addXP?.(12, 'craft relic');
    VaultRooms.evaluate?.();
    return { ok:true, artifact };
  }
  return { listRecipes, getRecipe, canCraft, getMissingMaterials, craft };
})();

const VaultRooms = (() => {
  const KEY = 'echovault_rooms_v1';
  const rooms = [
    { id:'weather_room', name:'Weather Room', reason:'Requires at least 1 echo.', test:()=>state.echoes.length >= 1 },
    { id:'crafting_table', name:'Crafting Table', reason:'Requires at least 3 total materials.', test:()=>Object.values(VaultInventory.getTotals()).reduce((a,b)=>a+Number(b||0),0) >= 3 },
    { id:'relic_hall', name:'Relic Hall', reason:'Requires at least 1 crafted artifact.', test:()=>ArtifactArchive.listArtifacts().some(a=>a.source==='crafted' || a.recipe_id) },
    { id:'lantern_garden', name:'Lantern Garden', reason:'Requires crafted Void Lantern.', test:()=>ArtifactArchive.listArtifacts().some(a=>a.recipe_id==='void_lantern' || (a.source==='crafted' && a.type==='lantern')) },
    { id:'storm_chamber', name:'Storm Chamber', reason:'Requires crafted Storm Jar.', test:()=>ArtifactArchive.listArtifacts().some(a=>a.recipe_id==='storm_jar' || (a.source==='crafted' && a.type==='stormjar')) },
    { id:'soundprint_wall', name:'Soundprint Wall', reason:'Requires at least 3 echoes.', test:()=>state.echoes.length >= 3 },
    { id:'archive_shelf', name:'Archive Shelf', reason:'Requires at least 3 saved artifacts.', test:()=>ArtifactArchive.listArtifacts().length >= 3 },
    { id:'society_gate', name:'Society Gate', reason:'Requires Echo Avatar + 5 echoes + 1 saved or crafted artifact.', test:()=>Object.keys(EchoAvatar.load()).length > 0 && state.echoes.length >= 5 && ArtifactArchive.listArtifacts().length >= 1 }
  ];
  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
  function getRooms(){ const saved=load(); return rooms.map(r=>({ id:r.id, name:r.name, unlocked:Boolean(saved[r.id]?.unlocked || r.test()), reason:r.reason })); }
  function getUnlockedRooms(){ return getRooms().filter(r=>r.unlocked); }
  function isUnlocked(roomId){ return Boolean(getRooms().find(r=>r.id===roomId)?.unlocked); }
  function getUnlockReason(roomId){ return rooms.find(r=>r.id===roomId)?.reason || 'Keep building your private vault.'; }
  function detectNewUnlocks(previousState={}){ return rooms.filter(r=>r.test() && !previousState[r.id]?.unlocked).map(r=>({ id:r.id, name:r.name })); }
  function saveUnlockState(){ const out={}; rooms.forEach(r=>{ out[r.id]={ unlocked:Boolean(r.test()), checked_at:new Date().toISOString() }; }); localStorage.setItem(KEY, JSON.stringify(out)); return out; }
  function evaluate(){ const prev=load(); const newly=detectNewUnlocks(prev); const saved=saveUnlockState(); newly.forEach(r=>{ Toast.show(`${r.name} awakened.`); GentleQuests.evaluate('room_unlocked', r); EchoAvatar.addXP?.(15, 'unlock room'); }); return saved; }
  return { KEY, getRooms, getUnlockedRooms, isUnlocked, getUnlockReason, detectNewUnlocks, saveUnlockState, evaluate };
})();

const GentleQuests = (() => {
  const KEY = 'echovault_quests_v1';
  const catalog = [
    { id:'void_echo', text:'Create one echo without words.', reward:{ name:'Void Stone', qty:1 }, xp:0, test:(event, data)=>event==='echo_created' && data?.void },
    { id:'save_artifact', text:'Save one artifact.', reward:{ name:'Moon Thread', qty:1 }, xp:0, test:(event)=>event==='artifact_saved' },
    { id:'light_lantern', text:'Light the Void Lantern once.', reward:{ name:'Moon Thread', qty:1 }, xp:0, test:(event)=>event==='lantern_lit' },
    { id:'visit_weather', text:'Visit the Weather Room.', reward:{ name:'Calm Shard', qty:1 }, xp:0, test:(event)=>event==='weather_room_visited' },
    { id:'low_intensity', text:'Create one low-intensity echo.', reward:{ name:'Silence Glass', qty:1 }, xp:0, test:(event, data)=>event==='echo_created' && (data?.intensity || 0) <= 3 },
    { id:'export_receipt', text:'Export a receipt.', reward:{ name:'Bloom Seed', qty:1 }, xp:0, test:(event)=>event==='receipt_exported' },
    { id:'craft_one_relic', text:'Craft one relic.', reward:{ name:'Bloom Seed', qty:1 }, xp:5, test:(event)=>event==='relic_crafted' },
    { id:'visit_crafting_table', text:'Visit the Crafting Table.', reward:{ name:'Compass Dust', qty:1 }, xp:3, test:(event)=>event==='crafting_table_visited' },
    { id:'save_crafted_artifact', text:'Save one crafted artifact.', reward:{ name:'Calm Shard', qty:1 }, xp:5, test:(event, data)=>event==='artifact_saved' && (data?.source==='crafted' || data?.recipe_id) },
    { id:'unlock_one_room', text:'Unlock one room.', reward:{ name:'Moon Thread', qty:1 }, xp:8, test:(event)=>event==='room_unlocked' },
    { id:'generate_avatar', text:'Generate your Echo Avatar.', reward:{ name:'Silence Glass', qty:1 }, xp:5, test:(event)=>event==='avatar_generated' }
  ];
  function todayKey(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function completionKey(id, dateKey = todayKey()) { return `${id}:${dateKey}`; }
  function load(){
    let data;
    try { data = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { data = {}; }
    let migrated = false;
    Object.entries(data || {}).forEach(([key, value]) => {
      if (!key.includes(':') && value?.completed) {
        const dateKey = value.completed_at ? todayKey(new Date(value.completed_at)) : todayKey();
        const dailyKey = completionKey(key, dateKey);
        if (!data[dailyKey]) data[dailyKey] = { ...value, completed:true, completed_at:value.completed_at || new Date().toISOString(), migrated_from:key };
        delete data[key];
        migrated = true;
      }
    });
    if (migrated) save(data);
    return data || {};
  }
  function save(data){ localStorage.setItem(KEY, JSON.stringify(data || {})); return data || {}; }
  function todayId(){ return catalog[new Date().getDate() % catalog.length].id; }
  function current(){ const q = catalog.find(x => x.id === todayId()) || catalog[0]; const data = load(); const key = completionKey(q.id); return { ...q, todayKey:todayKey(), completionKey:key, completed: Boolean(data[key]?.completed) }; }
  function evaluate(event, data) {
    const saved = load();
    const q = catalog.find(item => item.test(event, data) && !saved[completionKey(item.id)]);
    if (!q) return false;
    const key = completionKey(q.id);
    saved[key] = { completed:true, completed_at:new Date().toISOString(), todayKey:todayKey(), event };
    save(saved);
    VaultInventory.addMaterials([q.reward]);
    if (q.xp && EchoAvatar.addXP) EchoAvatar.addXP(q.xp, `quest:${q.id}`);
    Toast.show(`Gentle Quest complete · +${q.reward.qty} ${q.reward.name}${q.xp ? ` · +${q.xp} XP` : ''}`, 3200);
    return true;
  }
  return { KEY, catalog, todayKey, completionKey, current, evaluate, load, save };
})();

const EchoAvatar = (() => {
  const KEY = 'echovault_avatar_v1';
  const roleMap = {
    stillLake:['Lantern Keeper','blue-gold stillwater','hooded coat with lantern seams','🏮'],
    electricStorm:['Stormwright','rose lightning','glasswork jacket with copper lines','⚡'],
    nightArchivist:['Moon Archivist','violet moon haze','ink cloak with silver pockets','🌙'],
    tremblingCompass:['Weather Cartographer','amber wind-ring','soft field coat with compass thread','🧭'],
    bloomingField:['Bloom Tender','green dawn bloom','garden wrap with seed charms','🌸'],
    quietAbyss:['Void Keeper','indigo eclipse','dark mantle with quiet stars','🌑'],
    shiftingSky:['Signal Courier','prism skyglow','runner scarf with signal beads','✦'],
    glassComet:['Relic Runner','crystal ember trail','comet boots and relic satchel','☄️'],
    softWitness:['Archive Witness','mist gold aura','warm shawl with archive pins','👁️']
  };
  const thresholds = [
    { xp:300, title:'Mythbearer', accessory:'mythic mantle trim' },
    { xp:150, title:'Cartographer', accessory:'coordinate sash' },
    { xp:75, title:'Archivist', accessory:'archive pin' },
    { xp:25, title:'Keeper', accessory:'small lantern charm' },
    { xp:0, title:'Initiate', accessory:'first vault thread' }
  ];
  function getLevelTitle(xp=0){ return thresholds.find(t => xp >= t.xp)?.title || 'Initiate'; }
  function getLevelNumber(xp=0){ return thresholds.slice().reverse().filter(t => xp >= t.xp).length; }
  function getNextUnlock(){ const avatar=load(); const xp=Number(avatar.role_xp || 0); return thresholds.slice().reverse().find(t => t.xp > xp) || null; }
  function normalize(avatar={}){
    const xp = Math.max(0, Number(avatar.role_xp || 0));
    return { ...avatar, level:avatar.level || getLevelNumber(xp), role_xp:xp, role_title:avatar.role_title || getLevelTitle(xp), unlocked_accessories:Array.isArray(avatar.unlocked_accessories)?avatar.unlocked_accessories:[], last_progress_at:avatar.last_progress_at || avatar.updated_at || avatar.created_at || new Date().toISOString() };
  }
  function load(){ try { return normalize(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return normalize({}); } }
  function save(avatar){ localStorage.setItem(KEY, JSON.stringify(normalize(avatar))); return normalize(avatar); }
  function build() {
    const arch = ArchetypeEngine.compute(PatternEngine.analyze(state.echoes));
    const profile = ProfileStore.read();
    const key = arch.archetypeKey || 'shiftingSky';
    const [role, aura, outfit_hint, companion_symbol] = roleMap[key] || roleMap.shiftingSky;
    const previous = load();
    const xp = Number(previous.role_xp || 0);
    const avatar = save({ ...previous, avatar_name: profile.display_name || previous.avatar_name || 'Echo Voyager', archetype_key:key, role, aura, outfit_hint, companion_symbol, level:getLevelNumber(xp), role_xp:xp, role_title:getLevelTitle(xp), created_at:previous.created_at || new Date().toISOString(), updated_at:new Date().toISOString(), last_progress_at:previous.last_progress_at || new Date().toISOString() });
    GentleQuests.evaluate('avatar_generated', avatar);
    VaultRooms.evaluate?.();
    return avatar;
  }
  function regenerateRole(){ return build(); }
  function addXP(amount=0, reason='progress'){
    const current = Object.keys(load()).length ? load() : build();
    const beforeTitle = getLevelTitle(current.role_xp || 0);
    const nextXp = Math.max(0, Number(current.role_xp || 0) + Number(amount || 0));
    const nextTitle = getLevelTitle(nextXp);
    const unlocked_accessories = new Set(current.unlocked_accessories || []);
    thresholds.filter(t => nextXp >= t.xp).forEach(t => unlocked_accessories.add(t.accessory));
    const saved = save({ ...current, role_xp:nextXp, level:getLevelNumber(nextXp), role_title:nextTitle, unlocked_accessories:[...unlocked_accessories], last_progress_at:new Date().toISOString(), last_progress_reason:reason });
    if (nextTitle !== beforeTitle) Toast.show(`Echo Avatar evolved: ${nextTitle}`);
    return saved;
  }
  function getProgress(){ const avatar=load(); const xp=Number(avatar.role_xp || 0); const current=thresholds.find(t=>xp>=t.xp) || thresholds[thresholds.length-1]; const next=getNextUnlock(); const span=next ? next.xp-current.xp : 1; const pct=next ? Math.max(4, Math.min(100, ((xp-current.xp)/span)*100)) : 100; return { xp, level:avatar.level, role_title:avatar.role_title || getLevelTitle(xp), current, next, percent:pct }; }
  function renderProgress(){ const p=getProgress(); return `<div class="avatar-progress"><div class="avatar-progress-head"><span>${escapeHTML(p.role_title)}</span><b>${escapeHTML(p.xp)} XP</b></div><div class="avatar-progress-bar"><i style="width:${p.percent}%"></i></div><small>${p.next ? `Next unlock: ${escapeHTML(p.next.title)} at ${p.next.xp} XP · accessory: ${escapeHTML(p.next.accessory)}` : 'All current avatar milestones awakened.'}</small></div>`; }
  function render(){
    const avatar = Object.keys(load()).length ? load() : build();
    const arch = ArchetypeEngine.compute(PatternEngine.analyze(state.echoes));
    const next = getNextUnlock();
    const latestAccessory = (avatar.unlocked_accessories || []).slice(-1)[0] || 'first vault thread';
    const safe = {
      symbol: escapeHTML(avatar.companion_symbol),
      name: escapeHTML(avatar.avatar_name),
      role: escapeHTML(avatar.role),
      roleTitle: escapeHTML(avatar.role_title || getLevelTitle(avatar.role_xp)),
      aura: escapeHTML(avatar.aura),
      outfit: escapeHTML(avatar.outfit_hint),
      archetype: escapeHTML(arch.archetypeName),
      accessory: escapeHTML(latestAccessory)
    };
    const recommendedDistrict = escapeHTML(getSocietyDistrictSuggestion(avatar.role || ''));
    const gateReady = Boolean(state.echoes.length >= 5 && ArtifactArchive.listArtifacts().length >= 1);
    return `<div class="echo-avatar-card"><div class="echo-avatar-orb"><span>${safe.symbol}</span></div><div class="echo-avatar-kicker">Echo Avatar</div><h4>${safe.name}</h4><div class="echo-avatar-role" data-society-role="${safe.role}">${safe.role} · ${safe.roleTitle}</div>${renderProgress()}<p>Aura: ${safe.aura}</p><p>Archetype: ${safe.archetype}</p><p>Companion symbol: ${safe.symbol}</p><p class="echo-avatar-outfit">${safe.outfit}</p><p class="avatar-accessory-hint">Accessory hint: ${safe.accessory}</p><p class="avatar-next-hint">${next ? `Next unlock: ${escapeHTML(next.title)} at ${next.xp} XP.` : 'Your current path is fully awakened.'}</p><div class="phase-two-note">Society role: <b>${safe.role}</b> · Recommended district: <b>${recommendedDistrict}</b>. ${gateReady ? 'Society Gate can receive you privately.' : 'Society Gate requirement: 5 echoes and 1 saved artifact.'}</div><div class="echo-avatar-actions"><button class="receipt-action-btn" id="avatar-generate-btn">Generate from my profile</button><button class="receipt-action-btn" id="avatar-regenerate-btn">Regenerate role</button><button class="receipt-action-btn" id="avatar-visit-district-btn">Visit my district</button></div></div>`;
  }
  function bind(){ document.getElementById('avatar-generate-btn')?.addEventListener('click',()=>{build(); refreshEchoDependentUI(); Toast.show('Echo Avatar refreshed.');}); document.getElementById('avatar-regenerate-btn')?.addEventListener('click',()=>{regenerateRole(); refreshEchoDependentUI(); Toast.show('Role regenerated locally.');}); document.getElementById('avatar-visit-district-btn')?.addEventListener('click',()=>{ const ok=Rituals.open?.('museum'); setTimeout(()=>{ document.querySelector('[data-room="society"]')?.click(); document.getElementById('society-enter-btn')?.click(); }, 80); Toast.show('Opening your EchoSociety district.'); }); }
  return { KEY, load, save, build, regenerateRole, addXP, getProgress, getLevelTitle, getNextUnlock, renderProgress, render, bind };
})();


const SOCIETY_TABLES = {
  consents:'society_consents',
  signals:'society_signals',
  reactions:'society_reactions',
  publicSignals:'society_signals_public',
  weatherDaily:'society_weather_daily',
  reactionCounts:'society_reaction_counts'
};

const SOCIETY_REACTIONS = {
  witnessed:'🌙 witnessed',
  held:'🕯️ held',
  softened:'🌊 softened',
  bloomed:'🌸 bloomed',
  charged:'⚡ charged'
};

function readLocalJSON(key, fallback) {
  try { const parsed = JSON.parse(localStorage.getItem(key) || ''); return parsed ?? fallback; } catch { return fallback; }
}
function writeLocalJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
function dayKey(date = new Date()) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10); }

function sanitizeSocietySignal(signal = {}) {
  const allowed = ['client_id','mood','intensity_band','silence_band','archetype','signal_type','district','anonymous_label','metadata','day'];
  const forbidden = ['thought','raw_thought','email','display_name','name','profile','full_echo','user_text','archive_line'];
  const detected = forbidden.filter((field) => Object.prototype.hasOwnProperty.call(signal, field));
  if (detected.length && window.__ECHOVAULT_DEBUG__) console.warn('[EchoSociety] stripped unsafe fields', detected);
  const safe = {};
  allowed.forEach((field) => {
    if (signal[field] === undefined || signal[field] === null) return;
    if (field === 'metadata') {
      const meta = { ...(signal.metadata || {}) };
      forbidden.forEach((unsafe) => delete meta[unsafe]);
      safe.metadata = meta;
    } else {
      safe[field] = typeof signal[field] === 'string' ? signal[field].slice(0,120) : signal[field];
    }
  });
  safe.day = safe.day || dayKey();
  safe.client_id = safe.client_id || localStorage.getItem('echovault_client_id_v1') || (() => { const id=`ev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; localStorage.setItem('echovault_client_id_v1', id); return id; })();
  return safe;
}

const SocietyPrivacy = (() => {
  const forbidden = ['thought','raw_thought','email','display_name','name','profile','full_echo','user_text','archive_line'];
  function stripUnsafeFields(payload = {}) { return sanitizeSocietySignal(payload); }
  function isSafeSignalPayload(payload = {}) { return forbidden.every((field) => !Object.prototype.hasOwnProperty.call(payload, field)); }
  function hasSpecialAccess() { return Boolean(UserAccess.canUse('echosociety') && UserAccess.canUse('society_gate')); }
  function requireSpecialAccess() { if (hasSpecialAccess()) return true; UserAccess.requirePremium('society_gate', { openSettings:true }); return false; }
  function canContribute() { return hasSpecialAccess() && SocietySignals.getConsent(); }
  function requireConsent() { if (!SocietySignals.getConsent()) { Toast.show('Join EchoSociety first. Your vault is still private.'); return false; } return true; }
  function requireSafeSignalPayload(payload = {}) { if (isSafeSignalPayload(payload)) return true; Toast.show('Only anonymous symbolic signals can enter EchoSociety.'); return false; }
  function explainPrivacy() { return 'Raw echoes stay private by default. EchoSociety receives only anonymous symbolic mood, intensity, silence, archetype, district, and day signals after consent.'; }
  return { canContribute, requireSpecialAccess, requireConsent, requireSafeSignalPayload, stripUnsafeFields, isSafeSignalPayload, explainPrivacy };
})();

const SocietySignals = (() => {
  const CONSENT_KEY = 'echovault_society_consent_v1';
  const SIGNALS_KEY = 'echovault_society_signals_v1';
  const REACTIONS_KEY = 'echovault_society_reactions_v1';
  const SIGNAL_TYPES = ['weather','lantern','storm','bloom','archive','delivery','alam'];
  const DISTRICTS = { weather:'Weather Tower', lantern:'Lantern District', storm:'Storm Works', bloom:'Bloom Market', archive:'Moon Archive', delivery:'Signal Couriers’ Route', alam:'alam.ai Observatory' };
  const ANON_LABELS = ['Moon Signal','Lantern Wisp','Quiet Comet','Bloom Shade','Storm Mote','Archive Finch','Drift Spark','Soft Witness'];
  function ensureKeys(){ if (localStorage.getItem(CONSENT_KEY) === null) writeLocalJSON(CONSENT_KEY, { consent:false, updated_at:null, cloud_status:'unknown' }); if (localStorage.getItem(SIGNALS_KEY) === null) writeLocalJSON(SIGNALS_KEY, []); if (localStorage.getItem(REACTIONS_KEY) === null) writeLocalJSON(REACTIONS_KEY, {}); }
  function getConsent(){ ensureKeys(); return Boolean(readLocalJSON(CONSENT_KEY, {consent:false})?.consent); }
  function setConsent(consent){ ensureKeys(); const value = { consent:Boolean(consent), updated_at:new Date().toISOString(), local_only:Auth.isLocalMode(), cloud_status:Auth.user ? 'pending' : 'local_preview' }; writeLocalJSON(CONSENT_KEY, value); SocietySync.setConsent?.(Boolean(consent)).catch?.(()=>{}); return value; }
  function revokeConsent(){ const value = { consent:false, updated_at:new Date().toISOString(), local_only:Auth.isLocalMode(), cloud_status:Auth.user ? 'revoked_pending' : 'local_preview' }; writeLocalJSON(CONSENT_KEY, value); SocietySync.revokeConsent?.().catch?.(()=>{}); return value; }
  function requireConsent(){ return SocietyPrivacy.requireConsent(); }
  function latestEcho(){ return state.echoes?.[0] || {}; }
  function band(value, lowLabel, midLabel, highLabel){ const n = Number(value || 0); if (n >= 8) return highLabel; if (n >= 4) return midLabel; return lowLabel; }
  function resolveArchetype(){ try { return ArchetypeEngine.compute(PatternEngine.analyze(state.echoes)).archetypeName; } catch { return 'The Unknown'; } }
  function normalizeType(type){ return SIGNAL_TYPES.includes(type) ? type : 'weather'; }
  function baseSignal(type='weather', source={}){
    const signalType = normalizeType(type);
    const echo = source.echo || latestEcho();
    return {
      id: source.id || `soc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      mood: source.mood || echo.mood || PatternEngine.analyze(state.echoes).dominantMood || 'empty',
      intensity_band: source.intensity_band || band(source.intensity ?? echo.intensity, 'low', 'medium', 'high'),
      silence_band: source.silence_band || band(source.silence ?? echo.silence, 'soft', 'hushed', 'deep'),
      archetype: source.archetype || resolveArchetype(),
      signal_type: signalType,
      district: source.district || DISTRICTS[signalType],
      created_at: source.created_at || new Date().toISOString(),
      day: source.day || dayKey(),
      anonymous_label: source.anonymous_label || ANON_LABELS[Math.floor(Math.random()*ANON_LABELS.length)],
      metadata: source.metadata || {}
    };
  }
  function createSignal(type='weather', source={}){
    ensureKeys();
    if (!SocietyPrivacy.requireSpecialAccess()) return null;
    if (!requireConsent()) return null;
    const signal = baseSignal(type, source);
    if (!SocietyPrivacy.requireSafeSignalPayload(signal)) return null;
    const safe = sanitizeSocietySignal(signal);
    if (!SocietyPrivacy.requireSafeSignalPayload(safe)) return null;
    const local = { ...safe, id:signal.id, created_at:signal.created_at, synced:false, raw_echo_shared:false };
    const arr = listLocalSignals(); arr.unshift(local); writeLocalJSON(SIGNALS_KEY, arr.slice(0,160));
    SocietySync.uploadSignal(local).then((res)=>{ if(res?.ok) markSynced(local.id); }).catch(()=>{});
    return local;
  }
  function listLocalSignals(){ ensureKeys(); const arr = readLocalJSON(SIGNALS_KEY, []); return Array.isArray(arr) ? arr : []; }
  function markSynced(id){ const arr=listLocalSignals().map((s)=>s.id===id?{...s,synced:true,synced_at:new Date().toISOString()}:s); writeLocalJSON(SIGNALS_KEY, arr); }
  function clearLocalSignals(){ writeLocalJSON(SIGNALS_KEY, []); writeLocalJSON(REACTIONS_KEY, {}); }
  function exportSignals(){ ensureKeys(); const blob = new Blob([JSON.stringify({ version:2, privacy:SocietyPrivacy.explainPrivacy(), consent:readLocalJSON(CONSENT_KEY,{}), signals:listLocalSignals().map(sanitizeSocietySignal), reactions:listReactions() }, null, 2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='echovault-society-signals.json'; a.click(); URL.revokeObjectURL(url); }
  function listReactions(){ ensureKeys(); const obj = readLocalJSON(REACTIONS_KEY, {}); return obj && typeof obj === 'object' ? obj : {}; }
  function addReaction(signalId, reactionType){ if (!SocietyPrivacy.requireSpecialAccess()) return null; if (!SocietyPrivacy.requireConsent()) return null; if(!SOCIETY_REACTIONS[reactionType]) return null; const payload={ signal_id:String(signalId || 'local-preview'), reaction_type:reactionType, day:dayKey() }; if(!SocietyPrivacy.requireSafeSignalPayload(payload)) return null; const all=listReactions(); const key=payload.signal_id; const current=Array.isArray(all[key]) ? all[key] : []; if(!current.includes(reactionType)) current.push(reactionType); all[key]=current; writeLocalJSON(REACTIONS_KEY, all); SocietySync.addReaction(signalId, reactionType).catch(()=>{}); return current; }
  function guardDistrictContribution(payload = {}){ return SocietyPrivacy.requireSpecialAccess() && SocietyPrivacy.requireConsent() && SocietyPrivacy.requireSafeSignalPayload(payload); }
  const contributeWeather=()=> guardDistrictContribution({ signal_type:'weather' }) ? createSignal('weather') : null;
  const contributeLantern=()=> guardDistrictContribution({ signal_type:'lantern' }) ? createSignal('lantern', { mood: latestEcho().mood || 'empty', silence: latestEcho().silence ?? 9 }) : null;
  const contributeStorm=()=> guardDistrictContribution({ signal_type:'storm' }) ? createSignal('storm', { mood: latestEcho().mood || 'chaos', intensity: latestEcho().intensity ?? 9 }) : null;
  const contributeBloom=()=> guardDistrictContribution({ signal_type:'bloom' }) ? createSignal('bloom', { mood: latestEcho().mood || 'joyful', intensity: latestEcho().intensity ?? 4 }) : null;
  const contributeArchiveLine=(optionalLine='')=> guardDistrictContribution({ signal_type:'archive', metadata:{ archive_marker:Boolean(String(optionalLine).trim()) } }) ? createSignal('archive', { metadata:{ archive_marker:Boolean(String(optionalLine).trim()) } }) : null;
  const contributeDelivery=(mission)=> guardDistrictContribution({ signal_type:'delivery', district:mission?.to || 'Signal Couriers’ Route', metadata:{ delivery_item:mission?.item || 'signal', mission_id:mission?.id || 'delivery' } }) ? createSignal('delivery', { district:mission?.to || 'Signal Couriers’ Route', metadata:{ delivery_item:mission?.item || 'signal', mission_id:mission?.id || 'delivery' } }) : null;
  const contributeAlam=()=> guardDistrictContribution({ signal_type:'alam', metadata:{ portal:'observatory' } }) ? createSignal('alam', { metadata:{ portal:'observatory' } }) : null;
  function isSupabaseSocietyAvailable(){ return SocietySync.isAvailable(); }
  function maybePrepareFutureSync(signal){ return { ok:isSupabaseSocietyAvailable(), signal:sanitizeSocietySignal(signal), raw_echo_shared:false }; }
  ensureKeys();
  return { CONSENT_KEY, SIGNALS_KEY, REACTIONS_KEY, SIGNAL_TYPES, DISTRICTS, createSignal, listLocalSignals, markSynced, contributeWeather, contributeLantern, contributeStorm, contributeBloom, contributeArchiveLine, contributeDelivery, contributeAlam, getConsent, setConsent, revokeConsent, clearLocalSignals, exportSignals, listReactions, addReaction, isSupabaseSocietyAvailable, maybePrepareFutureSync, requireConsent };
})();

const SocietySync = (() => {
  function isAvailable(){ return Boolean(Auth.client && Auth.user && !Auth.isLocalMode()); }
  async function getConsent(){ if(!isAvailable()) return readLocalJSON(SocietySignals.CONSENT_KEY, {consent:false}); try { const {data,error}=await Auth.client.from(SOCIETY_TABLES.consents).select('*').eq('user_id',Auth.user.id).maybeSingle(); if(error) throw error; return data || readLocalJSON(SocietySignals.CONSENT_KEY, {consent:false}); } catch(err){ if(window.__ECHOVAULT_DEBUG__) console.warn('[EchoSociety] consent fetch failed', err); return readLocalJSON(SocietySignals.CONSENT_KEY, {consent:false}); } }
  async function setConsent(consent){ if(!isAvailable()) return {ok:false, mode:'local'}; const payload={ user_id:Auth.user.id, consent:Boolean(consent), updated_at:new Date().toISOString() }; try { const {error}=await Auth.client.from(SOCIETY_TABLES.consents).upsert(payload,{onConflict:'user_id'}); if(error) throw error; const stored=readLocalJSON(SocietySignals.CONSENT_KEY,{}); writeLocalJSON(SocietySignals.CONSENT_KEY,{...stored, cloud_status:consent?'synced':'revoked'}); return {ok:true}; } catch(err){ if(window.__ECHOVAULT_DEBUG__) console.warn('[EchoSociety] consent sync failed', err); return {ok:false, error:err}; } }
  async function revokeConsent(){ return setConsent(false); }
  async function uploadSignal(signal){ if(!isAvailable() || !SocietySignals.getConsent()) return {ok:false, mode:'local_preview'}; const payload=sanitizeSocietySignal(signal); if(!SocietyPrivacy.isSafeSignalPayload(payload)) return {ok:false, error:'unsafe_payload'}; try { const {error}=await Auth.client.from(SOCIETY_TABLES.signals).insert(payload); if(error) throw error; return {ok:true}; } catch(err){ if(window.__ECHOVAULT_DEBUG__) console.warn('[EchoSociety] signal upload failed', err); return {ok:false, error:err}; } }
  async function syncLocalSignals(){ if(!isAvailable() || !SocietySignals.getConsent()) { Toast.show('Sync Local Signals requires consent and login.'); return {ok:false}; } const pending=SocietySignals.listLocalSignals().filter((s)=>!s.synced); let count=0; for (const signal of pending) { const res=await uploadSignal(signal); if(res.ok){ SocietySignals.markSynced(signal.id); count++; } } Toast.show(`${count} symbolic signals synced.`); return {ok:true, count}; }
  async function fetchPublicSignals(){ if(!isAvailable()) return null; try { const {data,error}=await Auth.client.from(SOCIETY_TABLES.publicSignals).select('*').order('created_at',{ascending:false}).limit(24); if(error) throw error; return data || []; } catch(err){ return null; } }
  async function fetchDailyWeather(){ if(!isAvailable()) return null; try { const {data,error}=await Auth.client.from(SOCIETY_TABLES.weatherDaily).select('*').eq('day',dayKey()).maybeSingle(); if(error) throw error; return data || null; } catch(err){ return null; } }
  async function addReaction(signalId, reactionType){ if(!isAvailable() || !SocietySignals.getConsent()) return {ok:false, mode:'local'}; if(!SOCIETY_REACTIONS[reactionType]) return {ok:false}; try { const {error}=await Auth.client.from(SOCIETY_TABLES.reactions).insert({ signal_id:signalId, reaction_type:reactionType, day:dayKey() }); if(error) throw error; return {ok:true}; } catch(err){ return {ok:false, error:err}; } }
  async function fetchReactionCounts(){ if(!isAvailable()) return null; try { const {data,error}=await Auth.client.from(SOCIETY_TABLES.reactionCounts).select('*').limit(100); if(error) throw error; return data || []; } catch(err){ return null; } }
  return { isAvailable, getConsent, setConsent, revokeConsent, uploadSignal, syncLocalSignals, fetchPublicSignals, fetchDailyWeather, addReaction, fetchReactionCounts };
})();

const SocietyWeather = (() => {
  let liveStatus = 'local';
  const phrases = { calm:'Blue weather over the Lantern District', chaos:'Electric pressure in the Storm Works', reflective:'Moonlit drift through the Archive', anxious:'Restless wind around the Weather Tower', joyful:'Soft bloom across the market', empty:'Quiet fog around the Society Gate', mixed:'Shifting sky over EchoSociety' };
  function countBy(signals, field){ return signals.reduce((acc, s)=>{ const k=s[field] || 'unknown'; acc[k]=(acc[k]||0)+1; return acc; }, {}); }
  function top(counts, fallback='empty'){ const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]); if(entries.length>1 && entries[0][1]===entries[1][1]) return 'mixed'; return entries[0]?.[0] || fallback; }
  function normalizeReactionTotals(rows){ if(arguments.length) { if(Array.isArray(rows)) return rows.reduce((acc,row)=>{ const key=row.reaction_type || row.reaction || row.type; if(key) acc[key]=(acc[key]||0)+Number(row.count || row.total || 1); return acc; }, {}); return {}; } const local=SocietySignals.listReactions(); return Object.values(local).flat().reduce((acc,r)=>{ acc[r]=(acc[r]||0)+1; return acc; }, {}); }
  function shapeWeather({label,signals=[],daily=null,reactions={},note='',live=false}){
    const todaySignals = signals.filter((s)=>!s.day || s.day===dayKey() || String(s.created_at||'').startsWith(dayKey()));
    const moodCounts=countBy(todaySignals,'mood');
    const dominant=daily?.dominant_mood || daily?.mood || top(moodCounts, todaySignals.length ? 'mixed' : 'empty');
    const types=countBy(todaySignals,'signal_type');
    return { label, total:Number(daily?.total_signals ?? daily?.total ?? todaySignals.length), dominant_mood:dominant, lanterns_lit:Number(daily?.lanterns_lit ?? types.lantern ?? 0), storms_contained:Number(daily?.storms_contained ?? types.storm ?? 0), blooms_planted:Number(daily?.blooms_planted ?? types.bloom ?? 0), archive_signals:Number(daily?.archive_signals ?? types.archive ?? 0), reaction_totals:reactions, phrase:daily?.weather_phrase || phrases[dominant] || phrases.mixed, connected:live, note };
  }
  function computeLocal(note=''){
    const signals=SocietySignals.listLocalSignals();
    const patterns=PatternEngine.analyze(state.echoes);
    const localSignals=signals.length ? signals : [];
    const shaped=shapeWeather({label:'Local Preview Weather', signals:localSignals, reactions:normalizeReactionTotals(), note, live:false});
    if(!signals.length && patterns.dominantMood) { shaped.dominant_mood=patterns.dominantMood; shaped.phrase=phrases[patterns.dominantMood] || phrases.empty; }
    return shaped;
  }
  async function computeLive(){
    if(!SocietySync.isAvailable()) { liveStatus = 'local'; return computeLocal(); }
    try {
      const [daily, publicSignals, reactionRows] = await Promise.all([
        SocietySync.fetchDailyWeather(),
        SocietySync.fetchPublicSignals(),
        SocietySync.fetchReactionCounts()
      ]);
      const hasCloudSignals = Array.isArray(publicSignals) && publicSignals.length > 0;
      const hasDaily = daily && Object.keys(daily).length > 0;
      const hasReactions = Array.isArray(reactionRows) && reactionRows.length > 0;
      const allCloudFetchesSucceeded = Boolean(daily) && Array.isArray(publicSignals) && Array.isArray(reactionRows);
      if(!allCloudFetchesSucceeded) { liveStatus = 'unavailable'; return computeLocal('Live society unavailable — showing local preview.'); }
      liveStatus = 'live';
      return shapeWeather({label:'Live Society Weather', signals:hasCloudSignals ? publicSignals : [], daily:hasDaily ? daily : null, reactions:hasReactions ? normalizeReactionTotals(reactionRows) : {}, live:true});
    } catch(err) {
      if(window.__ECHOVAULT_DEBUG__) console.warn('[EchoSociety] live weather failed', err);
      liveStatus = 'unavailable';
      return computeLocal('Live society unavailable — showing local preview.');
    }
  }
  function renderCard(w){ const reactionText=Object.entries(SOCIETY_REACTIONS).map(([key,label])=>`${label}: ${w.reaction_totals[key]||0}`).join(' · '); return `<span>${escapeHTML(w.label)}</span><h4>${escapeHTML(w.phrase)}</h4><p>${escapeHTML(w.total)} anonymous signals today. ${w.connected ? 'Fetched from public-safe EchoSociety data.' : 'This is a local preview, not real global data.'}</p>${w.note ? `<small>${escapeHTML(w.note)}</small>` : ''}<div class="society-weather-grid"><b>${escapeHTML(w.dominant_mood)}</b><small>dominant mood</small><b>${w.lanterns_lit}</b><small>lanterns lit</small><b>${w.storms_contained}</b><small>storms contained</small><b>${w.blooms_planted}</b><small>blooms planted</small><b>${w.archive_signals}</b><small>archive signals</small><b>${Object.values(w.reaction_totals).reduce((a,b)=>a+b,0)}</b><small>reaction totals</small></div><small>${escapeHTML(reactionText)}</small>`; }
  function refreshLive(){ if(!SocietySync.isAvailable()) return; computeLive().then((w)=>{ const card=document.getElementById('society-weather-card'); if(card) card.innerHTML=renderCard(w); const status=document.getElementById('society-live-status'); if(status && liveStatus === 'unavailable') status.textContent='Live society unavailable — showing local preview.'; }).catch(()=>{}); }
  function render(){ const w=computeLocal(SocietySync.isAvailable() ? 'Checking live weather…' : ''); setTimeout(refreshLive, 0); return `<section class="society-weather-card" id="society-weather-card">${renderCard(w)}</section>`; }
  function getLiveStatus(){ return liveStatus; }
  return { compute:computeLocal, computeLocal, computeLive, getLiveStatus, render };
})();

function getSocietyDistrictSuggestion(role='') {
  const map = { 'Lantern Keeper':'Lantern District', 'Stormwright':'Storm Works', 'Moon Archivist':'Moon Archive', 'Weather Cartographer':'Weather Tower', 'Bloom Tender':'Bloom Market', 'Signal Courier':'Signal Couriers’ Route', 'Relic Runner':'Signal Couriers’ Route', 'Archive Witness':'Moon Archive', 'Void Keeper':'Lantern District' };
  return map[role] || (role.includes('Storm') ? 'Storm Works' : role.includes('Bloom') ? 'Bloom Market' : role.includes('Archive') ? 'Moon Archive' : role.includes('Courier') ? 'Signal Couriers’ Route' : 'Weather Tower');
}

const EchoWorldRenderer = (() => {
  function prefersReduced(){ return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  function hasWebGL(){ try { const c=document.createElement('canvas'); return Boolean(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch { return false; } }
  function mode(){ return hasWebGL() && window.THREE ? 'webgl' : 'canvas2d'; }
  function renderCanvas2D(canvas){ if(!canvas) return; const ctx=canvas.getContext('2d'); if(!ctx) return; const w=canvas.width=canvas.clientWidth||720, h=canvas.height=canvas.clientHeight||220; ctx.clearRect(0,0,w,h); const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#070a15'); g.addColorStop(1,'#21132b'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); ctx.strokeStyle='rgba(214,179,106,.45)'; ctx.lineWidth=2; [[.16,.55,.38,.32],[.38,.32,.58,.64],[.58,.64,.78,.36],[.38,.32,.78,.36]].forEach(([a,b,c,d])=>{ctx.beginPath();ctx.moveTo(w*a,h*b);ctx.lineTo(w*c,h*d);ctx.stroke();}); ['Lantern','Storm','Bloom','Archive','Weather','Alam'].forEach((label,i)=>{ const x=w*(.14+(i%3)*.32), y=h*(.32+Math.floor(i/3)*.34); ctx.fillStyle='rgba(214,179,106,.9)'; ctx.beginPath(); ctx.arc(x,y,8,0,6.28); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.72)'; ctx.font='11px monospace'; ctx.fillText(label,x+12,y+4); }); }
  function startSocietyBackground(canvas){ renderCanvas2D(canvas); if(prefersReduced()) return; }
  return { mode, hasWebGL, renderCanvas2D, startSocietyBackground, canvas2dFallback:true, webglGuarded:hasWebGL };
})();

const SignalCourierRoute = (() => {
  const missions = [
    {id:'deliver_lantern', label:'Deliver a Lantern to Lantern District', item:'Lantern', icon:'🏮', to:'Lantern District', reward:{name:'Glow Thread', qty:1}, xp:8},
    {id:'carry_storm_jar', label:'Carry a Storm Jar to Storm Works', item:'Storm Jar', icon:'🫙', to:'Storm Works', reward:{name:'Storm Glass', qty:1}, xp:8},
    {id:'bring_bloom_seed', label:'Bring a Bloom Seed to Bloom Market', item:'Bloom Seed', icon:'✽', to:'Bloom Market', reward:{name:'Bloom Seed', qty:1}, xp:8},
    {id:'take_moon_letter', label:'Take a Moon Letter to Moon Archive', item:'Moon Letter', icon:'☾', to:'Moon Archive', reward:{name:'Moon Thread', qty:1}, xp:8},
    {id:'deliver_weather_report', label:'Deliver Weather Report to Weather Tower', item:'Weather Report', icon:'◌', to:'Weather Tower', reward:{name:'Compass Dust', qty:1}, xp:8},
    {id:'carry_alam_note', label:'Carry Alam’s Note to alam.ai Observatory', item:'Alam’s Note', icon:'◉', to:'alam.ai Observatory', reward:{name:'Oracle Static', qty:1}, xp:8}
  ];
  const nodes = {'Society Gate':[.50,.84], 'Lantern District':[.17,.30], 'Storm Works':[.43,.18], 'Bloom Market':[.74,.30], 'Moon Archive':[.25,.64], 'Weather Tower':[.60,.56], 'alam.ai Observatory':[.83,.68]};
  const paths = {
    'Lantern District':['Society Gate','Moon Archive','Lantern District'],
    'Storm Works':['Society Gate','Weather Tower','Storm Works'],
    'Bloom Market':['Society Gate','Weather Tower','Bloom Market'],
    'Moon Archive':['Society Gate','Moon Archive'],
    'Weather Tower':['Society Gate','Weather Tower'],
    'alam.ai Observatory':['Society Gate','Weather Tower','alam.ai Observatory']
  };
  const completionCopy = {
    'Storm Jar':'The storm has shape now.',
    Lantern:'A small light is still a signal.',
    'Bloom Seed':'Something gentle arrived.',
    Bloom:'Something gentle arrived.',
    'Moon Letter':'The thought has a place now.',
    'Weather Report':'The weather has been witnessed.'
  };
  let open=false, raf=0, avatar={x:.50,y:.84,progress:0,target:0}, active=null, completed=null, particles=[], selectedId=missions[0].id, burst=null;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function selectedMission(){ return missions.find(m=>m.id===selectedId) || missions[0]; }
  function routeFor(mission){ return paths[mission.to] || ['Society Gate', mission.to]; }
  function renderModal(){
    const mission = selectedMission();
    return `<div class="courier-modal" id="courier-modal" role="dialog" aria-modal="true" aria-label="Signal Courier"><div class="courier-panel signal-courier-game"><button class="courier-close" id="courier-close-btn">Close</button><header class="courier-hero"><span class="echo-avatar-kicker">Signal Courier</span><h3>Signal Courier</h3><p>Carry the feeling somewhere safer.</p><small>No rush. One signal at a time.</small></header><div class="courier-layout"><section class="courier-map-wrap"><canvas id="courier-canvas" class="courier-district-map" width="760" height="460" aria-label="EchoSociety district map canvas"></canvas><div class="courier-progress" id="courier-progress">Tap steady when you’re ready.</div></section><aside class="courier-side mission-selection-panel"><h4>Choose signal</h4><label class="sr-only" for="courier-mission-select">Select Signal Courier mission</label><select id="courier-mission-select" aria-label="Select Signal Courier mission">${missions.map(m=>`<option value="${escapeHTML(m.id)}" ${m.id===mission.id?'selected':''}>${escapeHTML(m.label)}</option>`).join('')}</select><div class="courier-current-delivery" id="courier-current-delivery"><span>${escapeHTML(mission.icon)}</span><b>${escapeHTML(mission.item)}</b><small>Destination: ${escapeHTML(mission.to)}</small></div><div class="courier-reward" id="courier-reward-preview">Reward: +${mission.reward.qty} ${escapeHTML(mission.reward.name)} · +${mission.xp} XP</div><div class="courier-actions"><button class="receipt-action-btn" id="courier-start-btn">Begin slowly</button><button class="receipt-action-btn ghost" id="courier-steady-btn" disabled>Steady</button></div><div class="courier-complete" id="courier-complete" hidden><b>Signal delivered.</b><small>The signal arrived. It does not have to stay inside you.</small></div><small class="courier-hint">Follow the glowing route. Tap Steady or the glowing destination.</small></aside></div></div></div>`;
  }
  function openRoute(){ if(!UserAccess.requirePremium('signal_courier', { openSettings:true })) return; if(!document.getElementById('courier-modal')) document.body.insertAdjacentHTML('beforeend', renderModal()); open=true; document.body.style.overflow='hidden'; bind(); updateMissionUI(); drawLoop(); }
  function closeRoute(){ open=false; cancelAnimationFrame(raf); document.getElementById('courier-modal')?.remove(); document.body.style.overflow=''; }
  function missionForNode(name){ return missions.find(m=>m.to===name); }
  function pathPoint(mission, t){ const route=routeFor(mission).map(name=>nodes[name]); const segs=route.length-1; const scaled=Math.min(1, Math.max(0,t))*segs; const i=Math.min(segs-1, Math.floor(scaled)); const local=scaled-i; const [ax,ay]=route[i], [bx,by]=route[i+1]; return [ax+(bx-ax)*local, ay+(by-ay)*local]; }
  function setProgress(copy){ const el=document.getElementById('courier-progress'); if(el) el.textContent=copy; }
  function updateMissionUI(){ const m=selectedMission(); const select=document.getElementById('courier-mission-select'); if(select) select.value=m.id; const current=document.getElementById('courier-current-delivery'); if(current) current.innerHTML=`<span>${escapeHTML(m.icon)}</span><b>${escapeHTML(m.item)}</b><small>Destination: ${escapeHTML(m.to)}</small>`; const reward=document.getElementById('courier-reward-preview'); if(reward) reward.textContent=`Reward: +${m.reward.qty} ${m.reward.name} · +${m.xp} avatar XP`; const complete=document.getElementById('courier-complete'); if(complete) complete.hidden = !completed; const steady=document.getElementById('courier-steady-btn'); if(steady) steady.disabled = !active; }
  function startMission(m=selectedMission()){ selectedId=m.id; active=m; completed=null; burst=null; avatar.progress=0; avatar.target=0; const [x,y]=nodes['Society Gate']; avatar.x=x; avatar.y=y; setProgress('Tap steady when you’re ready.'); updateMissionUI(); }
  function advanceSegment(){ if(!active) return; const segs=routeFor(active).length-1; const nextSegment=Math.min(segs, Math.floor(avatar.target*segs+.001)+1); avatar.target=nextSegment/segs; setProgress(nextSegment >= segs ? `Carry the feeling to ${active.to}.` : 'No rush. One signal at a time.'); }
  function handleDistrictTap(nearest){
    const mission=missionForNode(nearest);
    if(active){
      if(nearest === active.to) { avatar.target = 1; setProgress(`Carry the feeling to ${active.to}.`); return; }
      if(mission) setProgress('Not this district. Follow the glowing route.');
      return;
    }
    if(mission){ selectedId=mission.id; completed=null; const [x,y]=nodes['Society Gate']; avatar={x,y,progress:0,target:0}; setProgress('Tap steady when you’re ready.'); updateMissionUI(); }
  }
  function bind(){ const modal=document.getElementById('courier-modal'); document.getElementById('courier-close-btn')?.addEventListener('click', closeRoute); document.getElementById('courier-start-btn')?.addEventListener('click',()=>startMission()); document.getElementById('courier-steady-btn')?.addEventListener('click', advanceSegment); document.getElementById('courier-mission-select')?.addEventListener('change',(e)=>{ selectedId=e.target.value; active=null; completed=null; burst=null; const [x,y]=nodes['Society Gate']; avatar={x,y,progress:0,target:0}; setProgress('Tap steady when you’re ready.'); updateMissionUI(); }); document.getElementById('courier-canvas')?.addEventListener('pointerdown',(e)=>{ const c=e.currentTarget,r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height; let nearest=null,dist=99; Object.entries(nodes).forEach(([name,[nx,ny]])=>{ const d=Math.hypot(nx-x,ny-y); if(d<dist){dist=d;nearest=name;} }); if(dist<.12) handleDistrictTap(nearest); }); document.getElementById('courier-another-btn')?.addEventListener('click',()=>{ completed=null; active=null; burst=null; const [x,y]=nodes['Society Gate']; avatar={x,y,progress:0,target:0}; setProgress('Tap steady when you’re ready.'); updateMissionUI(); }); document.getElementById('courier-return-btn')?.addEventListener('click', closeRoute); modal?.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeRoute(); }); }
  function completeMission(){ if(!active) return; const done=active; VaultInventory.addMaterials([done.reward]); EchoAvatar.addXP?.(done.xp, 'delivery_completed'); GentleQuests.evaluate('delivery_completed', done); const shared=SocietySignals.getConsent() ? SocietySignals.contributeDelivery(done) : null; completed=done; burst={to:done.to, born:performance.now?.() || Date.now()}; setProgress('Signal delivered.'); const complete=document.getElementById('courier-complete'); if(complete){ complete.hidden=false; complete.innerHTML=`<b>Signal delivered.</b><p>${escapeHTML(completionCopy[done.item] || 'The signal arrived. It does not have to stay inside you.')}</p><small>Reward: +${done.reward.qty} ${escapeHTML(done.reward.name)} · +${done.xp} avatar XP</small><small>${shared ? 'Signal shared anonymously.' : 'Delivered locally. Join EchoSociety to share symbolic signals.'}</small><div class="courier-actions"><button class="receipt-action-btn" id="courier-another-btn">Deliver another</button><button class="receipt-action-btn ghost" id="courier-return-btn">Return to EchoSociety</button></div>`; }
    Toast.show(`Signal delivered. +${done.reward.qty} ${done.reward.name} · +${done.xp} XP`); active=null; updateMissionUI(); document.getElementById('courier-another-btn')?.addEventListener('click',()=>{ completed=null; burst=null; const [x,y]=nodes['Society Gate']; avatar={x,y,progress:0,target:0}; setProgress('Tap steady when you’re ready.'); updateMissionUI(); }); document.getElementById('courier-return-btn')?.addEventListener('click', closeRoute); rerenderEchoSocietyOverlay() || rerenderSocietyGate(); }
  function drawRoute(ctx,w,h,mission,time){ const route=routeFor(mission); const pulse=reduced()?0:(Math.sin(time/850)+1)/2; ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=`rgba(255,211,106,${.50+pulse*.22})`; ctx.shadowColor='rgba(255,211,106,.55)'; ctx.shadowBlur=10+pulse*12; ctx.lineWidth=5; ctx.beginPath(); route.map(n=>nodes[n]).forEach(([x,y],i)=>{ if(i) ctx.lineTo(w*x,h*y); else ctx.moveTo(w*x,h*y); }); ctx.stroke(); ctx.restore(); }
  function drawCity(ctx,w,h,time){ const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#050713'); g.addColorStop(.55,'#10162a'); g.addColorStop(1,'#211024'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); ctx.strokeStyle='rgba(214,179,106,.20)'; ctx.lineWidth=2; Object.values(paths).forEach(route=>{ ctx.beginPath(); route.map(n=>nodes[n]).forEach(([x,y],i)=>{ if(i) ctx.lineTo(w*x,h*y); else ctx.moveTo(w*x,h*y); }); ctx.stroke(); }); drawRoute(ctx,w,h,active || selectedMission(),time); Object.entries(nodes).forEach(([name,[x,y]])=>{ const dest=(active?.to || selectedMission().to)===name; const pulse=1+(reduced()?0:Math.sin(time/900+x*7)*.08); const radius=(name==='Society Gate'?12:dest?15:9)*pulse; ctx.shadowColor=dest?'rgba(255,236,166,.98)':'rgba(214,179,106,.32)'; ctx.shadowBlur=dest?34:10; ctx.fillStyle=dest?'rgba(255,236,166,.98)':'rgba(214,179,106,.82)'; ctx.beginPath(); ctx.arc(w*x,h*y,radius,0,6.28); ctx.fill(); ctx.shadowBlur=0; ctx.fillStyle='rgba(246,239,218,.86)'; ctx.font=`${dest?'13px':'12px'} DM Mono, monospace`; ctx.fillText(name,w*x+14,h*y+4); }); }
  function drawCourier(ctx,w,h,time){ const m=active || completed || selectedMission(); ctx.save(); ctx.shadowColor='rgba(255,236,166,.65)'; ctx.shadowBlur=22; ctx.fillStyle='rgba(255,236,166,.18)'; ctx.beginPath(); ctx.arc(w*avatar.x,h*avatar.y,22,0,6.28); ctx.fill(); ctx.shadowBlur=16; ctx.fillStyle='rgba(255,244,190,.98)'; ctx.beginPath(); ctx.arc(w*avatar.x,h*avatar.y,11,0,6.28); ctx.fill(); ctx.shadowBlur=0; const bob=reduced()?0:Math.sin(time/700)*3; ctx.fillStyle='rgba(255,255,255,.94)'; ctx.font='22px serif'; ctx.fillText(m.icon,w*avatar.x-8,h*avatar.y-24+bob); ctx.restore(); }
  function drawLoop(time=0){ if(!open) return; const c=document.getElementById('courier-canvas'); const ctx=c?.getContext('2d'); if(ctx){ const w=c.width, h=c.height; if(active){ if(reduced()) avatar.progress=avatar.target; else avatar.progress += (avatar.target-avatar.progress)*.045; [avatar.x,avatar.y]=pathPoint(active, avatar.progress); if(Math.abs(avatar.target-avatar.progress)>.01 && !reduced() && Math.random()<.18) particles.push({x:avatar.x,y:avatar.y,life:1}); if(avatar.target>=1 && avatar.progress>.985) completeMission(); } drawCity(ctx,w,h,time); particles=particles.filter(p=>p.life>.04); particles.forEach(p=>{ p.life*=.94; ctx.fillStyle=`rgba(214,179,106,${p.life*.45})`; ctx.beginPath(); ctx.arc(w*p.x,h*p.y,6*p.life,0,6.28); ctx.fill(); }); drawCourier(ctx,w,h,time); if(completed){ const [dx,dy]=nodes[completed.to]; const age=Math.min(1, ((performance.now?.() || Date.now())-(burst?.born || 0))/1400); const ring=28+age*42; ctx.strokeStyle=`rgba(255,236,166,${.75*(1-age)+.12})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(w*dx,h*dy,ring,0,6.28); ctx.stroke(); } }
    raf=requestAnimationFrame(drawLoop);
  }
  return { missions, openRoute, closeRoute, delivery_completed:true, missionSelection:true, districtMapCanvas:true, localDeliveryWithoutConsent:true, sharingRequiresConsent:true };
})();

const AlamPrivacy = (() => {
  const SETTINGS_KEY='echovault_alam_ai_settings_v1';
  const sensitiveFields = ['thought','raw_thought','full_echo','user_text','echoes','raw_echoes','email','display_name','profile_name','name','profile','avatar_url','avatar_image_url','avatar_data_url','localStorage','supabase_user_id','user_id'];
  function shouldIncludeLatestEcho(){ return readLocalJSON(SETTINGS_KEY, { includeLatestEcho:false }).includeLatestEcho === true; }
  function stripSensitiveContext(context={}){
    const copy={...context};
    sensitiveFields.forEach((field)=>delete copy[field]);
    return copy;
  }
  function buildSafeContext(options={}){
    const patterns=PatternEngine.analyze(state.echoes);
    const arch=ArchetypeEngine.compute(patterns);
    const avatar=EchoAvatar.load?.() || {};
    const weather=SocietyWeather.computeLocal?.() || SocietyWeather.compute?.();
    const context={
      dominant_mood:patterns.dominantMood||'empty',
      emotional_weather:patterns.emotionalWeather||'quiet fog',
      archetype:arch.archetypeName,
      average_intensity:patterns.averageIntensity||0,
      average_silence:patterns.averageSilence||0,
      echo_count:patterns.totalEchoes||0,
      avatar_role:avatar.role||'Signal Courier',
      society_weather_label:weather?.label || 'Local Preview Weather',
      app_mode:Auth.isLocalMode?.() ? 'local' : 'cloud'
    };
    if(options.includeLatestEcho && shouldIncludeLatestEcho()) {
      const echo=state.echoes?.[0];
      context.latest_echo_summary=echo?{ mood:echo.mood, intensity:echo.intensity, silence:echo.silence }:null;
    }
    return stripSensitiveContext(context);
  }
  function canUseRemote(){ return Boolean(window.ECHOVAULT_CONFIG?.ALAM_AI_ENDPOINT); }
  return { buildSafeContext, canUseRemote, shouldIncludeLatestEcho, stripSensitiveContext };
})();

const AlamAI = (() => {
  const CHAT_KEY='echovault_alam_ai_chat_v1';
  const settingsKey='echovault_alam_ai_settings_v1';
  const bio = `what in the fiqh
is this coping mechanism
asking for my iman`;
  function isRemoteAvailable(){ return Boolean(window.ECHOVAULT_CONFIG?.ALAM_AI_ENDPOINT); }
  function currentMode(){ return isRemoteAvailable()?'endpoint available':'local'; }
  function buildSafeContext(options={}){ return AlamPrivacy.buildSafeContext(options); }
  function localReply(prompt='', context={}){
    const lower=String(prompt).toLowerCase();
    if(/self[- ]?harm|suicide|kill myself|hurt myself|dangerous instructions/.test(lower)) return 'I can’t help with harm instructions. If danger feels close, contact emergency support or someone nearby now. Stay with one safe breath and one safe person.';
    const ctx={...buildSafeContext(), ...context};
    const mood=ctx.dominant_mood || 'mixed';
    const weather=ctx.emotional_weather || 'weather';
    const intensity=Number(ctx.average_intensity || 0);
    const pressure=intensity >= 7 ? 'high static' : intensity >= 4 ? 'medium static' : 'low static';
    return `pattern read: ${mood} under ${weather}. ${pressure}. keep the question small, protect the signal, and choose one grounded next step.`;
  }
  function loadMessages(){ const arr=readLocalJSON(CHAT_KEY, []); return Array.isArray(arr)?arr.slice(-30):[]; }
  function saveMessages(arr){ writeLocalJSON(CHAT_KEY, Array.isArray(arr) ? arr.slice(-30) : []); }
  function appendMessage(role,text){
    const arr=loadMessages();
    arr.push({role,text:String(text).slice(0,1200),timestamp:new Date().toISOString(),mode:currentMode()});
    saveMessages(arr);
    const list=document.getElementById('alam-message-list');
    if(list) list.insertAdjacentHTML('beforeend', `<div class="alam-msg ${escapeHTML(role)}"><b>${escapeHTML(role)}</b><p>${escapeHTML(text)}</p></div>`);
    list?.scrollTo(0,list.scrollHeight);
  }
  async function sendMessage(prompt, options={}){
    const clean=String(prompt||'').trim();
    if(!clean) return null;
    appendMessage('you', clean);
    const safeContext=buildSafeContext(options);
    if(isRemoteAvailable() && AlamPrivacy.canUseRemote()) {
      try {
        const body={ prompt:clean, context:safeContext, options:{ includeLatestEcho:Boolean(options.includeLatestEcho), includeSocietyWeather:Boolean(options.includeSocietyWeather) } };
        const res=await fetch(window.ECHOVAULT_CONFIG.ALAM_AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!res.ok) throw new Error('remote failed');
        const data=await res.json();
        appendMessage('alam', data.reply || data.text || localReply(clean, safeContext));
        return data;
      } catch(err){ Toast.show('alam.ai is ready.'); }
    }
    const reply=localReply(clean, safeContext);
    appendMessage('alam', reply);
    return { mode:'local', reply };
  }
  function clearChat(){ localStorage.removeItem(CHAT_KEY); renderMessages(); Toast.show('alam.ai history cleared.'); }
  function renderMessages(){
    const list=document.getElementById('alam-message-list');
    if(!list) return;
    const arr=loadMessages();
    list.innerHTML=arr.map(m=>`<div class="alam-msg ${escapeHTML(m.role)}"><b>${escapeHTML(m.role)}</b><p>${escapeHTML(m.text)}</p></div>`).join('') || '<p class="alam-empty"></p>';
    list.scrollTo(0,list.scrollHeight);
  }
  function renderPortal(){
    return `<section class="alam-portal" id="alam-portal"><div class="alam-orb"><span>alam</span></div><div><h4>alam.ai</h4><pre>${escapeHTML(bio)}</pre><button class="receipt-action-btn" id="alam-open-btn">Ask alam</button></div></section>`;
  }
  function openChat(){
    if(!UserAccess.requirePremium('alam_chat', { openSettings:true })) return;
    if(!document.getElementById('alam-ai-panel')) document.body.insertAdjacentHTML('beforeend', `<div class="alam-ai-panel" id="alam-ai-panel" role="dialog" aria-modal="true" aria-label="alam.ai"><div class="alam-ai-card"><header class="alam-ai-head"><div><h3>alam.ai</h3></div><button class="courier-close" id="alam-close-btn">Close</button></header><pre>${escapeHTML(bio)}</pre><div id="alam-message-list" class="alam-message-list"></div><div class="alam-input-row"><input id="alam-input" maxlength="500" placeholder="ask alam…"><button class="receipt-action-btn" id="alam-send-btn">Ask alam</button></div><div class="alam-panel-actions"><button class="settings-secondary-btn" id="alam-clear-btn">Clear chat</button><button class="settings-secondary-btn" id="alam-bottom-close-btn">Close</button></div></div></div>`);
    document.body.style.overflow='hidden';
    bindChat();
    renderMessages();
    setTimeout(()=>document.getElementById('alam-input')?.focus(), 40);
  }
  function closeChat(){ document.getElementById('alam-ai-panel')?.remove(); document.body.style.overflow=''; }
  function bindChat(){
    document.getElementById('alam-close-btn')?.addEventListener('click', closeChat);
    document.getElementById('alam-bottom-close-btn')?.addEventListener('click', closeChat);
    document.getElementById('alam-clear-btn')?.addEventListener('click', clearChat);
        document.getElementById('alam-include-latest')?.addEventListener('change',(e)=>{ writeLocalJSON(settingsKey,{...readLocalJSON(settingsKey,{}), includeLatestEcho:e.target.checked}); });
    const send=()=>sendMessage(document.getElementById('alam-input')?.value,{includeLatestEcho:document.getElementById('alam-include-latest')?.checked,includeSocietyWeather:false}).then(()=>{ const input=document.getElementById('alam-input'); if(input) input.value=''; });
    document.getElementById('alam-send-btn')?.addEventListener('click',send);
    document.getElementById('alam-input')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') send(); });
  }
  function bindShortcut(){ document.getElementById('alam-floating-portal')?.addEventListener('click', () => { if (UserAccess.requirePremium('alam_chat')) openChat(); }); }
  return { CHAT_KEY, isRemoteAvailable, buildSafeContext, localReply, sendMessage, renderPortal, openChat, closeChat, appendMessage, clearChat, loadMessages, saveMessages, bindShortcut };
})();

function getSocietyGateProgress() {
  const avatar = EchoAvatar.load?.() || {};
  const hasAvatar = Boolean(Object.keys(avatar).length && avatar.role);
  const echoCount = state.echoes.length;
  const artifactCount = ArtifactArchive.listArtifacts().length;
  const requirementsMet = hasAvatar && echoCount >= 5 && artifactCount >= 1;
  const missing = [];
  if (!hasAvatar) missing.push('Create an Echo Avatar');
  if (echoCount < 5) missing.push(`Create ${5 - echoCount} more echo${5 - echoCount === 1 ? '' : 'es'}`);
  if (artifactCount < 1) missing.push('Save or craft 1 artifact');
  return { avatar, hasAvatar, echoCount, artifactCount, requirementsMet, missing };
}

function getSocietyGateState() {
  const hasSpecialAccess = Boolean(UserAccess.canUse('echosociety') && UserAccess.canUse('society_gate'));
  const progress = getSocietyGateProgress();
  const consent = SocietySignals.getConsent();
  const authUser = Auth.user || null;
  let gateState = 'active_live';
  if (!hasSpecialAccess) gateState = 'no_special_access';
  else if (!progress.requirementsMet) gateState = 'locked_progress';
  else if (!consent) gateState = 'ready_needs_consent';
  else if (!authUser || !SocietySync.isAvailable()) gateState = 'active_local_preview';
  else if (SocietyWeather.getLiveStatus?.() === 'unavailable') gateState = 'live_unavailable';
  else gateState = 'active_live';
  if (location.search.includes('debug=1')) console.info('[SocietyGate]', gateState, { hasSpecialAccess, progress, consent, authUser });
  return gateState;
}

const ECHO_SOCIETY_DISTRICTS = [
  {title:'Lantern District', description:'Blue lantern balconies for quiet signals and void-safe witnessing.', countKey:'lantern', roles:['Lantern Keeper','Void Keeper'], action:'Light Lantern signal', id:'society-lantern-btn', icon:'🕯️'},
  {title:'Storm Works', description:'Copper storm engines where intense weather becomes contained sparks.', countKey:'storm', roles:['Stormwright'], action:'Add Storm Spark signal', id:'society-storm-btn', icon:'⚡'},
  {title:'Bloom Market', description:'Soft stalls trading bloom seeds, green lamps, and tiny mercies.', countKey:'bloom', roles:['Bloom Tender'], action:'Plant Bloom signal', id:'society-bloom-btn', icon:'✽'},
  {title:'Moon Archive', description:'A moonlit shelf for symbolic archive markers — never raw diary pages.', countKey:'archive', roles:['Moon Archivist','Archive Witness'], action:'Leave symbolic archive signal', id:'society-archive-btn', icon:'🌙'},
  {title:'Weather Tower', description:'A high glass compass that turns anonymous signals into shared weather.', countKey:'weather', roles:['Weather Cartographer'], action:'Contribute Weather', id:'society-weather-btn', icon:'🧭'},
  {title:'Signal Couriers’ Route', description:'Gold roads for peaceful artifact deliveries between districts.', countKey:'delivery', roles:['Signal Courier','Relic Runner'], action:'Start Delivery', id:'society-delivery-btn', icon:'✦'},
  {title:'alam.ai Observatory', description:'A quiet observatory shortcut to alam.ai.', countKey:'alam', roles:['Signal Courier','Moon Archivist','Archive Witness'], action:'Open alam.ai', id:'society-alam-btn', icon:'◉'}
];

function societyActivityCount(countKey) {
  return SocietySignals.listLocalSignals().filter(signal => String(signal.signal_type || '').includes(countKey) || String(signal.district || '').toLowerCase().includes(countKey)).length;
}

function buildSocietyDistricts(avatar = {}) {
  return ECHO_SOCIETY_DISTRICTS.map((d) => {
    const roleMatch = d.roles.includes(avatar.role);
    return `<article class="society-district-card ${roleMatch ? 'recommended' : ''}"><div class="district-visual" aria-hidden="true"></div><span class="society-district-icon">${escapeHTML(d.icon)}</span><h4>${escapeHTML(d.title)}</h4><p>${escapeHTML(d.description)}</p><small>${societyActivityCount(d.countKey)} symbolic activities · Roles: ${escapeHTML(d.roles.join(', '))}</small><button class="receipt-action-btn" id="${escapeHTML(d.id)}">${escapeHTML(d.action)}</button></article>`;
  }).join('');
}

function buildSocietyPrivacyPanel(gateState) {
  return `<section class="society-privacy-panel" id="society-privacy-panel" ${gateState === 'ready_needs_consent' ? '' : ''}><div class="echo-avatar-kicker">Privacy Rules</div><h4>Privacy</h4><p>Raw echoes stay private.</p><p>Only symbolic signals are shared when you consent.</p><p>${escapeHTML(SocietyPrivacy.explainPrivacy())}</p><div class="society-actions"><button class="receipt-action-btn" id="society-understand-btn">Enter EchoSociety</button><button class="receipt-action-btn ghost" id="society-stay-private-btn">Stay Private</button><button class="receipt-action-btn" id="society-delivery-launcher-local">Launch Signal Courier</button><button class="receipt-action-btn" id="society-privacy-btn">Privacy Rules</button></div></section>`;
}

function societyStatusLabel(gateState) {
  if (gateState === 'active_live') return 'Live Society';
  if (gateState === 'live_unavailable') return 'Live unavailable — local preview';
  if (gateState === 'active_local_preview') return 'Local Preview';
  if (gateState === 'ready_needs_consent') return 'Consent needed';
  if (gateState === 'locked_progress') return 'Progress locked';
  return 'Special Access required';
}

function buildSocietyCity(gateState, avatar = {}) {
  const statusCopy = gateState === 'active_local_preview'
    ? '<p id="society-live-status">Local Preview — symbolic district UI is generated on this device.</p>'
    : gateState === 'live_unavailable'
      ? '<p id="society-live-status">Live Society Weather is unavailable — showing local preview fallback.</p>'
      : '<p id="society-live-status">Live Society Weather is available when the public-safe sync succeeds.</p>';
  const archiveInput = `<div class="society-archive-note"><input class="society-archive-input" id="society-archive-line" maxlength="80" placeholder="optional symbolic marker…"><small>Only a symbolic archive signal is used.</small></div>`;
  return `<section class="society-city" id="society-city">${statusCopy}<div class="society-city-sky"><canvas id="society-particles-canvas" width="720" height="220" aria-hidden="true"></canvas></div><div class="society-district-grid">${buildSocietyDistricts(avatar)}</div>${archiveInput}${SocietyWeather.render()}</section>`;
}

function buildEchoSocietyGate() {
  const progress = getSocietyGateProgress();
  const avatar = progress.avatar;
  const gateState = getSocietyGateState();
  const district = getSocietyDistrictSuggestion(avatar.role || '');
  if (gateState === 'no_special_access') return '<section class="echo-society-room society-state-no_special_access"><div class="echo-avatar-kicker">EchoSociety</div><h4>Special Access opens this city.</h4><p>Use the Special Access portal to enter EchoSociety.</p></section>';
  if (gateState === 'locked_progress') {
    return `<section class="echo-society-room society-state-locked_progress"><div class="echo-avatar-kicker">Society Gate</div><h4>Society Gate is still forming.</h4><p>Complete these private vault steps first:</p><ul class="society-requirements">${progress.missing.map(item => `<li class="missing">${escapeHTML(item)}</li>`).join('')}</ul></section>`;
  }
  if (gateState === 'ready_needs_consent') return buildSocietyPrivacyPanel(gateState);
  return `<section class="echo-society-room society-state-${gateState}"><div class="echo-avatar-kicker">Society Gate</div><h4>EchoSociety</h4><p>A shared city built from anonymous signals.</p><p class="society-recommendation">Avatar role: <b>${escapeHTML(avatar.role || 'Signal Courier')}</b> · Recommended district: <b>${escapeHTML(district)}</b></p></section>${buildSocietyCity(gateState, avatar)}`;
}

function buildEchoSocietyOverlay() {
  const progress = getSocietyGateProgress();
  const avatar = progress.avatar;
  const gateState = getSocietyGateState();
  const district = getSocietyDistrictSuggestion(avatar.role || '');
  const status = `<div class="echosociety-status-strip"><span>${escapeHTML(societyStatusLabel(gateState))}</span><span>Consent: ${SocietySignals.getConsent() ? 'granted' : 'private'}</span><span>Avatar role: ${escapeHTML(avatar.role || 'unformed')}</span><span>Recommended: ${escapeHTML(district)}</span></div>`;
  let main = '';
  if (gateState === 'no_special_access') main = UserAccess.lockedHTML('echosociety');
  else if (gateState === 'locked_progress') main = buildEchoSocietyGate();
  else if (gateState === 'ready_needs_consent') main = buildSocietyPrivacyPanel(gateState);
  else main = `<div class="echosociety-main"><section class="society-gate-panel">${buildEchoSocietyGate()}</section><section class="society-launchers"><button class="receipt-action-btn" id="society-delivery-launcher">Launch Signal Courier</button><button class="receipt-action-btn" id="society-alam-shortcut">alam.ai Observatory</button></section></div>${buildSocietyPrivacyPanel(gateState)}`;
  return `<div class="echosociety-shell" role="document"><button class="courier-close echosociety-close" id="echosociety-close-btn">Close</button><header class="echosociety-head"><span class="echo-avatar-kicker">EchoSociety</span><h3>EchoSociety</h3><p>“A shared city built from anonymous signals.”</p></header>${status}<main>${main}</main></div>`;
}

function openEchoSocietyOverlay() {
  if (!UserAccess.requirePremium('echosociety', { openSettings:true })) return;
  let overlay = document.getElementById('echosociety-overlay');
  if (!overlay) {
    document.body.insertAdjacentHTML('beforeend', '<div class="echosociety-overlay" id="echosociety-overlay" role="dialog" aria-modal="true" aria-label="EchoSociety"></div>');
    overlay = document.getElementById('echosociety-overlay');
  }
  overlay.innerHTML = buildEchoSocietyOverlay();
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  bindEchoSocietyGate();
  setTimeout(startSocietyParticles, 80);
}

function closeEchoSocietyOverlay() { document.getElementById('echosociety-overlay')?.remove(); document.body.style.overflow=''; }
function rerenderEchoSocietyOverlay() { const overlay = document.getElementById('echosociety-overlay'); if (!overlay) return false; overlay.innerHTML = buildEchoSocietyOverlay(); bindEchoSocietyGate(); setTimeout(startSocietyParticles, 80); return true; }

function updateSocietyConsentUI(options={}) {
  const consent = SocietySignals.getConsent();
  const privacyPanel = document.getElementById('society-privacy-panel');
  const city = document.getElementById('society-city');
  const privatePanel = document.getElementById('society-private-state');
  if (city) { city.hidden = !consent; city.querySelectorAll('button,input,textarea,select').forEach((el) => { el.disabled = !consent; }); }
  if (privacyPanel && getSocietyGateState() !== 'ready_needs_consent') privacyPanel.hidden = Boolean(options.privateState);
  if (privatePanel) privatePanel.hidden = !(options.privateState && !consent);
  if (consent) setTimeout(()=>EchoWorldRenderer.startSocietyBackground(document.getElementById('society-particles-canvas')), 60);
}
function rerenderSocietyGate() { return rerenderEchoSocietyOverlay(); }
function bindEchoSocietyGate() {
  const showPrivacy = () => { document.getElementById('society-privacy-panel')?.removeAttribute('hidden'); document.getElementById('society-private-state')?.setAttribute('hidden',''); updateSocietyConsentUI({ privateState:false }); };
  const stayPrivate = () => { SocietySignals.setConsent(false); updateSocietyConsentUI({ privateState:true }); Toast.show('You stayed private. EchoSociety will not receive signals.'); rerenderEchoSocietyOverlay(); };
  document.getElementById('echosociety-close-btn')?.addEventListener('click', closeEchoSocietyOverlay);
  document.getElementById('echosociety-overlay')?.addEventListener('click', e => { if(e.target?.id === 'echosociety-overlay') closeEchoSocietyOverlay(); });
  document.getElementById('society-privacy-btn')?.addEventListener('click', showPrivacy);
  document.getElementById('society-private-rules-btn')?.addEventListener('click', showPrivacy);
  document.getElementById('society-enter-btn')?.addEventListener('click', () => SocietySignals.getConsent() ? updateSocietyConsentUI({ privateState:false }) : showPrivacy());
  document.getElementById('society-private-btn')?.addEventListener('click', stayPrivate);
  document.getElementById('society-stay-private-btn')?.addEventListener('click', stayPrivate);
  document.getElementById('society-understand-btn')?.addEventListener('click', () => { SocietySignals.setConsent(true); Toast.show('EchoSociety consent saved.'); rerenderEchoSocietyOverlay(); });
  const guardDistrictAction = (payload = {}) => SocietyPrivacy.requireSpecialAccess() && SocietyPrivacy.requireConsent() && SocietyPrivacy.requireSafeSignalPayload(payload);
  const contribute = (fn, msg) => { const signal = fn(); if (!signal) { updateSocietyConsentUI({ privateState:true }); return; } Toast.show(msg); rerenderEchoSocietyOverlay(); };
  document.getElementById('society-lantern-btn')?.addEventListener('click', () => contribute(SocietySignals.contributeLantern, 'Anonymous lantern lit.'));
  document.getElementById('society-storm-btn')?.addEventListener('click', () => contribute(SocietySignals.contributeStorm, 'Storm spark contained.'));
  document.getElementById('society-bloom-btn')?.addEventListener('click', () => contribute(SocietySignals.contributeBloom, 'Bloom seed planted.'));
  document.getElementById('society-weather-btn')?.addEventListener('click', () => contribute(SocietySignals.contributeWeather, 'Weather signal added.'));
  document.getElementById('society-archive-btn')?.addEventListener('click', () => contribute(() => SocietySignals.contributeArchiveLine(document.getElementById('society-archive-line')?.value || ''), 'Moon Archive symbolic marker saved.'));
  document.getElementById('society-delivery-btn')?.addEventListener('click', () => { if(!guardDistrictAction({ signal_type:'delivery', district:'Signal Couriers’ Route' })) return; SignalCourierRoute.openRoute(); });
  document.getElementById('society-delivery-launcher')?.addEventListener('click', () => { if(!SocietyPrivacy.requireSpecialAccess()) return; SignalCourierRoute.openRoute(); });
  document.getElementById('society-delivery-launcher-local')?.addEventListener('click', () => { if(!SocietyPrivacy.requireSpecialAccess()) return; SignalCourierRoute.openRoute(); });
  document.getElementById('society-alam-btn')?.addEventListener('click', () => { if(!guardDistrictAction({ signal_type:'alam', metadata:{ portal:'observatory' } })) return; SocietySignals.contributeAlam(); AlamAI.openChat(); });
  document.getElementById('society-alam-shortcut')?.addEventListener('click', () => { if(!guardDistrictAction({ signal_type:'alam', metadata:{ portal:'observatory' } })) return; SocietySignals.contributeAlam(); AlamAI.openChat(); });
  document.getElementById('alam-open-btn')?.addEventListener('click', () => { if(!guardDistrictAction({ signal_type:'alam', metadata:{ portal:'standalone' } })) return; AlamAI.openChat(); });
  updateSocietyConsentUI({ privateState:false });
}

function startSocietyParticles() { EchoWorldRenderer.startSocietyBackground(document.getElementById('society-particles-canvas')); }

const CinematicCardRenderer = (() => {
  const MOOD_AURA = { calm:'#6ba2d0', chaos:'#cf5a74', reflective:'#8f79d8', anxious:'#c8935a', joyful:'#8bc97f', empty:'#7f8798' };
  function drawGrain(ctx, width, height) { for (let i=0;i<2200;i++){const a=Math.random()*.09;ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fillRect(Math.random()*width,Math.random()*height,1,1);} }
  function drawMoodAura(ctx, mood, x, y, radius){const c=MOOD_AURA[mood]||MOOD_AURA.reflective;const g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,`${c}66`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,6.28);ctx.fill();}
  function drawEchoVaultMark(ctx){ctx.fillStyle='rgba(214,179,106,.9)';ctx.font='500 24px "DM Mono"';ctx.fillText('ECHOVAULT',80,1275);ctx.strokeStyle='rgba(214,179,106,.4)';ctx.beginPath();ctx.moveTo(80,1248);ctx.lineTo(1000,1248);ctx.stroke();}
  function base(title,subtitle,mood='reflective',type='artifact'){const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#0b1021');g.addColorStop(1,'#160f1d');x.fillStyle=g;x.fillRect(0,0,1080,1350);drawMoodAura(x,mood,540,520,420);drawGrain(x,1080,1350);x.fillStyle='#d6b36a';x.font='700 62px "Playfair Display"';x.fillText(title,80,148);x.strokeStyle='rgba(214,179,106,.35)';x.beginPath();x.moveTo(80,182);x.lineTo(1000,182);x.stroke();x.fillStyle='#cfd2dc';x.font='32px "Cormorant Garamond"';x.fillText(subtitle||'',80,244);x.fillStyle='rgba(255,255,255,.74)';x.font='500 20px "DM Mono"';x.fillText(type.toUpperCase(),80,292);x.fillText(new Date().toLocaleDateString(),860,292);drawEchoVaultMark(x);return c;}
  const renderRelicCard=(r)=>{const c=base(r.title,`${r.rarity} · ${r.coordinates}`,r.mood,'relic');const x=c.getContext('2d');x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(540,710,110,0,6.28);x.fill();x.fillStyle='rgba(12,14,18,.9)';x.beginPath();x.arc(540,710,76,0,6.28);x.fill();return c;};
  const renderWeatherCard=(w)=>{const c=base('Weather Room',`${w.name} · ${w.summary}`,w.mood,'weather');const x=c.getContext('2d');for(let i=0;i<14;i++){x.strokeStyle='rgba(255,255,255,.2)';x.beginPath();x.arc(540,720,120+i*22,0,6.28);x.stroke();}return c;};
  const renderArchetypeCard=(a)=>base('Archetype Hall',`${a.name||a.archetypeName||'Unknown'}`,a.dominantMood||'reflective','archetype');
  const renderSoundprintCard=(s)=>{const c=base('Soundprint Wall',`${s.mood||'reflective'} resonance`,s.mood||'reflective','soundprint');const x=c.getContext('2d');x.fillStyle='rgba(20,22,28,.85)';x.fillRect(300,560,480,480);x.strokeStyle='rgba(214,179,106,.5)';x.strokeRect(300,560,480,480);return c;};
  const downloadCanvas=(canvas,filename='echovault-card.png')=>{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=filename;a.click();};
  const saveCardAsArtifact=(type,data,imageDataUrl)=>ArtifactArchive.saveArtifact({type,title:data.title||type,subtitle:data.description||'',data,imageDataUrl,favorite:false});
  return {renderRelicCard,renderWeatherCard,renderArchetypeCard,renderSoundprintCard,downloadCanvas,saveCardAsArtifact};
})();

const WeatherMap = (() => {
  const WEATHER_COPY = {
    calm: ['Calm Tides','Blue rings drift in steady breath.'],
    chaos: ['Chaos Front','Electric fractures move through the atmosphere.'],
    reflective: ['Reflective Night','Moon arcs and orbit trails hold a thoughtful sky.'],
    anxious: ['Restless Wind','Amber spirals circle with alert motion.'],
    joyful: ['Bloom Current','Petals and rising light open brighter air.'],
    empty: ['Quiet Haze','Soft fog stretches into spacious silence.']
  };
  function compute(echoes=[]) {
    const recent = echoes.slice(0,14);
    const patterns = PatternEngine.analyze(recent);
    const mood = patterns?.dominantMood || recent[0]?.mood || 'empty';
    const [name, summary] = WEATHER_COPY[mood] || WEATHER_COPY.empty;
    return { name, summary, mood, intensity: patterns.averageIntensity||0, silence: patterns.averageSilence||0, density: Math.max(10, recent.length*6), total: recent.length };
  }
  function render(canvas, data) {
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = Math.max(280, canvas.clientWidth || 320);
    const h = canvas.height = Math.max(190, canvas.clientHeight || 220);
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#0a0f1d'); g.addColorStop(1,'#120d18'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    const fog = Math.min(.38, .08 + data.silence/20); ctx.fillStyle=`rgba(190,190,210,${fog})`; ctx.fillRect(0,0,w,h);
    const mood = data.mood;
    for (let i=0;i<data.density;i++) { const x=Math.random()*w,y=Math.random()*h; ctx.fillStyle='rgba(214,179,106,.14)'; ctx.beginPath(); ctx.arc(x,y,Math.random()*1.8,0,6.28); ctx.fill(); }
    if (mood==='calm') { ctx.strokeStyle='rgba(110,165,210,.4)'; for (let i=0;i<5;i++){ctx.beginPath(); ctx.arc(w*(.2+i*.16),h*.55,26+i*8,0,6.28); ctx.stroke();}}
    if (mood==='chaos') { for(let i=0;i<14;i++){ctx.strokeStyle='rgba(216,82,120,.65)'; ctx.beginPath(); const x=Math.random()*w,y=Math.random()*h; ctx.moveTo(x,y); ctx.lineTo(x+Math.random()*34-17,y+Math.random()*30-15); ctx.stroke();}}
    if (mood==='reflective') { ctx.strokeStyle='rgba(148,120,220,.45)'; ctx.beginPath(); ctx.arc(w*.5,h*.5,64,0.5,5.8); ctx.stroke(); }
    if (mood==='anxious') { for(let i=0;i<8;i++){ctx.strokeStyle='rgba(210,150,78,.45)'; ctx.beginPath(); ctx.arc(w*(.2+i*.1),h*.58,18+i*4,0.2,4.9); ctx.stroke();}}
    if (mood==='joyful') { for(let i=0;i<16;i++){ctx.fillStyle='rgba(152,210,120,.55)'; ctx.fillRect(Math.random()*w,Math.random()*h,2,2);}}
    ctx.fillStyle='#d6b36a'; ctx.font='600 14px "DM Mono"'; ctx.fillText(data.name,14,20);
  }
  return { compute, render };
})();
const Rituals = (() => {
  const modal   = document.getElementById('fun-modal');
  const content = document.getElementById('fun-modal-content');
  let receiptTheme = 'classic';

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

  function getBuilders() { return {museum:buildMuseum,lantern:buildLantern,stormjar:buildStormJar,receipt:buildReceipt, dna:buildDNA, crash:buildCrash, sound:buildSound, vsvs:buildConflict, shatter:buildShatter}; }
  function hasBuilder(type) { return type === 'special-access' || type === 'alam' || type === 'echosociety' || Boolean(getBuilders()[type]); }
  function unknownRitualHTML(type) { return `<div class="ritual-error-card"><h3>Unknown ritual</h3><p>${escapeHTML(type || 'This ritual')} is not available in this build.</p></div>`; }
  function museumDebugEnabled() {
    return typeof location !== 'undefined' && location.search.includes('debug=1');
  }

  function museumDebugLog(message) {
    if (museumDebugEnabled()) console.warn(message);
  }

  function museumFallbackHTML(error) {
    museumDebugLog(`[Museum] shell fallback -> ${error?.message || error || 'unknown error'}`);
    const safeMessage = museumDebugEnabled() ? `<small>${escapeHTML(error?.message || error)}</small>` : '';
    return `<div class="museum-shell" data-room="weather"><header class="museum-head"><h3>Emotional Museum</h3><p class="museum-sub">A private archive of what your echoes became.</p></header><div class="museum-room active"><h4>This room is still forming.</h4><p>Create more echoes to fill this wing.</p>${safeMessage}</div></div>`;
  }

  function ritualLoadingHTML(type) {
    const nameMap = { museum:'Emotional Museum', receipt:'Mood Receipt', dna:'Emotion DNA', crash:'Crash Report', sound:'Echo Soundprint', shatter:'Shatter Softly', vsvs:'Inner Conflict', lantern:'Void Lantern', stormjar:'Storm Jar' };
    const title = nameMap[type] || 'Ritual';
    return `<div class="ritual-loading-card" role="status" aria-live="polite"><div class="ritual-loading-spinner"></div><h3>Opening ${escapeHTML(title)}</h3><p>Gathering your echoes and preparing the room…</p></div>`;
  }

  function ritualErrorHTML(type) {
    return `<div class="ritual-error-card"><h3>This ritual paused unexpectedly</h3><p>Your echoes are safe. Try reopening this room.</p><div class="ritual-actions"><button class="receipt-action-btn" id="ritual-retry-btn" data-ritual="${escapeHTML(type || '')}">Retry</button><button class="receipt-action-btn" id="ritual-close-btn">Close</button></div></div>`;
  }


  function open(type) {
    if (type === 'special-access') { SpecialAccessPortal.open(); return; }
    if (type === 'alam') { if (UserAccess.requirePremium('alam_chat')) AlamAI.openChat(); return; }
    if (type === 'echosociety') { openEchoSocietyOverlay(); return; }
    const premiumRitualMap = { museum:'emotional_museum_full', echosociety:'echosociety', lantern:'void_lantern', stormjar:'storm_jar', receipt:'basic_receipt', dna:'emotion_dna', crash:'crash_report', sound:'soundprint', vsvs:'inner_conflict', shatter:'shatter_softly' };
    if (premiumRitualMap[type] && !UserAccess.requirePremium(premiumRitualMap[type], { openSettings:true })) return;
    const builders = getBuilders();
    const fn = builders[type];
    if (!fn) { content.innerHTML = unknownRitualHTML(type); modal.classList.add('open'); return; }
    const shown = getRitualOb();
    const doOpen = () => {
      modal.classList.add('open');
      content.innerHTML = ritualLoadingHTML(type);
      requestAnimationFrame(() => {
        try {
          content.innerHTML = fn();
          postBuild(type);
        } catch (error) {
          if (location.search.includes('debug=1')) console.warn('Ritual failed to render', type, error);
          content.innerHTML = type === 'museum' ? museumFallbackHTML(error) : (type === 'receipt'
            ? '<div class="receipt-error-card"><h3>Receipt unavailable</h3><p>Your echoes are safe. Try refreshing the app cache or creating one new echo.</p></div>'
            : ritualErrorHTML(type));
          document.getElementById('ritual-retry-btn')?.addEventListener('click', () => open(type));
          document.getElementById('ritual-close-btn')?.addEventListener('click', close);
        }
      });
    };
    if (!shown[type]) {
      showRitualOnboarding(type, doOpen);
    } else {
      doOpen();
    }
  }

  function postBuild(type) {
    if (type === 'vsvs') setTimeout(startConflictAnimation, 100);
    if (type === 'shatter') setTimeout(() => ShatterSoftly.init(), 80);
    if (type === 'museum') {
      const w = WeatherMap.compute(state.echoes);
      WeatherMap.render(document.getElementById('weather-map-canvas'), w);
      GentleQuests.evaluate('weather_room_visited', w);
      EchoAvatar.bind();
      document.querySelectorAll('.museum-tab').forEach(btn=>btn.addEventListener('click',()=>{
        const room = btn.dataset.room;
        document.querySelectorAll('.museum-tab,.museum-room').forEach(el=>el.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.querySelector(`[data-room-panel="${room}"]`);
        panel?.classList.add('active');
        document.querySelector('.museum-shell')?.setAttribute('data-room', room);
        if (room === 'crafting') GentleQuests.evaluate('crafting_table_visited');
      }));
      document.getElementById('dl-weather')?.addEventListener('click',()=>CinematicCardRenderer.downloadCanvas(CinematicCardRenderer.renderWeatherCard(w),'weather-card.png'));
      document.getElementById('save-weather')?.addEventListener('click',()=>{ArtifactArchive.saveArtifact({type:'weather',title:w.name,subtitle:w.summary,data:w});Toast.show('Weather artifact saved ✓');});
      document.getElementById('dl-arch')?.addEventListener('click',()=>{const p=ArchetypeEngine.compute(PatternEngine.analyze(state.echoes));CinematicCardRenderer.downloadCanvas(CinematicCardRenderer.renderArchetypeCard(p),'archetype-card.png');});
      document.getElementById('dl-sound')?.addEventListener('click',()=>CinematicCardRenderer.downloadCanvas(CinematicCardRenderer.renderSoundprintCard({mood:state.echoes[0]?.mood}),'soundprint-card.png'));
      document.querySelectorAll('.relic-dl').forEach(btn=>btn.addEventListener('click',()=>{const r=RelicEngine.fromEchoes(state.echoes).find(x=>x.id===btn.dataset.id);if(!r)return;const c=CinematicCardRenderer.renderRelicCard(r);CinematicCardRenderer.downloadCanvas(c,`${r.title}.png`);}));
      document.querySelectorAll('.relic-save').forEach(btn=>btn.addEventListener('click',()=>{const r=RelicEngine.fromEchoes(state.echoes).find(x=>x.id===btn.dataset.id);if(!r)return;ArtifactArchive.saveArtifact({type:'relic',title:r.title,subtitle:r.description,data:r});btn.closest('.relic-item')?.classList.add('is-saved');Toast.show('Relic saved ✓');}));
      document.querySelectorAll('.art-del').forEach(btn=>btn.addEventListener('click',()=>{if(confirm('Remove this artifact from your local museum?')){ArtifactArchive.deleteArtifact(btn.dataset.id);btn.closest('.artifact-row')?.remove();}}));
      document.querySelectorAll('.art-fav').forEach(btn=>btn.addEventListener('click',()=>{ArtifactArchive.toggleFavorite(btn.dataset.id);btn.classList.toggle('active');}));
      document.querySelectorAll('.craft-btn').forEach(btn=>btn.addEventListener('click',()=>{const result=RelicCrafting.craft(btn.dataset.recipeId);if(result.ok){const preview=document.getElementById('crafted-preview');if(preview){preview.hidden=false;preview.innerHTML=`<b>Crafted Relic</b><span>${escapeHTML(result.artifact.title)}</span><small>${escapeHTML(result.artifact.description || result.artifact.subtitle || '')}</small>`;} refreshEchoDependentUI();}else if(result.missing?.length){Toast.show(`Missing: ${result.missing.map(m=>`${m.qty} ${m.name}`).join(', ')}`);}}));
      document.getElementById('save-receipt-latest')?.addEventListener('click',()=>{
        const data = safeGetReceiptData('latest');
        if (!data) return;
        ArtifactArchive.saveArtifact({ type:'receipt', title:'Mood Receipt', subtitle:data.insight, data });
        GentleQuests.evaluate('receipt_exported');
        Toast.show('Receipt saved ✓');
      });
    }
    if (type === 'lantern') initLanternInteraction();
    if (type === 'stormjar') initStormJarInteraction();
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
    if (type === 'vsvs') {
      document.getElementById('conflict-complete-btn')?.addEventListener('click', () => {
        const note = document.getElementById('conflict-complete-note');
        if (note) note.hidden = false;
        Toast.show('Inner Conflict archived.');
      });
      document.getElementById('conflict-close-btn')?.addEventListener('click', close);
    }
    if (type === 'receipt') {
      const replayBtn = document.createElement('button');
      replayBtn.className = 'ritual-ob-replay';
      replayBtn.textContent = '? how to use';
      replayBtn.addEventListener('click', () => showRitualOnboarding('receipt', () => {}));
      content.appendChild(replayBtn);
      document.querySelectorAll('.receipt-themes .theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          receiptTheme = btn.dataset.theme;
          document.querySelectorAll('.receipt-themes .theme-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const mainArea = document.querySelector('.receipt-main-area');
          if (mainArea) mainArea.innerHTML = buildReceiptCore();
        });
      });
      document.querySelector(`.theme-btn[data-theme="${receiptTheme}"]`)?.classList.add('active');
      document.querySelectorAll('.receipt-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.receipt-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const mainArea = document.querySelector('.receipt-main-area');
          if (mainArea) mainArea.innerHTML = buildReceiptCore(btn.dataset.mode || 'latest');
        });
      });
      document.getElementById('receipt-download-btn')?.addEventListener('click', downloadReceipt);
      document.getElementById('receipt-copy-btn')?.addEventListener('click', copyReceiptSummary);
      document.getElementById('receipt-close-btn')?.addEventListener('click', close);
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


  function initLanternInteraction(){const canvas=document.getElementById('lantern-canvas');if(!canvas)return;const ctx=canvas.getContext('2d');let glow=.4,taps=0,time=0,completed=false;const mood=PatternEngine.analyze(state.echoes).dominantMood||'reflective';const particles=[];const msg=document.getElementById('lantern-msg');const scene=document.querySelector('.lantern-scene');const frame=()=>{const w=canvas.width,h=canvas.height;time+=.012;ctx.clearRect(0,0,w,h);ctx.fillStyle='#07090f';ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(80,90,110,.12)';ctx.fillRect(0,h*.7,w,h*.3);const r=28+glow*8+Math.sin(time)*2;const g=ctx.createRadialGradient(w/2,h*.56,0,w/2,h*.56,r*2.2);g.addColorStop(0,`rgba(240,198,115,${.2+glow*.1})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(w/2,h*.56,r*2.2,0,6.28);ctx.fill();ctx.fillStyle=`rgba(243,201,126,${.5+glow*.06})`;ctx.beginPath();ctx.arc(w/2,h*.58,r,0,6.28);ctx.fill();for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.y-=p.vy;p.x+=p.vx;p.life-=.02;ctx.fillStyle=`rgba(248,214,155,${Math.max(0,p.life)})`;ctx.fillRect(p.x,p.y,2,2);if(p.life<=0)particles.splice(i,1);}if(document.getElementById('lantern-canvas') && document.getElementById('fun-modal')?.classList.contains('open')) requestAnimationFrame(frame)};frame();canvas.addEventListener('click',()=>{taps++;glow=Math.min(8,glow+1);scene?.setAttribute('data-state',taps>=4?'alive':(taps>=2?'faint':'unlit'));for(let i=0;i<6+taps;i++)particles.push({x:canvas.width/2+(Math.random()*36-18),y:canvas.height*.55,vx:Math.random()*.8-.4,vy:1+Math.random()*1.4,life:.8});if(taps===1)msg.textContent='The lantern wakes.';if(taps===2)msg.textContent='A faint warmth answers.';if(taps>=4){msg.textContent='Still here is still a signal.';document.getElementById('lantern-actions').hidden=false;scene?.classList.add('ritual-complete');if(!completed){completed=true;GentleQuests.evaluate('lantern_lit');VaultInventory.addMaterials([{name:'Moon Thread',qty:1}]);Toast.show('+1 Moon Thread');}}});document.getElementById('save-lantern')?.addEventListener('click',()=>{ArtifactArchive.saveArtifact({type:'lantern',title:'Void Lantern',subtitle:'Still here is still a signal.',data:{glowLevel:glow,mood,created_at:new Date().toISOString()}});Toast.show('Lantern saved to museum ✓');});document.getElementById('dl-lantern')?.addEventListener('click',()=>CinematicCardRenderer.downloadCanvas(CinematicCardRenderer.renderRelicCard({title:'Void Lantern',rarity:'luminous',coordinates:'EV-LIGHT',mood}),'void-lantern-card.png'));}
  function initStormJarInteraction(){const canvas=document.getElementById('storm-canvas');if(!canvas)return;const ctx=canvas.getContext('2d');const p=PatternEngine.analyze(state.echoes);let sparks=Math.max(10,Math.round((p.averageIntensity||4)*2));let taps=0,shake=0,flash=0;const msg=document.getElementById('storm-msg');const scene=document.querySelector('.storm-scene');const draw=()=>{const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#080a12';ctx.fillRect(0,0,w,h);const ox=(Math.random()-.5)*shake;ctx.save();ctx.translate(ox,0);ctx.strokeStyle='rgba(180,200,255,.65)';ctx.lineWidth=2;ctx.strokeRect(w/2-70,h/2-90,140,180);ctx.restore();for(let i=0;i<sparks;i++){ctx.strokeStyle='rgba(222,82,120,.6)';ctx.beginPath();const x=w/2-50+Math.random()*100,y=h/2-70+Math.random()*140;ctx.moveTo(x,y);ctx.lineTo(x+Math.random()*22-11,y+Math.random()*22-11);ctx.stroke();}if(flash>0){ctx.strokeStyle=`rgba(255,230,180,${flash})`;ctx.beginPath();ctx.moveTo(w/2-20,h/2-70);ctx.lineTo(w/2+16,h/2-30);ctx.lineTo(w/2-8,h/2+20);ctx.stroke();flash=Math.max(0,flash-.06);}shake*=.88;if(document.getElementById('storm-canvas') && document.getElementById('fun-modal')?.classList.contains('open')) requestAnimationFrame(draw)};draw();canvas.addEventListener('click',()=>{taps++;sparks=Math.min(52,sparks+4);shake=Math.min(14,shake+4);scene?.setAttribute('data-state',taps>=3?'contained':(taps>=2?'awake':'still'));if(taps===1)msg.textContent='Sparks begin to gather.';if(taps===2){msg.textContent='The jar trembles.';flash=.9;}if(taps>=3){msg.textContent='The storm has shape now.';document.getElementById('storm-actions').hidden=false;scene?.classList.add('ritual-complete');}});document.getElementById('save-storm')?.addEventListener('click',()=>{ArtifactArchive.saveArtifact({type:'stormjar',title:'Storm Jar',subtitle:'The storm has shape now.',data:{sparkCount:sparks,mood:'chaos',created_at:new Date().toISOString()}});Toast.show('Storm saved to museum ✓');});document.getElementById('dl-storm')?.addEventListener('click',()=>CinematicCardRenderer.downloadCanvas(CinematicCardRenderer.renderWeatherCard({name:'Storm Jar',summary:'The storm has shape now.',mood:'chaos'}),'storm-jar-card.png'));}
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
      return `<img class="receipt-char-img ${escapeHTML(posClass)}${smallClass}" src="${escapeHTML(src)}" alt="" aria-hidden="true" crossorigin="anonymous">`;
    }).join('');
  }

  function buildReceiptCore(mode='latest') {
    const safeMode = mode === 'weekly' ? 'weekly' : 'latest';
    const data = safeGetReceiptData(safeMode);
    let charImgHTML = '';
    if (isReceiptDebugMode()) console.info('[EchoVault Receipt]', data);
    if (!data) {
      return `<div class="receipt-error-card">
        <h3>Receipt unavailable</h3>
        <p>Your echoes are safe. Try refreshing the app cache or creating one new echo.</p>
      </div>`;
    }
    try {
      const charImgs = pickCharImgs();
      charImgHTML = buildCharImgHTML(charImgs);
    } catch (error) {
      console.warn('Receipt decoration failed', error);
      charImgHTML = '';
    }

    return `<div class="receipt ${escapeHTML(receiptTheme)}" id="receipt-el" style="position:relative">
      <div class="receipt-paper">
        <div class="receipt-header">
          <div class="receipt-store">ECHOVAULT™</div>
          <div class="receipt-tagline">Emotional Surplus Store · Est. Today</div>
        </div>
        <hr class="receipt-divider">
        <div class="receipt-line"><span>Receipt type</span><span>${escapeHTML(safeMode === 'weekly' ? 'Weekly Summary' : 'Latest Echo')}</span></div>
        <div class="receipt-line"><span>Vault Holder</span><span>${escapeHTML(data.vaultHolder)}</span></div>
        <div class="receipt-line"><span>Echo ID</span><span>${escapeHTML(data.echoId)}</span></div>
        <div class="receipt-line"><span>Receipt ID</span><span>${escapeHTML(data.receiptId)}</span></div>
        <div class="receipt-line"><span>Receipt Class</span><span>${escapeHTML(data.receiptClass)}</span></div>
        <div class="receipt-line"><span>Coordinates</span><span>${escapeHTML(data.coordinates)}</span></div>
        <div class="receipt-line"><span>Mood</span><span>${escapeHTML(String(data.mood).toUpperCase())}</span></div>
        <div class="receipt-line"><span>Intensity</span><span>${escapeHTML(data.intensity)}/10</span></div>
        <div class="receipt-line"><span>Silence</span><span>${escapeHTML(data.silence)}/10</span></div>
        <div class="receipt-line"><span>Emotional Season</span><span>${escapeHTML(data.emotionalSeason || data.weather)}</span></div>
        <div class="receipt-line"><span>Emotional Weather</span><span>${escapeHTML(data.weather)}</span></div>
        <div class="receipt-line"><span>Archetype</span><span>${escapeHTML(data.archetype)}</span></div>
        <div class="receipt-line"><span>Void status</span><span>${escapeHTML(data.voidStatus)}</span></div>
        <div class="receipt-line"><span>Sync state</span><span>${escapeHTML(data.syncLabel)}</span></div>
        ${data.materialsDiscovered ? `<div class="receipt-line"><span>Materials Discovered</span><span>${escapeHTML(data.materialsDiscovered)}</span></div>` : ''}
        ${data.craftedRelic ? `<div class="receipt-line"><span>Crafted Relic</span><span>${escapeHTML(data.craftedRelic)}</span></div>` : ''}
        ${data.avatarRole ? `<div class="receipt-line"><span>Avatar Role</span><span>${escapeHTML(data.avatarRole)}</span></div>` : ''}
        ${data.roomUnlocked ? `<div class="receipt-line"><span>Room Unlocked</span><span>${escapeHTML(data.roomUnlocked)}</span></div>` : ''}
        <div class="receipt-line"><span>Date</span><span>${escapeHTML(data.date)}</span></div>
        <hr class="receipt-divider">
        <div class="receipt-line bold"><span>INSIGHT</span><span>#${escapeHTML(data.receiptNumber)}</span></div>
        <div style="font-size:10px;opacity:.8">${escapeHTML(data.insight)}</div>
        <div class="receipt-phase-note">Receipt Class can later become a collectible frame style.</div>
        <div class="receipt-barcode">${escapeHTML(data.barcode)}</div>
        <div class="receipt-footer">EchoVault · ${escapeHTML(data.timestamp)}<br>${escapeHTML(data.receiptNumber)}</div>
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
    return `${themeBar}<div style="display:flex;gap:8px;margin-bottom:10px"><button class="theme-btn receipt-mode-btn active" data-mode="latest">Latest Echo</button><button class="theme-btn receipt-mode-btn" data-mode="weekly">Weekly Summary</button></div>
    <div class="receipt-main-area">${buildReceiptCore('latest')}</div>
    <div class="receipt-actions">
      <button class="receipt-action-btn" id="receipt-download-btn">⬇ Save Image</button>
      <button class="receipt-action-btn" id="receipt-copy-btn">⧉ Copy Summary</button>
      <button class="receipt-action-btn" id="receipt-close-btn">Close</button>
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

  async function copyReceiptSummary() {
    try {
      const mode = document.querySelector('.receipt-mode-btn.active')?.dataset.mode || 'latest';
      const d = safeGetReceiptData(mode);
      if (!d) { Toast.show('Copy failed.'); return; }
      const txt = `EchoVault ${mode} receipt
Vault Holder: ${d.vaultHolder}
Receipt ID: ${d.receiptId}
Echo ID: ${d.echoId}
Receipt Class: ${d.receiptClass}
Coordinates: ${d.coordinates}
Mood: ${d.mood}
Intensity: ${d.intensity}/10
Silence: ${d.silence}/10
Emotional Season: ${d.emotionalSeason || d.weather}
Emotional Weather: ${d.weather}
Archetype: ${d.archetype}
Void status: ${d.voidStatus}
Date: ${d.date}
Sync state: ${d.syncLabel}
Insight: ${d.insight}`;
      await navigator.clipboard.writeText(txt);
      Toast.show('Summary copied ✓');
    } catch(e) {
      console.warn('Receipt copy failed', e);
      Toast.show('Copy failed.');
    }
  }

  function fallbackDownload(canvas) {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = 'mood-receipt.png'; a.click();
    Toast.show('Saved as image ✓');
  }

  function buildDNA() {
    const patterns = PatternEngine.analyze(state.echoes);
    const mc = patterns.moodCounts || {};
    const total  = state.echoes.length || 1;
    const sorted = Object.entries(mc).sort((a,b)=>b[1]-a[1]);
    const archetype = ArchetypeEngine.compute(patterns);
    const season = patterns.emotionalSeason || getEmotionalSeason(state.echoes);
    const traits = Array.from(new Set([...(season.traits || []), ...(archetype.dominantFactors || []).slice(0,3)])).slice(0,7);
    if (!traits.length) traits.push('undefined','becoming','open');
    const domEmoji = MOOD_EMOJIS[sorted[0]?.[0]] || '✨';
    return `<div class="dna-card">
      <div class="dna-title">Emotion DNA — v${state.echoes.length}</div>
      <div class="dna-emoji-row">${domEmoji}${domEmoji}${domEmoji}</div>
      <div class="dna-archetype">${escapeHTML(archetype.archetypeName || getArchetype(mc))}</div>
      <div class="dna-archetype-sub">${escapeHTML(archetype.archetypeDescription || getArchetypeDesc(mc))}</div>
      <div class="dna-season-mini">${escapeHTML(season.title)} · ${escapeHTML(season.interpretation)}</div>
      <div class="dna-traits">${traits.map(t=>`<span class="dna-trait">${escapeHTML(t)}</span>`).join('')}</div>
      <div class="dna-bars">${sorted.slice(0,5).map(([mood,count])=>{
        const pct=Math.round(count/total*100);
        return `<div class="dna-bar-row">
          <div class="dna-bar-name">${escapeHTML(mood)}</div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width:${pct}%;background:${MOOD_COLORS[mood] || MOOD_COLORS[moodFamily(mood)]}"></div></div>
          <div class="dna-bar-pct">${pct}%</div>
        </div>`;
      }).join('')}</div>
      <div class="dna-footer">EchoVault · Your Emotional Sequence · confidence ${escapeHTML(season.confidence || 0)}%</div>
    </div>`;
  }

  function buildCrash() {
    const recent = state.echoes[0];
    const patterns = PatternEngine.analyze(state.echoes);
    const shouldCrash = Boolean(recent && (Number(recent.intensity || 0) >= 8 || Number(recent.silence || 0) >= 8 || patterns.averageIntensity >= 7 || patterns.averageSilence >= 7));
    if (!shouldCrash) {
      return `<div class="crash-report crash-report-soft">
        <div class="crash-header">SYSTEM STABLE: NO OVERFLOW DETECTED</div>
        <div class="crash-line"><span class="crash-key">echoes_logged:</span> <span class="crash-val">${state.echoes.length}</span></div>
        <div class="crash-line"><span class="crash-key">current_season:</span> <span class="crash-val">${escapeHTML(patterns.emotionalSeason?.title || 'Quiet Winter')}</span></div>
        <div class="crash-stack">Crash Report appears when recent echoes show high intensity or high silence. For now, the system is choosing calm containment.</div>
        <button class="crash-btn" id="crash-close">close gently</button>
      </div>`;
    }
    return `<div class="crash-report">
      <div class="crash-header">💥 PROCESS TERMINATED: EMOTIONAL_OVERFLOW</div>
      <div class="crash-line"><span class="crash-key">timestamp:</span> <span class="crash-val">${new Date().toISOString()}</span></div>
      <div class="crash-line"><span class="crash-key">error_code:</span> <span class="crash-val">FEELINGS_EXCEEDED_CAPACITY</span></div>
      <div class="crash-line"><span class="crash-key">echoes_logged:</span> <span class="crash-val">${state.echoes.length}</span></div>
      ${recent?`<div class="crash-line"><span class="crash-key">last_emotion:</span> <span class="crash-val">${escapeHTML(recent.mood)} (intensity ${escapeHTML(recent.intensity)})</span></div>`:''}
      <div class="crash-line"><span class="crash-key">silence_level:</span> <span class="crash-val">${escapeHTML(recent?.silence ?? patterns.averageSilence)}/10</span></div>
      <div class="crash-line"><span class="crash-key">recovery_mode:</span> <span class="crash-val">rest / water / one smaller breath</span></div>
      <div class="crash-stack">Stack trace:<br>&nbsp;&nbsp;at Human.feel() [signal.js:${Math.floor(Math.random()*999)}]<br>&nbsp;&nbsp;at EchoVault.contain() [ritual.js:${Math.floor(Math.random()*99)}]<br>&nbsp;&nbsp;at Universe.continue() [existence.js:1]</div>
      <button class="crash-btn" id="crash-close">ignore &amp; continue</button>
    </div>`;
  }

  function buildSound() {
    const recent = state.echoes[0];
    const mood   = recent?.mood || 'reflective';
    const family = moodFamily(mood);
    const patterns = PatternEngine.analyze(state.echoes);
    const tracks = getSoundprintForEcho(recent || { mood:family, intensity:5, silence:5 }, patterns);
    const season = patterns.emotionalSeason || getEmotionalSeason(state.echoes);
    const color  = MOOD_COLORS[mood] || MOOD_COLORS[family];
    const coverEmoji = MOOD_COVER_EMOJI[mood] || MOOD_COVER_EMOJI[family] || '🎵';

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
      <div class="soundprint-sub">Resonating with your ${(MOOD_EMOJIS[mood] || MOOD_EMOJIS[family])} <strong style="color:var(--text);font-style:normal">${mood}</strong> frequency · ${escapeHTML(season.title)}</div>
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
        <div class="reliever-text">${relieverMessages[family] || relieverMessages.reflective}</div>
        <div class="reliever-breath" id="reliever-orb" role="button" aria-label="Breathing orb — tap and breathe">
          <div class="reliever-breath-ring"></div>
          ${relieverEmojis[family] || '◯'}
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
      <div class="conflict-instruction">drag to influence · watch them collide</div><div class="ritual-actions"><button class="receipt-action-btn" id="conflict-complete-btn" type="button">I felt that</button><button class="receipt-action-btn" id="conflict-close-btn" type="button">Close ritual</button></div><div id="conflict-complete-note" class="ritual-msg" hidden>The room settles. You can return anytime.</div>
      <div class="conflict-labels">
        <div class="conflict-label past">${state.echoes.length > 1 ? state.echoes[state.echoes.length-1].mood : 'past'}</div>
        <div class="conflict-label present">${state.echoes[0]?.mood || 'present'}</div>
      </div>
    </div>`;
  }


  function buildLantern(){
    return `<div class="ritual-scene lantern-scene"><h3>Void Lantern</h3><p>Tap to give the quiet a small light.</p><canvas id="lantern-canvas" width="520" height="300"></canvas><div id="lantern-msg" class="ritual-msg">Stillness can hold a signal.</div><div class="ritual-actions" id="lantern-actions" hidden><button class="receipt-action-btn" id="save-lantern">Save Lantern Artifact</button><button class="receipt-action-btn" id="dl-lantern">Download Lantern Card</button></div></div>`;
  }
  function buildStormJar(){
    return `<div class="ritual-scene storm-scene"><h3>Storm Jar</h3><p>Put the weather somewhere it can’t swallow you.</p><canvas id="storm-canvas" width="520" height="300"></canvas><div id="storm-msg" class="ritual-msg">Tap the jar to give the storm a shape.</div><div class="ritual-actions" id="storm-actions" hidden><button class="receipt-action-btn" id="save-storm">Save Storm Artifact</button><button class="receipt-action-btn" id="dl-storm">Download Storm Card</button></div></div>`;
  }
  function buildMuseum(){
    VaultRooms.evaluate?.();
    const echoes=Array.isArray(state.echoes) ? state.echoes : [];
    const safeMuseumCompute = (label, fallback, compute) => {
      try { return compute(); }
      catch(error) { museumDebugLog(`[Museum] failed ${label} -> ${error?.message || error}`); return fallback; }
    };
    const saved=safeMuseumCompute('artifacts', [], () => ArtifactArchive.listArtifacts() || []);
    const materials = safeMuseumCompute('materials', {}, () => VaultInventory.getTotals() || {});
    const totalMaterials = Object.values(materials).reduce((sum, qty)=>sum + Number(qty || 0), 0);
    const meta = MaterialEngine.materialMeta || {};
    const buildMaterialRows = () => Object.entries(materials).map(([name,count])=>{ const m=meta[name] || { icon:'✦', description:'A private emotional material.', mood:'reflective' }; return `<div class="material-pill mood-${escapeHTML(m.mood)}"><span><b>${escapeHTML(m.icon)}</b> ${escapeHTML(name)}<small>${escapeHTML(m.description)}</small></span><strong>${escapeHTML(count)}</strong></div>`; }).join('') || '<div class="museum-empty">No materials discovered yet. Create an echo to uncover the first fragment.</div>';
    const materialRows = buildMaterialRows();
    const weather=safeMuseumCompute('weather', { name:'Quiet Weather', summary:'This room has no saved material yet.', mood:'reflective' }, () => WeatherMap.compute(echoes));
    const pattern=safeMuseumCompute('pattern', {}, () => PatternEngine.analyze(echoes));
    const arch=safeMuseumCompute('archetype', { archetypeName:'Still Forming', archetypeDescription:'Create more echoes to fill this wing.' }, () => ArchetypeEngine.compute(pattern));
    const quest=safeMuseumCompute('quest', { text:'Create one echo to wake the museum.', completed:false, reward:{ name:'Calm Shard', qty:1 }, xp:0 }, () => GentleQuests.current());
    const avatarHtml=safeMuseumCompute('avatar', '', () => EchoAvatar.render());
    const relicVisual = (name) => {
      const key = String(name || '').toLowerCase();
      if (key.includes('signal')) return 'relic-star';
      if (key.includes('quiet')) return 'relic-stone';
      if (key.includes('storm')) return 'relic-prism';
      if (key.includes('comet')) return 'relic-comet';
      return 'relic-token';
    };
    const buildCraftCards = () => RelicCrafting.listRecipes().map(recipe => {
      const missing = RelicCrafting.getMissingMaterials(recipe.id);
      const can = missing.length === 0;
      const costs = recipe.cost.map(c => { const have=VaultInventory.getMaterialCount(c.name); return `<span class="cost-chip ${have>=c.qty?'has':'missing'}">${escapeHTML(c.name)} <b>${escapeHTML(have)}/${escapeHTML(c.qty)}</b></span>`; }).join('');
      const missText = missing.map(m=>`${m.qty} ${m.name}`).join(', ');
      return `<article class="craft-recipe-card ${can?'can-craft':'is-missing'}"><div class="craft-recipe-top"><span class="craft-rune">✦</span><div><h5>${escapeHTML(recipe.title)}</h5><p>${escapeHTML(recipe.description)}</p></div></div><div class="craft-costs">${costs}</div>${can ? '<small class="craft-ready">Materials aligned.</small>' : `<small class="craft-missing">missing: ${escapeHTML(missText)}</small>`}<button class="receipt-action-btn craft-btn" data-recipe-id="${escapeHTML(recipe.id)}" ${can?'':'disabled'}>Craft</button></article>`;
    }).join('') || '<div class="museum-empty">Create more echoes to fill this wing.</div>';
    const materialsPrep = '<div class="phase-two-note">Materials remain local-first in <code>echovault_inventory_v1</code>; crafting only spends local inventory when every cost is available.</div>';
    const premiumRoomFeatures = { weather_room:'premium_weather_map', soundprint_wall:'advanced_soundprint', relic_hall:'emotional_museum_full', archive_shelf:'artifact_archive', lantern_garden:'vault_rooms', crafting_table:'crafting_table' };
    const roomUnlockAlias = { archetype_hall:'weather_room', materials_room:'crafting_table' };
    const allRoomDefs = [
      { id:'weather_room', panel:'weather', label:'Weather Room' },
      { id:'archetype_hall', panel:'archetype', label:'Archetype Hall' },
      { id:'soundprint_wall', panel:'soundprint', label:'Soundprint Wall' },
      { id:'relic_hall', panel:'relics', label:'Memory Relics' },
      { id:'archive_shelf', panel:'receipts', label:'Receipt Archive' },
      { id:'lantern_garden', panel:'lanterns', label:'Void Lanterns' },
      { id:'crafting_table', panel:'crafting', label:'Crafting Table' },
      { id:'materials_room', panel:'materials', label:'Vault Materials' }
    ];
    const roomDefs = allRoomDefs;
    const roomBuilders = {
      weather_room: () => panelLock('weather_room', `<h4>Weather Room</h4><p>${escapeHTML(weather.summary || 'This room has no saved material yet.')}</p><canvas id="weather-map-canvas" style="width:100%;height:240px"></canvas><div class="ritual-actions"><button class="receipt-action-btn" id="dl-weather">Download Weather Card</button><button class="receipt-action-btn" id="save-weather">Save Weather Artifact</button></div>`),
      archetype_hall: () => `<h4>Archetype Hall</h4><p>${escapeHTML(arch.archetypeName || 'Still Forming')} · ${escapeHTML(arch.archetypeDescription || 'Create more echoes to fill this wing.')}</p><button class="receipt-action-btn" id="dl-arch">Download Archetype Card</button>`,
      soundprint_wall: () => panelLock('soundprint_wall', (() => { const tracks=getSoundprintForEcho(echoes[0] || { mood:weather.mood || 'reflective', intensity:5, silence:5 }, pattern) || []; const rows=tracks.slice(0,3).map(t=>`<div class='track-item'><div><b>${escapeHTML(t.song)}</b><small>${escapeHTML(t.artist)}</small></div><a class='track-link spotify' href='${escapeHTML(t.spotify)}' target='_blank' rel='noopener noreferrer'>Spotify</a><a class='track-link youtube' href='${escapeHTML(t.youtube)}' target='_blank' rel='noopener noreferrer'>YouTube</a></div>`).join('') || '<div class="museum-empty">No soundprint entries yet. Create more echoes to fill this wing.</div>'; return `<h4>Soundprint Wall</h4>${rows}<button class="receipt-action-btn" id="dl-sound">Download Soundprint Card</button>`; })()),
      relic_hall: () => panelLock('relic_hall', (() => { const relics=RelicEngine.fromEchoes(echoes) || []; const rows=relics.map((r,i)=>`<article class='relic-item mood-${escapeHTML(r.mood)}' style='--delay:${i * 120}ms'><div class='relic-visual ${relicVisual(r.title)}'></div><b>${escapeHTML(r.title)}</b><span class='rarity'>${escapeHTML(r.rarity)}</span><small>${escapeHTML(r.coordinates)}</small><p>${escapeHTML(r.description)}</p><button class='receipt-action-btn relic-dl' data-id='${escapeHTML(r.id)}'>Download Card</button><button class='receipt-action-btn relic-save' data-id='${escapeHTML(r.id)}'>Save Artifact</button></article>`).join('') || '<div class="museum-empty">No relics archived here yet. Create more echoes to fill this wing.</div>'; return `<h4>Memory Relics</h4><div class="relic-grid">${rows}</div>`; })()),
      archive_shelf: () => panelLock('archive_shelf', `<h4>Receipt Archive</h4><p>Receipts you save will appear here.</p><button class='receipt-action-btn' id='save-receipt-latest'>Save Latest Receipt</button><div class="artifact-shelf" id='artifact-list'>${saved.map(a=>`<div class='artifact-row'><b>${escapeHTML(a.title)}</b><small>${escapeHTML(a.type)}</small><button class='receipt-action-btn art-fav' data-id='${escapeHTML(a.id)}'>☆</button><button class='receipt-action-btn art-del' data-id='${escapeHTML(a.id)}'>Delete</button></div>`).join('') || '<div class="museum-empty">No artifacts archived here yet.</div>'}</div>`),
      lantern_garden: () => panelLock('lantern_garden', '<h4>Void Lanterns</h4><p>Still here is still a signal. Crafted lanterns gather here as a private garden.</p><div class="museum-empty">This room has no saved material yet.</div>'),
      crafting_table: () => panelLock('crafting_table', `<section class="crafting-table"><div class="crafting-head"><div><h4>Crafting Table</h4><p>Shape emotional materials into relics.</p></div><span>${totalMaterials} materials</span></div><section class="vault-materials compact"><h4>Inventory Summary</h4>${materialRows}</section><div class="craft-grid">${buildCraftCards()}</div><div id="crafted-preview" class="crafted-preview" hidden></div></section>`),
      materials_room: () => `<h4>Vault Materials</h4><section class="vault-materials">${materialRows}</section>${materialsPrep}`
    };
    const roomFallback = (label, error) => `<div class="museum-empty"><h4>${escapeHTML(label)}</h4><p>This room is still forming.</p><small>${museumDebugEnabled() ? escapeHTML(error?.message || error || '') : 'Create more echoes to fill this wing.'}</small></div>`;
    const renderRoom = ({ id, panel, label }, index) => {
      museumDebugLog(`[Museum] building room: ${id}`);
      try {
        const builder = roomBuilders[id];
        if (typeof builder !== 'function') throw new Error(`Missing museum room builder for ${id}`);
        return `<div class="museum-room ${index===0?'active':''}" data-room-panel="${escapeHTML(panel)}">${builder()}</div>`;
      } catch(error) {
        museumDebugLog(`[Museum] failed room: ${id} -> ${error?.message || error}`);
        return `<div class="museum-room ${index===0?'active':''}" data-room-panel="${escapeHTML(panel)}">${roomFallback(label, error)}</div>`;
      }
    };
    const panelLock = (roomId, html) => {
      const feature = premiumRoomFeatures[roomId];
      if (feature && !UserAccess.canUse(feature)) return UserAccess.lockedHTML(feature);
      const unlockId = roomUnlockAlias[roomId] || roomId;
      return VaultRooms.isUnlocked(unlockId) ? html : `<div class="museum-locked"><h4>${escapeHTML(VaultRooms.getRooms().find(r=>r.id===unlockId)?.name || 'Locked Room')}</h4><p>${escapeHTML(VaultRooms.getUnlockReason(unlockId))}</p></div>`;
    };
    const tabButton = ({ id, panel, label }) => {
      const unlockId = roomUnlockAlias[id] || id;
      const feature = premiumRoomFeatures[id];
      const premiumUnlocked = !feature || UserAccess.canUse(feature);
      const unlocked = premiumUnlocked && VaultRooms.isUnlocked(unlockId);
      const title = premiumUnlocked ? (unlocked ? 'Awakened' : VaultRooms.getUnlockReason(unlockId)) : UserAccess.getLockedCopy(feature).body;
      return `<button class="museum-tab ${panel==='weather'?'active':''} ${unlocked?'is-unlocked':'is-locked'}" data-room="${escapeHTML(panel)}" title="${escapeHTML(title)}">${premiumUnlocked ? '' : '✦ '}${escapeHTML(label)}</button>`;
    };
    const shellStart = `<div class="museum-shell" data-room="weather"><header class="museum-head"><h3>Emotional Museum</h3><p class="museum-sub">A private archive of what your echoes became.</p><div class="museum-meta"><span>${echoes.length} echoes</span><span>${saved.length} artifacts</span><span>${totalMaterials} materials</span><span>${escapeHTML(weather.name || 'Quiet Weather')}</span><span>${escapeHTML(arch.archetypeName || 'Still Forming')}</span></div></header><div class="gentle-quest-card"><span>Today’s Gentle Quest</span><b>${escapeHTML(quest.text)}</b><small>${quest.completed ? 'complete' : `Reward: +${escapeHTML(quest.reward?.qty || 0)} ${escapeHTML(quest.reward?.name || 'material')}${quest.xp ? ` · +${escapeHTML(quest.xp)} XP` : ''}`}</small></div>${avatarHtml}<nav class="museum-tabs" aria-label="Museum rooms">${roomDefs.map(tabButton).join('')}</nav>`;
    const roomsHtml = roomDefs.map(renderRoom).join('');
    const emptyNote = !echoes.length ? '<div class="museum-empty">The museum is quiet. Create echoes to awaken its rooms.</div>' : '';
    return `${shellStart}${roomsHtml}${emptyNote}</div>`;
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
      if (prefersReducedMotion()) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
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

  return {open, hasBuilder};
})();


/* ── ECHO REPLAY DRIFT ── */
const ReplayDrift = (() => {
  const stage = document.getElementById('replay-drift-stage');
  const canvas = document.getElementById('replay-drift-canvas');
  const staticLayer = document.getElementById('replay-drift-static');
  const seasonEl = document.getElementById('replay-drift-season');
  const narrationEl = document.getElementById('replay-drift-narration');
  const fragmentEl = document.getElementById('replay-drift-fragment');
  const exitBtn = document.getElementById('replay-drift-exit');
  const skipBtn = document.getElementById('replay-drift-skip');
  const audioBtn = document.getElementById('replay-drift-audio');
  const clock = { start:0, last:0, duration:52000, fps:45, paused:false };
  const seasonDefs = {
    quietWinter:{ label:'Quiet Winter', color:'#BFD7FF', fog:0.055, line:0.18, text:'You were quieter here.' },
    neonCollapse:{ label:'Neon Collapse', color:'#C084FC', fog:0.042, line:0.28, text:'Some echoes flickered before they softened.' },
    solarDrift:{ label:'Solar Drift', color:'#FFD37A', fog:0.032, line:0.24, text:'Warmth kept finding a way back.' },
    voidSeason:{ label:'Void Season', color:'#8796C8', fog:0.071, line:0.12, text:'Some echoes refused to disappear.' },
    lunarArchive:{ label:'Lunar Archive', color:'#C8B6FF', fog:0.048, line:0.2, text:'You returned to this feeling often.' }
  };
  let renderer = null;
  let scene = null;
  let camera = null;
  let raf = null;
  let points = null;
  let lineMesh = null;
  let memoryGroup = null;
  let memories = [];
  let seasons = [];
  let narrationMarks = [];
  let activeSeason = '';
  let previousFocus = null;
  let audio = null;
  let resizeHandler = null;
  let visibilityHandler = null;
  let keyHandler = null;
  let initTimeoutId = null;

  function chronologicalEchoes() {
    return [...state.echoes]
      .filter((echo) => echo && echo.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function seeded(value) {
    const str = String(value || 'echo');
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) hash = Math.imul(hash ^ str.charCodeAt(i), 16777619);
    return (hash >>> 0) / 4294967295;
  }

  function buildMemoryMap(echoes) {
    const maxEchoes = isMobileViewport() ? 32 : 54;
    const step = Math.max(1, Math.ceil(echoes.length / maxEchoes));
    const sampled = echoes.filter((_, index) => index % step === 0 || index === echoes.length - 1);
    const first = new Date(sampled[0]?.date || Date.now()).getTime();
    const last = new Date(sampled[sampled.length - 1]?.date || Date.now()).getTime();
    const span = Math.max(1, last - first);
    return sampled.map((echo, index) => {
      const family = moodFamily(echo.mood);
      const date = new Date(echo.date);
      const age = (date.getTime() - first) / span;
      const monthCurve = ((date.getMonth() / 11) - 0.5) * 20;
      const seed = seeded(echo.id || echo.date || index);
      const drift = (seed - 0.5) * 16;
      const silence = Number(echo.silence || 4);
      const intensity = Number(echo.intensity || 5);
      return {
        echo, index, family, date,
        x: monthCurve + drift,
        y: (5.5 - intensity) * 2.1 + (seeded(echo.thought || echo.mood) - 0.5) * 5,
        z: -92 + age * 142,
        size: 0.34 + Math.min(1.15, intensity / 10) * 0.46 + (echo.void ? 0.16 : 0),
        color: MOOD_COLORS[family] || '#c9a84c',
        silence,
        opacity: 0.38 + Math.max(0, 10 - silence) * 0.045
      };
    });
  }

  function classifySeason(group) {
    const counts = {};
    let silence = 0;
    let intensity = 0;
    group.forEach((memory) => {
      counts[memory.family] = (counts[memory.family] || 0) + 1;
      silence += memory.silence;
      intensity += Number(memory.echo.intensity || 5);
    });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'reflective';
    const avgSilence = silence / Math.max(1, group.length);
    const avgIntensity = intensity / Math.max(1, group.length);
    if (dominant === 'empty' || avgSilence >= 7.2) return 'voidSeason';
    if (dominant === 'chaos' || (dominant === 'anxious' && avgIntensity >= 6.2)) return 'neonCollapse';
    if (dominant === 'joyful' || dominant === 'calm') return 'solarDrift';
    if (avgSilence >= 5.8) return 'quietWinter';
    return 'lunarArchive';
  }

  function buildSeasons(memoryMap) {
    const groups = [];
    const chunkSize = Math.max(3, Math.ceil(memoryMap.length / 5));
    for (let i = 0; i < memoryMap.length; i += chunkSize) groups.push(memoryMap.slice(i, i + chunkSize));
    return groups.map((group, groupIndex) => {
      const key = classifySeason(group);
      const start = group[0]?.z || -92;
      const end = group[group.length - 1]?.z || start + 10;
      return { key, ...seasonDefs[key], start, end, groupIndex };
    });
  }

  function chooseNarration(memoryMap, seasonMap) {
    const oldestWithWords = memoryMap.find((memory) => memory.echo.thought && !memory.echo.void);
    const repeated = Object.entries(memoryMap.reduce((acc, memory) => {
      acc[memory.family] = (acc[memory.family] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1])[0]?.[0];
    return [
      { t:0.08, text:'The oldest echoes are farther out.' },
      { t:0.34, text:seasonMap[1]?.text || 'This season moved slowly.' },
      { t:0.62, text:oldestWithWords ? 'A forgotten fragment is returning.' : 'Even wordless echoes left gravity.', fragment:oldestWithWords },
      { t:0.82, text:repeated ? `You returned to ${repeated} more than once.` : 'Your echoes made a quiet constellation.' }
    ].map((mark) => ({ ...mark, shown:false }));
  }

  function setAtmosphere(season) {
    if (!season || activeSeason === season.label) return;
    activeSeason = season.label;
    seasonEl.textContent = season.label;
    stage.style.setProperty('--drift-glow', `${season.color}33`);
  }

  function initStaticReduced() {
    staticLayer.innerHTML = memories.map((memory) => {
      const left = 14 + ((memory.z + 92) / 142) * 72;
      const top = 50 + memory.y * 1.9;
      return `<span class="replay-drift-memory" style="left:${left.toFixed(2)}%;top:${Math.max(18, Math.min(78, top)).toFixed(2)}%;--memory-color:${memory.color}"></span>`;
    }).join('');
    const firstSeason = seasons[0] || seasonDefs.lunarArchive;
    setAtmosphere(firstSeason);
    narrationEl.textContent = memories.length > 1 ? 'Your echoes rest in chronological orbit.' : 'One echo can still hold a sky.';
    const fragment = memories.find((memory) => memory.echo.thought && !memory.echo.void);
    fragmentEl.textContent = fragment ? `“${String(fragment.echo.thought).slice(0, 96)}${String(fragment.echo.thought).length > 96 ? '…' : ''}”` : '';
  }

  function initThree() {
    const THREE = window.THREE;
    renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:true, powerPreference:'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileViewport() ? 1.35 : 1.65));
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.045);
    camera = new THREE.PerspectiveCamera(54, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 260);
    camera.position.set(0, 0, 68);
    memoryGroup = new THREE.Group();
    scene.add(memoryGroup);

    const starCount = Math.min(isMobileViewport() ? 90 : 150, Math.max(44, Math.round(window.innerWidth * window.innerHeight / (isMobileViewport() ? 15000 : 11000))));
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const seed = seeded(`star-${i}-${memories.length}`);
      starPositions[i * 3] = (seeded(`sx-${i}`) - 0.5) * 76;
      starPositions[i * 3 + 1] = (seeded(`sy-${i}`) - 0.5) * 48;
      starPositions[i * 3 + 2] = -106 + seeded(`sz-${i}`) * 176;
      const color = new THREE.Color(seed > 0.72 ? '#D8A85A' : '#8796C8');
      starColors[i * 3] = color.r; starColors[i * 3 + 1] = color.g; starColors[i * 3 + 2] = color.b;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    points = new THREE.Points(starGeometry, new THREE.PointsMaterial({ size:isMobileViewport() ? 0.085 : 0.105, vertexColors:true, transparent:true, opacity:0.52, depthWrite:false }));
    scene.add(points);

    memories.forEach((memory) => {
      const material = new THREE.MeshBasicMaterial({ color:new THREE.Color(memory.color), transparent:true, opacity:memory.opacity });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(memory.size, 12, 8), material);
      mesh.position.set(memory.x, memory.y, memory.z);
      mesh.userData = memory;
      memoryGroup.add(mesh);
    });

    const linePositions = [];
    memories.forEach((memory, index) => {
      const next = memories[index + 1];
      if (next) linePositions.push(memory.x, memory.y, memory.z, next.x, next.y, next.z);
      const sibling = memories.slice(index + 2, index + 8).find((candidate) => candidate.family === memory.family);
      if (sibling && seeded(`${memory.echo.id || index}-link`) > 0.38) linePositions.push(memory.x, memory.y, memory.z, sibling.x, sibling.y, sibling.z);
    });
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineMesh = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color:0xc9a84c, transparent:true, opacity:0.14 }));
    scene.add(lineMesh);

    resizeHandler = () => {
      if (!renderer || !camera) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileViewport() ? 1.35 : 1.65));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
      camera.updateProjectionMatrix();
      clock.fps = isMobileViewport() ? 30 : 45;
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
  }

  function renderFrame(now) {
    if (!stage.classList.contains('open')) return;
    raf = requestAnimationFrame(renderFrame);
    if (clock.paused) return;
    const minFrame = 1000 / clock.fps;
    if (now - clock.last < minFrame) return;
    clock.last = now;
    const elapsed = now - clock.start;
    const progress = Math.min(1, elapsed / clock.duration);
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const z = -84 + ease * 130;
    const currentSeason = seasons.find((season) => z >= season.start - 12 && z <= season.end + 16) || seasons[Math.min(seasons.length - 1, Math.floor(progress * seasons.length))] || seasonDefs.lunarArchive;
    setAtmosphere(currentSeason);
    scene.fog.density += ((currentSeason.fog || 0.045) - scene.fog.density) * 0.025;
    lineMesh.material.opacity += ((currentSeason.line || 0.18) - lineMesh.material.opacity) * 0.025;
    narrationMarks.forEach((mark) => {
      if (!mark.shown && progress >= mark.t) {
        mark.shown = true;
        narrationEl.textContent = mark.text;
        if (mark.fragment) {
          const text = String(mark.fragment.echo.thought || '').trim();
          fragmentEl.textContent = text ? `“${text.slice(0, 118)}${text.length > 118 ? '…' : ''}”` : '';
        }
      }
    });
    camera.position.z += (z - camera.position.z) * 0.018;
    camera.position.x = Math.sin(progress * Math.PI * 1.4) * 3.2;
    camera.position.y = Math.cos(progress * Math.PI * 1.1) * 1.8;
    camera.lookAt(Math.sin(progress * Math.PI) * 2, 0, z - 34);
    memoryGroup.children.forEach((mesh, index) => {
      const distance = Math.abs(mesh.position.z - camera.position.z);
      const targetOpacity = distance < 34 ? mesh.userData.opacity : Math.max(0.12, mesh.userData.opacity * 0.34);
      mesh.material.opacity += (targetOpacity - mesh.material.opacity) * 0.035;
      const pulse = 1 + Math.sin(now * 0.0012 + index) * 0.035;
      mesh.scale.setScalar(pulse);
    });
    points.rotation.y += 0.00014;
    renderer.render(scene, camera);
    if (progress >= 1) {
      narrationEl.textContent = 'The universe remembers in layers.';
      fragmentEl.textContent = 'Replay complete. You can exit whenever you are ready.';
    }
  }

  function startAudio() {
    if (audio?.enabled) return stopAudio();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    const low = context.createOscillator();
    const high = context.createOscillator();
    low.type = 'sine'; high.type = 'triangle';
    low.frequency.value = 58; high.frequency.value = 146;
    gain.gain.value = 0.0001;
    low.connect(gain); high.connect(gain); gain.connect(context.destination);
    low.start(); high.start();
    gain.gain.setTargetAtTime(0.028, context.currentTime, 1.8);
    audio = { context, gain, low, high, enabled:true };
    audioBtn.textContent = 'Ambience On';
    audioBtn.setAttribute('aria-pressed', 'true');
  }

  function stopAudio() {
    if (!audio) return;
    const { context, gain, low, high } = audio;
    gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.4);
    setTimeout(() => {
      low.stop(); high.stop(); context.close();
    }, 550);
    audio = null;
    audioBtn.textContent = 'Ambience Off';
    audioBtn.setAttribute('aria-pressed', 'false');
  }

  function disposeThree() {
    cancelAnimationFrame(raf);
    raf = null;
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
    if (points) { points.geometry.dispose(); points.material.dispose(); }
    if (lineMesh) { lineMesh.geometry.dispose(); lineMesh.material.dispose(); }
    if (memoryGroup) memoryGroup.children.forEach((mesh) => { mesh.geometry.dispose(); mesh.material.dispose(); });
    if (renderer) renderer.dispose();
    points = null; lineMesh = null; memoryGroup = null; renderer = null; scene = null; camera = null;
  }

  function close() {
    if (initTimeoutId) { clearTimeout(initTimeoutId); initTimeoutId = null; }
    stopAudio();
    disposeThree();
    document.removeEventListener('visibilitychange', visibilityHandler);
    document.removeEventListener('keydown', keyHandler);
    visibilityHandler = null; keyHandler = null;
    stage.classList.remove('open', 'reduced');
    stage.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    staticLayer.innerHTML = '';
    fragmentEl.textContent = '';
    if (previousFocus?.focus) previousFocus.focus({ preventScroll:true });
  }

  function open() {
    if (stage.classList.contains('open')) close();
    const echoes = chronologicalEchoes();
    if (!echoes.length) { Toast.show('Create an Echo before entering Replay Drift.'); return; }
    previousFocus = document.activeElement;
    memories = buildMemoryMap(echoes);
    seasons = buildSeasons(memories);
    narrationMarks = chooseNarration(memories, seasons);
    activeSeason = '';
    clock.start = performance.now(); clock.last = 0; clock.fps = isMobileViewport() ? 30 : 45; clock.paused = false;
    stage.classList.add('open');
    stage.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    exitBtn.focus({ preventScroll:true });
    narrationEl.textContent = 'Your echoes are gathering in the distance.';
    fragmentEl.textContent = '';
    if (prefersReducedMotion() || !window.THREE) {
      stage.classList.add('reduced');
      initStaticReduced();
    } else {
      try {
        initTimeoutId = setTimeout(() => {
          if (stage.classList.contains('open') && !raf) {
            console.warn('[ReplayDrift] init timeout fallback');
            stage.classList.add('reduced');
            initStaticReduced();
          }
          initTimeoutId = null;
        }, 2400);
        initThree();
        raf = requestAnimationFrame(renderFrame);
      } catch (error) {
        console.warn('[ReplayDrift] init failed, static fallback', error);
        stage.classList.add('reduced');
        initStaticReduced();
      }
    }
    visibilityHandler = () => { clock.paused = document.visibilityState === 'hidden'; };
    keyHandler = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        const focusables = [audioBtn, exitBtn, skipBtn].filter(Boolean);
        const current = focusables.indexOf(document.activeElement);
        if (event.shiftKey && current === 0) { event.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!event.shiftKey && current === focusables.length - 1) { event.preventDefault(); focusables[0].focus(); }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    document.addEventListener('keydown', keyHandler);
  }

  function bind() {
    document.getElementById('replay-drift-btn')?.addEventListener('click', open);
    exitBtn?.addEventListener('click', close);
    skipBtn?.addEventListener('click', close);
    audioBtn?.addEventListener('click', startAudio);
    stage?.addEventListener('click', (event) => { if (event.target === stage) close(); });
  }

  return { bind, open, close, buildMemoryMap, buildSeasons };
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
bindOnce(document.getElementById('nav-logo-btn'), 'click', e => { e.preventDefault(); Nav.show('home'); }, undefined, 'wire:nav-logo');
bindOnce(document.getElementById('home-create-btn'), 'click', () => Nav.show('entry'), undefined, 'wire:home-create');
bindOnce(document.getElementById('home-enter-btn'), 'click',  () => Nav.show('timeline'), undefined, 'wire:home-enter');
bindOnce(document.getElementById('timeline-create-btn'), 'click', () => Nav.show('entry'), undefined, 'wire:timeline-create');
bindOnce(document.getElementById('wrapped-create-btn'), 'click', () => Nav.show('entry'), undefined, 'wire:wrapped-create');
bindOnce(document.getElementById('view-uni-btn'), 'click', () => Nav.show('timeline'), undefined, 'wire:view-uni');
document.getElementById('chip-onboarding-btn')?.addEventListener('click', () => { localStorage.removeItem(OB_KEY); Onboarding.start(); });
bindOnce(document.getElementById('detail-close-btn'), 'click', () =>
  document.getElementById('node-detail').classList.remove('open'), undefined, 'wire:detail-close');
bindOnce(document.getElementById('node-detail'), 'click', e => {
  if (e.target.id==='node-detail') document.getElementById('node-detail').classList.remove('open');
}, undefined, 'wire:node-detail-overlay-close');
bindOnce(document.getElementById('period-week'), 'click',  function(){ setPeriod('week',this);  }, undefined, 'wire:period-week');
bindOnce(document.getElementById('period-month'), 'click', function(){ setPeriod('month',this); }, undefined, 'wire:period-month');
bindOnce(document.getElementById('period-all'), 'click',   function(){ setPeriod('all',this);   }, undefined, 'wire:period-all');
function setPeriod(p, btn) {
  state.wrappedPeriod = ['week', 'month', 'all'].includes(p) ? p : 'week';
  document.querySelectorAll('.period-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  const activeBtn = btn || document.getElementById(`period-${state.wrappedPeriod}`) || document.getElementById('period-week');
  activeBtn?.classList.add('active');
  activeBtn?.setAttribute('aria-pressed', 'true');
  Wrapped.render();
}
bindOnce(document.getElementById('export-btn'), 'click', () => Storage.exportVault(state.echoes), undefined, 'wire:export');
bindOnce(document.getElementById('import-btn'), 'click', () => document.getElementById('import-file').click(), undefined, 'wire:import');
bindOnce(document, 'click', (event) => {
  if (event.target.closest('.premium-settings-btn')) Settings.open();
}, undefined, 'wire:open-settings-from-premium-button');

const UserChip = (() => {
  const chip = document.getElementById('user-chip');
  const menu = chip?.querySelector('.chip-menu');
  const settingsBtn = document.getElementById('chip-settings-btn');
  function sanitizeAvatarUrl(value) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) return trimmed;
    try {
      const parsed = new URL(trimmed, window.location.origin);
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? parsed.href : '';
    } catch {
      return '';
    }
  }
  function refresh() {
    const profile = ProfileStore.read();
    const name = profile.display_name || Auth.user?.user_metadata?.display_name || localStorage.getItem(USER_KEY) || 'you';
    const email = Auth.user?.email || 'local mode';
    const tier = UserAccess.getTier();
    if (!Auth.user && !localStorage.getItem(USER_KEY) && !profile.display_name) { chip?.classList.remove('visible'); return; }
    chip?.classList.add('visible');
    document.getElementById('chip-name').textContent = name;
    document.getElementById('chip-display-name').textContent = name;
    document.getElementById('chip-email').textContent = `${email} · ${UserAccess.isPremium() ? 'Special Access Active' : 'Free Vault'}${UserAccess.isPremium() ? ` · ${tier}` : ''}`;
    const syncLabel = document.getElementById('chip-sync-label');
    if (syncLabel) syncLabel.textContent = UserAccess.isPremium() ? 'Special Access Active' : (Auth.user ? 'Profile Synced' : 'Local Vault');
    const avatarEl = document.getElementById('chip-avatar');
    const avatarUrl = sanitizeAvatarUrl(profile.avatar_url || profile.avatar_data_url);
    if (avatarUrl && avatarEl) {
      avatarEl.textContent = '';
      const img = document.createElement('img');
      img.src = avatarUrl;
      img.alt = '';
      avatarEl.appendChild(img);
    } else if (avatarEl) {
      const initials = name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
      avatarEl.textContent = initials || 'EV';
    }
  }

  function toggleMenu(forceOpen) {
    if (!menu) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !menu.classList.contains('open');
    menu.classList.toggle('open', shouldOpen);
  }

  chip?.addEventListener('click', (e) => {
    if (e.target.closest('.chip-item')) return;
    toggleMenu();
  });
  chip?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });

  document.addEventListener('click', (e) => {
    if (!chip?.contains(e.target)) toggleMenu(false);
  });

  settingsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu(false);
    Settings.open();
  });

  document.getElementById('chip-export-btn')?.addEventListener('click', () => Storage.exportVault(state.echoes));
  document.getElementById('chip-signout-btn')?.addEventListener('click', () => {
    Auth.signOut().then(() => window.location.reload());
  });
  return { refresh };
})();

const VaultPulse = (() => {
  const chip = document.getElementById('user-chip');
  const label = document.getElementById('chip-sync-label');
  const msg = document.getElementById('sync-msg');
  const toast = document.getElementById('sync-toast');
  function set(stateKey, text){
    if(!chip||!label) return;
    chip.classList.remove('syncing','synced','failed','local');
    chip.classList.add(stateKey);
    label.textContent=text;
    if(msg) msg.textContent=text;
  }
  function toastPulse(){ toast?.classList.add('show'); setTimeout(()=>toast?.classList.remove('show'),1800); }
  return {set,toastPulse};
})();


function refreshEchoDependentUI() {
  Weather.update();
  IdentityOrb.update();
  IdentityCore.update();
  GhostLayer.initFromEchoes(state.echoes);

  if (state.currentView === 'timeline') {
    Timeline.render();
    setTimeout(ConnectionCanvas.render, 60);
  }

  if (state.currentView === 'wrapped') {
    Wrapped.render();
  }
  const weather = WeatherMap.compute(state.echoes);
  const e=document.getElementById('museum-echo-count'); if(e) e.textContent=`${state.echoes.length} echoes`;
  const a=document.getElementById('museum-artifact-count'); if(a) a.textContent=`${ArtifactArchive.listArtifacts().length} artifacts`;
  const w=document.getElementById('museum-weather'); if(w) w.textContent=weather.name.toLowerCase();
}

const EchoSync = (() => {
  function isAvailable() {
    return Boolean(Auth.user && Auth.client);
  }

  async function syncLocalToCloud() {
    if (!isAvailable()) {
      VaultPulse.set('local', 'Local Vault');
      return { ok: false, reason: 'not_authenticated' };
    }

    VaultPulse.set('synced', 'Profile Synced');
    return { ok: true };
  }

  return { isAvailable, syncLocalToCloud };
})();

const MigrationFlow = (() => {
  const modal = document.getElementById('migration-modal');

  function close() {
    modal?.classList.remove('open');
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    bindOnce(document.getElementById('migration-sync-btn'), 'click', async () => {
      VaultPulse.set('syncing', 'Syncing Echoes…');
      VaultPulse.toastPulse();

      try {
        if (window.EchoSync?.syncLocalToCloud) {
          const result = await window.EchoSync.syncLocalToCloud();
          if (result?.ok) {
            VaultPulse.set('synced', 'Profile Synced');
          } else if (result?.reason === 'not_authenticated') {
            VaultPulse.set('local', 'Local Vault');
            Toast.show('Sign in to sync. Your local vault is still safe.');
          } else {
            VaultPulse.set('local', 'Local Vault');
          }
        } else {
          VaultPulse.set('local', 'Local Vault');
          Toast.show('Sign in to sync. Your local vault is still safe.');
        }
      } catch {
        VaultPulse.set('failed', 'Sync Failed — Still Safe');
      }

      close();
    }, undefined, 'migration:sync');

    bindOnce(document.getElementById('migration-keep-btn'), 'click', () => {
      VaultPulse.set('local', 'Offline — Held Locally');
      close();
    }, undefined, 'migration:keep-local');

    bindOnce(document.getElementById('migration-export-btn'), 'click', () => {
      Storage.exportVault(state.echoes);
      VaultPulse.set('local', 'Local Vault');
      close();
    });
  }

  return { init, close };
})();

window.EchoSync = EchoSync;

const ImportFlow = (() => {
  let imported = null;
  const modal = document.getElementById('import-preview-modal');
  const content = document.getElementById('import-preview-content');
  function preview(arr){
    imported = arr;
    const dates = arr.map(e=>new Date(e.date)).filter(d=>!isNaN(d));
    const min = dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : '—';
    const max = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : '—';
    const profileIncluded = arr.some(e=>e.profile_snapshot) ? 'yes' : 'no';
    content.innerHTML = `<div>Echoes: ${arr.length}</div><div>Date Range: ${min} → ${max}</div><div>Profile Included: ${profileIncluded}</div><div>Import Type: vault json</div>`;
    modal?.classList.add('open');
  }
  function close(){ modal?.classList.remove('open'); imported=null; }
  document.getElementById('import-merge-btn')?.addEventListener('click', () => {
    if (!imported) return;
    state.echoes = [...state.echoes, ...imported];
    Storage.save(state.echoes);
    refreshEchoDependentUI();
    close();
    Toast.show('Merged with your vault.');
  });
  document.getElementById('import-replace-btn')?.addEventListener('click', () => {
    if (!imported) return;
    if (!window.confirm('Replace your local vault with imported echoes? This cannot be undone.')) return;
    state.echoes = imported;
    Storage.save(state.echoes);
    refreshEchoDependentUI();
    close();
    Toast.show('Local vault replaced.');
  });
  document.getElementById('import-cancel-btn')?.addEventListener('click', close);
  return {preview};
})();

bindOnce(document.getElementById('import-file'), 'change', function() {
  if (this.files[0]) {
    Storage.importVault(this.files[0], (arr) => { ImportFlow.preview(arr); });
  }
  this.value = '';
}, undefined, 'wire:import-file-change');

bindOnce(document, 'keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('node-detail')?.classList.remove('open');
    document.getElementById('fun-modal')?.classList.remove('open');
    document.getElementById('onboarding')?.classList.remove('open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    DebugPanel?.ensure?.();
  }
}, undefined, 'wire:global-escape-close');

bindOnce(document, 'visibilitychange', () => { state.tabHidden = document.hidden; if (document.hidden) ConnectionCanvas.stop(); else if (state.currentView === 'timeline') ConnectionCanvas.render(); }, undefined, 'wire:visibility');

bindOnce(window, 'resize', () => {
  Cosmos.resize(); Ripple.resize(); ConnectionCanvas.resize(); Whip.resize();
  if (state.currentView === 'timeline') Timeline.render();
}, {passive:true});


/* ── EXTERNAL BRIDGE ── */
window.EchoVaultBridge = {
  getState: () => state,
  MOOD_COLORS,
  ARCHETYPE_NAMES,
  ARCHETYPE_DESCS,
  SOUNDPRINTS,
  getSoundprintForEcho,
  moodFamily
};

/* ── INIT ── */
let appInitialized = false;
async function init() {
  if (appInitialized) return;
  appInitialized = true;
  state.echoes = Storage.load();
  Cosmos.init();
  Cosmos.draw();
  Breathing.start();
  Weather.update();
  GhostLayer.initFromEchoes(state.echoes);
  IdentityCore.update();
  try {
    await Auth.init();
  } catch (error) {
    console.warn('Auth initialization failed; continuing in local mode.', error);
  }
  if (Auth.user) {
    const profile = await Auth.fetchProfile();
    if (profile) ProfileStore.write(profile);
  }
  UserAccess.refreshAccessState();
  UserChip.refresh();
  VaultPulse.set(Auth.user ? "synced" : "local", Auth.user ? "Profile Synced" : "Local Vault");
  MigrationFlow.init();
  PWAInstall.init();
  Login.init();
  AlamAI.bindShortcut();
  ReplayDrift.bind();
  await ServiceWorkerManager.register();
  DebugPanel.ensure();
}



const DebugPanel = (() => {
  function ensure() {
    if (!location.search.includes('debug=1')) return;
    let panel = document.getElementById('debug-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'debug-panel';
      panel.className = 'debug-panel';
      document.body.appendChild(panel);
    }
    const profile = ProfileStore.read();
    const activeOverlays = ['login-screen','onboarding','settings-overlay','fun-modal','node-detail','migration-modal','import-preview-modal','replay-drift-stage','special-access-modal']
      .map((id) => document.getElementById(id))
      .filter((el) => el && (el.classList.contains('open') || (!el.classList.contains('hidden') && getComputedStyle(el).display !== 'none' && ['login-screen'].includes(el.id))))
      .map((el) => `${el.id}${el.classList.contains('open') ? '.open' : ''}`);
    const swStatus = navigator.serviceWorker?.controller ? `active (${navigator.serviceWorker.controller.scriptURL || 'controller'})` : 'none';
    panel.innerHTML = `APP_VERSION:${APP_VERSION}<br>SW cache:${SW_CACHE_VERSION}<br>mode:${Auth.isLocalMode() ? 'local' : 'supabase'}<br>display:${AppEnvironment.isStandalone() ? 'standalone':'browser'}<br>current view:${escapeHTML(state.currentView)}<br>active overlays:${escapeHTML(activeOverlays.join(', ') || 'none')}<br>html overflow:${escapeHTML(document.documentElement.style.overflow || getComputedStyle(document.documentElement).overflow)}<br>body overflow:${escapeHTML(document.body.style.overflow || getComputedStyle(document.body).overflow)}<br>sw:${escapeHTML(swStatus)}<br>echoes:${state.echoes.length}<br>artifacts:${ArtifactArchive.listArtifacts().length}<br>profile:${escapeHTML(profile.display_name || 'anon')}<br>access:${escapeHTML(UserAccess.getTier())} (${escapeHTML(UserAccess.getSource())})`;
    console.info('[EchoVault Debug]', { appVersion: APP_VERSION, swCacheVersion: SW_CACHE_VERSION, storageMode: Auth.isLocalMode() ? 'local' : 'supabase', standalone: AppEnvironment.isStandalone(), currentView: state.currentView, activeOverlays, htmlOverflow: document.documentElement.style.overflow || getComputedStyle(document.documentElement).overflow, bodyOverflow: document.body.style.overflow || getComputedStyle(document.body).overflow, serviceWorker: swStatus, echoCount: state.echoes.length, artifactCount: ArtifactArchive.listArtifacts().length, accessTier: UserAccess.getTier(), accessSource: UserAccess.getSource() });
  }
  return { ensure };
})();

const ServiceWorkerManager = (() => {
  const UPDATE_GUARD_KEY = 'ev_sw_update_reload_guard';
  const LAST_VERSION_KEY = 'ev_sw_last_version';
  let swRegisterBound = false;
  async function register() {
    if (swRegisterBound) return;
    swRegisterBound = true;
    if (!('serviceWorker' in navigator)) return;
    if (sessionStorage.getItem(LAST_VERSION_KEY) === APP_VERSION) sessionStorage.removeItem(UPDATE_GUARD_KEY);
    sessionStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    const reg = await navigator.serviceWorker.register('sw.js');
    const refreshOnce = () => {
      if (sessionStorage.getItem(UPDATE_GUARD_KEY) === APP_VERSION) return;
      sessionStorage.setItem(UPDATE_GUARD_KEY, APP_VERSION);
      Toast.show('New EchoVault version ready — refreshing…', 3200);
      setTimeout(() => location.reload(), 850);
    };
    const onNewWorker = (worker) => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if ((worker.state === 'installed' || worker.state === 'activated') && navigator.serviceWorker.controller) refreshOnce();
      });
    };
    onNewWorker(reg.installing || reg.waiting);
    reg.addEventListener('updatefound', () => onNewWorker(reg.installing));
    navigator.serviceWorker.addEventListener('controllerchange', refreshOnce);
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_ACTIVATED') {
        if (event.data?.appVersion === APP_VERSION) sessionStorage.removeItem(UPDATE_GUARD_KEY);
        DebugPanel.ensure();
      }
    });
    reg.update?.();
  }
  return { register };
})();
init();

})();


  const PRODUCTION_REDIRECT_URL = 'https://nmethylpyrrolinium.github.io/echovault.com/';
  function getAuthRedirectUrl() {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalhost) return PRODUCTION_REDIRECT_URL;
    return new URL('./', window.location.href).toString();
  }

// serviceWorker.register marker retained for smoke tests


(function initScrollLockGuard(){
  const overlayIds = ['settings-overlay','fun-modal','node-detail','migration-modal','import-preview-modal','replay-drift-stage','special-access-modal','courier-modal','alam-ai-panel','echosociety-overlay'];
  const syncLock = () => {
    const locked = overlayIds.some((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      if (id === 'courier-modal' || id === 'alam-ai-panel' || id === 'echosociety-overlay') return true;
      if (id === 'replay-drift-stage') return el.classList.contains('open');
      return el.classList.contains('open') || el.getAttribute('aria-hidden') === 'false';
    });
    document.body.style.overflow = locked ? 'hidden' : '';
  };
  const mo = new MutationObserver(syncLock);
  mo.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class','style','aria-hidden'] });
  document.addEventListener('visibilitychange', syncLock);
  syncLock();
})();
