# Vistaar

**SIH PS-90 — Ministry of Social Justice & Empowerment.**
A voice-first business manager for artisans and weavers. One voice note becomes a
priced, authenticated listing on ONDC, Indiahandmade, GeM and WhatsApp — and the
order comes back as a phone call in her language.

**Live — https://vistaar-sih.vercel.app**  ·  **Repo — https://github.com/vayam404/vistaar**

Three role-based surfaces over one dataset: **artisan**, **buyer**, **ministry**.
An RFQ posted in the buyer app really does land in the artisan's inbox; the
dashboard really does read the listing you just published — across devices,
because the dataset is a real Postgres, not a fixture. Nothing is staged
between them.

---

## Run

Live: **https://vistaar-sih.vercel.app** — open it on a phone, it is the same build.

Locally:

```bash
node vistaar/serve.mjs
```

Open **http://localhost:5173** in Chrome or Edge.

Do not open `index.html` off the filesystem — the Web Speech API and
`getUserMedia` need a secure context (localhost or https), so the mic and camera
are dead on a `file://` path. The **sample voice** and **sample photo** buttons
drive the entire flow when the mic or camera is unavailable, which is also the
fallback if a judge takes the phone or the venue blocks permissions.

Press **D** anywhere in the app to open the diagnostics suite.

---

## The 90-second demo path

1. **Artisan** → phone → OTP (pre-filled) → spoken consent.
2. **नया सामान बेचें** → tap capture ×4. Watch the QC gate score each frame on
   eight measured quantities and correct it. Frame 1 is a deliberately bad
   workshop shot; frame 3 is underexposed.
3. **Sample 2 — incomplete answer.** The extractor recovers what it heard, marks
   what it did not, and asks **one** spoken follow-up — the field that moves the
   cost floor most.
4. **Price.** Drag below the floor. It blocks, disables publish, and says why out
   loud. The refused amount is written to the ministry's "losses prevented".
5. **Publish.** Four channels fan out on a retrying queue. Three go live, ONDC
   lands in `pending` because we are not yet a registered seller-NP — labelled,
   not hidden. Open the **Payload** tab in the rail for the actual Beckn JSON.
6. **Simulate an order** → it arrives as a **full-screen phone call**, read aloud
   in Hindi, confirmed with one keypress.
7. Switch to **Buyer** — your new listing is top of the grid. Post an RFQ and
   watch capability matching decompose into weighted factors.
8. Switch to **Ministry** — median income delta, not GMV.

---

## What is real and what is mocked

Labelled in-product too, under the x-ray rail → Engine.

| Layer | In this prototype | In production |
|---|---|---|
| Speech in/out | **Real** — Web Speech API (`hi-IN`), live mic RMS drives the waveform | Bhashini ULCA ASR/NMT/TTS; Sarvam or Agni as fallback |
| Camera | **Real** — `getUserMedia`, live preview, framing guide | same |
| Image QC gate | **Real** — 8 metrics, thresholds, grade, spoken remediation | same, plus MODNet/U2Net alpha matting on TFLite |
| Image correction | **Real** — canvas: grey-world WB, auto-levels, soft matte, USM | same, on-device |
| Speech → schema | **Real** — lexicon + numeral parsing + per-field confidence | Bhashini NMT → schema-constrained LLM, same validators |
| Cost floor | **Real** — arithmetic, every term itemised | same, wage bound to notified state minimum |
| Comparables | **Real** — cosine retrieval over an embedded corpus | same, over platform transaction history |
| Channel payloads | **Real** — protocol-correct, schema-validated before send | same |
| RFQ matching | **Real** — weighted, fully decomposed | same |
| Persistence | **Real** — Supabase Postgres (ap-south-1), RLS, offline-first sync queue | same |
| **Network endpoints** | **Mocked** — latency, 429/500 injection, retries | ONDC via seller-NP, GeM, Indiahandmade, WhatsApp Cloud API |
| **Telephony** | **Mocked** — the call UI is local TTS | Exotel / Plivo outbound + IVR |

A judge forgives a labelled mock. They do not forgive a hidden one.

---

