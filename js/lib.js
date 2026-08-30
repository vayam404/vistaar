/* Shared primitives: DOM, icons, formatting, speech adapter, overlays.
   The speech layer is written as an adapter on purpose — Bhashini is the
   production engine, Web Speech is what runs with zero signup. Swapping one
   for the other is a key in localStorage, not a code change. */

import { getLang } from './i18n.js';

/* ------------------------------------------------------------------- DOM */
export const $  = (s, r=document) => r.querySelector(s);
export const $$ = (s, r=document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const on = (root, sel, ev, fn) => root.addEventListener(ev, e => {
  const el = e.target.closest(sel); if(el && root.contains(el)) fn(e, el);
});
export const raf = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
/* Chrome logs a console error if vibrate() is called before the first user
   gesture, so gate on activation rather than swallowing the noise. */
export const haptic = (ms=12) => {
  if(!navigator.userActivation || navigator.userActivation.hasBeenActive){
    try{ navigator.vibrate?.(ms); }catch{}
  }
};

/* -------------------------------------------------------------- formatting */
export const fmt = {
  rupee:n => '₹' + Math.round(n).toLocaleString('en-IN'),
  rupee0:n => Math.round(n).toLocaleString('en-IN'),
  compact(n){
    if(n >= 1e7) return '₹' + (n/1e7).toFixed(n>=1e8?0:1) + ' Cr';
    if(n >= 1e5) return '₹' + (n/1e5).toFixed(n>=1e6?0:1) + ' L';
    if(n >= 1e3) return '₹' + (n/1e3).toFixed(0) + 'k';
    return '₹' + Math.round(n);
  },
  n:n => Math.round(n).toLocaleString('en-IN'),
  pct:n => (n>0?'+':'') + n.toFixed(0) + '%',
  ago(ts){
    const m = Math.floor((Date.now()-ts)/60000), hi = getLang()==='hi';
    if(m < 60)   return hi ? `${m} मिनट पहले` : `${m}m ago`;
    const h = Math.floor(m/60);
    if(h < 24)   return hi ? `${h} घंटे पहले` : `${h}h ago`;
    const d = Math.floor(h/24);
    return hi ? `${d} दिन पहले` : `${d}d ago`;
  },
  clock(){ const d = new Date(); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); }
};

