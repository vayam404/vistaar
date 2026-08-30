/* Seed data + persistent store.
   One store backs all four logins, so an RFQ posted in the buyer app really does
   land in the artisan's inbox. Persisted to localStorage so a demo survives a
   refresh; `resetDemo()` puts it back to a known state before you present. */

import * as remote from './remote.js';

const KEY = 'vs.store.v3';

/* ---------------------------------------------------------------- clusters */
export const CLUSTERS = [
  {id:'blg', name:{hi:'भागलपुर',en:'Bhagalpur'}, state:{hi:'बिहार',en:'Bihar'},
   craft:{hi:'भागलपुरी सिल्क',en:'Bhagalpuri silk'}, gi:'Bhagalpur Silk', artisans:1240, women:71},
  {id:'kch', name:{hi:'कच्छ',en:'Kachchh'}, state:{hi:'गुजरात',en:'Gujarat'},
   craft:{hi:'अजरख छपाई',en:'Ajrakh block print'}, gi:'Kachchh Ajrakh', artisans:860, women:48},
  {id:'vns', name:{hi:'वाराणसी',en:'Varanasi'}, state:{hi:'उत्तर प्रदेश',en:'Uttar Pradesh'},
   craft:{hi:'बनारसी ब्रोकेड',en:'Banarasi brocade'}, gi:'Banaras Brocades & Sarees', artisans:2110, women:34},
  {id:'chn', name:{hi:'चन्नपटना',en:'Channapatna'}, state:{hi:'कर्नाटक',en:'Karnataka'},
   craft:{hi:'लकड़ी के खिलौने',en:'Lacquerware toys'}, gi:'Channapatna Toys & Dolls', artisans:540, women:62},
  {id:'mrd', name:{hi:'मुरादाबाद',en:'Moradabad'}, state:{hi:'उत्तर प्रदेश',en:'Uttar Pradesh'},
   craft:{hi:'पीतल का काम',en:'Brass metalware'}, gi:'Moradabad Metal Craft', artisans:1780, women:29},
  {id:'pcm', name:{hi:'पोचमपल्ली',en:'Pochampally'}, state:{hi:'तेलंगाना',en:'Telangana'},
   craft:{hi:'इकत बुनाई',en:'Ikat weave'}, gi:'Pochampally Ikat', artisans:980, women:66},
  {id:'srn', name:{hi:'श्रीनगर',en:'Srinagar'}, state:{hi:'जम्मू-कश्मीर',en:'Jammu & Kashmir'},
   craft:{hi:'पश्मीना',en:'Pashmina'}, gi:'Kashmir Pashmina', artisans:1420, women:57},
  {id:'mdb', name:{hi:'मधुबनी',en:'Madhubani'}, state:{hi:'बिहार',en:'Bihar'},
   craft:{hi:'मिथिला चित्रकला',en:'Mithila painting'}, gi:'Madhubani Painting', artisans:1650, women:83},
];
export const clusterById = id => CLUSTERS.find(c => c.id === id) || CLUSTERS[0];

/* ---------------------------------------------------------------- schemes */
export const SCHEMES = [
  {id:'pmv', short:'PM Vishwakarma', full:{hi:'पीएम विश्वकर्मा योजना',en:'PM Vishwakarma Scheme'}},
  {id:'nsf', short:'NSFDC',  full:{hi:'राष्ट्रीय अनुसूचित जाति वित्त निगम',en:'National SC Finance & Dev. Corp.'}},
  {id:'nbc', short:'NBCFDC', full:{hi:'राष्ट्रीय पिछड़ा वर्ग वित्त निगम',en:'National BC Finance & Dev. Corp.'}},
  {id:'sfr', short:'SFURTI', full:{hi:'स्फूर्ति क्लस्टर',en:'SFURTI cluster'}},
];

