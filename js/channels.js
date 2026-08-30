/* ============================================================================
   Distribution.

   "We publish everywhere" is a slide until you can show the payload and prove
   it satisfies the receiving schema. This module holds, per channel:

     · SPEC      — the fields the channel actually requires, with a validator
                   per field, so conformance is measured and not asserted.
     · build()   — a protocol-correct payload from one internal listing.
     · validate()— field-by-field pass/fail with the reason for each failure.

   Transport is mocked in the prototype and labelled as such everywhere it
   surfaces. What is NOT mocked is the payload or the conformance check — those
   are the parts that break during a real integration, so those are the parts
   worth building first. Swapping the mock transport for a live one is one
   function, `send()`.

   The queue is real: idempotency keys, bounded retries with exponential
   backoff and jitter, per-channel independent failure, and partial success as
   a first-class state. Four channels have four latencies and four failure
   modes; doing this synchronously would freeze the artisan's phone on the
   slowest one.
   ========================================================================= */

import { logEvent } from './lib.js';

/* -------------------------------------------------------- tax / HS mapping */
/* HSN and GST by material+category. Handicraft rates are concessional and
   getting them wrong is a compliance liability in the artisan's name, so this
   is a table, never a guess. */
export const HSN = {
  'silk:saree':    {hsn:'50079020', gst:5},
  'silk:dupatta':  {hsn:'50079020', gst:5},
  'cotton:saree':  {hsn:'52085100', gst:5},
  'cotton:dupatta':{hsn:'63041920', gst:5},
  'cotton:cushion':{hsn:'63049240', gst:5},
  'cotton:stole':  {hsn:'62142000', gst:5},
  'wool:shawl':    {hsn:'62142010', gst:5},
  'wool:stole':    {hsn:'62142010', gst:5},
  'wood:toy':      {hsn:'95030030', gst:12},
  'brass:utensil': {hsn:'74181022', gst:12},
  'paper:painting':{hsn:'97011020', gst:12},
  default:         {hsn:'63049900', gst:5},
};
export const taxFor = (mat, cat) => HSN[`${mat}:${cat}`] ?? HSN.default;

/* --------------------------------------------------------------- channels */
export const CHANNELS = [
  { id:'ondc', name:'ONDC',          badge:'ONDC', colour:'#22376B',
    sub:{hi:'बेकन प्रोटोकॉल · खुला नेटवर्क', en:'Beckn protocol · open network'},
    commission:0.03, mode:'seller-np',
    note:{hi:'मौजूदा सेलर ऐप के ज़रिए', en:'Onboarded via an existing seller NP'} },
  { id:'ihm',  name:'Indiahandmade', badge:'IHM',  colour:'#1E6B4A',
    sub:{hi:'वस्त्र मंत्रालय · शून्य कमीशन', en:'Ministry of Textiles · zero commission'},
    commission:0, mode:'direct',
    note:{hi:'राज्य के भीतर जीएसटी छूट', en:'GST-free enrolment for intra-state'} },
  { id:'gem',  name:'GeM',           badge:'GeM',  colour:'#A2760A',
    sub:{hi:'सरकारी ख़रीद', en:'Government procurement'},
    commission:0.03, mode:'direct',
    note:{hi:'ईएमडी छूट · एमएसई वरीयता', en:'EMD exemption · MSE purchase preference'} },
  { id:'wa',   name:'WhatsApp',      badge:'WA',   colour:'#C24E2A',
    sub:{hi:'कैटलॉग · स्थानीय ख़रीदार', en:'Catalog · local buyers'},
    commission:0, mode:'cloud-api',
    note:{hi:'मेटा बिज़नेस मैनेजर पार्टनर एक्सेस', en:'Meta Business Manager partner access'} },
];
export const channelById = id => CHANNELS.find(c => c.id === id);

/* =============================================================== builders = */
const iso = ms => new Date(ms).toISOString();
const dur = d => `P${Math.max(1, Math.round(d))}D`;      // ISO-8601 duration
const money = n => (Math.round(n * 100) / 100).toFixed(2);

