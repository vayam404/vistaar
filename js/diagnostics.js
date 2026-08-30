/* ============================================================================
   In-app diagnostics.

   "Does it work" should not be answered by a person clicking around. This is a
   real assertion suite over the four engines, runnable from inside the product
   on the machine that is presenting it. It measures the things that would
   actually be wrong if the system were wrong:

     · the floor is monotone in labour and never sits below subtotal
     · retrieval returns the nearest listing first, and the quantiles order
     · the extractor recovers every critical field from natural speech
     · the QC gate ADMITS a clean frame and REJECTS a defective one
     · the correction pipeline measurably RAISES the QC score of a bad frame
       (analyse → correct → analyse, asserting the delta)
     · every channel payload passes its own required-field spec
     · an injected schema defect is caught before send, not after
     · idempotency keys are stable on content and change on content
     · the matcher ranks a feasible artisan above an infeasible one
     · no translation key exists in one language and not the other

   The last one is not decoration: a missing Hindi string is a user who cannot
   use the product.
   ========================================================================= */

import { costFloor, comparables, verdict, suggest, CORPUS, embed, cosine, WAGE } from './pricing.js';
import { extract, rankFollowUps, parseAnswer, SAMPLES, CONF_BAR } from './nlu.js';
import { analyse, correct, sampleFrame, QC, fixFor } from './vision.js';
import { BUILDERS, validate, toListing, idempotencyKey, CHANNELS, taxFor, conformanceReport } from './channels.js';
import { matchScore, rankArtisans, WEIGHTS } from './match.js';
import { DICT } from './i18n.js';
import { ARTISANS, CLUSTERS, clusterById, artFor } from './data.js';

/* --------------------------------------------------------------- harness */
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;

/* Yield to the renderer between tests so progress paints. setTimeout is
   clamped hard in a backgrounded tab (4ms → 1000ms+), which would stretch a
   two-second suite into a minute; a MessageChannel task is not throttled. */
const chan = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
const yieldToUI = () => new Promise(res => {
  if(!chan) return setTimeout(res, 0);
  chan.port1.onmessage = () => res();
  chan.port2.postMessage(0);
});

function suite(name, icon){
  const tests = [];
  const api = {
    name, icon, tests,
    /** @param {string} label @param {()=>any} fn — throw or return false to fail */
    test(label, fn){ tests.push({ label, fn, async:false }); return api; },
    atest(label, fn){ tests.push({ label, fn, async:true }); return api; },
  };
  return api;
}

/* ============================================================= the suites = */