## Architecture

```
index.html
├── app.css / components.css      design system, then components
└── js/
    ├── app.js          shell, auth, router, x-ray rail
    ├── i18n.js         every string, hi + en, no hardcoded copy in views
    ├── data.js         seed data + the one store all three roles share
    ├── remote.js       Supabase Postgres over PostgREST + offline-first queue
    ├── lib.js          DOM, icons, formatting, speech adapter, overlays
    ├── vision.js       image quality gate + correction pipeline
    ├── nlu.js          transcript → validated schema, follow-up ranking
    ├── pricing.js      cost floor (arithmetic) + comparables (retrieval)
    ├── channels.js     payload builders, schema validators, publish queue
    ├── match.js        RFQ ↔ capability matching
    ├── diagnostics.js  55 assertions over all of the above
    ├── artisan.js      artisan surface
    ├── buyer.js        buyer surface
    └── ministry.js     ministry dashboard
```

No build step, no bundler, no CDN dependency at runtime. Fonts load
non-blocking and fall back to a system stack, so the page is fully usable with
no network at all.

---

## The image quality gate — the eight parameters

Analysis runs on a fixed 320px downsample so numbers are comparable across
devices, once per **captured** frame (not per preview frame), in ~25–50ms.
Everything is measured on the **subject mask**, not the whole frame — a
correctly matted product sits on a white backdrop, and a whole-frame exposure
reading would score that as blown highlights and punish the pipeline for
working.

| Metric | Measured as | Weight | Recoverable? |
|---|---|---|---|
| Sharpness | Variance of Laplacian over the eroded subject mask | 0.22 | no |
| Exposure | Dynamic range + distance from mid-grey + clipping, over the subject | 0.16 | no |
| Subject fill | Foreground pixels ÷ frame | 0.15 | no |
| Background | `1 − σ(luma)` of the border ring | 0.12 | yes |
| Centering | Mask centroid offset from frame centre | 0.09 | yes |
| White balance | Shades-of-Grey (Minkowski p=6) illuminant deviation | 0.12 | yes |
| Glare | Fraction of bright **and** desaturated pixels on the subject | 0.08 | no |
| Resolution | Short edge vs GeM's 1000px floor (ONDC's is 500px) | 0.06 | no |

**Admission policy.** The weighted score judges overall quality; hard floors
disqualify on any single catastrophic metric. But a frame is **refused only when
an irrecoverable metric fails hard** — blur, crushed shadows, blown highlights
and missing pixels are information that is not in the file, and no pipeline
invents it. A colour cast, an off-centre subject or a cluttered backdrop *are*
fixable, so those are corrected and the advice is spoken for the next shot.
Refusing a photo we could have fixed has a real cost: an artisan who has already
put the loom away.

**Why Shades-of-Grey and not grey-world.** Grey-world over the subject reads an
indigo saree as a colour cast. The grey-pixel method is fragile when a workshop
frame contains almost no neutral surface. The Minkowski p-norm (p=6) generalises
both — it leans on the brighter pixels, where illuminant information actually
lives, without being hostage to one blown pixel. One number, no per-scene tuning.

**Correction order matters.** White balance → auto-levels → *re-estimate the
backdrop* → soft matte → unsharp mask. The re-estimate is not optional: using the
backdrop colour measured before WB and levels targets a colour those two steps
have already moved, the matte lifts the wrong pixels, and measured quality goes
*down* after "correction". The diagnostics suite asserts the delta specifically
to catch that regression.

Levels map into `[6, 246]` with the gain capped at 1.85. A hard stretch to pure
white turns an existing specular highlight into a blown region — correcting an
image should not destroy the information in it.

---

## Distribution — how we know it works

Per channel we hold a **field-level spec** (`SPECS` in `channels.js`), a
**builder**, and a **validator**. Conformance is measured, not asserted:

```
ONDC  22/22 required  +1/1 optional   CONFORMANT
IHM   12/12 required  +1/1 optional   CONFORMANT
GeM   16/16 required  +0/1 optional   CONFORMANT
WA     9/9  required  +1/1 optional   CONFORMANT
```