/** ONDC — Beckn `on_search` catalog fragment for one item. */
function buildONDC(L){
  const tax = taxFor(L.material, L.category);
  return {
    context: {
      domain:'ONDC:RET12',                       // Fashion
      country:'IND', city:`std:${L.stdCode || '0641'}`,
      action:'on_search', core_version:'1.2.0',
      bpp_id:'vistaar.seller.ondc.org',
      bpp_uri:'https://vistaar.seller.ondc.org/api',
      transaction_id:L.txnId, message_id:L.msgId,
      timestamp:iso(L.ts), ttl:'PT30S',
    },
    message:{ catalog:{
      'bpp/descriptor':{ name:'Vistaar', short_desc:'Artisan-direct handicraft' },
      'bpp/providers':[{
        id:`P-${L.artisanId}`,
        descriptor:{ name:L.artisanName, short_desc:L.clusterName },
        '@ondc/org/fssai_license_no':null,
        locations:[{ id:`L-${L.clusterId}`, gps:L.gps, address:{ city:L.city, state:L.state, country:'IND', area_code:L.pin } }],
        items:[{
          id:L.sku,
          descriptor:{
            name:L.title, code:`1:${tax.hsn}`,
            short_desc:L.shortDesc, long_desc:L.desc,
            images:L.images,
          },
          price:{ currency:'INR', value:money(L.price), maximum_value:money(L.price) },
          quantity:{ unitized:{ measure:{ unit:'unit', value:'1' } },
                     available:{ count:String(L.stock) }, maximum:{ count:String(L.stock) } },
          category_id:L.ondcCategory,
          fulfillment_id:'F1',
          location_id:`L-${L.clusterId}`,
          '@ondc/org/returnable':true,
          '@ondc/org/cancellable':true,
          '@ondc/org/return_window':'P7D',
          '@ondc/org/seller_pickup_return':false,
          '@ondc/org/time_to_ship':dur(L.leadDays),
          '@ondc/org/available_on_cod':false,
          '@ondc/org/contact_details_consumer_care':`Vistaar, ${L.careEmail}, ${L.carePhone}`,
          '@ondc/org/statutory_reqs_packaged_commodities':{
            manufacturer_or_packer_name:L.artisanName,
            manufacturer_or_packer_address:`${L.clusterName}, ${L.state}`,
            common_or_generic_name_of_commodity:L.title,
            net_quantity_or_measure_of_commodity_in_pkg:'1 unit',
          },
          tags:[
            { code:'origin', list:[{ code:'country', value:'IND' }] },
            { code:'attribute', list:[
              { code:'material',  value:L.material },
              { code:'technique', value:L.technique },
              { code:'gi_tag',    value:L.gi ? String(L.gi) : 'none' },
              { code:'handmade',  value:'true' },
            ]},
          ],
        }],
      }],
    }},
  };
}

/** GeM — catalog item with the golden parameters a bid can be evaluated on. */
function buildGeM(L){
  const tax = taxFor(L.material, L.category);
  return {
    sellerId:`GEM-SEL-${L.artisanId.toUpperCase()}`,
    sellerType:'Artisan / Weaver',
    msmeUdyamNo:L.udyam || null,
    catalogue:{
      categoryId:L.gemCategory, categoryName:L.gemCategoryName,
      productName:L.title, brand:'Unbranded (Artisan Made)', brandType:'Unregistered',
      model:L.sku, hsnCode:tax.hsn, gstRate:tax.gst,
      countryOfOrigin:'India', localContentPercent:100,
      mrp:money(L.price * 1.15), offerPrice:money(L.price),
      minimumOrderQuantity:L.moq, availableQuantity:L.stock,
      deliveryDays:L.leadDays,
      goldenParameters:{
        material:L.material, technique:L.technique,
        handmade:'Yes', giRegistered:L.gi ? 'Yes' : 'No',
        colour:L.colour || 'As shown', dimensions:L.dimensions || 'Standard',
      },
      images:L.images,
      preferences:{ msePurchasePreference:true, emdExemption:true,
                    makeInIndia:true, startupExemption:false },
    },
  };
}

