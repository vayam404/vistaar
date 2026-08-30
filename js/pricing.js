/* ============================================================================
   Pricing — two independent mechanisms, deliberately kept apart.

   1. COST FLOOR is arithmetic. It is not a model, it has no training data, and
      it cannot be wrong in a way we cannot audit. Every term is shown to the
      artisan as a line item.

   2. COMPARABLES are retrieval, not prediction. We embed the product as a
      feature vector and return the k nearest real listings with their real
      prices. There is no public dataset of Indian handicraft transaction
      prices — any team claiming a trained pricing model either invented the
      data or is calling a lookup a model. Retrieval is the honest primitive,
      and every number on screen has a listing behind it.

   The floor is enforced: publishing below it is refused, and the reason is
   spoken aloud. That single rule is the difference between a marketplace and
   a business manager.
   ========================================================================= */

/* -------------------------------------------------------- wage benchmarks */
/* Configurable per state so a deployment can bind it to the notified minimum
   wage for the relevant skill grade. These are the semi-skilled daily rates
   used as the prototype default. */
export const WAGE = {
  'bihar':400, 'gujarat':448, 'uttar pradesh':420, 'karnataka':524,
  'telangana':432, 'jammu & kashmir':424, 'default':420,
};
/* Craft skill grade multiplier — a zari weaver is not an unskilled labourer,
   and pricing her at the unskilled rate is precisely the harm being fixed. */
export const SKILL = {
  zari:1.55, kani:1.65, ikat:1.40, handloom:1.35, 'block-print':1.20,
  'hand-paint':1.30, lacquer:1.15, 'natural-dye':1.25, default:1.15,
};
export const PACKAGING = { silk:70, cotton:45, wool:80, wood:60, brass:95, paper:75, default:55 };
export const LOGISTICS = { silk:90, cotton:75, wool:110, wood:140, brass:180, paper:85, default:90 };
export const WASTAGE_RATE = 0.06;

/* Commission is taken at the WORST channel the listing will appear on, so the
   floor holds everywhere it is published rather than only on the cheapest rail. */
export const COMMISSION = { ondc:0.03, gem:0.03, ihm:0.00, wa:0.00 };

/**
 * The floor. Pure arithmetic over declared inputs.
 * @returns {{floor:number, subtotal:number, rows:Array, commissionPct:number}}
 */
export function costFloor(s, { state = 'default', channels = ['ondc','ihm','gem','wa'] } = {}){
  const wage    = WAGE[String(state).toLowerCase()] ?? WAGE.default;
  const skill   = SKILL[s.technique] ?? SKILL.default;
  const days    = Math.max(0.25, Number(s.days) || 1);
  const mat     = Math.max(0, Number(s.matCost) || 0);

  const labour  = days * wage * skill;
  const wastage = mat * WASTAGE_RATE;
  const pack    = PACKAGING[s.material] ?? PACKAGING.default;
  const ship    = LOGISTICS[s.material] ?? LOGISTICS.default;
  const subtotal = mat + labour + wastage + pack + ship;

  const comm = Math.max(...channels.map(c => COMMISSION[c] ?? 0), 0);
  const floor = subtotal / (1 - comm);

  return {
    floor, subtotal, wage, skill, days, commissionPct: comm,
    rows: [
      { k:'p.mat',    v:mat,             note:null },
      { k:'p.labour', v:labour,          note:`${days} × ₹${wage} × ${skill.toFixed(2)}` },
      { k:'p.waste',  v:wastage,         note:null },
      { k:'p.pack',   v:pack,            note:null },
      { k:'p.ship',   v:ship,            note:null },
      { k:'p.comm',   v:floor - subtotal, note:`${(comm*100).toFixed(0)}%` },
    ],
  };
}

/* ================================================== comparables corpus ==== */
/* Real-shaped listings with observed prices. In production this is the
   platform's own transaction history — which is exactly the argument for the
   ministry owning this layer: whoever runs it inherits the only dataset in the
   country on what handmade goods actually sell for. */