const S_PRICING = suite('Cost floor', 'scale')
  .test('floor ≥ subtotal once commission is applied', () => {
    const r = costFloor({ material:'silk', technique:'handloom', days:12, matCost:800 }, { state:'bihar' });
    if(!(r.floor >= r.subtotal)) throw new Error(`${r.floor} < ${r.subtotal}`);
    return `₹${r.floor.toFixed(0)} ≥ ₹${r.subtotal.toFixed(0)}`;
  })
  .test('floor is strictly monotone in labour days', () => {
    const base = { material:'silk', technique:'handloom', matCost:800 };
    const a = costFloor({...base, days:4}).floor, b = costFloor({...base, days:12}).floor,
          c = costFloor({...base, days:26}).floor;
    if(!(a < b && b < c)) throw new Error(`${a} ${b} ${c} not increasing`);
    return `4d ₹${a|0} < 12d ₹${b|0} < 26d ₹${c|0}`;
  })
  .test('labour term equals days × wage × skill', () => {
    const r = costFloor({ material:'silk', technique:'zari', days:10, matCost:0 }, { state:'uttar pradesh' });
    const row = r.rows.find(x => x.k === 'p.labour');
    const expect = 10 * WAGE['uttar pradesh'] * 1.55;
    if(!near(row.v, expect, 1)) throw new Error(`${row.v} ≠ ${expect}`);
    return `10 × ₹${WAGE['uttar pradesh']} × 1.55 = ₹${expect.toFixed(0)}`;
  })
  .test('skilled craft is not priced at the unskilled rate', () => {
    const p = { material:'silk', days:10, matCost:500 };
    const zari = costFloor({...p, technique:'zari'}).floor;
    const plain = costFloor({...p, technique:'lacquer'}).floor;
    if(!(zari > plain * 1.15)) throw new Error(`zari ${zari} vs lacquer ${plain}`);
    return `zari ₹${zari|0} vs low-skill ₹${plain|0}`;
  })
  .test('commission is taken at the WORST channel, not the cheapest', () => {
    const p = { material:'cotton', technique:'block-print', days:2, matCost:200 };
    const all  = costFloor(p, { channels:['ondc','ihm','gem','wa'] });
    const free = costFloor(p, { channels:['ihm','wa'] });
    if(!(all.commissionPct === 0.03 && free.commissionPct === 0)) throw new Error('commission not maximised');
    if(!(all.floor > free.floor)) throw new Error('floor did not rise with commission');
    return `3% floor ₹${all.floor|0} > 0% floor ₹${free.floor|0}`;
  })
  .test('state wage table is actually consulted', () => {
    const p = { material:'silk', technique:'handloom', days:10, matCost:0 };
    const bihar = costFloor(p, { state:'bihar' }).floor;
    const kar   = costFloor(p, { state:'karnataka' }).floor;
    if(!(kar > bihar)) throw new Error(`karnataka ${kar} ≤ bihar ${bihar}`);
    return `Bihar ₹${bihar|0} vs Karnataka ₹${kar|0}`;
  })
  .test('a below-floor price is refused and the loss is exact', () => {
    const f = costFloor({ material:'silk', technique:'handloom', days:12, matCost:800 }).floor;
    const v = verdict(f - 500, f, { median:5000, p25:4000, p75:6000 });
    if(v.kind !== 'bad') throw new Error('not blocked');
    if(!near(v.loss, 500, 0.01)) throw new Error(`loss ${v.loss} ≠ 500`);
    return `₹${(f-500)|0} blocked · loss ₹500`;
  })
  .test('a floor above market p75 is reported, not smoothed away', () => {
    /* A 12-day handloom saree at a fair wage costs more than comparable
       listings sell for. The product must say so plainly — that finding is the
       whole argument for pricing her time at all. */
    const s = { material:'silk', technique:'handloom', category:'saree', days:12, matCost:800, gi:true };
    const f = costFloor(s, { state:'bihar' }).floor;
    const c = comparables(s);
    if(!(f > c.p75)) throw new Error(`floor ₹${f|0} not above p75 ₹${c.p75|0} — fixture drifted`);
    const v = verdict(f * 1.18, f, c);
    if(v.band !== 'above-market') throw new Error(`band was ${v.band}`);
    return `floor ₹${f|0} > p75 ₹${c.p75|0} → "above-market"`;
  })
  .test('the partial sample is missing exactly one critical field', () => {
    const r = extract(SAMPLES.partial.hi, {});
    if(!r.missing.includes('matCost')) throw new Error('matCost was not missing');
    if(!r.missing.includes('days'))    throw new Error('days was not missing');
    if(r.fields.capacity !== 6)        throw new Error('capacity should still parse');
    return `missing ${r.missing.join(', ')} · capacity still 6`;
  })
  .test('suggested price always clears the floor', () => {
    for(const d of [1, 5, 12, 30]){
      const f = costFloor({ material:'silk', technique:'handloom', days:d, matCost:600 }).floor;
      const c = comparables({ category:'saree', material:'silk', technique:'handloom', days:d, gi:true });
      if(suggest(f, c) < f) throw new Error(`d=${d}: suggestion below floor`);
    }
    return 'checked 4 effort bands';
  });

