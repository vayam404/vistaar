/* ============================================================================
   The buyer surface.

   A retail listing describes one object that already exists. A bulk buyer does
   the opposite — they post a requirement and sellers quote back. That is the
   RFQ, and answering it needs the artisan's CAPABILITY (capacity, materials,
   turnaround), not her catalogue. This screen is where "connect directly with
   larger B2B buyers" actually happens; browsing a saree does not do it.

   An RFQ posted here writes to the same store the artisan app reads. Log out,
   log in as the artisan, and it is in her inbox. Nothing is staged.
   ========================================================================= */

import { t, getLang, pick } from './i18n.js';
import { $, on, esc, icon, fmt, haptic, toast, sheet, closeSheet, logEvent } from './lib.js';
import { store, ARTISANS, artisanById, clusterById, buyerById, artFor, uid,
         addOrder, addRfq } from './data.js';
import { nameOf } from './nlu.js';
import { rankArtisans, poolFor, WEIGHTS } from './match.js';
import { CHANNELS } from './channels.js';

const B = () => buyerById(window.__app?.userId || 'b1');

/* ============================================================ DISCOVER === */
const discover = {
  nav:'discover', back:false, title:'b.h', sub:'b.sub',
  render({ params }){
    const q = (params.q || '').toLowerCase();
    const f = params.f || 'all';
    const all = store.get().products;
    const list = all.filter(p => {
      const a = artisanById(p.artisan), cl = clusterById(a.cluster);
      const hay = [pick(p.title), p.material, p.technique, pick(cl.name), pick(a.name)].join(' ').toLowerCase();
      const okQ = !q || hay.includes(q);
      const okF = f === 'all' || p.material === f || p.technique === f;
      return okQ && okF;
    });
    const filters = [['all','common.all'],['silk',null],['cotton',null],['block-print',null],['handloom',null]];
    return `<div class="stack-lg enter">
      <div class="searchbar">
        ${icon('search')}
        <input id="q" placeholder="${esc(t('b.search'))}" value="${esc(params.q || '')}">
      </div>
      <div class="chips" style="overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px">
        ${filters.map(([k, lbl]) => `<button class="pill ${f===k?'i':''}" data-f="${k}" style="flex:0 0 auto">
          ${esc(lbl ? t(lbl) : (nameOf('material',k,getLang()) !== k ? nameOf('material',k,getLang()) : nameOf('technique',k,getLang())))}
        </button>`).join('')}
      </div>

      <button class="row" data-go="b.rfqnew" style="background:var(--gold-soft);box-shadow:0 0 0 1px var(--gold-line), var(--sh-1)">
        <span class="ic bg-d">${icon('layers')}</span>
        <span class="tx"><b>${esc(t('b.rfqnew'))}</b><small style="white-space:normal">${esc(t('b.rfqsub'))}</small></span>
        <span class="rt" style="color:var(--gold)">${icon('chevR')}</span></button>

      <div class="pgrid">
        ${list.map(productCard).join('') || `<p class="note">—</p>`}
      </div>
    </div>`;
  },
  mount(view){
    on(view, '#q', 'input', e => {
      clearTimeout(view._t);
      view._t = setTimeout(() => window.__app.go('b.discover', { ...window.__app.params, q:e.target.value }, 'none'), 220);
    });
    on(view, '[data-f]', 'click', (e, el) =>
      window.__app.go('b.discover', { ...window.__app.params, f:el.dataset.f }, 'none'));
    setRail(`<div class="railsec"><b>Catalogue source</b>
      <pre class="code">${esc(store.get().products.length)} listings from ${esc(ARTISANS.length)} artisans
across ${esc(new Set(ARTISANS.map(a=>a.cluster)).size)} SFURTI-style clusters.

Anything published in the artisan app
appears here immediately — same store,
no fixture swap.</pre></div>`);
  },
};

const productCard = p => {
  const a = artisanById(p.artisan), cl = clusterById(a.cluster);
  return `<button class="pcard" data-go="b.product" data-params='{"id":"${p.id}"}'>
    <span class="thumb">${artFor(p.art)}
      ${p.gi ? `<span class="tag">${icon('award')} ${esc(t('b.gi'))}</span>` : ''}
      ${p.fresh ? `<span class="tag" style="left:auto;right:7px;background:var(--terra)">new</span>` : ''}</span>
    <b>${esc(pick(p.title))}</b>
    <small>${esc(pick(a.name))} · ${esc(pick(cl.name))}</small>
    <span class="pr">${fmt.rupee(p.price)}<em>${esc(t('b.moq',{n:p.moq}))}</em></span>
  </button>`;
};