A payload that fails its own spec is **never sent**. Catching it here costs
nothing; catching it at the partner costs a rejected listing.

The queue is real:

- **Idempotency** — `vs_<channel>_<sku>_<fnv1a(payload)>`. Derived from content,
  so it is stable across retries and page reloads and changes when the price does.
- **Retries** — 3 attempts, exponential ×2 from 420ms, ±25% jitter.
- **Partial success is a first-class state.** Four channels have four latencies
  and four failure modes; doing this synchronously would freeze her phone on the
  slowest one. Three live and one pending is a real, displayable outcome.
- GeM injects a 429 on first attempt and WhatsApp a 500, so the retry path is
  exercised in the demo rather than being dead code.

HSN codes and GST slabs come from a table, never a guess — getting them wrong is
a compliance liability in the artisan's name.

---

## Pricing — two mechanisms, deliberately kept apart

**The cost floor is arithmetic.** Material + (days × state wage × craft skill
grade) + 6% wastage + packaging + logistics, all ÷ (1 − commission). Commission
is taken at the **worst** channel the listing will appear on, so the floor holds
everywhere it is published rather than only on the cheapest rail. Every term is
shown to her as a line item. It has no training data and cannot be wrong in a way
we cannot audit.

**Comparables are retrieval, not prediction.** The product is embedded (category,
material, technique, effort band, GI) and the *k* nearest real listings are
returned with their real prices and their similarity. There is no public dataset
of Indian handicraft transaction prices — anyone claiming a trained pricing model
either invented the data or is calling a lookup a model.

**The floor is enforced, not advisory.** Below it, publish is disabled and the
loss is spoken aloud.

**When the floor sits above market p75**, the app says so plainly rather than
smoothing it into "high price": comparable listings top out at ₹X, your cost is
₹Y, that is not your mistake — the market is not paying for your labour. Then
three honest options. A 12-day handloom saree at a fair wage genuinely costs more
than comparable listings sell for, and that finding is the entire argument for
pricing her time at all.

---

## Follow-up questions are chosen by sensitivity

Not a fixed script. Each missing field is perturbed across a plausible range and
the induced spread in the cost floor is measured; the widest spread wins.

```
days       ₹ 13361  (1851% of floor)
matCost    ₹  2568  ( 356% of floor)
→ asking "days" first
```

Labour days move the floor by thousands; material cost by hundreds. So we ask
about days — which is also the field nobody has ever asked her about. Asking a
woman with a loom three questions when one determines the answer is a design
failure, not thoroughness.

---

## Diagnostics

**Press D in the app**, or open `/selftest.html` for a plain-text run.

55 assertions across every engine. It is not decoration — it found three real
bugs during construction:

1. `QC.sharpness` mixed raw Variance-of-Laplacian units with normalised score
   units, so the sharpness gate hard-failed **every** frame — and silently faked
   a pass on the "rejects a bad frame" test.
2. The matte used a backdrop estimate taken *before* white balance and levels
   moved every pixel, so correction measurably **lowered** image quality.
3. `numberNear` returned the first keyword hit and bailed, so *"twelve **days**
   … **raw** material"* bound 12 to material cost; adjacency also broke on
   filler words (*"महीने **में** छह"*).

Notable assertions:

- the floor is monotone in labour and never below subtotal
- commission is taken at the worst channel, not the cheapest
- a below-floor price is refused and the loss is exact
- retrieval returns the nearest *craft*, not merely the same category
- compound Hindi numerals (`आठ सौ` → 800) and Devanagari digits (`१२` → 12)
- a value never heard is reported missing, never invented
- profile-filled fields carry low confidence, not high
- the QC gate admits a clean frame and refuses an unrecoverable one
- **correction measurably raises the score of a bad frame** (analyse → correct →
  analyse, asserting the delta)
- a *correctable* defect is never refused, only advised
- every channel payload satisfies its own required-field spec
- an injected schema defect is caught **before** send
- idempotency keys are stable on content and change on content
- the matcher never ranks an infeasible artisan as feasible
- no translation key exists in one language and not the other

---

## Speech engine is swappable