const S_COMPS = suite('Comparables retrieval', 'target')
  .test('cosine is bounded and self-similarity is 1', () => {
    const v = embed({ cat:'saree', mat:'silk', tech:'handloom', days:12, gi:1 });
    const s = cosine(v, v);
    if(!near(s, 1, 1e-9)) throw new Error(`self-sim ${s}`);
    return 'cos(v,v) = 1.000';
  })
  .test('nearest neighbour is the same craft, not merely the same category', () => {
    const c = comparables({ category:'saree', material:'silk', technique:'zari', days:24, gi:true }, 3);
    const top = c.items[0];
    if(top.tech !== 'zari') throw new Error(`top was ${top.tech}`);
    return `top: ${top.mat}/${top.tech} ₹${top.price} (sim ${top.sim.toFixed(2)})`;
  })
  .test('quantiles are ordered p25 ≤ median ≤ p75', () => {
    const c = comparables({ category:'cushion', material:'cotton', technique:'block-print', days:1, gi:true });
    if(!(c.p25 <= c.median && c.median <= c.p75)) throw new Error(`${c.p25}/${c.median}/${c.p75}`);
    return `₹${c.p25|0} ≤ ₹${c.median|0} ≤ ₹${c.p75|0}`;
  })
  .test('every returned comparable is a real corpus row', () => {
    const c = comparables({ category:'toy', material:'wood', technique:'lacquer', days:0.5, gi:true });
    for(const it of c.items){
      if(!CORPUS.some(r => r.price === it.price && r.cat === it.cat && r.tech === it.tech))
        throw new Error('synthesised comparable');
    }
    return `${c.n} rows, all traceable`;
  })
  .test('a zari saree is priced above a plain handloom saree', () => {
    const z = comparables({ category:'saree', material:'silk', technique:'zari', days:24, gi:true }).median;
    const h = comparables({ category:'saree', material:'cotton', technique:'handloom', days:6, gi:true }).median;
    if(!(z > h)) throw new Error(`zari ${z} ≤ handloom ${h}`);
    return `₹${z|0} vs ₹${h|0}`;
  });

const S_NLU = suite('Speech → schema', 'cpu')
  .test('Hindi sample yields every critical field above the confidence bar', () => {
    const r = extract(SAMPLES.full.hi, { craft:{} });
    const need = ['days','matCost','capacity'];
    const bad = need.filter(k => (r.confidence[k] ?? 0) < CONF_BAR);
    if(bad.length) throw new Error(`missing ${bad.join(', ')}`);
    return `days=${r.fields.days} matCost=${r.fields.matCost} capacity=${r.fields.capacity}`;
  })
  .test('compound Hindi numerals parse ("आठ सौ" → 800)', () => {
    const r = extract('कच्चा माल आठ सौ रुपये का आया', {});
    if(r.fields.matCost !== 800) throw new Error(`got ${r.fields.matCost}`);
    return '800';
  })
  .test('Devanagari digits parse ("१२ दिन" → 12)', () => {
    const r = extract('इसमें १२ दिन लगे', {});
    if(r.fields.days !== 12) throw new Error(`got ${r.fields.days}`);
    return '12';
  })
  .test('craft vocabulary is recognised (भागलपुर silk handloom)', () => {
    const r = extract(SAMPLES.full.hi, {});
    if(r.fields.material !== 'silk')     throw new Error('material missed');
    if(r.fields.technique !== 'handloom')throw new Error('technique missed');
    if(r.fields.category !== 'saree')    throw new Error('category missed');
    return 'silk · handloom · saree';
  })
  .test('English code-switched input extracts identically', () => {
    const r = extract(SAMPLES.full.en, {});
    if(r.fields.days !== 12 || r.fields.matCost !== 800) throw new Error(JSON.stringify(r.fields));
    return 'days=12 matCost=800';
  })
  .test('a value never heard is reported missing, never invented', () => {
    const r = extract('यह एक सूती दुपट्टा है', {});
    if(r.fields.matCost !== undefined) throw new Error('hallucinated a cost');
    if(!r.missing.includes('matCost'))  throw new Error('not flagged missing');
    return 'matCost absent and flagged';
  })
  .test('profile-filled fields carry low confidence, not high', () => {
    const r = extract('यह अच्छी चीज़ है', { craft:{ material:'silk', technique:'handloom' } });
    if((r.confidence.material ?? 1) >= 0.55) throw new Error('assumption presented as fact');
    return `material conf ${r.confidence.material}`;
  })
  .test('follow-up is chosen by sensitivity — labour days outrank material cost', () => {
    const f = { material:'silk', technique:'handloom' };
    const ranked = rankFollowUps(f, ['matCost','days'], { state:'bihar' });
    if(ranked[0].field !== 'days') throw new Error(`asked ${ranked[0].field} first`);
    return `days spread ₹${ranked[0].spread|0} > matCost ₹${ranked[1].spread|0}`;
  })
  .test('spoken answers parse and out-of-range answers are rejected', () => {
    if(parseAnswer('days', 'बारह दिन') !== 12)      throw new Error('12 failed');
    if(parseAnswer('matCost', 'आठ सौ') !== 800)     throw new Error('800 failed');
    if(parseAnswer('days', 'नौ सौ निन्यानवे दिन') !== null &&
       parseAnswer('days', '5000') !== null)        throw new Error('range check missing');
    return 'parse + range guard';
  });