/* ============================================================= PRODUCT === */
const product = {
  title:() => { const p = store.get().products.find(x => x.id === window.__app.params.id); return p ? pick(p.title) : '—'; },
  sub:() => { const p = store.get().products.find(x => x.id === window.__app.params.id);
              return p ? pick(artisanById(p.artisan).name) : ''; },
  render({ params }){
    const p = store.get().products.find(x => x.id === params.id);
    if(!p) return '<p class="note">—</p>';
    const a = artisanById(p.artisan), cl = clusterById(a.cluster);
    return `<div class="stack-lg enter">
      <div class="thumb" style="aspect-ratio:4/3">${artFor(p.art)}</div>

      <div style="display:flex;align-items:flex-end;gap:12px">
        <div style="flex:1">
          <h2 style="font-size:20px">${esc(pick(p.title))}</h2>
          <p class="note" style="margin-top:4px">${esc(nameOf('technique',p.technique,getLang()))} ·
            ${esc(nameOf('material',p.material,getLang()))}</p>
        </div>
        <div style="text-align:right"><b style="font-size:22px;letter-spacing:-.03em">${fmt.rupee(p.price)}</b>
          <div class="note">${esc(t('b.moq',{n:p.moq}))}</div></div>
      </div>

      <!-- The provenance card. In handicraft the authenticity IS the price
           premium, so it travels with the listing as verifiable metadata. -->
      <div class="card prov">
        <div class="card-h"><span style="color:var(--gold)">${icon('award')}</span>
          <h4>${esc(t('b.provenance'))}</h4>
          <span class="pill d sp">${esc(t('b.verified'))}</span></div>
        <div class="kv"><span>${esc(t('pr.benid'))}</span><b>${esc(a.benId)}</b></div>
        <div class="kv"><span>${esc(t('pr.scheme'))}</span><b>${esc(a.scheme.toUpperCase())}</b></div>
        <div class="kv"><span>${esc(t('pr.cluster'))}</span><b>${esc(pick(cl.name))}, ${esc(pick(cl.state))}</b></div>
        <div class="kv"><span>${esc(t('pr.gi'))}</span><b>${esc(cl.gi)}</b></div>
        <div class="kv"><span>${esc(t('x.technique'))}</span><b>${esc(nameOf('technique',p.technique,getLang()))}</b></div>
        <div class="hr"></div>
        <div class="makingclip">${icon('play')}
          <span>${esc(getLang()==='hi' ? 'बनाते हुए का वीडियो — असली फ़ुटेज, बनाया हुआ नहीं'
                                       : 'Video of it being made — real footage, never generated')}</span></div>
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('pr.capprofile'))}</h4></div>
        <div class="kv"><span>${esc(t('b.cap',{n:a.capacity}))}</span><b>${a.capacity}</b></div>
        <div class="kv"><span>${esc(t('b.lead',{n:a.lead}))}</span><b>${a.lead} ${esc(t('common.days'))}</b></div>
        <div class="kv"><span>${esc(t('x.stock'))}</span><b>${p.stock}</b></div>
      </div>

      <div class="btn-row">
        <button class="btn ghost" data-go="b.rfqnew">${esc(t('b.quote'))}</button>
        <button class="btn" id="buy">${esc(t('b.buy'))}</button>
      </div>
    </div>`;
  },
  mount(view){
    on(view, '#buy', 'click', () => {
      const p = store.get().products.find(x => x.id === window.__app.params.id);
      sheet(t('b.buy'), `
        <label class="field"><span class="lb">${esc(t('o.qty',{n:''}))}</span>
          <input class="input" id="qty" inputmode="numeric" value="${p.moq}"></label>
        <div class="kv total"><span>${esc(t('o.total'))}</span><b id="tot">${fmt.rupee(p.price*p.moq)}</b></div>
        <button class="btn" id="place" style="margin-top:14px">${esc(t('b.buy'))}</button>
        <p class="railnote" style="margin-top:10px">Settlement goes straight to the artisan's
          bank account. Vistaar never holds the money.</p>`,
        { onMount(el){
            on(el, '#qty', 'input', e => {
              const n = Math.max(1, parseInt(e.target.value) || 1);
              $('#tot').textContent = fmt.rupee(p.price * n);
            });
            on(el, '#place', 'click', () => {
              const n = Math.max(1, parseInt($('#qty').value) || 1);
              addOrder({ id:uid('o'), product:p.id, artisan:p.artisan,
                buyer:B().id, qty:n, unit:p.price, status:'new', ch:'ondc', ts:Date.now() });
              logEvent('order', `placed ${n} × ${p.id}`, { buyer:B().name, amount:n*p.price });
              closeSheet();
              toast(getLang()==='hi' ? 'ऑर्डर भेजा गया — कारीगर को फ़ोन जाएगा'
                                     : 'Order placed — the artisan will be called', 'ok');
            });
          }});
    });
  },
};