/* ------------------------------------------------------------------ icons */
const I = {
  home:'M3 10.4 12 3l9 7.4M5.6 9v10.4A1.6 1.6 0 0 0 7.2 21h9.6a1.6 1.6 0 0 0 1.6-1.6V9',
  box:'M20.5 7.3 12 3 3.5 7.3m17 0v9.4L12 21l-8.5-4.3V7.3m17 0L12 11.6 3.5 7.3M12 11.6V21',
  receipt:'M5 3v18l2.4-1.6L9.8 21l2.2-1.6L14.2 21l2.4-1.6L19 21V3zM8.5 8h7M8.5 12h7M8.5 16h4',
  wallet:'M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M3 7.5h16a2 2 0 0 1 2 2v2.5h-4.5a2 2 0 0 0 0 4H21',
  mic:'M12 2.8a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0v-6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7',
  camera:'M4 8.5h2.8l1.3-2.2h7.8l1.3 2.2H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z',
  chevR:'M9 5l7 7-7 7', chevL:'M15 5l-7 7 7 7', chevD:'M6 9l6 6 6-6', chevU:'M6 15l6-6 6 6',
  check:'M4.5 12.5 9.5 17.5 19.5 6.5',
  x:'M6 6l12 12M18 6L6 18',
  alert:'M12 8.5v5m0 3.2v.1M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20.2h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  info:'M12 16v-5m0-3.2v-.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  spark:'M12 2.5l2.2 5.9 5.9 2.2-5.9 2.2L12 18.7l-2.2-5.9L3.9 10.6l5.9-2.2zM19 16l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z',
  phone:'M15.5 3.8a7 7 0 0 1 4.7 4.7M14.7 7a3.5 3.5 0 0 1 2.3 2.3M20.5 16.3v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.6-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 2.9 5a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14 14 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.9z',
  globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.6 9h16.8M3.6 15h16.8M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18',
  search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20.5 20.5 16 16',
  filter:'M3.5 5.5h17l-6.6 7.8v5.4l-3.8 2v-7.4z',
  plus:'M12 5v14M5 12h14',
  shield:'M12 21s7.5-3.4 7.5-9.4V5.9L12 3 4.5 5.9v5.7C4.5 17.6 12 21 12 21z',
  user:'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.2a7.6 7.6 0 0 1 15 0',
  users:'M9.5 12a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6zM2.6 19.8a7 7 0 0 1 13.8 0M16.5 4.8a3.8 3.8 0 0 1 0 7.2M18 19.8a7 7 0 0 0-2-4.6',
  bank:'M3 9.5 12 4l9 5.5M4.5 9.5V19M9.5 9.5V19M14.5 9.5V19M19.5 9.5V19M2.5 19.8h19',
  chart:'M3.5 3.5v15a2 2 0 0 0 2 2h15M7.5 15.5l3.5-4 3 2.5 4.5-6',
  up:'M4 16.5 10 10l3.5 3.5L20 6.5M20 6.5h-5m5 0v5',
  down:'M4 7.5 10 14l3.5-3.5L20 17M20 17h-5m5 0v-5',
  rupee:'M7 4.5h10M7 9h10M15.5 4.5c0 3-2.2 4.5-5 4.5H7l7.5 10',
  play:'M7.5 4.8v14.4L19.5 12z',
  volume:'M11 5 6.5 8.8H3v6.4h3.5L11 19zM15.2 9.2a4 4 0 0 1 0 5.6M18 6.4a8 8 0 0 1 0 11.2',
  lock:'M6.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5M5.5 10.5h13A1.5 1.5 0 0 1 20 12v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-7a1.5 1.5 0 0 1 1.5-1.5z',
  send:'M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8z',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.2l3.2 1.9',
  truck:'M2.5 6.5h11v10h-11zM13.5 10h4l3 3v3.5h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  tag:'M3.5 11.3V4.5a1 1 0 0 1 1-1h6.8a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7zM7.8 7.8h.01',
  award:'M12 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8.4 13.6 7 21.5l5-2.5 5 2.5-1.4-7.9',
  layers:'M12 2.8 2.8 7.4 12 12l9.2-4.6zM2.8 16.6 12 21.2l9.2-4.6M2.8 12 12 16.6l9.2-4.6',
  zap:'M13.5 2.5 4 14h7l-.5 7.5L20 10h-7z',
  refresh:'M20.5 5.5v5h-5M3.5 18.5v-5h5M4.2 10.4a8 8 0 0 1 13.2-3L20.5 10M3.5 14l3.1 2.6a8 8 0 0 0 13.2-3',
  logout:'M9.5 20.5h-4a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4M16 16.5l4.5-4.5L16 7.5M20.5 12h-11',
  settings:'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.1 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7.5 19a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1.4a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3 7.5a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 8.6 1.4V1.3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6',
  arrowR:'M4.5 12h15M13.5 6l6 6-6 6',
  arrowL:'M19.5 12h-15M10.5 18l-6-6 6-6',
  eye:'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  image:'M4.5 3.5h15a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM20.5 15.5 15 10 4 20.5',
  scale:'M12 3v18M7 7 3 15h8zM17 7l-4 8h8zM6 3.8 18 6',
  book:'M4 4.5A2 2 0 0 1 6 2.5h13v17H6a2 2 0 0 0-2 2z M19 15.5H6a2 2 0 0 0-2 2',
  flask:'M9.5 3v6.2L4.2 18a2 2 0 0 0 1.7 3h12.2a2 2 0 0 0 1.7-3l-5.3-8.8V3M8 3h8M6.6 14.5h10.8',
  cpu:'M6.5 6.5h11v11h-11zM9.5 9.5h5v5h-5zM9 2.5v4M15 2.5v4M9 17.5v4M15 17.5v4M2.5 9h4M2.5 15h4M17.5 9h4M17.5 15h4',
  route:'M6.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6.5 16V9a3.5 3.5 0 0 1 3.5-3.5h5M17.5 8v7a3.5 3.5 0 0 1-3.5 3.5H9',
  crop:'M6.5 2.5v15h15M2.5 6.5h15v15',
  target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
};
export const icon = (n, cls='') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[n]||I.info}"/></svg>`;

/* --------------------------------------------------------- speech adapter */
/* Two engines behind one interface.
   · Web Speech  — zero signup, ships in Chrome/Edge, what the demo runs on.
   · Bhashini    — MeitY ULCA. Production engine. Needs userID + ulcaApiKey,
                   which are issued to a registered organisation, so they are
                   pasted in Settings rather than baked into the bundle.
   Nothing else in the app knows which one is live. */

const BH_KEY = 'vs.bhashini';
export const bhashiniCreds = () => {
  try{ return JSON.parse(localStorage.getItem(BH_KEY) || 'null'); }catch{ return null; }
};
export const setBhashiniCreds = c => c
  ? localStorage.setItem(BH_KEY, JSON.stringify(c))
  : localStorage.removeItem(BH_KEY);

const ULCA_CONFIG  = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const PIPELINE_ID  = '64392f96daac500b55c543cd';           // MeitY / IITM public pipeline
const LANG_MAP = { hi:'hi', en:'en' };