/* ---------------------------------------------------------------- artisans */
export const ARTISANS = [
  {id:'a1', name:{hi:'सुनीता देवी',en:'Sunita Devi'}, initials:'सु', phone:'98350 41277',
   cluster:'blg', scheme:'pmv', benId:'PMV-BR-2024-118433', since:'2024',
   craft:{hi:'हाथ की बुनाई',en:'Handloom weaving'},
   bank:{name:'Bank of India', acct:'••••4471'},
   capacity:6, lead:14, materials:['silk','cotton'],
   techniques:['handloom','natural-dye'], rating:4.8, orders:34,
   incomeBefore:2900, incomeNow:11400},
  {id:'a2', name:{hi:'रज़िया बानो',en:'Razia Bano'}, initials:'रज़', phone:'99274 30115',
   cluster:'kch', scheme:'nbc', benId:'NBC-GJ-2023-90211', since:'2023',
   craft:{hi:'अजरख ब्लॉक छपाई',en:'Ajrakh block printing'},
   bank:{name:'Bank of Baroda', acct:'••••8820'},
   capacity:180, lead:21, materials:['cotton'],
   techniques:['block-print','natural-dye'], rating:4.9, orders:61,
   incomeBefore:3400, incomeNow:16800},
  {id:'a3', name:{hi:'मोहन लाल',en:'Mohan Lal'}, initials:'मो', phone:'94151 77302',
   cluster:'chn', scheme:'nsf', benId:'NSF-KA-2024-33740', since:'2024',
   craft:{hi:'लाख की खरादी',en:'Lacquer turning'},
   bank:{name:'Canara Bank', acct:'••••1092'},
   capacity:400, lead:18, materials:['wood'],
   techniques:['lathe','lacquer'], rating:4.6, orders:22,
   incomeBefore:4100, incomeNow:9700},
  {id:'a4', name:{hi:'गीता कुमारी',en:'Geeta Kumari'}, initials:'गी', phone:'96935 20418',
   cluster:'mdb', scheme:'pmv', benId:'PMV-BR-2024-207781', since:'2024',
   craft:{hi:'मिथिला चित्रकला',en:'Mithila painting'},
   bank:{name:'SBI', acct:'••••3355'},
   capacity:25, lead:12, materials:['paper','cotton'],
   techniques:['hand-paint'], rating:4.7, orders:18,
   incomeBefore:2200, incomeNow:8300},
  {id:'a5', name:{hi:'अब्दुल रहमान',en:'Abdul Rahman'}, initials:'अब', phone:'90045 66120',
   cluster:'vns', scheme:'nbc', benId:'NBC-UP-2022-44190', since:'2022',
   craft:{hi:'बनारसी बुनाई',en:'Banarasi weaving'},
   bank:{name:'PNB', acct:'••••7714'},
   capacity:4, lead:26, materials:['silk','zari'],
   techniques:['handloom','zari'], rating:4.9, orders:47,
   incomeBefore:5200, incomeNow:19600},
  {id:'a6', name:{hi:'लक्ष्मी अम्मा',en:'Lakshmi Amma'}, initials:'लक', phone:'91485 33907',
   cluster:'pcm', scheme:'sfr', benId:'SFR-TS-2023-11284', since:'2023',
   craft:{hi:'इकत बुनाई',en:'Ikat weaving'},
   bank:{name:'Union Bank', acct:'••••6603'},
   capacity:9, lead:20, materials:['cotton','silk'],
   techniques:['ikat','handloom'], rating:4.8, orders:29,
   incomeBefore:3100, incomeNow:12900},
];
export const artisanById = id => ARTISANS.find(a => a.id === id) || ARTISANS[0];

export const BUYERS = [
  {id:'b1', name:'Anand Exports', kind:{hi:'निर्यातक',en:'Exporter'}, city:'Jaipur', initials:'AE'},
  {id:'b2', name:'Taj Hotels — Procurement', kind:{hi:'आतिथ्य',en:'Hospitality'}, city:'Mumbai', initials:'TH'},
  {id:'b3', name:'Kalaa Living', kind:{hi:'खुदरा शृंखला',en:'Retail chain'}, city:'Bengaluru', initials:'KL'},
  {id:'b4', name:'Ministry of Culture — GeM', kind:{hi:'सरकारी ख़रीद',en:'Govt procurement'}, city:'New Delhi', initials:'GeM'},
];
export const buyerById = id => BUYERS.find(b => b.id === id) || BUYERS[0];

/* ---------------------------------------------------------------- products */
/* Artwork is drawn, not photographed — an SVG per craft keeps the page fully
   offline and avoids passing off stock imagery as a real artisan's work. */