/* ================================================================= RFQ === */
const rfqList = {
  nav:'rfq', back:false, title:'nav.rfq', sub:() => B().name,
  render(){
    const mine = store.get().rfqs.filter(r => r.buyer === B().id);
    return `<div class="stack-lg enter">
      <button class="btn" data-go="b.rfqnew">${icon('plus')} ${esc(t('b.rfqnew'))}</button>
      ${mine.length ? mine.map(r => {
        const ranked = rankArtisans(ARTISANS.filter(a => r.sent.includes(a.id)), r, clusterById);
        return `<div class="card">
          <div class="card-h"><h4>${esc(pick(r.item))}</h4>
            <span class="pill sp ${r.quotes.length?'g':''}">${r.quotes.length} ${esc(getLang()==='hi'?'दाम आए':'quotes')}</span></div>
          <p class="note">${esc(t('o.byline',{qty:r.qty,days:r.days,city:r.city}))}</p>
          <div class="hr"></div>
          <div class="stack" style="gap:7px">
            ${ranked.slice(0,3).map(m => artisanMini(m)).join('')}
          </div>
        </div>`;
      }).join('') : `<div class="card"><p class="note">${esc(t('o.rfqnone'))}</p></div>`}
    </div>`;
  },
};

const artisanMini = m => `<div class="row" style="box-shadow:none;padding:7px 0">
  <span class="avatar" style="width:32px;height:32px;flex:0 0 32px;border-radius:11px;font-size:12px">${esc(m.artisan.initials)}</span>
  <span class="tx"><b style="font-size:13.5px">${esc(pick(m.artisan.name))}</b>
    <small>${esc(pick(clusterById(m.artisan.cluster).name))} · ${esc(t('b.cap',{n:m.artisan.capacity}))}</small></span>
  <span class="rt"><b style="color:${m.feasible?'var(--green)':'var(--terra)'}">${(m.score*100).toFixed(0)}%</b>
    <small>${esc(m.feasible ? (getLang()==='hi'?'कर सकती हैं':'can deliver') : (getLang()==='hi'?'क्षमता कम':'short'))}</small></span>
</div>`;