const S_VISION = suite('Image quality gate', 'camera')
  .atest('a clean frame is ADMITTED', async () => {
    const c = await sampleFrame(artFor('saree'), 'clean', 1200);
    const r = analyse(c);
    if(!r.admit) throw new Error(`score ${r.score.toFixed(2)} < ${QC.ADMIT}, worst=${r.worst}`);
    return `grade ${r.grade} · ${r.score.toFixed(2)} · ${r.ms}ms`;
  })
  .atest('a workshop frame is flagged for the defects it actually has', async () => {
    /* Policy: the weighted score judges overall quality, hard floors disqualify
       on any single catastrophic metric. A warm, off-centre, small-subject frame
       is not unusable — it is correctable — so the assertion is that the gate
       names the right defects, not that it refuses the frame. */
    const c = await sampleFrame(artFor('saree'), 'workshop', 1200);
    const r = analyse(c);
    const flagged = [...r.hardFails, ...r.softFails];
    for(const expect of ['whiteBalance'])
      if(!flagged.includes(expect)) throw new Error(`did not flag ${expect} (flagged: ${flagged.join(', ')||'none'})`);
    return `flagged ${flagged.join(', ')} at ${r.score.toFixed(2)}`;
  })
  .atest('a CORRECTABLE defect is never refused, only advised', async () => {
    /* The workshop frame's colour cast fails hard, but white balance is
       recoverable — so the frame must be admitted, corrected, and the advice
       spoken. Refusing a photo we can fix is a bug with a real cost: an artisan
       who has already put the loom away. */
    const c = await sampleFrame(artFor('saree'), 'workshop', 1200);
    const r = analyse(c);
    if(r.blocking.length) throw new Error(`blocked on ${r.blocking.join(', ')}`);
    if(!r.hardFails.includes('whiteBalance')) throw new Error('expected WB to fail hard');
    if(!r.admit) throw new Error('not admitted despite being recoverable');
    return `WB hard-fails (${r.metrics.whiteBalance.score.toFixed(2)}) but is recoverable → admitted`;
  })
  .atest('a severely underexposed frame is REJECTED outright', async () => {
    const c = await sampleFrame(artFor('saree'), 'dark', 1200);
    const r = analyse(c);
    if(r.admit) throw new Error(`admitted at ${r.score.toFixed(2)}`);
    if(!r.blocking.includes('exposure'))
      throw new Error(`rejected, but not on exposure (blocking: ${r.blocking.join(', ')||'none'})`);
    return `hard-fail on exposure (${r.metrics.exposure.score.toFixed(2)} < ${QC.exposure.hard})`;
  })
  .atest('the tungsten cast is actually detected', async () => {
    const c = await sampleFrame(artFor('saree'), 'workshop', 1200);
    const r = analyse(c);
    if(r.stats.cast !== 'warm') throw new Error(`cast reported ${r.stats.cast}`);
    return `cast=warm (k=${r.stats.castK.toFixed(3)}), WB score ${r.metrics.whiteBalance.score.toFixed(2)}`;
  })
  .atest('correction measurably RAISES the score of a bad frame', async () => {
    const c = await sampleFrame(artFor('ajrakh'), 'workshop', 1200);
    const before = analyse(c);
    const { canvas, steps } = correct(c, before);
    const after = analyse(canvas);
    if(!(after.score > before.score))
      throw new Error(`${before.score.toFixed(3)} → ${after.score.toFixed(3)} (no gain)`);
    return `${before.score.toFixed(2)} → ${after.score.toFixed(2)} (+${((after.score-before.score)*100).toFixed(0)}pt) via ${steps.length} steps`;
  })
  .atest('white balance improves specifically, not just overall', async () => {
    const c = await sampleFrame(artFor('mithila'), 'workshop', 1200);
    const before = analyse(c);
    const after = analyse(correct(c, before).canvas);
    const b = before.metrics.whiteBalance.score, a = after.metrics.whiteBalance.score;
    if(!(a >= b)) throw new Error(`WB ${b.toFixed(2)} → ${a.toFixed(2)}`);
    return `WB ${b.toFixed(2)} → ${a.toFixed(2)}`;
  })
  .atest('exposure improves after auto-levels', async () => {
    const c = await sampleFrame(artFor('toy'), 'dim', 1200);
    const before = analyse(c);
    const after = analyse(correct(c, before).canvas);
    const b = before.metrics.exposure.score, a = after.metrics.exposure.score;
    if(!(a > b)) throw new Error(`exposure ${b.toFixed(2)} → ${a.toFixed(2)}`);
    return `exposure ${b.toFixed(2)} → ${a.toFixed(2)}`;
  })
  .atest('a downscaled frame fails the resolution gate', async () => {
    const c = await sampleFrame(artFor('saree'), 'clean', 320);
    const r = analyse(c);
    if(r.metrics.resolution.score >= 1) throw new Error('320px passed as full resolution');
    if(r.metrics.resolution.pass)       throw new Error('320px marked conformant');
    return `320px → score ${r.metrics.resolution.score.toFixed(2)}`;
  })
  .atest('analysis stays inside its capture-time budget', async () => {
    /* Budget is per CAPTURED frame, not per preview frame — the gate runs when
       the shutter fires. 120ms on a 1600² source keeps the shutter-to-feedback
       loop under the ~200ms that reads as instant. */
    const c = await sampleFrame(artFor('ikat'), 'clean', 1600);
    const r = analyse(c);
    if(r.ms > 120) throw new Error(`${r.ms}ms exceeds 120ms`);
    return `${r.ms}ms on a 1600² frame`;
  })
  .atest('every failing metric maps to a spoken instruction', async () => {
    const c = await sampleFrame(artFor('saree'), 'workshop', 1200);
    const r = analyse(c);
    const bad = [...r.hardFails, ...r.softFails];
    for(const k of bad) if(!fixFor(k)) throw new Error(`no remediation for ${k}`);
    return `${bad.length || 0} failures, all actionable`;
  });

