/* ============================================================================
   Transcript → product schema.

   Facts are EXTRACTED and scored; prose is generated. Nothing free-form is ever
   allowed into a price, a material or a dimension — those fields either clear a
   confidence bar or the app asks a spoken follow-up question instead of
   guessing. That is the whole anti-hallucination design, and it is why the
   output is a validated schema rather than a paragraph.

   Which question to ask is not arbitrary. We rank the missing fields by how
   much each one moves the cost floor (a finite-difference sensitivity over the
   pricing function), and ask about the one that moves it most. Asking a woman
   with a loom three questions when one determines the answer is a design
   failure, not thoroughness.
   ========================================================================= */

import { costFloor } from './pricing.js';

/* ------------------------------------------------------------ number words */
const HI_NUM = {
  'शून्य':0,'एक':1,'दो':2,'तीन':3,'चार':4,'पाँच':5,'पांच':5,'छह':6,'छः':6,'सात':7,'आठ':8,'नौ':9,
  'दस':10,'ग्यारह':11,'बारह':12,'तेरह':13,'चौदह':14,'पंद्रह':15,'पन्द्रह':15,'सोलह':16,'सत्रह':17,
  'अठारह':18,'उन्नीस':19,'बीस':20,'पच्चीस':25,'तीस':30,'चालीस':40,'पचास':50,'साठ':60,
  'सत्तर':70,'अस्सी':80,'नब्बे':90,'सौ':100,'हज़ार':1000,'हजार':1000,'लाख':100000,
  'डेढ़':1.5,'ढाई':2.5,'आधा':0.5,
};
const EN_NUM = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,
  eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,
  eighty:80,ninety:90,hundred:100,thousand:1000,lakh:100000,half:0.5,
};
const DEV_DIGITS = '०१२३४५६७८९';
const normDigits = s => s.replace(/[०-९]/g, d => String(DEV_DIGITS.indexOf(d)));

/** Parse a run of tokens into one value: "आठ सौ" → 800, "साढ़े चार" → 4.5. */
function tokensToNumber(toks){
  let total = 0, current = 0, seen = false;
  for(const raw of toks){
    const w = raw.replace(/[^\wऀ-ॿ]/g,'');
    if(!w) continue;
    if(/^\d+(\.\d+)?$/.test(w)){ current = current ? current * parseFloat(w) : parseFloat(w); seen = true; continue; }
    const v = HI_NUM[w] ?? EN_NUM[w.toLowerCase()];
    if(v === undefined) return seen ? total + current : null;
    seen = true;
    if(v >= 100){ current = (current || 1) * v; if(v >= 1000){ total += current; current = 0; } }
    else current += v;
  }
  return seen ? total + current : null;
}

const tokenize = t => normDigits(String(t)).toLowerCase()
  .replace(/[,।!?]/g,' ').split(/\s+/).filter(Boolean);

/* Words that may sit between a unit and its number without breaking the
   association: "महीने में छह", "three are ready". Anything else does break it —
   that is what stops "बारह दिन लगे कच्चा माल" from binding 12 to material cost. */
const FILLER = new Set([
  'में','का','के','की','को','से','पर','है','हैं','था','थी','आया','आयी','लगा','लगे','लगी',
  'रुपये','रुपए','रूपये','रुपया','अभी','रखी','रखे','हूँ','हूं','लेती','लेता','बना','बनाती','कुल','करीब','लगभग',
  'a','an','the','in','of','is','are','was','were','it','for','about','around','roughly',
  'rupees','rs','right','now','and','i','can','make','have','ready','total','approximately',
]);
const isNumWord = w => /^\d+(\.\d+)?$/.test(w) || HI_NUM[w] !== undefined || EN_NUM[w.toLowerCase()] !== undefined;

/** Read a maximal run of number words starting at `j` and moving `dir`. */
function numberRun(toks, j, dir){
  if(!toks[j] || !isNumWord(toks[j])) return null;
  let a = j, b = j;
  if(dir === 1){ while(b + 1 < toks.length && isNumWord(toks[b+1])) b++; }
  else         { while(a - 1 >= 0        && isNumWord(toks[a-1])) a--; }
  return tokensToNumber(toks.slice(a, b + 1));   // always evaluated left-to-right
}

/**
 * Find the number attached to any of `keys`.
 *
 * Every key occurrence is considered, not just the first, and each candidate is
 * kept with its token distance. The caller supplies `accept` so an implausible
 * reading (a 12-rupee raw material) is skipped in favour of the next candidate
 * rather than terminating the search — which is precisely the failure the test
 * suite caught.
 */