const rfqNew = {
  title:'b.rfqnew', sub:'b.rfqsub',
  render(){
    const cats = ['cushion','dupatta','saree','stole','runner','bag'];
    const mats = ['cotton','silk','wool','wood','brass','paper'];
    const techs = ['block-print','handloom','ikat','zari','lacquer','hand-paint'];
    return `<div class="stack-lg">
      <div class="card">
        <label class="field"><span class="lb">${esc(t('b.rfq.item'))}</span>
          <select class="input" id="cat">${cats.map(c=>`<option value="${c}">${esc(nameOf('category',c,getLang()))}</option>`).join('')}</select></label>
        <div class="grid2">
          <label class="field"><span class="lb">${esc(t('b.rfq.mat'))}</span>
            <select class="input" id="mat">${mats.map(c=>`<option value="${c}">${esc(nameOf('material',c,getLang()))}</option>`).join('')}</select></label>
          <label class="field"><span class="lb">${esc(t('x.technique'))}</span>
            <select class="input" id="tech">${techs.map(c=>`<option value="${c}">${esc(nameOf('technique',c,getLang()))}</option>`).join('')}</select></label>
        </div>
        <div class="grid2">
          <label class="field"><span class="lb">${esc(t('b.rfq.qty'))}</span>
            <input class="input" id="qty" inputmode="numeric" value="500"></label>
          <label class="field"><span class="lb">${esc(t('b.rfq.by'))}</span>
            <input class="input" id="days" inputmode="numeric" value="45"></label>
        </div>
        <label class="field"><span class="lb">${esc(t('b.rfq.city'))}</span>
          <input class="input" id="city" value="Mumbai"></label>
      </div>
      <button class="btn" id="match">${icon('target')} ${esc(getLang()==='hi'?'कारीगर खोजें':'Find artisans')}</button>
      <div id="matches"></div>
    </div>`;
  },
  mount(view){
    const read = () => ({
      category:$('#cat').value, material:$('#mat').value, technique:$('#tech').value,
      qty:Math.max(1, parseInt($('#qty').value)||1), days:Math.max(1, parseInt($('#days').value)||30),
      city:$('#city').value.trim() || 'Mumbai',
      state:{ Mumbai:'Maharashtra', Jaipur:'Rajasthan', Bengaluru:'Karnataka',
              Delhi:'Delhi', Ahmedabad:'Gujarat', Patna:'Bihar' }[$('#city').value.trim()] || '',
    });

    const paint = () => {
      const rfq = read();
      const ranked = rankArtisans(ARTISANS, rfq, clusterById);
      const feasible = ranked.filter(m => m.feasible);
      const pool = poolFor(rfq, ARTISANS, ranked[0]?.artisan.cluster, clusterById);
      $('#matches').innerHTML = `
        <div class="card" style="margin-bottom:12px">
          <div class="card-h"><h4>${esc(t('b.matched',{n:feasible.length}))}</h4>
            <span class="pill sp">${esc(t('b.matchwhy'))}</span></div>
          ${ranked.slice(0,5).map(m => `<div class="matchrow">
            <div class="mh">
              <span class="avatar" style="width:30px;height:30px;flex:0 0 30px;border-radius:10px;font-size:11px">${esc(m.artisan.initials)}</span>
              <span style="flex:1;min-width:0"><b>${esc(pick(m.artisan.name))}</b>
                <small>${esc(pick(clusterById(m.artisan.cluster).name))}</small></span>
              <b style="color:${m.feasible?'var(--green)':'var(--terra)'}">${(m.score*100).toFixed(0)}%</b>
            </div>
            <div class="fbars">
              ${m.factors.map(f => `<span class="fb" title="${esc(pick(f.why))}">
                <i style="height:${(f.value*100).toFixed(0)}%;background:${f.value>0.7?'var(--green)':f.value>0.4?'var(--gold)':'var(--terra)'}"></i>
                <em>${esc(f.key.slice(0,4))}</em></span>`).join('')}
            </div>
            <p class="note">${esc(pick(m.factors[0].why))}${m.shortfall?` · ${esc(getLang()==='hi'?`${m.shortfall} नग कम`:`${m.shortfall} short`)}`:''}</p>
          </div>`).join('')}
        </div>
        ${!pool.complete ? '' : `<div class="card" style="margin-bottom:12px">
          <div class="card-h"><span style="color:var(--indigo)">${icon('users')}</span><h4>${esc(getLang()==='hi'?'क्लस्टर मिलकर':'Cluster pooling')}</h4></div>
          <p class="note" style="margin-bottom:9px">${esc(getLang()==='hi'
            ? 'अकेले कारीगर की क्षमता कम है, पर क्लस्टर मिलकर पूरा ऑर्डर ले सकता है।'
            : 'No single artisan can cover this, but the cluster can — allocated below.')}</p>
          ${pool.team.map(m => `<div class="kv"><span>${esc(pick(m.artisan.name))}</span><b>${m.allocated} ${esc(t('common.pieces'))}</b></div>`).join('')}
          <div class="kv total"><span>${esc(getLang()==='hi'?'कुल':'Covered')}</span><b>${pool.covered} / ${rfq.qty}</b></div>
        </div>`}
        <button class="btn" id="send">${icon('send')} ${esc(t('b.rfq.post'))}</button>`;

      setRail(`<div class="railsec"><b>Match weights</b>
        <pre class="code">${esc(Object.entries(WEIGHTS).map(([k,v])=>`${k.padEnd(10)} ${v.toFixed(2)}`).join('\n'))}
Σ          ${Object.values(WEIGHTS).reduce((a,b)=>a+b,0).toFixed(2)}</pre></div>
      <div class="railsec"><b>Top match decomposition</b>
        <pre class="code">${esc(ranked[0].factors.map(f =>
          `${f.key.padEnd(10)} ${f.value.toFixed(2)} × ${f.weight.toFixed(2)} = ${f.contribution.toFixed(3)}`).join('\n'))}
${'TOTAL'.padEnd(10)} ${ranked[0].score.toFixed(3)}
feasible   ${ranked[0].feasible}</pre></div>`);

      on($('#matches'), '#send', 'click', () => {
        const sent = ranked.filter(m => m.score >= 0.42).slice(0, 4).map(m => m.artisan.id);
        const id = uid('r');
        addRfq({ id, buyer:B().id,
          item:{ hi:`${nameOf('technique',rfq.technique,'hi')} ${nameOf('category',rfq.category,'hi')}`,
                 en:`${nameOf('technique',rfq.technique,'en')} ${nameOf('category',rfq.category,'en')}` },
          qty:rfq.qty, material:rfq.material, technique:rfq.technique, city:rfq.city,
          days:rfq.days, budget:0, ts:Date.now(), sent, quotes:[] });
        logEvent('rfq', `posted to ${sent.length} matched artisans`, { qty:rfq.qty, technique:rfq.technique });
        haptic(24);
        toast(getLang()==='hi' ? `${sent.length} कारीगरों को भेजा गया` : `Sent to ${sent.length} artisans`, 'ok');
        window.__app.go('b.rfq');
      });
    };

    on(view, '#match', 'click', paint);
    paint();
  },
};