/** Resolve an ULCA pipeline once, then reuse the callback + auth for every call. */
let bhPipeline = null;
async function bhResolve(task, src, tgt){
  const c = bhashiniCreds(); if(!c) throw new Error('no-creds');
  const key = task + src + (tgt||'');
  if(bhPipeline?.[key]) return bhPipeline[key];
  const body = { pipelineTasks:[{ taskType:task,
    config:{ language:{ sourceLanguage:src, ...(tgt?{targetLanguage:tgt}:{}) } } }],
    pipelineRequestConfig:{ pipelineId: PIPELINE_ID } };
  const r = await fetch(ULCA_CONFIG, { method:'POST',
    headers:{ 'Content-Type':'application/json', userID:c.userID, ulcaApiKey:c.apiKey },
    body: JSON.stringify(body) });
  if(!r.ok) throw new Error('ulca-config-' + r.status);
  const j = await r.json();
  const cfg = j.pipelineResponseConfig?.[0]?.config?.[0];
  const auth = j.pipelineInferenceAPIEndPoint;
  const out = { url: auth.callbackUrl, hdr: { [auth.inferenceApiKey.name]: auth.inferenceApiKey.value },
                serviceId: cfg.serviceId, voice: cfg.modelId };
  bhPipeline = { ...(bhPipeline||{}), [key]: out };
  return out;
}
async function bhCompute(p, tasks, input){
  const r = await fetch(p.url, { method:'POST',
    headers:{ 'Content-Type':'application/json', ...p.hdr },
    body: JSON.stringify({ pipelineTasks: tasks, inputData: input }) });
  if(!r.ok) throw new Error('ulca-compute-' + r.status);
  return r.json();
}