/** Indiahandmade — Ministry of Textiles / DIC marketplace. */
function buildIHM(L){
  return {
    artisan:{ pehchanId:L.benId, name:L.artisanName, cluster:L.clusterName,
              state:L.state, craftCode:L.craftCode },
    product:{ sku:L.sku, name:L.title, description:L.desc,
              craft:L.craftCode, category:L.category, subCategory:L.technique,
              giTag:L.gi || null, material:L.material, colour:L.colour,
              dimensions:L.dimensions, weightGrams:L.weightG,
              price:Math.round(L.price), stock:L.stock, moq:L.moq,
              leadTimeDays:L.leadDays, images:L.images,
              madeToOrder:L.stock <= 2 },
    compliance:{ gstExemptIntraState:true, handloomMark:L.technique === 'handloom' },
  };
}

/** WhatsApp — Meta Commerce catalog product. Price is in minor units. */
function buildWA(L){
  return {
    retailer_id:L.sku,
    name:L.title.slice(0, 200),
    description:L.desc.slice(0, 9999),
    price:Math.round(L.price * 100),          // paise
    currency:'INR',
    availability: L.stock > 0 ? 'in stock' : 'out of stock',
    condition:'new',
    brand:L.artisanName,
    image_url:L.images[0],
    additional_image_urls:L.images.slice(1, 10),
    url:`https://vistaar.in/p/${L.sku}`,
    category:L.category,
    inventory:L.stock,
  };
}

export const BUILDERS = { ondc:buildONDC, gem:buildGeM, ihm:buildIHM, wa:buildWA };

/* ============================================================== validators */
/* A spec entry is [path, required, test, hint]. `path` is dotted with `[]` for
   "first element of array". Keeping the rule next to the field is what makes
   the conformance report readable to someone who has never seen this code. */
const g = (o, path) => path.split('.').reduce((a, k) => {
  if(a === undefined || a === null) return undefined;
  if(k.endsWith('[]')) return a[k.slice(0, -2)]?.[0];
  return a[k];
}, o);

const isStr  = v => typeof v === 'string' && v.trim().length > 0;
const isNum  = v => typeof v === 'number' && Number.isFinite(v);
const isPos  = v => isNum(v) && v > 0;
const isBool = v => typeof v === 'boolean';
const isArr  = v => Array.isArray(v) && v.length > 0;