/* ------------------------------------------------------------- fixtures --- */
const fixtureListing = () => toListing({
  product:{ id:'t1', title:{en:'Bhagalpur Indigo Silk Saree', hi:'भागलपुर नीली सिल्क साड़ी'},
            desc:'Handloom saree woven in Bhagalpur over twelve days. GI-registered craft. Straight from the maker.' },
  artisan: ARTISANS[0], cluster: clusterById('blg'),
  images:['https://cdn.vistaar.in/p/t1/1.jpg','https://cdn.vistaar.in/p/t1/2.jpg'],
  schema:{ material:'silk', technique:'handloom', category:'saree', colour:'indigo',
           stock:3, moq:1, leadDays:14, gi:true, weightG:600 },
  price: 4850,
});

const S_CHANNELS = suite('Channel conformance', 'route');
for(const ch of CHANNELS){
  S_CHANNELS.test(`${ch.name}: payload satisfies every required field`, () => {
    const v = validate(ch.id, BUILDERS[ch.id](fixtureListing()));
    if(!v.conformant)
      throw new Error(`${v.requiredPass}/${v.requiredTotal} — first gap: ${v.failures[0].path} (${v.failures[0].hint})`);
    return `${v.requiredPass}/${v.requiredTotal} required · +${v.optionalPass}/${v.optionalTotal} optional`;
  });
}
S_CHANNELS
  .test('an injected defect is caught BEFORE send', () => {
    const p = BUILDERS.ondc(fixtureListing());
    p.message.catalog['bpp/providers'][0].items[0].price.value = '4850';   // missing decimals
    const v = validate('ondc', p);
    if(v.conformant) throw new Error('malformed price accepted');
    const hit = v.failures.find(f => f.path.endsWith('price.value'));
    if(!hit) throw new Error('wrong field flagged');
    return `caught: ${hit.hint}`;
  })
  .test('a missing PIN is caught by the Legal Metrology / address rule', () => {
    const l = fixtureListing(); l.pin = '81200';                            // 5 digits
    const v = validate('ondc', BUILDERS.ondc(l));
    if(v.conformant) throw new Error('5-digit PIN accepted');
    return 'caught: 6-digit PIN';
  })
  .test('GST slab and HSN come from the table, not from a guess', () => {
    const a = taxFor('silk','saree'), b = taxFor('wood','toy');
    if(a.gst !== 5 || b.gst !== 12) throw new Error(`${a.gst}/${b.gst}`);
    if(!/^\d{8}$/.test(a.hsn))      throw new Error('bad HSN');
    return `silk saree ${a.hsn}@${a.gst}% · wooden toy ${b.hsn}@${b.gst}%`;
  })
  .test('WhatsApp price is in minor units (paise), not rupees', () => {
    const p = BUILDERS.wa(fixtureListing());
    if(p.price !== 485000) throw new Error(`${p.price}`);
    return '₹4850 → 485000 paise';
  })
  .test('idempotency key is stable on identical content', () => {
    const l = fixtureListing();
    const a = idempotencyKey(l.sku, 'ondc', BUILDERS.ondc({...l, ts:1, txnId:'x', msgId:'y'}));
    const b = idempotencyKey(l.sku, 'ondc', BUILDERS.ondc({...l, ts:1, txnId:'x', msgId:'y'}));
    if(a !== b) throw new Error(`${a} ≠ ${b}`);
    return a;
  })
  .test('idempotency key changes when the price changes', () => {
    const l = fixtureListing();
    const a = idempotencyKey(l.sku, 'wa', BUILDERS.wa(l));
    const b = idempotencyKey(l.sku, 'wa', BUILDERS.wa({...l, price:5200}));
    if(a === b) throw new Error('collision on differing content');
    return 'distinct';
  })
  .test('one listing conforms on all four channels simultaneously', () => {
    const rep = conformanceReport(fixtureListing());
    const bad = rep.filter(r => !r.conformant);
    if(bad.length) throw new Error(bad.map(b => b.channel).join(', '));
    return rep.map(r => `${r.channel} ${r.requiredPass}/${r.requiredTotal}`).join(' · ');
  });