let synthVoices = [];
const loadVoices = () => { synthVoices = window.speechSynthesis?.getVoices?.() || []; };
loadVoices();
if(window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;

let recog = null, recogActive = false, audioCtx = null, analyser = null, micStream = null;

export const speech = {
  get engineName(){ return bhashiniCreds() ? 'Bhashini ULCA' : 'Web Speech API'; },
  get asrSupported(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  get ttsSupported(){ return !!window.speechSynthesis; },

  /** Speak text. Resolves when the utterance ends (or immediately if unsupported). */
  speak(text, { lang = getLang(), rate = 0.94, onend } = {}){
    return new Promise(res => {
      if(!window.speechSynthesis){ onend?.(); return res(); }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const code = lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.lang = code; u.rate = rate; u.pitch = 1;
      const v = synthVoices.find(v => v.lang === code)
            || synthVoices.find(v => v.lang?.startsWith(lang))
            || synthVoices.find(v => v.lang === 'en-IN');
      if(v) u.voice = v;
      const done = () => { onend?.(); res(); };
      u.onend = done; u.onerror = done;
      window.speechSynthesis.speak(u);
      setTimeout(done, Math.min(16000, 900 + text.length * 95)); // watchdog: some builds never fire onend
    });
  },
  cancelSpeak(){ try{ window.speechSynthesis?.cancel(); }catch{} },

  /** Continuous dictation with interim results + a live RMS level for the meter. */
  async listen({ lang = getLang(), onPartial, onFinal, onLevel, onEnd, onError } = {}){
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!R){ onError?.('unsupported'); return null; }
    this.stop();
    recog = new R();
    recog.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recog.continuous = true; recog.interimResults = true; recog.maxAlternatives = 1;
    let finalTx = '';
    recog.onresult = e => {
      let interim = '';
      for(let i = e.resultIndex; i < e.results.length; i++){
        const r = e.results[i];
        if(r.isFinal) finalTx += r[0].transcript + ' '; else interim += r[0].transcript;
      }
      onPartial?.(finalTx, interim);
    };
    recog.onerror = e => onError?.(e.error);
    recog.onend = () => { recogActive = false; stopMeter(); onFinal?.(finalTx.trim()); onEnd?.(); };
    try{ recog.start(); recogActive = true; }catch{ onError?.('start-failed'); }
    if(onLevel) startMeter(onLevel);
    return recog;
  },
  stop(){ if(recog && recogActive){ try{ recog.stop(); }catch{} } recogActive = false; stopMeter(); },
  get listening(){ return recogActive; },

  /* Production path — exercised only when credentials exist. */
  async bhashiniASR(blob, lang = 'hi'){
    const p = await bhResolve('asr', LANG_MAP[lang]);
    const b64 = await blobToB64(blob);
    const j = await bhCompute(p,
      [{ taskType:'asr', config:{ language:{ sourceLanguage:LANG_MAP[lang] },
        serviceId:p.serviceId, audioFormat:'wav', samplingRate:16000 } }],
      { audio:[{ audioContent:b64 }] });
    return j.pipelineResponse?.[0]?.output?.[0]?.source ?? '';
  },
  async bhashiniTTS(text, lang = 'hi'){
    const p = await bhResolve('tts', LANG_MAP[lang]);
    const j = await bhCompute(p,
      [{ taskType:'tts', config:{ language:{ sourceLanguage:LANG_MAP[lang] },
        serviceId:p.serviceId, gender:'female', samplingRate:22050 } }],
      { input:[{ source:text }] });
    return j.pipelineResponse?.[0]?.audio?.[0]?.audioContent ?? null;
  },
  async bhashiniTranslate(text, from='hi', to='en'){
    const p = await bhResolve('translation', LANG_MAP[from], LANG_MAP[to]);
    const j = await bhCompute(p,
      [{ taskType:'translation', config:{ language:{ sourceLanguage:LANG_MAP[from],
        targetLanguage:LANG_MAP[to] }, serviceId:p.serviceId } }],
      { input:[{ source:text }] });
    return j.pipelineResponse?.[0]?.output?.[0]?.target ?? '';
  },
};

const blobToB64 = b => new Promise(res => {
  const r = new FileReader();
  r.onloadend = () => res(String(r.result).split(',')[1]);
  r.readAsDataURL(b);
});

/* Real RMS off the mic so the waveform is the artisan's actual voice, not a loop. */
async function startMeter(cb){
  try{
    micStream = await navigator.mediaDevices.getUserMedia({ audio:true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.72;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if(!analyser) return;
      analyser.getByteFrequencyData(buf);
      const bands = 24, out = new Array(bands);
      const step = Math.floor(buf.length * 0.55 / bands);
      for(let i = 0; i < bands; i++){
        let s = 0; for(let j = 0; j < step; j++) s += buf[i*step + j];
        out[i] = (s / step) / 255;
      }
      cb(out);
      requestAnimationFrame(tick);
    };
    tick();
  }catch{ /* meter is decorative; dictation still runs without it */ }
}
function stopMeter(){
  analyser = null;
  try{ micStream?.getTracks().forEach(t => t.stop()); }catch{}
  try{ audioCtx?.close(); }catch{}
  micStream = null; audioCtx = null;
}

/* --------------------------------------------------------------- overlays */
let toastTimer = null;
export function toast(msg, kind='info'){
  const host = $('#screen'); if(!host) return;
  $('.toast')?.remove(); clearTimeout(toastTimer);
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(kind==='ok'?'check':kind==='bad'?'alert':'info')}<span>${esc(msg)}</span>`;
  host.appendChild(el);
  toastTimer = setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

export function sheet(title, html, { onMount, tall } = {}){
  const host = $('#screen'); if(!host) return;
  closeSheet();
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const s = document.createElement('div'); s.className = 'sheet';
  if(tall) s.style.maxHeight = '92%';
  s.innerHTML = `<div class="grab"></div>${title ? `<h3>${esc(title)}</h3>` : ''}<div class="sheet-body">${html}</div>`;
  host.append(scrim, s);
  scrim.onclick = closeSheet;
  onMount?.(s);
  return s;
}
export function closeSheet(){
  const s = $('.sheet'), sc = $('.scrim');
  if(s){ s.style.animation = 'slideDown .22s var(--ease) both'; setTimeout(()=>s.remove(), 210); }
  if(sc){ sc.style.animation = 'fadeOut .2s var(--ease) both'; setTimeout(()=>sc.remove(), 190); }
}

/* ------------------------------------------------------------- event log */
/* One append-only log. The x-ray rail renders it, and it is also the artisan's
   plain-language audit trail — same events, two vocabularies. */
export const EVENTS = [];
const evSubs = new Set();
export function logEvent(scope, msg, detail){
  EVENTS.unshift({ ts:Date.now(), scope, msg, detail });
  if(EVENTS.length > 200) EVENTS.length = 200;
  evSubs.forEach(f => f());
}
export const onEvents = fn => { evSubs.add(fn); return () => evSubs.delete(fn); };

/* --------------------------------------------------------- json pretty-print */
export function jsonHTML(obj, indent=0){
  const pad = ' '.repeat(indent);
  if(obj === null) return '<span class="n">null</span>';
  if(typeof obj === 'string')  return `<span class="s">"${esc(obj)}"</span>`;
  if(typeof obj === 'number' || typeof obj === 'boolean') return `<span class="n">${obj}</span>`;
  if(Array.isArray(obj)){
    if(!obj.length) return '[]';
    return `[\n${obj.map(v => pad + '  ' + jsonHTML(v, indent+2)).join(',\n')}\n${pad}]`;
  }
  const ks = Object.keys(obj);
  if(!ks.length) return '{}';
  return `{\n${ks.map(k => `${pad}  <span class="k">"${esc(k)}"</span>: ${jsonHTML(obj[k], indent+2)}`).join(',\n')}\n${pad}}`;
}