function numberNear(toks, keys, { accept = () => true, win = 5 } = {}){
  const cands = [];
  for(let i = 0; i < toks.length; i++){
    if(!keys.some(k => toks[i].includes(k))) continue;
    for(let j = i + 1; j < Math.min(toks.length, i + 1 + win); j++){      // look right
      if(FILLER.has(toks[j])) continue;
      const v = numberRun(toks, j, 1);
      if(v !== null) cands.push({ v, d: j - i, dir:'after', at:i });
      break;                                    // first non-filler token decides
    }
    for(let j = i - 1; j >= Math.max(0, i - win); j--){                   // look left
      if(FILLER.has(toks[j])) continue;
      const v = numberRun(toks, j, -1);
      if(v !== null) cands.push({ v, d: i - j, dir:'before', at:i });
      break;
    }
  }
  return cands.filter(c => c.v !== null && c.v > 0 && accept(c.v))
              .sort((a, b) => a.d - b.d)[0] || null;
}

/* -------------------------------------------------------------- lexicons */
/* The failure words in this domain are domain words. A general ASR model has
   never heard "अजरख" or "कलमकारी" in training, so the recogniser is biased
   with this vocabulary and the matcher accepts near-misses on it. */
const LEX = {
  category: {
    saree:    ['साड़ी','साड़ी','सारी','saree','sari'],
    dupatta:  ['दुपट्टा','दुपट्टे','ओढ़नी','dupatta','odhni'],
    stole:    ['स्टोल','स्कार्फ','stole','scarf'],
    shawl:    ['शॉल','शाल','चादर','shawl'],
    cushion:  ['कुशन','गद्दी','तकिया','cushion','pillow'],
    toy:      ['खिलौना','खिलौने','गुड़िया','toy','doll'],
    painting: ['चित्र','पेंटिंग','चित्रकला','painting','artwork'],
    utensil:  ['बर्तन','थाली','लोटा','utensil','plate','vessel'],
    runner:   ['रनर','मेज़पोश','runner','tablecloth'],
    bag:      ['थैला','बैग','झोला','bag','tote'],
    kurta:    ['कुर्ता','कुरता','kurta'],
  },
  material: {
    silk:   ['सिल्क','रेशम','रेशमी','silk'],
    cotton: ['कॉटन','सूती','सूत','कपास','खादी','cotton','khadi'],
    wool:   ['ऊन','ऊनी','पश्मीना','wool','pashmina','woollen'],
    wood:   ['लकड़ी','काठ','wood','wooden'],
    brass:  ['पीतल','कांसा','brass','bronze'],
    paper:  ['कागज़','कागज','handmade paper','paper'],
  },
  technique: {
    handloom:     ['हाथ','हथकरघा','करघा','बुनी','बुनाई','handloom','handwoven','woven'],
    zari:         ['ज़री','जरी','ज़रदोज़ी','zari','brocade','zardozi'],
    ikat:         ['इकत','इकात','बंधा','ikat'],
    'block-print':['छपाई','ठप्पा','ब्लॉक','अजरख','बागरू','block','print','ajrakh','bagru'],
    lacquer:      ['लाख','लाह','खराद','lacquer','lathe'],
    'hand-paint': ['चित्रकारी','पेंट','मधुबनी','मिथिला','कलमकारी','paint','madhubani','kalamkari'],
    kani:         ['कानी','जामावार','kani','jamawar'],
    repousse:     ['नक्काशी','ठठेरा','repousse','engraved'],
    'natural-dye':['प्राकृतिक रंग','नील','हल्दी','मजीठ','natural','indigo','vegetable dye'],
  },
  colour: {
    indigo: ['नीला','नीली','नील','indigo','blue'],
    red:    ['लाल','सिंदूरी','red','maroon'],
    gold:   ['सुनहरा','सुनहरी','सोना','golden','gold'],
    green:  ['हरा','हरी','green'],
    black:  ['काला','काली','black'],
    white:  ['सफ़ेद','सफेद','white','ivory'],
    yellow: ['पीला','पीली','हल्दी','yellow','mustard'],
    pink:   ['गुलाबी','pink'],
  },
};

function matchLex(toks, group){
  const joined = toks.join(' ');
  for(const [key, words] of Object.entries(LEX[group])){
    for(const w of words){
      if(joined.includes(w)) return { v:key, conf:0.95, hit:w };
    }
  }
  /* near-miss pass: ASR commonly drops a matra on craft vocabulary */
  for(const [key, words] of Object.entries(LEX[group])){
    for(const w of words){
      if(w.length < 4) continue;
      const stem = w.slice(0, Math.max(3, w.length - 1));
      if(joined.includes(stem)) return { v:key, conf:0.72, hit:stem };
    }
  }
  return null;
}

/* ------------------------------------------------------------- extraction */
export const CRITICAL = ['matCost','days','capacity'];
export const CONF_BAR = 0.55;