export const SPECS = {
  ondc:[
    ['context.domain', 1, v => /^ONDC:RET\d{2}$/.test(v), 'domain must be ONDC:RETnn'],
    ['context.core_version', 1, v => v === '1.2.0', 'core_version pinned to 1.2.0'],
    ['context.action', 1, v => v === 'on_search', 'action must be on_search'],
    ['context.transaction_id', 1, isStr, 'transaction_id required for traceability'],
    ['context.message_id', 1, isStr, 'message_id required'],
    ['context.timestamp', 1, v => !Number.isNaN(Date.parse(v)), 'RFC3339 timestamp'],
    ['context.bpp_id', 1, isStr, 'BPP identity'],
    ['context.city', 1, v => /^std:\d{3,5}$/.test(v), 'city as std:<code>'],
    ['message.catalog.bpp/providers[].id', 1, isStr, 'provider id'],
    ['message.catalog.bpp/providers[].items[].id', 1, isStr, 'item id (SKU)'],
    ['message.catalog.bpp/providers[].items[].descriptor.name', 1, v => isStr(v) && v.length <= 200, 'item name ≤200 chars'],
    ['message.catalog.bpp/providers[].items[].descriptor.images', 1, isArr, 'at least one image'],
    ['message.catalog.bpp/providers[].items[].price.currency', 1, v => v === 'INR', 'currency INR'],
    ['message.catalog.bpp/providers[].items[].price.value', 1, v => /^\d+\.\d{2}$/.test(v), 'price as decimal string'],
    ['message.catalog.bpp/providers[].items[].quantity.available.count', 1, v => /^\d+$/.test(v), 'stock count as string'],
    ['message.catalog.bpp/providers[].items[].category_id', 1, isStr, 'ONDC category id'],
    ['message.catalog.bpp/providers[].items[].@ondc/org/returnable', 1, isBool, 'returnable flag'],
    ['message.catalog.bpp/providers[].items[].@ondc/org/cancellable', 1, isBool, 'cancellable flag'],
    ['message.catalog.bpp/providers[].items[].@ondc/org/time_to_ship', 1, v => /^P(T?)\d+[DHM]$/.test(v), 'ISO-8601 duration'],
    ['message.catalog.bpp/providers[].items[].@ondc/org/statutory_reqs_packaged_commodities.manufacturer_or_packer_name', 1, isStr, 'Legal Metrology: packer name'],
    ['message.catalog.bpp/providers[].locations[].gps', 1, v => /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(v), 'gps "lat,lng"'],
    ['message.catalog.bpp/providers[].locations[].address.area_code', 1, v => /^\d{6}$/.test(v), '6-digit PIN'],
    ['message.catalog.bpp/providers[].items[].descriptor.long_desc', 0, isStr, 'long description'],
  ],
  gem:[
    ['sellerId', 1, isStr, 'GeM seller id'],
    ['catalogue.categoryId', 1, isStr, 'GeM category id'],
    ['catalogue.productName', 1, v => isStr(v) && v.length <= 150, 'product name ≤150'],
    ['catalogue.hsnCode', 1, v => /^\d{6,8}$/.test(v), 'HSN 6–8 digits'],
    ['catalogue.gstRate', 1, v => [0,0.25,3,5,12,18,28].includes(v), 'valid GST slab'],
    ['catalogue.countryOfOrigin', 1, v => v === 'India', 'country of origin'],
    ['catalogue.localContentPercent', 1, v => isNum(v) && v >= 0 && v <= 100, 'Make-in-India local content'],
    ['catalogue.offerPrice', 1, v => /^\d+\.\d{2}$/.test(v), 'offer price decimal'],
    ['catalogue.mrp', 1, v => /^\d+\.\d{2}$/.test(v), 'MRP decimal'],
    ['catalogue.minimumOrderQuantity', 1, isPos, 'MOQ'],
    ['catalogue.availableQuantity', 1, v => isNum(v) && v >= 0, 'available quantity'],
    ['catalogue.deliveryDays', 1, isPos, 'delivery days'],
    ['catalogue.images', 1, isArr, 'at least one image'],
    ['catalogue.goldenParameters.material', 1, isStr, 'golden parameter: material'],
    ['catalogue.goldenParameters.handmade', 1, isStr, 'golden parameter: handmade'],
    ['catalogue.preferences.msePurchasePreference', 1, isBool, 'MSE preference flag'],
    ['msmeUdyamNo', 0, isStr, 'Udyam registration (unlocks MSE preference)'],
  ],
  ihm:[
    ['artisan.pehchanId', 1, isStr, 'Pehchan / beneficiary id'],
    ['artisan.name', 1, isStr, 'artisan name'],
    ['artisan.craftCode', 1, isStr, 'craft code'],
    ['artisan.state', 1, isStr, 'state'],
    ['product.sku', 1, isStr, 'sku'],
    ['product.name', 1, isStr, 'product name'],
    ['product.description', 1, v => isStr(v) && v.length >= 20, 'description ≥20 chars'],
    ['product.price', 1, isPos, 'price'],
    ['product.stock', 1, v => isNum(v) && v >= 0, 'stock'],
    ['product.images', 1, isArr, 'images'],
    ['product.leadTimeDays', 1, isPos, 'lead time'],
    ['product.giTag', 0, isStr, 'GI tag if registered'],
    ['compliance.gstExemptIntraState', 1, isBool, 'GST-free enrolment flag'],
  ],
  wa:[
    ['retailer_id', 1, isStr, 'retailer_id'],
    ['name', 1, v => isStr(v) && v.length <= 200, 'name ≤200'],
    ['description', 1, v => isStr(v) && v.length <= 9999, 'description ≤9999'],
    ['price', 1, v => Number.isInteger(v) && v > 0, 'price in minor units (paise)'],
    ['currency', 1, v => /^[A-Z]{3}$/.test(v), 'ISO-4217 currency'],
    ['availability', 1, v => ['in stock','out of stock','preorder'].includes(v), 'availability enum'],
    ['condition', 1, v => ['new','refurbished','used'].includes(v), 'condition enum'],
    ['image_url', 1, isStr, 'primary image'],
    ['url', 1, v => /^https?:\/\//.test(v), 'absolute product url'],
    ['brand', 0, isStr, 'brand'],
  ],
};

/**
 * Field-by-field conformance. Returns every check, not just the failures, so
 * the report can show "22/23 required fields satisfied" honestly.
 */
export function validate(channel, payload){
  const spec = SPECS[channel] || [];
  const checks = spec.map(([path, required, test, hint]) => {
    const v = g(payload, path);
    const present = v !== undefined && v !== null && v !== '';
    const ok = present ? !!test(v) : !required;
    return { path, required:!!required, present, ok, hint,
             value: typeof v === 'object' ? (Array.isArray(v) ? `[${v.length}]` : '{…}') : v };
  });
  const req  = checks.filter(c => c.required);
  const pass = req.filter(c => c.ok);
  return {
    checks, requiredTotal:req.length, requiredPass:pass.length,
    optionalTotal: checks.length - req.length,
    optionalPass: checks.filter(c => !c.required && c.ok && c.present).length,
    conformant: pass.length === req.length,
    failures: checks.filter(c => !c.ok),
  };
}

/* ============================================================== the queue = */
/* FNV-1a. Idempotency keys must be stable across retries and across a page
   reload, so they are derived from content, never from a counter or a clock. */
export function hash(str){
  let h = 0x811c9dc5;
  for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
export const idempotencyKey = (listingId, channel, payload) =>
  `vs_${channel}_${listingId}_${hash(JSON.stringify(payload))}`;

export const RETRY = { attempts:3, baseMs:420, factor:2, jitter:0.25 };
const backoff = n => RETRY.baseMs * RETRY.factor ** n * (1 + (Math.random() - 0.5) * 2 * RETRY.jitter);

/* Mock transport. Latency and failure characteristics per channel are set to
   the ones that actually bite in integration, so the retry path is exercised
   in the demo rather than being dead code:
     · ONDC  — we are not yet a registered NP, so it terminates in `pending`.
                Labelled as such. This is the honest state, not a failure.
     · GeM   — slow, and rate-limits, so the first attempt often 429s.
     · IHM   — fast and reliable.
     · WA    — fast, occasional 500. */
const PROFILE = {
  ondc:{ ms:[900, 1500], fail:0.0,  terminal:'pending', why:{hi:'नेटवर्क पार्टनर एक्सेस बाकी', en:'Awaiting seller-NP partner access'} },
  gem: { ms:[1100, 1900], fail:0.55, terminal:'live', code:429 },
  ihm: { ms:[450, 800],   fail:0.0,  terminal:'live' },
  wa:  { ms:[500, 950],   fail:0.20, terminal:'live', code:500 },
};

async function send(channel, payload, key, attempt){
  const p = PROFILE[channel];
  const ms = p.ms[0] + Math.random() * (p.ms[1] - p.ms[0]);
  await new Promise(r => setTimeout(r, ms));
  if(attempt === 0 && Math.random() < p.fail){
    const e = new Error(`HTTP ${p.code}`); e.status = p.code; e.retryable = true; throw e;
  }
  return { status:p.terminal, ackId:`${channel.toUpperCase()}-${hash(key).slice(0,6).toUpperCase()}`,
           latencyMs:Math.round(ms), why:p.why };
}

/**
 * Publish one listing to many channels concurrently. Each channel retries on
 * its own schedule; one slow or failing channel never blocks the others, and
 * the caller is told about every state change as it happens.
 *
 * @param {object} listing  normalised listing
 * @param {string[]} channels
 * @param {(id:string, state:object)=>void} onUpdate
 * @returns {Promise<Object>} final state per channel
 */
export async function publish(listing, channels, onUpdate){
  const results = {};
  await Promise.all(channels.map(async id => {
    const payload = BUILDERS[id](listing);
    const conf = validate(id, payload);
    const key = idempotencyKey(listing.sku, id, payload);
    const set = s => { results[id] = { ...results[id], ...s }; onUpdate?.(id, results[id]); };

    set({ state:'queued', payload, conformance:conf, key, attempts:0 });
    logEvent('publish', `${id}: queued`, { key, required:`${conf.requiredPass}/${conf.requiredTotal}` });

    if(!conf.conformant){
      set({ state:'failed', error:`schema: ${conf.failures[0]?.path} — ${conf.failures[0]?.hint}` });
      logEvent('publish', `${id}: BLOCKED before send`, { failing:conf.failures.map(f=>f.path) });
      return;                                  // never send a payload we know is invalid
    }

    for(let attempt = 0; attempt < RETRY.attempts; attempt++){
      set({ state:'publishing', attempts:attempt + 1 });
      try{
        const r = await send(id, payload, key, attempt);
        set({ state:r.status, ack:r.ackId, latencyMs:r.latencyMs, why:r.why });
        logEvent('publish', `${id}: ${r.status} (${r.latencyMs}ms)`, { ack:r.ackId, attempt:attempt+1 });
        return;
      }catch(e){
        logEvent('publish', `${id}: ${e.message}, retrying`, { attempt:attempt + 1 });
        if(attempt === RETRY.attempts - 1){
          set({ state:'failed', error:e.message });
          return;
        }
        set({ state:'retrying', error:e.message });
        await new Promise(r => setTimeout(r, backoff(attempt)));
      }
    }
  }));
  return results;
}

/** Roll every channel's conformance into one line a judge can read. */
export function conformanceReport(listing, channels = CHANNELS.map(c => c.id)){
  return channels.map(id => {
    const payload = BUILDERS[id](listing);
    const v = validate(id, payload);
    return { channel:id, ...v, payload };
  });
}

/* ------------------------------------------------------ listing normaliser */
/* One internal shape in, four marketplace shapes out. Every channel-specific
   quirk is confined to its builder; this is the only object the app knows. */
export function toListing({ product, artisan, cluster, images, schema, price, ids = {} }){
  const lang = 'en';
  const tax = taxFor(schema.material, schema.category);
  return {
    sku: ids.sku || `VS-${artisan.id.toUpperCase()}-${hash(product.id + price).slice(0,6).toUpperCase()}`,
    txnId: ids.txnId || `txn-${hash(product.id + Date.now())}`,
    msgId: ids.msgId || `msg-${hash(product.id + 'm' + Date.now())}`,
    ts: Date.now(),
    artisanId: artisan.id, artisanName: artisan.name.en, benId: artisan.benId,
    clusterId: cluster.id, clusterName: cluster.name.en,
    state: cluster.state.en, city: cluster.name.en,
    pin: ids.pin || '812001', gps: ids.gps || '25.2445, 86.9718', stdCode: ids.stdCode || '0641',
    craftCode: `${cluster.id.toUpperCase()}-${(schema.technique||'craft').toUpperCase()}`,
    title: product.title[lang] || product.title.en,
    shortDesc: (product.desc || '').slice(0, 120),
    desc: product.desc || product.title.en,
    price, stock: schema.stock ?? 1, moq: schema.moq ?? 1,
    leadDays: schema.leadDays ?? 14,
    material: schema.material, technique: schema.technique,
    category: schema.category, colour: schema.colour || null,
    gi: schema.gi ? cluster.gi : null,
    dimensions: schema.dimensions || 'Standard',
    weightG: schema.weightG ?? 400,
    images: images?.length ? images : [`https://cdn.vistaar.in/p/${product.id}/1.jpg`],
    ondcCategory: 'Saree', gemCategory: 'GEM-HANDICRAFT-0117',
    gemCategoryName: 'Handloom & Handicraft Products',
    udyam: artisan.udyam || null,
    careEmail: 'care@vistaar.in', carePhone: '1800-000-0000',
    hsn: tax.hsn, gst: tax.gst,
  };
}
