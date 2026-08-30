/* i18n — every user-facing string lives here in both languages.
   Hindi is the primary voice of the product; English is the working language of
   buyers and ministry staff. Nothing is hardcoded in a view. */

export const DICT = {
  hi:{
    /* --- chrome --- */
    'app.name':'विस्तार',
    'app.tag':'आपका अपना बिज़नेस मैनेजर',
    'nav.home':'होम','nav.items':'सामान','nav.orders':'ऑर्डर','nav.money':'पैसा',
    'nav.discover':'खोजें','nav.rfq':'माँग','nav.buyorders':'ऑर्डर','nav.saved':'सहेजा',
    'nav.overview':'सार','nav.people':'लाभार्थी','nav.clusters':'क्लस्टर','nav.impact':'असर',
    'common.next':'आगे','common.back':'पीछे','common.done':'हो गया','common.cancel':'रद्द करें',
    'common.close':'बंद करें','common.save':'सहेजें','common.send':'भेजें','common.retry':'फिर से',
    'common.yes':'हाँ','common.no':'नहीं','common.live':'लाइव','common.pending':'बाकी',
    'common.all':'सभी','common.today':'आज','common.viewall':'सब देखें','common.month':'महीना',
    'common.perpiece':'प्रति नग','common.pieces':'नग','common.days':'दिन','common.na':'—',

    /* --- auth --- */
    'auth.h1':'एक आवाज़। पूरा बाज़ार।',
    'auth.lede':'बोलिए, बाकी सब हम करेंगे — फ़ोटो, दाम, और चार जगह आपका सामान।',
    'auth.who':'आप कौन हैं?',
    'auth.r1':'कारीगर','auth.r1s':'बुनकर, शिल्पकार — अपना सामान बेचें',
    'auth.r2':'सहायक','auth.r2s':'क्लस्टर सहायक — 20 कारीगरों का काम एक फ़ोन से',
    'auth.r3':'ख़रीदार','auth.r3s':'थोक ख़रीदार, निर्यातक, संस्थान',
    'auth.r4':'मंत्रालय','auth.r4s':'सामाजिक न्याय एवं अधिकारिता मंत्रालय — डैशबोर्ड',
    'auth.phone':'मोबाइल नंबर','auth.phoneph':'10 अंकों का नंबर',
    'auth.sendotp':'ओटीपी भेजें','auth.otp':'ओटीपी डालिए',
    'auth.otpsent':'{phone} पर भेजा गया','auth.demo':'डेमो ओटीपी अपने आप भर गया है',
    'auth.verify':'पक्का करें','auth.change':'नंबर बदलें',
    'auth.consent.h':'आपकी अनुमति',
    'auth.consent.p':'हम आपकी आवाज़ सुनकर आपका सामान चार जगह लगाएँगे। पैसा सीधे आपके बैंक खाते में आएगा — हम पैसे को हाथ नहीं लगाते।',
    'auth.consent.i1':'आवाज़ और फ़ोटो — सिर्फ़ सामान की लिस्टिंग बनाने के लिए',
    'auth.consent.i2':'नाम और क्लस्टर — ख़रीदार को दिखाने के लिए',
    'auth.consent.i3':'बैंक खाता — सीधे भुगतान के लिए, हम पैसा नहीं रखते',
    'auth.consent.rev':'आप कभी भी बोलकर अनुमति वापस ले सकती हैं।',
    'auth.consent.hear':'सुनकर समझें',
    'auth.consent.ok':'मैं सहमत हूँ',
    'auth.langq':'भाषा चुनें · Choose language',

    /* --- artisan home --- */
    'a.greet':'नमस्ते, {name}',
    'a.sub':'{cluster} · {craft}',
    'a.newitem':'नया सामान बेचें','a.newitems':'बोलकर लिस्टिंग बनाइए — 90 सेकंड',
    'a.thismonth':'इस महीने','a.earned':'कमाई','a.orders':'ऑर्डर','a.livelist':'लाइव सामान',
    'a.pendingorders':'{n} ऑर्डर बाकी है','a.rfqwaiting':'{n} थोक माँग आपके लिए',
    'a.recent':'हाल का काम','a.yourshop':'आपकी दुकान','a.capacity':'महीने की क्षमता',
    'a.nolistings':'अभी कोई सामान नहीं। नीचे का बटन दबाकर शुरू कीजिए।',
    'a.saved':'नुक़सान से बचाया','a.savedsub':'दाम की सीमा ने रोका',

    /* --- capture --- */
    'cap.title':'फ़ोटो लीजिए','cap.sub':'तीन तरफ़ से + बनाते हुए का वीडियो',
    'cap.shot1':'सामने से','cap.shot2':'किनारे से','cap.shot3':'बुनाई पास से','cap.shot4':'बनाते हुए',
    'cap.take':'फ़ोटो लें','cap.retake':'दोबारा','cap.allow':'कैमरा चालू करें',
    'cap.denied':'कैमरा नहीं मिला — नमूना फ़ोटो से आगे बढ़िए',
    'cap.sample':'नमूना फ़ोटो','cap.cleaning':'साफ़ किया जा रहा है…',
    'cap.cleaned':'पृष्ठभूमि साफ़, रंग ठीक किया गया','cap.hint':'सादे कपड़े पर रखिए, अच्छी रोशनी में',
    'cap.before':'पहले','cap.after':'बाद',

    /* --- voice --- */
    'v.title':'अपने सामान के बारे में बताइए',
    'v.sub':'जैसे बोलती हैं वैसे ही बोलिए',
    'v.tap':'बोलने के लिए दबाएँ','v.listening':'सुन रहे हैं… बोलिए','v.stop':'रोकें',
    'v.ph':'यहाँ आपकी बात दिखेगी…',
    'v.samplebtn':'नमूना आवाज़ चलाएँ','v.samplenote':'माइक न चले तो यह दबाइए',
    'v.sample2':'नमूना 2 — अधूरी जानकारी',
    'v.example':'जैसे: “यह भागलपुर सिल्क की साड़ी है, हाथ से बुनी, बारह दिन लगे, कच्चा माल आठ सौ का, नीली रंगाई है, महीने में छह बना लेती हूँ।”',
    'v.retry':'फिर से बोलें','v.usethis':'यही ठीक है',
    'v.nomic':'इस ब्राउज़र में माइक नहीं चलता — नमूना आवाज़ दबाइए',

    /* --- extraction --- */
    'x.title':'हमने यह समझा','x.sub':'ग़लत हो तो बदल दीजिए',
    'x.material':'कच्चा माल','x.technique':'तकनीक','x.size':'नाप','x.colour':'रंग',
    'x.days':'लगे दिन','x.matcost':'माल की लागत','x.stock':'तैयार माल','x.capacity':'महीने में बना सकती हैं',
    'x.missing':'यह नहीं बताया','x.ask':'एक बात और पूछनी है',
    'x.q.matcost':'कच्चा माल कितने का आया?','x.q.days':'कितने दिन लगे इसे बनाने में?',
    'x.q.capacity':'महीने में कितने बना सकती हैं?',
    'x.answer':'जवाब बोलिए','x.confirm':'सुनकर पक्का कीजिए','x.playback':'यह पढ़कर सुनाया जाएगा',
    'x.title2':'सामान का नाम','x.desc':'ख़रीदार को दिखने वाला विवरण',

    /* --- pricing --- */
    'p.title':'दाम तय कीजिए','p.sub':'आपकी लागत से नीचे नहीं जाएगा',
    'p.floor':'आपका सबसे कम दाम','p.yourcost':'आपकी असली लागत',
    'p.mat':'कच्चा माल','p.labour':'आपकी मज़दूरी','p.waste':'बर्बादी 6%',
    'p.pack':'पैकिंग','p.ship':'भाड़ा','p.comm':'चैनल कमीशन 3%',
    'p.market':'बाज़ार में ऐसे सामान','p.median':'बीच का दाम','p.premium':'सबसे ऊँचा',
    'p.blocked':'यह दाम नहीं लगेगा',
    'p.blockedwhy':'इस दाम पर ₹{loss} का नुक़सान होगा। यह बिक्री नहीं, घाटा है।',
    'p.okmargin':'आपकी लागत से {pct}% ऊपर','p.good':'अच्छा दाम','p.high':'ऊँचा दाम — बिकने में समय लगेगा',
    'p.abovemkt':'बाज़ार आपकी लागत से कम देता है',
    'p.abovemktwhy':'ऐसे सामान बाज़ार में ₹{p75} तक बिकते हैं, पर आपकी लागत ₹{floor} है। यह आपकी ग़लती नहीं — बाज़ार आपकी मज़दूरी का पूरा दाम नहीं दे रहा।',
    'p.opt1':'कम मेहनत वाला रूप बनाइए','p.opt2':'जीआई और प्रामाणिकता वाले ख़रीदार को बेचिए','p.opt3':'इस दाम पर यह सामान मत बनाइए',
    'p.set':'यही दाम रखें','p.spoken':'यह बात बोलकर भी बताई गई',
    'p.compare':'{n} मिलते-जुलते सामान से तुलना','p.wage':'मज़दूरी ₹{w}/दिन के हिसाब से',

    /* --- publish --- */
    'pub.title':'चार जगह भेज रहे हैं','pub.sub':'एक बार बोलीं, चार बाज़ार',
    'pub.q':'क़तार में','pub.p':'भेजा जा रहा है','pub.l':'लाइव','pub.w':'बाकी',
    'pub.done':'आपका सामान लाइव है','pub.donesub':'{n} जगह दिख रहा है',
    'pub.profile':'आपकी क्षमता प्रोफ़ाइल भी बनी','pub.profilesub':'थोक ख़रीदार अब आपको ढूँढ सकते हैं',
    'pub.gohome':'होम पर जाएँ','pub.viewitem':'सामान देखें',
    'pub.simnote':'डेमो में एंडपॉइंट नक़ली हैं — payload असली प्रोटोकॉल का है',

    /* --- orders --- */
    'o.title':'ऑर्डर','o.new':'नया ऑर्डर','o.none':'अभी कोई ऑर्डर नहीं',
    'o.tab.orders':'ऑर्डर','o.tab.rfq':'थोक माँग',
    'o.from':'{name} से','o.qty':'{n} नग','o.total':'कुल','o.status.new':'नया',
    'o.status.confirmed':'पक्का किया','o.status.packed':'पैक हुआ','o.status.shipped':'भेज दिया',
    'o.status.paid':'पैसा आ गया','o.status.declined':'मना किया',
    'o.confirm':'ऑर्डर लें','o.decline':'मना करें','o.sim':'ऑर्डर आने का डेमो',
    'o.callin':'आ रही कॉल','o.callsub':'विस्तार · आपकी भाषा में',
    'o.callsaid':'नमस्ते {name}। {buyer} ने आपकी {item} के {n} नग माँगे हैं। कुल {amt} रुपये। लेने के लिए एक दबाइए।',
    'o.press1':'ऑर्डर लें','o.press2':'अभी नहीं','o.pressone':'1 दबाएँ','o.presstwo':'2 दबाएँ',
    'o.accepted':'ऑर्डर पक्का हुआ','o.acceptedsub':'पैसा सीधे आपके खाते में आएगा',
    'o.rfqnone':'अभी कोई थोक माँग नहीं',
    'o.rfqmatch':'आपकी क्षमता से {pct}% मिलती है','o.quote':'दाम भेजें','o.rfqpass':'छोड़ें',
    'o.quotesent':'दाम भेज दिया','o.byline':'{qty} नग · {days} दिन में · {city}',

    /* --- money --- */
    'm.title':'पैसा','m.thismonth':'इस महीने','m.lastmonth':'पिछले महीने',
    'm.before':'ऐप से पहले','m.after':'अब','m.up':'{pct}% ज़्यादा',
    'm.bank':'सीधे आपके खाते में','m.banksub':'{bank} · खाता {acct}',
    'm.nofee':'विस्तार आपके पैसे में से कुछ नहीं लेता',
    'm.history':'पिछले 6 महीने','m.perchannel':'किस बाज़ार से कितना',
    'm.settle':'भुगतान','m.settled':'आ गया','m.settlepending':'रास्ते में',

    /* --- profile --- */
    'pr.title':'आपकी जानकारी','pr.scheme':'योजना','pr.benid':'लाभार्थी संख्या',
    'pr.cluster':'क्लस्टर','pr.craft':'शिल्प','pr.gi':'जीआई टैग','pr.since':'सदस्य',
    'pr.consent':'अनुमति और निजता','pr.consentsub':'क्या-क्या इजाज़त दी है','pr.audit':'आपके नाम पर क्या-क्या हुआ',
    'pr.revoke':'अनुमति वापस लें','pr.lang':'भाषा','pr.logout':'बाहर निकलें',
    'pr.speech':'आवाज़ की सेटिंग','pr.speechsub':'अभी: {engine}',
    'pr.capprofile':'क्षमता प्रोफ़ाइल','pr.capsub':'थोक ख़रीदार इससे आपको ढूँढते हैं',

    /* --- buyer --- */
    'b.h':'शिल्प खोजें','b.sub':'सीधे कारीगर से, बीच में कोई नहीं',
    'b.search':'शिल्प, सामग्री या क्लस्टर खोजें','b.filters':'छाँटें',
    'b.gi':'जीआई','b.verified':'सत्यापित कारीगर','b.moq':'कम से कम {n} नग',
    'b.rfqnew':'थोक माँग डालें','b.rfqsub':'ज़रूरत बताइए, कारीगर दाम भेजेंगे',
    'b.rfq.item':'क्या चाहिए','b.rfq.qty':'कितने नग','b.rfq.city':'कहाँ पहुँचाना है',
    'b.rfq.by':'कब तक','b.rfq.mat':'सामग्री','b.rfq.post':'कारीगरों को भेजें',
    'b.matched':'{n} कारीगर मिले','b.matchwhy':'क्यों मिले',
    'b.cap':'क्षमता {n} नग/माह','b.lead':'{n} दिन में','b.provenance':'प्रामाणिकता',
    'b.buy':'ऑर्डर दें','b.quote':'दाम पूछें','b.contact':'कारीगर से बात करें',

    /* --- ministry --- */
    'g.title':'विस्तार · डैशबोर्ड','g.sub':'सामाजिक न्याय एवं अधिकारिता मंत्रालय',
    'g.ben':'सक्रिय लाभार्थी','g.listings':'लाइव लिस्टिंग','g.gmv':'कुल बिक्री',
    'g.delta':'औसत आय बढ़ोतरी','g.prevented':'घाटे की बिक्री रुकी','g.reach':'ज़िले',
    'g.trend':'महीनेवार बिक्री','g.channels':'बाज़ार का हिस्सा','g.top':'बेहतरीन क्लस्टर',
    'g.scheme':'योजना के हिसाब से','g.women':'महिला लाभार्थी','g.subsidy':'सब्सिडी से आय तक',
  },

  en:{
    'app.name':'Vistaar',
    'app.tag':'Your own business manager',
    'nav.home':'Home','nav.items':'Products','nav.orders':'Orders','nav.money':'Money',
    'nav.discover':'Discover','nav.rfq':'RFQ','nav.buyorders':'Orders','nav.saved':'Saved',
    'nav.overview':'Overview','nav.people':'Beneficiaries','nav.clusters':'Clusters','nav.impact':'Impact',
    'common.next':'Continue','common.back':'Back','common.done':'Done','common.cancel':'Cancel',
    'common.close':'Close','common.save':'Save','common.send':'Send','common.retry':'Try again',
    'common.yes':'Yes','common.no':'No','common.live':'Live','common.pending':'Pending',
    'common.all':'All','common.today':'Today','common.viewall':'View all','common.month':'month',
    'common.perpiece':'per piece','common.pieces':'pcs','common.days':'days','common.na':'—',

    'auth.h1':'One voice. A year-round market.',
    'auth.lede':'She speaks. We do the rest — the photo, the price, and four marketplaces.',
    'auth.who':'Who are you?',
    'auth.r1':'Artisan','auth.r1s':'Weaver, craftsperson — sell your own work',
    'auth.r2':'Sahayak','auth.r2s':'Cluster helper — 20 artisans from one phone',
    'auth.r3':'Buyer','auth.r3s':'Bulk buyer, exporter, institution',
    'auth.r4':'Ministry','auth.r4s':'Social Justice & Empowerment — dashboard',
    'auth.phone':'Mobile number','auth.phoneph':'10-digit number',
    'auth.sendotp':'Send OTP','auth.otp':'Enter OTP',
    'auth.otpsent':'Sent to {phone}','auth.demo':'Demo OTP filled in for you',
    'auth.verify':'Verify','auth.change':'Change number',
    'auth.consent.h':'Your permission',
    'auth.consent.p':'We listen to your voice and place your product in four marketplaces. Money goes straight to your bank account — we never touch it.',
    'auth.consent.i1':'Voice and photos — only to build your product listing',
    'auth.consent.i2':'Name and cluster — shown to buyers',
    'auth.consent.i3':'Bank account — for direct settlement, we hold no funds',
    'auth.consent.rev':'You can withdraw this at any time by speaking one command.',
    'auth.consent.hear':'Hear it aloud',
    'auth.consent.ok':'I agree',
    'auth.langq':'Choose language · भाषा चुनें',

    'a.greet':'Namaste, {name}',
    'a.sub':'{cluster} · {craft}',
    'a.newitem':'Sell something new','a.newitems':'Speak it into a listing — 90 seconds',
    'a.thismonth':'This month','a.earned':'Earned','a.orders':'Orders','a.livelist':'Live products',
    'a.pendingorders':'{n} order awaiting you','a.rfqwaiting':'{n} bulk requirement matched to you',
    'a.recent':'Recent activity','a.yourshop':'Your shop','a.capacity':'Monthly capacity',
    'a.nolistings':'Nothing listed yet. Tap the button below to start.',
    'a.saved':'Losses prevented','a.savedsub':'blocked by the cost floor',

    'cap.title':'Take the photos','cap.sub':'Three angles + a clip of it being made',
    'cap.shot1':'Front','cap.shot2':'Side','cap.shot3':'Weave close-up','cap.shot4':'Being made',
    'cap.take':'Capture','cap.retake':'Retake','cap.allow':'Turn on camera',
    'cap.denied':'No camera — continue with sample photos',
    'cap.sample':'Sample photo','cap.cleaning':'Cleaning up…',
    'cap.cleaned':'Background lifted, white balance corrected','cap.hint':'Plain cloth, good daylight',
    'cap.before':'Before','cap.after':'After',

    'v.title':'Tell us about your product',
    'v.sub':'Speak exactly the way you normally talk',
    'v.tap':'Tap to speak','v.listening':'Listening… go ahead','v.stop':'Stop',
    'v.ph':'Your words will appear here…',
    'v.samplebtn':'Play sample voice','v.samplenote':'Use this if the mic will not work',
    'v.sample2':'Sample 2 — incomplete answer',
    'v.example':'For example: “This is a Bhagalpur silk saree, handwoven, took twelve days, raw material eight hundred, indigo dyed, I can make six a month.”',
    'v.retry':'Speak again','v.usethis':'Use this',
    'v.nomic':'This browser has no mic support — press sample voice',

    'x.title':'Here is what we understood','x.sub':'Correct anything that is wrong',
    'x.material':'Material','x.technique':'Technique','x.size':'Size','x.colour':'Colour',
    'x.days':'Days taken','x.matcost':'Material cost','x.stock':'In stock','x.capacity':'Can make per month',
    'x.missing':'not mentioned','x.ask':'One more question',
    'x.q.matcost':'What did the raw material cost?','x.q.days':'How many days did it take to make?',
    'x.q.capacity':'How many can you make in a month?',
    'x.answer':'Speak your answer','x.confirm':'Confirm by listening','x.playback':'This is read aloud, never shown as text alone',
    'x.title2':'Product name','x.desc':'Description buyers will see',

    'p.title':'Set your price','p.sub':'It will never go below your own cost',
    'p.floor':'Your cost floor','p.yourcost':'What it actually costs you',
    'p.mat':'Raw material','p.labour':'Your labour','p.waste':'Wastage 6%',
    'p.pack':'Packaging','p.ship':'Logistics','p.comm':'Channel commission 3%',
    'p.market':'Comparable products in the market','p.median':'Median','p.premium':'Top of range',
    'p.blocked':'This price is blocked',
    'p.blockedwhy':'At this price you lose ₹{loss}. That is not a sale, it is a loss.',
    'p.okmargin':'{pct}% above your cost floor','p.good':'Good price','p.high':'High — expect a slower sale',
    'p.abovemkt':'The market pays less than this costs you',
    'p.abovemktwhy':'Comparable listings top out near ₹{p75}, but your cost floor is ₹{floor}. That is not your mistake — the market is not paying for your labour.',
    'p.opt1':'Make a lower-effort variant','p.opt2':'Sell into a GI / provenance channel','p.opt3':'Do not make this at this price',
    'p.set':'Use this price','p.spoken':'This was also spoken aloud',
    'p.compare':'Compared with {n} similar products','p.wage':'Labour at ₹{w}/day benchmark',

    'pub.title':'Publishing to four channels','pub.sub':'One voice note, four marketplaces',
    'pub.q':'Queued','pub.p':'Publishing','pub.l':'Live','pub.w':'Pending',
    'pub.done':'Your product is live','pub.donesub':'Visible in {n} places',
    'pub.profile':'Capability profile created','pub.profilesub':'Bulk buyers can now find you',
    'pub.gohome':'Back to home','pub.viewitem':'View product',
    'pub.simnote':'Endpoints are mocked in the demo — payloads are protocol-correct',

    'o.title':'Orders','o.new':'New order','o.none':'No orders yet',
    'o.tab.orders':'Orders','o.tab.rfq':'Bulk requirements',
    'o.from':'from {name}','o.qty':'{n} pcs','o.total':'Total','o.status.new':'New',
    'o.status.confirmed':'Confirmed','o.status.packed':'Packed','o.status.shipped':'Shipped',
    'o.status.paid':'Paid','o.status.declined':'Declined',
    'o.confirm':'Accept order','o.decline':'Decline','o.sim':'Simulate an incoming order',
    'o.callin':'Incoming call','o.callsub':'Vistaar · in your language',
    'o.callsaid':'Namaste {name}. {buyer} has ordered {n} of your {item}. Total {amt} rupees. Press one to accept.',
    'o.press1':'Accept','o.press2':'Not now','o.pressone':'Press 1','o.presstwo':'Press 2',
    'o.accepted':'Order confirmed','o.acceptedsub':'Money settles straight to your account',
    'o.rfqnone':'No bulk requirements right now',
    'o.rfqmatch':'{pct}% match to your capacity','o.quote':'Send a quote','o.rfqpass':'Pass',
    'o.quotesent':'Quote sent','o.byline':'{qty} pcs · in {days} days · {city}',

    'm.title':'Money','m.thismonth':'This month','m.lastmonth':'Last month',
    'm.before':'Before the app','m.after':'Now',
    'm.up':'{pct}% higher',
    'm.bank':'Straight to your bank','m.banksub':'{bank} · A/c {acct}',
    'm.nofee':'Vistaar takes nothing out of your money',
    'm.history':'Last 6 months','m.perchannel':'Earnings by marketplace',
    'm.settle':'Settlement','m.settled':'Received','m.settlepending':'On the way',

    'pr.title':'Your details','pr.scheme':'Scheme','pr.benid':'Beneficiary ID',
    'pr.cluster':'Cluster','pr.craft':'Craft','pr.gi':'GI tag','pr.since':'Member since',
    'pr.consent':'Consent & privacy','pr.consentsub':'What you have permitted','pr.audit':'Done in your name',
    'pr.revoke':'Withdraw consent','pr.lang':'Language','pr.logout':'Sign out',
    'pr.speech':'Speech settings','pr.speechsub':'Currently: {engine}',
    'pr.capprofile':'Capability profile','pr.capsub':'How bulk buyers find you',

    'b.h':'Discover craft','b.sub':'Straight from the maker, nobody in between',
    'b.search':'Search craft, material or cluster','b.filters':'Filters',
    'b.gi':'GI','b.verified':'Verified artisan','b.moq':'MOQ {n} pcs',
    'b.rfqnew':'Post a requirement','b.rfqsub':'Describe the need, artisans quote back',
    'b.rfq.item':'What you need','b.rfq.qty':'Quantity','b.rfq.city':'Deliver to',
    'b.rfq.by':'Needed by','b.rfq.mat':'Material','b.rfq.post':'Send to matched artisans',
    'b.matched':'{n} artisans matched','b.matchwhy':'Why they matched',
    'b.cap':'Capacity {n}/month','b.lead':'{n}-day lead time','b.provenance':'Provenance',
    'b.buy':'Place order','b.quote':'Request quote','b.contact':'Talk to the artisan',

    'g.title':'Vistaar · Dashboard','g.sub':'Ministry of Social Justice & Empowerment',
    'g.ben':'Active beneficiaries','g.listings':'Live listings','g.gmv':'Gross sales',
    'g.delta':'Median income delta','g.prevented':'Loss-making sales blocked','g.reach':'Districts',
    'g.trend':'Monthly sales','g.channels':'Channel share','g.top':'Top clusters',
    'g.scheme':'By scheme','g.women':'Women beneficiaries','g.subsidy':'Subsidy to income',
  }
};

let lang = localStorage.getItem('vs.lang') || 'hi';
const listeners = new Set();

export const getLang = () => lang;
export function setLang(l){
  if(l === lang) return;
  lang = l;
  localStorage.setItem('vs.lang', l);
  document.documentElement.lang = l;
  listeners.forEach(fn => fn(l));
}
export const onLang = fn => { listeners.add(fn); return () => listeners.delete(fn); };

/** t('a.greet', {name:'सुनीता'}) — falls back to English, then to the key itself. */
export function t(key, vars){
  let s = DICT[lang][key] ?? DICT.en[key] ?? key;
  if(vars) for(const k in vars) s = s.replaceAll('{'+k+'}', vars[k]);
  return s;
}

/** Pick the right half of a bilingual data record without a lookup table. */
export const pick = obj => (obj && typeof obj === 'object' && ('hi' in obj))
  ? (obj[lang] ?? obj.en ?? obj.hi) : obj;

document.documentElement.lang = lang;