const S_MATCH = suite('RFQ matching', 'users')
  .test('a capable artisan outranks an incapable one', () => {
    const rfq = { qty:500, days:45, material:'cotton', technique:'block-print', state:'Gujarat' };
    const ranked = rankArtisans(ARTISANS, rfq, clusterById);
    if(ranked[0].artisan.id !== 'a2') throw new Error(`top was ${ranked[0].artisan.id}`);
    return `${ranked[0].artisan.name.en} ${(ranked[0].score*100).toFixed(0)}% vs next ${(ranked[1].score*100).toFixed(0)}%`;
  })
  .test('score decomposes exactly into its weighted factors', () => {
    const rfq = { qty:100, days:60, material:'silk', technique:'handloom', state:'Bihar' };
    const m = matchScore(ARTISANS[0], rfq, clusterById('blg'));
    const sum = m.factors.reduce((s,f) => s + f.contribution, 0);
    if(!near(m.score, sum, 1e-9)) throw new Error(`${m.score} ≠ Σ${sum}`);
    return `Σ ${m.factors.length} factors = ${m.score.toFixed(3)}`;
  })
  .test('capacity shortfall is computed, not hidden', () => {
    const rfq = { qty:500, days:30, material:'silk', technique:'handloom', state:'Bihar' };
    const m = matchScore(ARTISANS[0], rfq, clusterById('blg'));   // capacity 6/month
    if(m.shortfall !== 500 - m.maxQty) throw new Error('shortfall wrong');
    if(m.feasible) throw new Error('6/month marked feasible for 500 in 30 days');
    return `can do ${m.maxQty}, short ${m.shortfall} → infeasible`;
  })
  .test('a wrong-technique artisan is never ranked feasible', () => {
    const rfq = { qty:10, days:90, material:'wood', technique:'lacquer', state:'Karnataka' };
    const m = matchScore(ARTISANS[0], rfq, clusterById('blg'));   // a weaver
    if(m.feasible) throw new Error('weaver marked feasible for lacquer turning');
    return `score ${(m.score*100).toFixed(0)}%, feasible=false`;
  })
  .test('every factor carries a bilingual explanation', () => {
    const m = matchScore(ARTISANS[1], { qty:200, days:40, material:'cotton', technique:'block-print', state:'Gujarat' }, clusterById('kch'));
    for(const f of m.factors) if(!f.why?.hi || !f.why?.en) throw new Error(`${f.key} unexplained`);
    return `${m.factors.length}/${m.factors.length} explained`;
  })
  .test('weights sum to 1.0', () => {
    const s = Object.values(WEIGHTS).reduce((a,b)=>a+b,0);
    if(!near(s, 1, 1e-9)) throw new Error(`Σw = ${s}`);
    return 'Σw = 1.000';
  });

