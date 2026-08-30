/* ============================================================================
   RFQ ↔ capability matching.

   A marketplace listing describes one object that already exists. An RFQ
   describes something nobody has made yet — "500 indigo cushion covers, 40cm,
   Jaipur, by 20 October". Answering it needs a different record: not her
   catalogue but her CAPABILITY — technique, materials, monthly capacity,
   turnaround, cluster. That record does not exist anywhere today, and it is the
   only way a small maker gets found for a 500-unit order.

   The score is explainable by construction: every factor returns its own
   contribution and a sentence saying why, so the buyer sees the arithmetic and
   the artisan sees why she was matched. A black-box score would be worse than
   useless here — it would be unauditable allocation of public-scheme demand.
   ========================================================================= */

import { clamp } from './lib.js';

export const WEIGHTS = {
  capacity:  0.30,   // can she physically make this many in the time available
  technique: 0.24,   // does she do this craft at all
  material:  0.18,
  lead:      0.12,   // will it arrive by the date
  track:     0.10,   // completed orders and rating
  proximity: 0.06,   // same state ⇒ cheaper, faster logistics
};

/**
 * @param {object} a    artisan (capacity per month, lead days, materials[], techniques[], rating, orders)
 * @param {object} rfq  {qty, days, material, technique, city, state}
 * @returns {{score:number, factors:Array, feasible:boolean, maxQty:number}}
 */
export function matchScore(a, rfq, cluster){
  const factors = [];
  const add = (key, weight, value, why) => {
    factors.push({ key, weight, value: clamp(value, 0, 1), contribution: clamp(value,0,1) * weight, why });
    return value;
  };

  /* --- capacity: units she can produce inside the window ------------------ */
  const months = Math.max(0.25, (rfq.days ?? 30) / 30);
  const maxQty = Math.floor(a.capacity * months);
  const ratio  = rfq.qty ? maxQty / rfq.qty : 1;
  /* Full credit at 1.0× and above; a cluster can usually pool a modest
     shortfall, so the curve degrades rather than cliffs. */
  const capScore = ratio >= 1 ? 1 : ratio >= 0.6 ? 0.55 + (ratio - 0.6) * 1.125 : ratio * 0.9;
  add('capacity', WEIGHTS.capacity, capScore,
      { hi:`${months.toFixed(1)} माह में ${maxQty} नग बना सकती हैं, माँग ${rfq.qty}`,
        en:`can make ${maxQty} in ${months.toFixed(1)} months vs ${rfq.qty} needed` });

  /* --- technique ---------------------------------------------------------- */
  const techHit = !rfq.technique || a.techniques.includes(rfq.technique);
  add('technique', WEIGHTS.technique, techHit ? 1 : 0.08,
      { hi: techHit ? `${rfq.technique || 'कोई भी'} करती हैं` : 'यह तकनीक नहीं करतीं',
        en: techHit ? `works in ${rfq.technique || 'any technique'}` : 'does not work in this technique' });

  /* --- material ----------------------------------------------------------- */
  const matHit = !rfq.material || a.materials.includes(rfq.material);
  add('material', WEIGHTS.material, matHit ? 1 : 0.15,
      { hi: matHit ? `${rfq.material || 'कोई भी'} में काम करती हैं` : 'यह सामग्री नहीं',
        en: matHit ? `works with ${rfq.material || 'any material'}` : 'does not work with this material' });

  /* --- lead time ---------------------------------------------------------- */
  const leadOk = (rfq.days ?? 30) >= a.lead;
  const leadScore = leadOk ? 1 : clamp((rfq.days ?? 30) / a.lead, 0, 1) * 0.7;
  add('lead', WEIGHTS.lead, leadScore,
      { hi:`सामान्य समय ${a.lead} दिन, माँग ${rfq.days} दिन की`,
        en:`${a.lead}-day turnaround vs ${rfq.days}-day deadline` });

  /* --- track record ------------------------------------------------------- */
  const track = clamp(a.rating / 5 * 0.7 + Math.min(1, a.orders / 40) * 0.3, 0, 1);
  add('track', WEIGHTS.track, track,
      { hi:`${a.orders} ऑर्डर पूरे, रेटिंग ${a.rating}`,
        en:`${a.orders} completed orders, ${a.rating}★` });

  /* --- proximity ---------------------------------------------------------- */
  const same = cluster && rfq.state && cluster.state.en === rfq.state;
  add('proximity', WEIGHTS.proximity, same ? 1 : 0.5,
      { hi: same ? 'उसी राज्य में' : 'दूसरे राज्य से',
        en: same ? 'same state as delivery' : 'inter-state shipment' });

  const score = factors.reduce((s, f) => s + f.contribution, 0);
  /* Feasibility is a separate gate from score: a high-scoring artisan who
     physically cannot make the quantity in time must not be shown as ready. */
  const feasible = techHit && matHit && maxQty >= rfq.qty * 0.5;

  return { score, factors, feasible, maxQty, shortfall: Math.max(0, rfq.qty - maxQty) };
}

/** Rank a roster against one RFQ. Infeasible artisans sort below feasible ones. */
export function rankArtisans(artisans, rfq, clusterOf){
  return artisans
    .map(a => ({ artisan:a, ...matchScore(a, rfq, clusterOf(a.cluster)) }))
    .sort((x, y) => (y.feasible - x.feasible) || (y.score - x.score));
}

/** The inverse view: which open RFQs are worth showing this artisan. */
export function rankRFQs(rfqs, artisan, clusterOf, floor = 0.42){
  return rfqs
    .map(r => ({ rfq:r, ...matchScore(artisan, r, clusterOf(artisan.cluster)) }))
    .filter(m => m.score >= floor)
    .sort((x, y) => y.score - x.score);
}

/** Cluster pooling: when one artisan is short, who else in her cluster covers it. */
export function poolFor(rfq, artisans, clusterId, clusterOf){
  const peers = artisans.filter(a => a.cluster === clusterId);
  const ranked = rankArtisans(peers, rfq, clusterOf);
  let covered = 0; const team = [];
  for(const m of ranked){
    if(covered >= rfq.qty) break;
    if(!m.feasible && team.length) continue;
    const take = Math.min(m.maxQty, rfq.qty - covered);
    if(take <= 0) continue;
    team.push({ ...m, allocated: take });
    covered += take;
  }
  return { team, covered, complete: covered >= rfq.qty };
}
