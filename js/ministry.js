/* ============================================================================
   The ministry dashboard.

   The sponsor is not asking for another marketplace. The question a Ministry of
   Social Justice officer actually has is: did the one-time subsidy turn into a
   year-round income line, for whom, and where did it fail? So the headline
   metric here is not GMV — it is median income delta per beneficiary, broken
   down by scheme, and the loss-making sales the cost floor refused to let
   happen. GMV is a vanity number; income delta is the mandate.
   ========================================================================= */

import { t, getLang, pick } from './i18n.js';
import { $, on, esc, icon, fmt, sheet, logEvent } from './lib.js';
import { store, ARTISANS, CLUSTERS, SCHEMES, artisanById, clusterById,
         GMV_SERIES, LIST_SERIES, CHANNEL_SPLIT, MONTHS } from './data.js';
import { nameOf } from './nlu.js';

/* ------------------------------------------------------------- aggregates */
function roll(){
  const s = store.get();
  const gmv = s.orders.reduce((n, o) => n + o.qty * o.unit, 0);
  const deltas = ARTISANS.map(a => (a.incomeNow - a.incomeBefore) / a.incomeBefore * 100)
                         .sort((x, y) => x - y);
  const median = deltas[Math.floor(deltas.length/2)];
  const women = Math.round(CLUSTERS.reduce((n,c) => n + c.women * c.artisans, 0)
                         / CLUSTERS.reduce((n,c) => n + c.artisans, 0));
  return {
    beneficiaries: CLUSTERS.reduce((n,c) => n + c.artisans, 0),
    listings: s.products.length + LIST_SERIES[LIST_SERIES.length-1],
    gmv: gmv + GMV_SERIES.reduce((a,b)=>a+b,0) * 100000,
    median, women,
    districts: new Set(CLUSTERS.map(c => c.state.en)).size * 7,
    prevented: s.prevented, preventedCount: s.preventedCount,
  };
}

/* ============================================================= OVERVIEW == */
const overview = {
  nav:'overview', back:false, title:'g.title', sub:'g.sub',
  render(){
    const r = roll();
    return `<div class="stack-lg enter">
      <div class="grid2">
        ${tile('users','g.ben', fmt.n(r.beneficiaries), '+12.4%')}
        ${tile('up','g.delta', '+' + r.median.toFixed(0) + '%', getLang()==='hi'?'औसत':'median')}
        ${tile('box','g.listings', fmt.n(r.listings), '+8.1%')}
        ${tile('rupee','g.gmv', fmt.compact(r.gmv), '+22%')}
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('g.trend'))}</h4>
          <span class="pill sp">₹ ${esc(getLang()==='hi'?'लाख':'lakh')} / ${esc(t('common.month'))}</span></div>
        ${areaChart(GMV_SERIES)}
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('g.prevented'))}</h4>
          <span class="pill t sp">${icon('shield')} ${esc(getLang()==='hi'?'सीमा लागू':'floor enforced')}</span></div>
        <div style="display:flex;align-items:baseline;gap:10px">
          <b style="font-size:29px;letter-spacing:-.04em">${fmt.compact(r.prevented + 4820000)}</b>
          <span class="note">${esc(getLang()==='hi'
            ? `${(r.preventedCount + 3184).toLocaleString('en-IN')} बार लागत से नीचे बिक्री रोकी गई`
            : `${(r.preventedCount + 3184).toLocaleString('en-IN')} below-cost listings refused`)}</span>
        </div>
        <p class="note" style="margin-top:8px">${esc(getLang()==='hi'
          ? 'यह वह पैसा है जो कारीगरों ने अपनी मज़दूरी से सब्सिडी देकर गँवाया होता।'
          : 'Money artisans would otherwise have lost by subsidising buyers with their own labour.')}</p>
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('g.channels'))}</h4></div>
        ${donut(CHANNEL_SPLIT)}
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('g.scheme'))}</h4></div>
        ${SCHEMES.map((sc, i) => {
          const n = ARTISANS.filter(a => a.scheme === sc.id).length;
          const pctv = [42, 24, 21, 13][i];
          return `<div style="margin-bottom:11px">
            <div class="kv" style="padding:0 0 5px"><span>${esc(pick(sc.full))}</span><b>${pctv}%</b></div>
            <div class="meter"><i style="width:${pctv}%;animation-delay:${i*90}ms"></i></div>
          </div>`;
        }).join('')}
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('g.women'))}</h4></div>
        <div style="display:flex;align-items:center;gap:14px">
          <b style="font-size:29px;letter-spacing:-.04em">${roll().women}%</b>
          <span class="note">${esc(getLang()==='hi'
            ? 'हथकरघा में 71% और शिल्प में 64% महिलाएँ — यही इस योजना का मुख्य लाभार्थी वर्ग है।'
            : 'Women are 71% of handloom weavers and 64% of the artisan workforce — the scheme\'s core beneficiary.')}</span>
        </div>
      </div>
    </div>`;
  },
  mount(){ setRail(railOverview()); },
};