/* ============================================================== ORDERS === */
const buyerOrders = {
  nav:'buyorders', back:false, title:'nav.buyorders', sub:() => B().name,
  render(){
    const os = store.get().orders.filter(o => o.buyer === B().id).sort((a,b)=>b.ts-a.ts);
    return `<div class="stack-lg enter">
      ${os.length ? `<div class="stack">${os.map(o => {
        const p = store.get().products.find(x => x.id === o.product);
        const a = artisanById(o.artisan);
        return `<div class="row">
          <span class="thumb" style="width:42px;height:42px;flex:0 0 42px;border-radius:13px">${artFor(p?.art||'saree')}</span>
          <span class="tx"><b>${esc(p?pick(p.title):'—')}</b>
            <small>${esc(pick(a.name))} · ${esc(t('o.qty',{n:o.qty}))} · ${esc(fmt.ago(o.ts))}</small></span>
          <span class="rt"><b>${fmt.compact(o.qty*o.unit)}</b><small>${esc(t('o.status.'+o.status))}</small></span>
        </div>`; }).join('')}</div>`
        : `<div class="card"><p class="note">${esc(t('o.none'))}</p></div>`}
    </div>`;
  },
};

const saved = {
  nav:'saved', back:false, title:'nav.saved', sub:() => B().name,
  render(){
    const cls = [...new Set(ARTISANS.map(a => a.cluster))].map(clusterById);
    return `<div class="stack-lg enter">
      <div class="card"><div class="card-h"><h4>${esc(getLang()==='hi'?'क्लस्टर':'Clusters')}</h4></div>
        <div class="stack" style="gap:7px">
          ${cls.map(c => `<div class="row" style="box-shadow:none;padding:7px 0">
            <span class="ic bg-d">${icon('award')}</span>
            <span class="tx"><b>${esc(pick(c.name))}</b><small>${esc(c.gi)}</small></span>
            <span class="rt"><b>${c.artisans}</b><small>${esc(getLang()==='hi'?'कारीगर':'artisans')}</small></span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  },
};

const account = {
  title:'pr.title', sub:() => B().name,
  render(){
    const b = B();
    return `<div class="stack-lg enter">
      <div class="card">
        <div style="display:flex;gap:13px;align-items:center;margin-bottom:12px">
          <span class="avatar d" style="width:48px;height:48px;border-radius:17px;font-size:15px">${esc(b.initials)}</span>
          <div><b style="font-size:17px;display:block">${esc(b.name)}</b>
            <span class="note">${esc(pick(b.kind))} · ${esc(b.city)}</span></div>
        </div>
        <div class="kv"><span>${esc(getLang()==='hi'?'चैनल':'Channel')}</span><b>ONDC buyer app</b></div>
        <div class="kv"><span>${esc(getLang()==='hi'?'कमीशन':'Commission')}</span><b>1–3%</b></div>
      </div>
      <button class="btn ghost" id="out">${icon('logout')} ${esc(t('pr.logout'))}</button>
    </div>`;
  },
  mount(view){ on(view, '#out', 'click', () => window.__app.logout()); },
};

function setRail(html){
  const app = window.__app; if(!app) return;
  app.rail.engine = html;
  if(app.railTab === 'engine'){ const b = document.getElementById('railBody'); if(b) b.innerHTML = html; }
}

export default { screens:{
  'b.discover':discover, 'b.product':product, 'b.rfq':rfqList, 'b.rfqnew':rfqNew,
  'b.orders':buyerOrders, 'b.saved':saved, 'b.account':account,
}};