/**
 * @returns {{fields:Object, confidence:Object, missing:string[], transcript:string}}
 *  fields.<k>       parsed value
 *  confidence.<k>   0..1 — below CONF_BAR the value is treated as absent
 */
export function extract(transcript, { craft } = {}){
  const toks = tokenize(transcript);
  const f = {}, conf = {};
  const put = (k, v, c) => { if(v !== null && v !== undefined){ f[k] = v; conf[k] = c; } };

  const cat  = matchLex(toks, 'category');
  const mat  = matchLex(toks, 'material');
  const tech = matchLex(toks, 'technique');
  const col  = matchLex(toks, 'colour');
  if(cat)  put('category',  cat.v,  cat.conf);
  if(mat)  put('material',  mat.v,  mat.conf);
  if(tech) put('technique', tech.v, tech.conf);
  if(col)  put('colour',    col.v,  col.conf);

  /* Craft profile fills only what was not heard, and always at low confidence
     so the UI marks it as an assumption rather than a statement. */
  if(craft){
    if(!f.category  && craft.category)  put('category',  craft.category,  0.42);
    if(!f.material  && craft.material)  put('material',  craft.material,  0.42);
    if(!f.technique && craft.technique) put('technique', craft.technique, 0.42);
  }

  /* Plausibility bounds are part of the extractor, not an afterthought: a
     value outside them is treated as a mis-binding and the next candidate is
     tried, rather than being written into a price. */
  const days = numberNear(toks, ['दिन','दिवस','day','days'],
    { accept:v => v > 0 && v <= 400 });
  if(days) put('days', days.v, 0.90);

  const cost = numberNear(toks, ['माल','लागत','कच्चा','रुपये','रुपए','रूपये','material','cost','raw'],
    { accept:v => v >= 20 && v <= 1e6 });
  if(cost) put('matCost', cost.v, 0.86);

  const cap = numberNear(toks, ['महीने','महीना','माह','month','monthly'],
    { accept:v => v > 0 && v <= 5000 });
  if(cap) put('capacity', cap.v, 0.88);

  const stock = numberNear(toks, ['तैयार','बचे','बचा','स्टॉक','stock','ready'],
    { accept:v => v > 0 && v <= 10000 });
  if(stock) put('stock', stock.v, 0.80);

  const size = numberNear(toks, ['मीटर','इंच','फुट','metre','meter','inch','cm','feet'],
    { accept:v => v > 0 && v < 1000 });
  if(size) put('sizeVal', size.v, 0.75);

  if(/जीआई|gi tag|जी आई/.test(toks.join(' '))) put('gi', true, 0.9);

  const missing = CRITICAL.filter(k => (conf[k] ?? 0) < CONF_BAR);
  return { fields:f, confidence:conf, missing, transcript:String(transcript).trim(), tokens:toks.length };
}

/* ------------------------------------------------- follow-up question order */
/* Sensitivity, not a fixed script. We perturb each missing field across a
   plausible range and measure the induced spread in the cost floor; the field
   with the widest spread is the one worth a question. On a 12-day saree,
   material cost moves the floor by a few hundred rupees and labour days move it
   by thousands — so we ask about days first, which is also the field nobody has
   ever asked her about. */
const PRIORS = {
  matCost:  [150, 2500],
  days:     [1, 25],
  capacity: [2, 200],
};
export function rankFollowUps(fields, missing, ctx){
  return missing.map(k => {
    const [lo, hi] = PRIORS[k] ?? [1, 10];
    const a = costFloor({ ...fields, [k]: lo }, ctx).floor;
    const b = costFloor({ ...fields, [k]: hi }, ctx).floor;
    const base = Math.max(1, costFloor(fields, ctx).floor);
    return { field:k, spread: Math.abs(b - a), relative: Math.abs(b - a) / base };
  }).sort((x, y) => y.spread - x.spread);
}

/** Parse a spoken answer to a specific follow-up. Narrow parse, narrow field. */
export function parseAnswer(field, text){
  const toks = tokenize(text);
  let n = tokensToNumber(toks);
  if(n === null){
    const key = { matCost:['रुपये','रुपए','cost'], days:['दिन','day'], capacity:['महीने','month'] }[field] || [];
    n = numberNear(toks, key)?.v ?? null;
  }
  if(n === null) return null;
  if(field === 'days'     && (n <= 0 || n > 400))  return null;
  if(field === 'matCost'  && n < 10)               return null;
  if(field === 'capacity' && (n <= 0 || n > 5000)) return null;
  return n;
}

/* ------------------------------------------------------------ copywriting */
/* Generated prose, clearly separated from extracted facts. The schema fields
   are what go into the structured marketplace record; this is the human-facing
   sentence, and it only ever restates values that were actually extracted. */