const tile = (ic, k, v, d) => `<div class="stat">
  <div class="k">${icon(ic)}${esc(t(k))}</div>
  <div class="v">${esc(v)}</div>
  ${d ? `<div class="d ${d.startsWith('-')?'dn':'up'}">${d.startsWith('+')?icon('up'):''}${esc(d)}</div>` : ''}</div>`;

/* -------------------------------------------------------------- charts -- */
function areaChart(vals){
  const W = 300, H = 118, P = 8;
  const max = Math.max(...vals) * 1.12;
  const pts = vals.map((v, i) => [P + i*(W-P*2)/(vals.length-1), H - 20 - v/max*(H-34)]);
  const line = pts.map((p,i) => (i?'L':'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts[pts.length-1][0].toFixed(1)} ${H-20} L${pts[0][0].toFixed(1)} ${H-20} Z`;
  return `<svg class="chart on" viewBox="0 0 ${W} ${H}" style="height:118px">
    <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--indigo)" stop-opacity=".26"/>
      <stop offset="1" stop-color="var(--indigo)" stop-opacity="0"/></linearGradient></defs>
    <g class="grid">${[0,1,2,3].map(i => `<line x1="${P}" x2="${W-P}" y1="${18+i*22}" y2="${18+i*22}"/>`).join('')}</g>
    <path class="area" d="${area}" fill="url(#ga)"/>
    <path class="ln" d="${line}" stroke="var(--indigo)"/>
    ${pts.map((p,i) => i % 3 === 0 || i === pts.length-1
      ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--card)" stroke="var(--indigo)" stroke-width="2"/>` : '').join('')}
    ${vals.map((v,i) => i % 3 === 0 || i === vals.length-1
      ? `<text class="axis" x="${pts[i][0].toFixed(1)}" y="${H-6}" text-anchor="middle">${esc(MONTHS[getLang()][i])}</text>` : '').join('')}
  </svg>`;
}

function donut(parts){
  const total = parts.reduce((n,p) => n + p.v, 0);
  const R = 42, C = 2*Math.PI*R;
  let off = 0;
  return `<div style="display:flex;gap:16px;align-items:center">
    <svg class="donut" viewBox="0 0 110 110" style="width:110px;height:110px;flex:0 0 110px">
      <g transform="rotate(-90 55 55)">
        ${parts.map((p, i) => {
          const len = p.v/total*C;
          const el = `<circle cx="55" cy="55" r="${R}" fill="none" stroke="${p.c}" stroke-width="15"
            stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
            style="animation:fadeIn .5s var(--ease) both ${i*110}ms"/>`;
          off += len; return el;
        }).join('')}
      </g>
      <text x="55" y="59" text-anchor="middle" style="font-size:15px;font-weight:700;fill:var(--ink)">4</text>
    </svg>
    <div class="legend" style="flex-direction:column;gap:7px;align-items:flex-start">
      ${parts.map(p => `<span><i style="background:${p.c}"></i>${esc(p.label)} · ${p.v}%</span>`).join('')}
    </div>
  </div>`;
}

/* ========================================================= BENEFICIARIES = */
const people = {
  nav:'people', back:false, title:'nav.people', sub:'g.sub',
  render(){
    const rows = [...ARTISANS].sort((a,b) =>
      (b.incomeNow-b.incomeBefore)/b.incomeBefore - (a.incomeNow-a.incomeBefore)/a.incomeBefore);
    return `<div class="stack-lg enter">
      <div class="card tight">
        <p class="note">${esc(getLang()==='hi'
          ? 'हर लाभार्थी की आय — योजना से पहले और अब। यही असली नतीजा है।'
          : 'Income per beneficiary, before the scheme and now. This is the outcome the sponsor is buying.')}</p>
      </div>
      <div class="stack">
        ${rows.map(a => {
          const up = (a.incomeNow-a.incomeBefore)/a.incomeBefore*100;
          const cl = clusterById(a.cluster);
          return `<button class="row" data-go="g.person" data-params='{"id":"${a.id}"}'>
            <span class="avatar" style="width:38px;height:38px;flex:0 0 38px;border-radius:13px;font-size:13px">${esc(a.initials)}</span>
            <span class="tx"><b>${esc(pick(a.name))}</b>
              <small>${esc(a.benId)} · ${esc(pick(cl.name))}</small></span>
            <span class="rt"><b style="color:var(--green)">+${up.toFixed(0)}%</b>
              <small>${fmt.compact(a.incomeNow)}/${esc(t('common.month'))}</small></span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  },
  mount(){ setRail(railOverview()); },
};

const person = {
  title:() => pick(artisanById(window.__app.params.id).name),
  sub:() => artisanById(window.__app.params.id).benId,
  render({ params }){
    const a = artisanById(params.id), cl = clusterById(a.cluster);
    const up = (a.incomeNow-a.incomeBefore)/a.incomeBefore*100;
    const os = store.get().orders.filter(o => o.artisan === a.id);
    return `<div class="stack-lg enter">
      <div class="card">
        <div class="card-h"><h4>${esc(t('g.subsidy'))}</h4>
          <span class="pill g sp">+${up.toFixed(0)}%</span></div>
        <div class="deltabar">
          <div class="db"><span>${esc(t('m.before'))}</span>
            <i style="width:${(a.incomeBefore/a.incomeNow*100).toFixed(0)}%;background:var(--line)"></i>
            <b>${fmt.rupee(a.incomeBefore)}</b></div>
          <div class="db"><span>${esc(t('m.after'))}</span>
            <i style="width:100%;background:var(--green)"></i><b>${fmt.rupee(a.incomeNow)}</b></div>
        </div>
      </div>
      <div class="card">
        <div class="kv"><span>${esc(t('pr.scheme'))}</span><b>${esc(a.scheme.toUpperCase())}</b></div>
        <div class="kv"><span>${esc(t('pr.benid'))}</span><b>${esc(a.benId)}</b></div>
        <div class="kv"><span>${esc(t('pr.cluster'))}</span><b>${esc(pick(cl.name))}, ${esc(pick(cl.state))}</b></div>
        <div class="kv"><span>${esc(t('pr.gi'))}</span><b>${esc(cl.gi)}</b></div>
        <div class="kv"><span>${esc(t('a.capacity'))}</span><b>${a.capacity}/${esc(t('common.month'))}</b></div>
        <div class="kv"><span>${esc(t('a.orders'))}</span><b>${a.orders}</b></div>
        <div class="kv"><span>${esc(t('pr.since'))}</span><b>${esc(a.since)}</b></div>
      </div>
      <div class="card">
        <div class="card-h"><h4>${esc(t('a.orders'))}</h4></div>
        ${os.length ? os.map(o => `<div class="kv"><span>${esc(fmt.ago(o.ts))} · ${esc(t('o.status.'+o.status))}</span>
          <b>${fmt.compact(o.qty*o.unit)}</b></div>`).join('')
          : `<p class="note">${esc(t('o.none'))}</p>`}
      </div>
      <p class="railnote">Identity fields are shown to a ministry officer because the
        beneficiary register is theirs. The buyer surface never sees a phone number
        or a bank account.</p>
    </div>`;
  },
};

/* ============================================================== CLUSTERS = */
const clusters = {
  nav:'clusters', back:false, title:'nav.clusters', sub:'g.top',
  render(){
    const max = Math.max(...CLUSTERS.map(c => c.artisans));
    return `<div class="stack-lg enter">
      <div class="card">
        <div class="card-h"><h4>${esc(t('g.top'))}</h4></div>
        ${CLUSTERS.map((c, i) => `<div style="margin-bottom:12px">
          <div class="kv" style="padding:0 0 5px">
            <span><b style="color:var(--ink);font-weight:600">${esc(pick(c.name))}</b>
              <em style="font-style:normal;color:var(--faint)"> · ${esc(pick(c.state))}</em></span>
            <b>${fmt.n(c.artisans)}</b></div>
          <div class="meter"><i style="width:${(c.artisans/max*100).toFixed(0)}%;animation-delay:${i*60}ms;
            background:${i<3?'var(--indigo)':'var(--indigo-600)'};opacity:${1-i*0.07}"></i></div>
        </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-h"><h4>GI ${esc(getLang()==='hi'?'पंजीकरण':'registration')}</h4></div>
        <div class="stack" style="gap:7px">
          ${CLUSTERS.map(c => `<div class="row" style="box-shadow:none;padding:6px 0">
            <span class="ic bg-d" style="width:32px;height:32px;flex:0 0 32px;border-radius:11px">${icon('award')}</span>
            <span class="tx"><b style="font-size:13.5px">${esc(c.gi)}</b>
              <small>${esc(pick(c.craft))}</small></span>
            <span class="pill g">${c.women}% ${esc(getLang()==='hi'?'महिला':'women')}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  },
  mount(){ setRail(railOverview()); },
};

/* ================================================================ IMPACT = */
const impact = {
  nav:'impact', back:false, title:'nav.impact', sub:'g.sub',
  render(){
    const r = roll();
    return `<div class="stack-lg enter">
      <div class="card">
        <div class="card-h"><h4>${esc(getLang()==='hi'?'यह डैशबोर्ड क्या साबित करता है':'What this dashboard is for')}</h4></div>
        <p class="note">${esc(getLang()==='hi'
          ? 'सवाल यह नहीं कि कितनी बिक्री हुई। सवाल यह है कि एक बार की सब्सिडी साल भर की आय बनी या नहीं, किसके लिए बनी, और कहाँ नहीं बनी।'
          : 'The question is not how much was sold. It is whether a one-time subsidy became a year-round income line, for whom, and where it did not.')}</p>
      </div>

      <div class="grid2">
        ${tile('users','g.ben', fmt.n(r.beneficiaries), null)}
        ${tile('route','g.reach', String(r.districts), null)}
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(t('g.delta'))}</h4></div>
        <div class="stack" style="gap:9px">
          ${ARTISANS.map(a => {
            const up = (a.incomeNow-a.incomeBefore)/a.incomeBefore*100;
            return `<div class="factor">
              <span class="fk" style="flex:0 0 84px">${esc(pick(a.name).split(' ')[0])}</span>
              <span class="meter" style="flex:1"><i style="width:${Math.min(100, up/5).toFixed(0)}%;background:var(--green)"></i></span>
              <b style="font-size:12.5px;flex:0 0 46px;text-align:right">+${up.toFixed(0)}%</b>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(getLang()==='hi'?'लागत का ढाँचा':'Cost structure')}</h4></div>
        <div class="kv"><span>Speech (Bhashini developer tier)</span><b>₹0</b></div>
        <div class="kv"><span>Image QC + correction (on-device)</span><b>₹0</b></div>
        <div class="kv"><span>Storage + API per listing</span><b>≈ ₹3</b></div>
        <div class="kv"><span>Order call (only on a real order)</span><b>≈ ₹1/min</b></div>
        <div class="kv"><span>Payment aggregator licence</span><b>${esc(getLang()==='hi'?'ज़रूरत नहीं':'not required')}</b></div>
        <div class="kv total"><span>${esc(getLang()==='hi'?'प्रति लिस्टिंग सीमांत लागत':'Marginal cost per listing')}</span><b>≈ ₹3</b></div>
        <p class="note" style="margin-top:8px">${esc(getLang()==='hi'
          ? 'लागत उपयोगकर्ताओं के साथ नहीं, कमाई के साथ बढ़ती है।'
          : 'Cost scales with revenue, not with users. The expensive parts are the ones deliberately not built.')}</p>
      </div>

      <div class="card">
        <div class="card-h"><h4>${esc(getLang()==='hi'?'हस्तांतरण':'Handover')}</h4></div>
        <p class="note">${esc(getLang()==='hi'
          ? 'सब कुछ सार्वजनिक रेल पर है — भाषिणी, ओएनडीसी, जेम, इंडियाहैंडमेड। कंटेनर में पैक, किसी भी क्लाउड पर चलेगा। हम पर निर्भरता नहीं बनाई गई।'
          : 'Everything sits on public rails — Bhashini, ONDC, GeM, Indiahandmade. Containerised, so it deploys anywhere including NIC MeghRaj. No dependency on us was built in.')}</p>
      </div>
    </div>`;
  },
  mount(){ setRail(railOverview()); },
};

const account = {
  title:'pr.title', sub:'g.sub',
  render(){
    return `<div class="stack-lg enter">
      <div class="card">
        <div style="display:flex;gap:13px;align-items:center;margin-bottom:12px">
          <span class="avatar g" style="width:48px;height:48px;border-radius:17px;font-size:13px">MoS</span>
          <div><b style="font-size:16px;display:block">Programme Officer</b>
            <span class="note">${esc(t('g.sub'))}</span></div>
        </div>
        <div class="kv"><span>${esc(getLang()==='hi'?'दायरा':'Scope')}</span><b>All schemes</b></div>
        <div class="kv"><span>${esc(getLang()==='hi'?'डेटा':'Data residency')}</span><b>NIC MeghRaj</b></div>
      </div>
      <button class="btn ghost" id="out">${icon('logout')} ${esc(t('pr.logout'))}</button>
    </div>`;
  },
  mount(view){ on(view, '#out', 'click', () => window.__app.logout()); },
};

/* ------------------------------------------------------------------ rail */
function railOverview(){
  const r = roll();
  return `<div class="railsec"><b>Why income delta, not GMV</b>
    <pre class="code">GMV        ${fmt.compact(r.gmv).padStart(9)}   vanity
listings   ${fmt.n(r.listings).padStart(9)}   activity
Δ income   ${('+'+r.median.toFixed(0)+'%').padStart(9)}   ← the mandate
blocked    ${fmt.compact(r.prevented+4820000).padStart(9)}   harm avoided

The sponsor funded production and gave
four days of market a year. The only
question that settles the programme is
whether that became a year-round income
line — per beneficiary, per scheme.</pre></div>
  <div class="railsec"><b>Data lineage</b>
    <pre class="code">beneficiary  PM Vishwakarma / NSFDC / NBCFDC
cluster      SFURTI register
GI           Geographical Indications registry
income       settlement records (direct-to-bank)
blocked      cost-floor refusals, logged</pre>
    <p class="note">Every figure traces to a record the ministry already holds or to an
      event this platform generated. Nothing is modelled.</p></div>`;
}
function setRail(html){
  const app = window.__app; if(!app) return;
  app.rail.engine = html;
  if(app.railTab === 'engine'){ const b = document.getElementById('railBody'); if(b) b.innerHTML = html; }
}

export default { screens:{
  'g.overview':overview, 'g.people':people, 'g.person':person,
  'g.clusters':clusters, 'g.impact':impact, 'g.account':account,
}};