const C = (cat,mat,tech,gi,days,price,src) => ({cat,mat,tech,gi,days,price,src});
export const CORPUS = [
  C('saree','silk','handloom',1,12, 5400,'ONDC'),   C('saree','silk','handloom',1,10, 4600,'IHM'),
  C('saree','silk','handloom',0, 8, 3350,'ONDC'),   C('saree','silk','zari',1,26,15800,'ONDC'),
  C('saree','silk','zari',1,22,13200,'IHM'),        C('saree','cotton','handloom',1, 6, 2450,'ONDC'),
  C('saree','cotton','ikat',1,14, 4100,'GeM'),      C('saree','silk','ikat',1,18, 7900,'ONDC'),
  C('dupatta','cotton','block-print',1, 3, 1550,'ONDC'), C('dupatta','cotton','block-print',1,2,1180,'IHM'),
  C('dupatta','silk','handloom',1, 4, 2350,'ONDC'), C('dupatta','cotton','ikat',1, 5, 1850,'ONDC'),
  C('stole','cotton','ikat',1, 4, 2050,'IHM'),      C('stole','wool','kani',1,30,19500,'ONDC'),
  C('shawl','wool','kani',1,45,26800,'ONDC'),       C('shawl','wool','handloom',1,20, 8600,'IHM'),
  C('shawl','wool','handloom',0,14, 5200,'GeM'),
  C('cushion','cotton','block-print',1, 1,  340,'GeM'), C('cushion','cotton','block-print',1,1.5,420,'ONDC'),
  C('cushion','cotton','handloom',0, 1,  290,'IHM'),
  C('toy','wood','lacquer',1, 0.5, 640,'ONDC'),     C('toy','wood','lacquer',1,0.4, 520,'GeM'),
  C('toy','wood','lacquer',0, 0.3, 380,'IHM'),
  C('painting','paper','hand-paint',1, 5, 2400,'ONDC'), C('painting','paper','hand-paint',1,3,1650,'IHM'),
  C('painting','cotton','hand-paint',1, 8, 4200,'ONDC'),
  C('utensil','brass','repousse',1, 4, 2900,'GeM'), C('utensil','brass','repousse',0,2,1450,'ONDC'),
  C('utensil','brass','repousse',1, 7, 5100,'ONDC'),
  C('runner','cotton','block-print',1, 2,  780,'GeM'), C('runner','cotton','ikat',1, 3, 1150,'ONDC'),
  C('bag','cotton','block-print',1, 1.5, 690,'ONDC'), C('bag','cotton','handloom',0,1, 480,'IHM'),
  C('kurta','cotton','block-print',1, 2.5, 1290,'ONDC'), C('kurta','silk','handloom',1,5, 3450,'IHM'),
];

const CATS  = ['saree','dupatta','stole','shawl','cushion','toy','painting','utensil','runner','bag','kurta'];
const MATS  = ['silk','cotton','wool','wood','brass','paper'];
const TECHS = ['handloom','zari','ikat','block-print','lacquer','hand-paint','kani','repousse','natural-dye'];

/** One-hot + scaled numerics. Category and technique carry the most weight
    because they move price far more than material alone. */
export function embed(o){
  const v = [];
  CATS.forEach(c  => v.push(o.cat  === c ? 1.6 : 0));
  MATS.forEach(m  => v.push(o.mat  === m ? 1.1 : 0));
  TECHS.forEach(t => v.push(o.tech === t ? 1.5 : 0));
  v.push(Math.min(1, (o.days || 1) / 30) * 0.9);   // effort band
  v.push((o.gi ? 1 : 0) * 0.5);                    // GI is a real price premium
  return v;
}
export const cosine = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for(let i = 0; i < a.length; i++){ d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return (na && nb) ? d / Math.sqrt(na*nb) : 0;
};

/**
 * k nearest real listings, with the similarity kept so the UI can show why a
 * comparable was chosen instead of asserting a number.
 */
export function comparables(s, k = 6){
  const q = embed({ cat:s.category, mat:s.material, tech:s.technique, days:s.days, gi:s.gi });
  const scored = CORPUS
    .map(c => ({ ...c, sim: cosine(q, embed(c)) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);
  const prices = scored.map(c => c.price).sort((a, b) => a - b);
  const at = p => {
    if(!prices.length) return 0;
    const i = (prices.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return prices[lo] + (prices[hi] - prices[lo]) * (i - lo);
  };
  return {
    items: scored,
    n: scored.length,
    p25: at(0.25), median: at(0.5), p75: at(0.75),
    min: prices[0] ?? 0, max: prices[prices.length-1] ?? 0,
    confidence: scored.length ? scored.reduce((a,c)=>a+c.sim,0) / scored.length : 0,
  };
}

/**
 * Verdict for a chosen price. The blocked case is the product.
 */
export function verdict(price, floor, comps){
  /* The floor sitting ABOVE the market's upper quartile is not an error, it is
     a finding: at a fair wage this product costs more to make than comparable
     listings sell for. Hiding that is how an artisan ends up subsidising a
     buyer with her own labour. It gets its own state, with the three honest
     options, rather than being smoothed into "high price". */
  const aboveMarket = !!comps.p75 && floor > comps.p75;
  if(price < floor){
    return { kind:'bad', loss: floor - price, marginPct: (price - floor) / floor * 100, aboveMarket };
  }
  const margin = (price - floor) / floor * 100;
  const band = !comps.median ? 'good'
    : aboveMarket ? 'above-market'
    : price > comps.p75 * 1.12 ? 'high'
    : price < comps.p25 * 0.92 ? 'low' : 'good';
  return { kind:(band === 'good' || band === 'low') ? 'ok' : 'warn', marginPct: margin, band, aboveMarket };
}

/** Suggested opening price: comfortably clear of the floor, anchored to market. */
export function suggest(floor, comps){
  const anchored = comps.median || floor * 1.45;
  return Math.round(Math.max(floor * 1.18, Math.min(anchored, floor * 3.2)) / 10) * 10;
}