const NAMES = {
  category:{saree:{hi:'साड़ी',en:'Saree'},dupatta:{hi:'दुपट्टा',en:'Dupatta'},stole:{hi:'स्टोल',en:'Stole'},
    shawl:{hi:'शॉल',en:'Shawl'},cushion:{hi:'कुशन कवर',en:'Cushion cover'},toy:{hi:'खिलौना',en:'Wooden toy'},
    painting:{hi:'चित्रकला',en:'Painting'},utensil:{hi:'बर्तन',en:'Metalware'},runner:{hi:'टेबल रनर',en:'Table runner'},
    bag:{hi:'थैला',en:'Tote bag'},kurta:{hi:'कुर्ता',en:'Kurta'}},
  material:{silk:{hi:'सिल्क',en:'Silk'},cotton:{hi:'सूती',en:'Cotton'},wool:{hi:'ऊनी',en:'Wool'},
    wood:{hi:'लकड़ी',en:'Wood'},brass:{hi:'पीतल',en:'Brass'},paper:{hi:'हस्तनिर्मित कागज़',en:'Handmade paper'}},
  technique:{handloom:{hi:'हथकरघा',en:'Handloom'},zari:{hi:'ज़री',en:'Zari brocade'},ikat:{hi:'इकत',en:'Ikat'},
    'block-print':{hi:'हाथ की छपाई',en:'Hand block print'},lacquer:{hi:'लाख',en:'Lacquerware'},
    'hand-paint':{hi:'हाथ की चित्रकारी',en:'Hand-painted'},kani:{hi:'कानी',en:'Kani weave'},
    repousse:{hi:'नक्काशी',en:'Repoussé'},'natural-dye':{hi:'प्राकृतिक रंगाई',en:'Natural dye'}},
  colour:{indigo:{hi:'नीला',en:'Indigo'},red:{hi:'लाल',en:'Red'},gold:{hi:'सुनहरा',en:'Gold'},
    green:{hi:'हरा',en:'Green'},black:{hi:'काला',en:'Black'},white:{hi:'सफ़ेद',en:'Ivory'},
    yellow:{hi:'पीला',en:'Yellow'},pink:{hi:'गुलाबी',en:'Pink'}},
};
export const nameOf = (group, key, lang='hi') => NAMES[group]?.[key]?.[lang] ?? key ?? '—';

export function compose(f, lang, cluster){
  const g = (grp,k) => nameOf(grp, f[k ?? grp], lang);
  const place = cluster ? (cluster.name?.[lang] ?? cluster.name?.en) : '';
  if(lang === 'hi'){
    const title = [place, g('colour'), g('material'), g('category')].filter(Boolean).join(' ');
    const desc = [
      `${place} की ${g('technique')} से बनी ${g('category')}।`,
      f.days ? `इसे बनाने में ${f.days} दिन लगे।` : '',
      f.gi ? 'जीआई पंजीकृत शिल्प।' : '',
      'सीधे कारीगर से — बीच में कोई नहीं।',
    ].filter(Boolean).join(' ');
    return { title, desc };
  }
  const title = [place, g('colour'), g('material'), g('category')].filter(Boolean).join(' ');
  const desc = [
    `${g('technique')} ${g('category').toLowerCase()} made in ${place}.`,
    f.days ? `${f.days} days on the loom.` : '',
    f.gi ? 'GI-registered craft.' : '',
    'Straight from the maker — nobody in between.',
  ].filter(Boolean).join(' ');
  return { title, desc };
}

/* --------------------------------------------------------- demo transcripts */
/* The fallback for a dead mic or a judge holding the phone. Deliberately the
   way someone actually talks — run-on, code-switched, unit-less. */
export const SAMPLES = {
  full:{
    hi:'यह भागलपुर सिल्क की साड़ी है हाथ से बुनी हुई इसमें बारह दिन लगे कच्चा माल आठ सौ रुपये का आया नीली रंगाई है महीने में छह बना लेती हूँ अभी तीन तैयार रखी हैं',
    en:'this is a bhagalpur silk saree handwoven it took twelve days raw material cost eight hundred rupees indigo dyed I can make six in a month three are ready right now',
  },
  /* The realistic case: she says what matters to her and omits what the schema
     needs. This is the transcript that exercises the spoken follow-up. */
  partial:{
    hi:'यह भागलपुर सिल्क की साड़ी है नीली रंगाई हाथ से बुनी है बहुत मेहनत लगी है महीने में छह बना लेती हूँ',
    en:'this is a bhagalpur silk saree indigo dyed handwoven it took a lot of work I can make six in a month',
  },
};