`speech` in `lib.js` is an adapter. Web Speech is the zero-signup default that
the demo runs on. **Profile → Speech settings** takes a Bhashini ULCA `userID`
and `ulcaApiKey` and the engine switches live — pipeline resolution, ASR, NMT and
TTS are implemented against the real MeitY endpoints. Credentials are issued to a
registered organisation, so they are pasted in rather than shipped in the bundle.

Nothing else in the app knows which engine is live.

**Why a cascade, not end-to-end speech-to-speech.** Speech-to-speech is faster and
demos beautifully. It breaks when someone starts in Hindi and drops an English
word mid-sentence, which is how every one of these users actually talks — and you
cannot inspect why, because there is no text to look at. We trade ~1s for a
transcript we can validate, show back, and debug.

---

## Persistence — a real database, without becoming dependent on it

The shared dataset lives in **Supabase Postgres (ap-south-1)**, in the
`VBH STUDIO AGENCY PORTAL` project, isolated behind a `vs_` table prefix so it
shares the project without touching anything else in it. Six tables:
`vs_clusters`, `vs_artisans` (reference), `vs_products`, `vs_orders`,
`vs_rfqs`, `vs_events`.

It is talked to over **PostgREST with plain `fetch`, not the Supabase SDK** —
deliberately, so the app keeps its no-build-step / no-CDN-at-runtime property
and still opens and runs with no network at all. The database is an upgrade
when reachable, never a dependency.

**Offline-first, because the pitch claims it.** Every mutation writes to local
state and a durable localStorage queue first; the queue drains to Postgres when
the network allows, retries with backoff, and survives a reload mid-publish. The
rail header shows the truth in both directions — `Postgres live · 76ms` or
`offline · local queue · 2 queued`. Demonstrate it:

```js
vistaar.offline(true)   // publish a listing — it works, and queues
vistaar.offline(false)  // watch the queue drain
```

**Row-level security is the boundary, not key secrecy.** The publishable key
ships in the bundle, which is how Supabase is designed to work. Policies grant
`anon` read on reference data and read/insert/update on exactly the four demo
tables. **No delete is granted anywhere**, so the worst an abusive client can do
is add rows. Supabase’s security advisor reports **no findings against any
`vs_` table**.

**One bug worth knowing about**, because it is the classic distributed-systems
trap and it bit during integration: PostgREST answers a `Prefer: return=minimal`
write with **201 and an empty body**. Calling `.json()` on that throws, so a
*successful* write looked like a failure and the queue retried a row that had
already committed — four times. The fix is two-part, and both halves matter:
parse only what is actually there, **and** make the writes idempotent, because
at-least-once delivery guarantees a duplicate will eventually happen anyway.
Products and orders carry their own primary key and upsert; events now carry a
content-derived `dedupe_key` behind a unique index, so a retried floor-block
cannot double-count the ministry's “losses prevented”.

## Deploy

Static, so any host works. Nothing is server-rendered and there is no build step —
Vercel uploads the directory and serves it; there is nothing to compile.

```bash
cd vistaar && npx vercel deploy --prod --yes
```

Live at **https://vistaar-sih.vercel.app**. `.vercelignore` keeps the local dev
server out of the bundle.

`vercel.json` pins it as a static site with long-lived caching on assets and
none on HTML. For a ministry deployment the same directory drops behind any
static server on NIC MeghRaj — the point of building on public rails is that the
handover is a directory copy, not a dependency on us.

---

## Deliberate omissions

- **No AI-generated product imagery.** In handicraft the authenticity *is* the
  price premium; a synthetic product shot destroys the thing being sold and
  misrepresents a physical good. AI finishes real footage, never invents it.
- **We never custody funds.** Settlement is direct to her bank, which removes RBI
  payment-aggregator exposure and the "new middleman" objection at once.
- **No covert account creation.** Delegation happens through official rails only —
  seller-NP on ONDC, Business Manager partner access on Meta, authorised
  representative on GeM.
- **We do not become an ONDC network participant.** Onboarding through an existing
  seller app is weeks and near-zero cost against a protocol build and a
  governance process.