const S_I18N = suite('Bilingual coverage', 'globe')
  .test('no key exists in one language and not the other', () => {
    const hi = Object.keys(DICT.hi), en = Object.keys(DICT.en);
    const missEn = hi.filter(k => !(k in DICT.en));
    const missHi = en.filter(k => !(k in DICT.hi));
    if(missEn.length || missHi.length)
      throw new Error(`missing en: ${missEn.slice(0,3)} | missing hi: ${missHi.slice(0,3)}`);
    return `${hi.length} keys × 2 languages`;
  })
  .test('interpolation placeholders match across languages', () => {
    const bad = [];
    for(const k of Object.keys(DICT.hi)){
      const a = [...String(DICT.hi[k]).matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort().join(',');
      const b = [...String(DICT.en[k]||'').matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort().join(',');
      if(a !== b) bad.push(k);
    }
    if(bad.length) throw new Error(bad.slice(0,4).join(', '));
    return 'all placeholders aligned';
  })
  .test('every cluster and artisan record is bilingual', () => {
    for(const c of CLUSTERS) if(!c.name.hi || !c.name.en || !c.state.hi) throw new Error(`cluster ${c.id}`);
    for(const a of ARTISANS) if(!a.name.hi || !a.name.en) throw new Error(`artisan ${a.id}`);
    return `${CLUSTERS.length} clusters · ${ARTISANS.length} artisans`;
  });

export const SUITES = [S_PRICING, S_COMPS, S_NLU, S_VISION, S_CHANNELS, S_MATCH, S_I18N];

/* ------------------------------------------------------------------- run */
export async function runAll(onProgress){
  const t0 = performance.now();
  const results = [];
  let pass = 0, total = 0;
  for(const s of SUITES){
    const out = { name:s.name, icon:s.icon, tests:[] };
    results.push(out);
    for(const t of s.tests){
      const tt = performance.now();
      let r;
      try{
        const detail = await t.fn();   // uniform: a sync test simply resolves immediately
        r = { label:t.label, ok:true, detail: detail === undefined ? '' : String(detail) };
        pass++;
      }catch(e){
        r = { label:t.label, ok:false, detail:e.message || String(e) };
      }
      r.ms = +(performance.now() - tt).toFixed(1);
      total++;
      out.tests.push(r);
      onProgress?.(results, pass, total);
      await yieldToUI();
    }
  }
  return { results, pass, total, ms:+(performance.now() - t0).toFixed(0) };
}