export const ART = {
  saree:`<defs><linearGradient id='s1' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#2A3F78'/><stop offset='1' stop-color='#16264D'/></linearGradient></defs>
    <rect width='200' height='200' fill='url(#s1)'/>
    <g stroke='#C9A227' stroke-width='1' opacity='.55'>${Array.from({length:13},(_,i)=>`<line x1='0' y1='${i*16+6}' x2='200' y2='${i*16+6}'/>`).join('')}</g>
    <g stroke='#DCC77A' stroke-width='2.5' opacity='.9'><line x1='0' y1='168' x2='200' y2='168'/><line x1='0' y1='178' x2='200' y2='178'/></g>
    <g fill='#D8B84A' opacity='.92'>${Array.from({length:7},(_,i)=>`<path d='M${20+i*27} 186 l6 -10 l6 10 l-6 6 z'/>`).join('')}</g>
    <g fill='none' stroke='#E4D08A' stroke-width='1.6' opacity='.75'>${Array.from({length:4},(_,i)=>`<circle cx='${40+i*42}' cy='60' r='13'/><circle cx='${40+i*42}' cy='60' r='5'/>`).join('')}</g>`,
  ajrakh:`<rect width='200' height='200' fill='#7B2D26'/>
    <g fill='#12304E'>${Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>`<rect x='${c*40+4}' y='${r*40+4}' width='32' height='32' rx='3'/>`).join('')).join('')}</g>
    <g fill='#F2E7D5'>${Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>`<path d='M${c*40+20} ${r*40+9} l7 11 l-7 11 l-7 -11 z'/>`).join('')).join('')}</g>
    <g fill='none' stroke='#E3B23C' stroke-width='1.4'>${Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>`<circle cx='${c*40+20}' cy='${r*40+20}' r='15'/>`).join('')).join('')}</g>`,
  brass:`<rect width='200' height='200' fill='#2A2118'/>
    <circle cx='100' cy='104' r='62' fill='#B98B2E'/><circle cx='100' cy='104' r='62' fill='none' stroke='#E6C56A' stroke-width='3'/>
    <ellipse cx='84' cy='84' rx='22' ry='15' fill='#E8CE86' opacity='.55'/>
    <g fill='none' stroke='#6E4E12' stroke-width='1.5' opacity='.8'>${Array.from({length:5},(_,i)=>`<circle cx='100' cy='104' r='${16+i*10}'/>`).join('')}</g>
    <rect x='72' y='30' width='56' height='20' rx='7' fill='#C79B39' stroke='#E6C56A' stroke-width='2'/>`,
  toy:`<rect width='200' height='200' fill='#F0E4CF'/>
    <g><rect x='44' y='96' width='112' height='26' rx='13' fill='#C0432B'/>
    <circle cx='68' cy='134' r='17' fill='#1F5D53'/><circle cx='132' cy='134' r='17' fill='#1F5D53'/>
    <circle cx='68' cy='134' r='6' fill='#F0E4CF'/><circle cx='132' cy='134' r='6' fill='#F0E4CF'/>
    <circle cx='100' cy='70' r='27' fill='#D9A62E'/><circle cx='100' cy='70' r='27' fill='none' stroke='#8C5A15' stroke-width='2'/>
    <circle cx='91' cy='66' r='3.4' fill='#2A2118'/><circle cx='109' cy='66' r='3.4' fill='#2A2118'/>
    <path d='M92 78 q8 6 16 0' stroke='#2A2118' stroke-width='2' fill='none' stroke-linecap='round'/></g>`,
  mithila:`<rect width='200' height='200' fill='#EFE2C6'/>
    <rect x='7' y='7' width='186' height='186' fill='none' stroke='#8E2F1B' stroke-width='5'/>
    <circle cx='100' cy='86' r='36' fill='none' stroke='#1F4E4A' stroke-width='3'/>
    <circle cx='100' cy='86' r='23' fill='#C0432B' opacity='.85'/>
    <g stroke='#1F4E4A' stroke-width='2.4' fill='none'>${Array.from({length:16},(_,i)=>`<line x1='100' y1='86' x2='${100+Math.cos(i*Math.PI/8)*48}' y2='${86+Math.sin(i*Math.PI/8)*48}'/>`).join('')}</g>
    <g fill='#1F4E4A'>${Array.from({length:9},(_,i)=>`<circle cx='${22+i*20}' cy='158' r='5'/>`).join('')}</g>
    <path d='M30 176 q70 -16 140 0' stroke='#8E2F1B' stroke-width='3' fill='none'/>`,
  pashmina:`<rect width='200' height='200' fill='#5C4030'/>
    <g stroke='#D9C7AE' stroke-width='.8' opacity='.3'>${Array.from({length:26},(_,i)=>`<line x1='0' y1='${i*8}' x2='200' y2='${i*8}'/>`).join('')}</g>
    <g fill='none' stroke='#E0B24C' stroke-width='2.2'>${Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>`<path d='M${30+c*62} ${52+r*52} c-14 -18 12 -30 18 -10 c6 -20 32 -8 18 10 c-8 11 -22 20 -18 26 c-4 -6 -18 -15 -18 -26 z'/>`).join('')).join('')}</g>`,
  ikat:`<rect width='200' height='200' fill='#F2ECE0'/>
    <g>${Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>`<path d='M${c*25+12} ${r*25+4} l9 9 l-9 9 l-9 -9 z' fill='${(r+c)%2?'#1D4E6B':'#A63F1F'}' opacity='.9'/>`).join('')).join('')}</g>
    <g stroke='#1D4E6B' stroke-width='1' opacity='.25'>${Array.from({length:9},(_,i)=>`<line x1='${i*25}' y1='0' x2='${i*25}' y2='200'/>`).join('')}</g>`,
};
export const artFor = k => `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>${ART[k] || ART.saree}</svg>`;

const P = (id,artisan,art,hi,en,price,mat,tech,gi,stock,moq)=>({
  id, artisan, art, title:{hi,en}, price, material:mat, technique:tech, gi, stock, moq,
  channels:['ondc','ihm','gem','wa'], views:0
});
export const SEED_PRODUCTS = [
  P('p1','a1','saree','भागलपुर सिल्क साड़ी · नील रंगाई','Bhagalpur silk saree · indigo dyed',
    4850,'silk','handloom',true,3,1),
  P('p2','a2','ajrakh','अजरख हाथ छपाई दुपट्टा','Ajrakh hand-block dupatta',
    1450,'cotton','block-print',true,26,10),
  P('p3','a3','toy','चन्नपटना लकड़ी का खिलौना','Channapatna lacquered wooden toy',
    620,'wood','lacquer',true,80,20),
  P('p4','a4','mithila','मिथिला चित्रकला · मछली','Mithila painting · fish motif',
    2200,'paper','hand-paint',true,6,1),
  P('p5','a5','saree','बनारसी ज़री ब्रोकेड साड़ी','Banarasi zari brocade saree',
    14800,'silk','zari',true,2,1),
  P('p6','a6','ikat','पोचमपल्ली इकत स्टोल','Pochampally ikat stole',
    1980,'cotton','ikat',true,14,5),
  P('p7','a2','ajrakh','अजरख कुशन कवर (सेट 4)','Ajrakh cushion covers (set of 4)',
    1180,'cotton','block-print',true,40,12),
  P('p8','a5','pashmina','कानी पश्मीना शॉल','Kani pashmina shawl',
    22400,'wool','kani',true,1,1),
];

/* ------------------------------------------------------------ ministry seed */
export const MONTHS = {
  hi:['अप्रैल','मई','जून','जुलाई','अग','सित','अक्टू','नव','दिस','जन','फ़र','मार्च'],
  en:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
};
export const GMV_SERIES  = [12,19,27,34,41,58,86,104,92,79,88,113]; // ₹ lakh
export const LIST_SERIES = [340,610,900,1240,1580,2120,2740,3210,3560,3840,4180,4620];
export const CHANNEL_SPLIT = [
  {id:'ondc', label:'ONDC',          v:38, c:'#22376B'},
  {id:'ihm',  label:'Indiahandmade', v:24, c:'#1E6B4A'},
  {id:'gem',  label:'GeM',           v:21, c:'#A2760A'},
  {id:'wa',   label:'WhatsApp',      v:17, c:'#C24E2A'},
];

/* --------------------------------------------------------------- the store */
const seed = () => ({
  products: SEED_PRODUCTS.map(p => ({...p})),
  orders: [
    {id:'o1', product:'p2', artisan:'a2', buyer:'b3', qty:40, unit:1450, status:'confirmed',
     ch:'ondc', ts:Date.now()-86400000*2},
    {id:'o2', product:'p4', artisan:'a4', buyer:'b1', qty:2,  unit:2200, status:'shipped',
     ch:'ihm',  ts:Date.now()-86400000*5},
    {id:'o3', product:'p1', artisan:'a1', buyer:'b1', qty:1,  unit:4850, status:'paid',
     ch:'ondc', ts:Date.now()-86400000*9},
    {id:'o4', product:'p6', artisan:'a6', buyer:'b2', qty:60, unit:1980, status:'paid',
     ch:'gem',  ts:Date.now()-86400000*14},
  ],
  rfqs: [
    {id:'r1', buyer:'b2', item:{hi:'ब्लॉक छपाई कुशन कवर',en:'Block-print cushion covers'},
     qty:500, material:'cotton', technique:'block-print', city:'Mumbai', days:45,
     budget:340, ts:Date.now()-3600000*20, sent:['a2'], quotes:[]},
    {id:'r2', buyer:'b1', item:{hi:'हाथ बुनी सिल्क स्टोल',en:'Handwoven silk stoles'},
     qty:120, material:'silk', technique:'handloom', city:'Jaipur', days:60,
     budget:1250, ts:Date.now()-3600000*40, sent:['a1','a6'], quotes:[]},
  ],
  audit: [
    {ts:Date.now()-3600000*20, hi:'आपकी क्षमता प्रोफ़ाइल एक थोक माँग से मिलाई गई',
     en:'Your capability profile was matched to a bulk requirement'},
    {ts:Date.now()-86400000*2, hi:'ओएनडीसी पर आपकी साड़ी की लिस्टिंग अपडेट हुई',
     en:'Your saree listing was updated on ONDC'},
  ],
  prevented: 0,       // ₹ of below-cost sales the floor has blocked
  preventedCount: 0,
  session: null,
});

let state = load();
const subs = new Set();

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return seed();
    const s = JSON.parse(raw);
    return s && s.products ? s : seed();
  }catch{ return seed(); }
}
function persist(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch{}
}

export const store = {
  get:()=>state,
  set(fn){ fn(state); persist(); subs.forEach(f=>f(state)); },
  sub(fn){ subs.add(fn); return ()=>subs.delete(fn); },
  reset(){ state = seed(); persist(); subs.forEach(f=>f(state)); },
};
export const resetDemo = () => store.reset();

/* helpers used across the three apps */
export const productById = id => state.products.find(p => p.id === id);
export const ordersFor   = aid => state.orders.filter(o => o.artisan === aid).sort((a,b)=>b.ts-a.ts);
export const rfqsFor     = aid => state.rfqs.filter(r => r.sent.includes(aid)).sort((a,b)=>b.ts-a.ts);
export const productsOf  = aid => state.products.filter(p => p.artisan === aid);

export const uid = p => p + Math.random().toString(36).slice(2,8);

/* ======================================================== remote sync ==== */
/* Every mutation below writes LOCAL FIRST and enqueues the remote write, so the
   UI never waits on a network round trip and nothing is lost if the network is
   not there. This is the offline-first sync queue the pitch claims, and it is
   the same code path in the workshop and in the auditorium. */

export async function hydrate(){
  try{
    const d = await remote.pull();
    if(!d.artisans.length) return false;
    /* Mutate in place: every module holds a reference to these arrays. */
    CLUSTERS.length = 0; CLUSTERS.push(...d.clusters);
    ARTISANS.length = 0; ARTISANS.push(...d.artisans);
    state.products = d.products;
    state.orders   = d.orders;
    state.rfqs     = d.rfqs;
    state.prevented      = d.prevented;
    state.preventedCount = d.preventedCount;
    persist(); subs.forEach(f => f(state));
    return true;
  }catch{
    return false;   // seed data is already loaded; the demo runs regardless
  }
}

export function addProduct(p){
  store.set(s => { s.products.unshift(p); });
  remote.pushProduct(p);
}
export function addOrder(o){
  store.set(s => { s.orders.unshift(o); });
  remote.pushOrder(o);
}
export function setOrderStatus(id, status){
  store.set(s => { const o = s.orders.find(x => x.id === id); if(o) o.status = status; });
  remote.patchOrder(id, { status });
}
export function addRfq(r){
  store.set(s => { s.rfqs.unshift(r); });
  remote.pushRfq(r);
}
export function addQuote(rfqId, quote){
  let quotes = null;
  store.set(s => {
    const r = s.rfqs.find(x => x.id === rfqId);
    if(r){ r.quotes = [...(r.quotes || []), quote]; quotes = r.quotes; }
  });
  if(quotes) remote.patchRfq(rfqId, { quotes });
}
/* The floor did not warn, it refused — and that is a measurable harm avoided,
   so it is persisted as an event the ministry dashboard aggregates rather than
   a number someone typed into a slide. */
export function recordBlock(amount, detail){
  store.set(s => { s.prevented += amount; s.preventedCount += 1; });
  remote.pushEvent('floor_block', 'cost floor refused a below-cost listing', detail, amount);
}
export function addAudit(entry){ store.set(s => { s.audit.unshift(entry); }); }
export { remote };
