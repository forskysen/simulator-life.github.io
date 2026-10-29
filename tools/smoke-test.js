// Быстрая проверка игры без браузера: node tools/smoke-test.js
// Подставляет заглушки DOM, прогоняет 300 дней, рисует все разделы и проверяет сохранение,
// навигацию, ферму, историю, события, работы, дома, машины, имплант, бизнесы и технологии.
const { stub, gameSource } = require('./browser-stub');
const game = gameSource();
const test = `
var fails=0;function ok(c,m){console.log((c?"OK   ":"FAIL ")+m);if(!c)fails++}
state.job=5;state.bal=2e6;
for(var d=0;d<300;d++)nextDay();
var bad=["bal","mood","teeth","tot","infl","dep"].filter(function(k){return isNaN(state[k])});
ok(bad.length===0,"300 days, no NaN (day "+state.day+", dead="+(state.dead||false)+")");
state.dead=false;
var probs=[];
NAV_GROUPS.reduce(function(a,g){return a.concat(g.tabs)},["Настройки"]).forEach(function(t){state.tab=t;state.bs="home";state.ms=-1;render();var h=getEl("view").innerHTML;if(h.indexOf("NaN")>-1||h.indexOf("undefined")>-1)probs.push(t)});
["home"].concat(BUSINESSES.map(function(b,i){return i})).forEach(function(b){state.tab="Бизнес";state.bs=b;render();var h=getEl("view").innerHTML;if(h.indexOf("NaN")>-1||h.indexOf("undefined")>-1)probs.push("biz "+b)});
ok(probs.length===0,"all tabs and business views render"+(probs.length?": "+probs.join():""));
state.tab="Работа";render();
ok(getEl("nav").innerHTML.indexOf('data-g="Имущество"')>-1&&getEl("subnav").innerHTML.indexOf('data-t="Образование"')>-1,"nav: sections and subtabs");
openTab("Машины");ok(state.tab==="Машины"&&getEl("view").innerHTML.indexOf("data-car")>-1,"cars are their own tab");
openTab("Стата");ok(getEl("subnav").hidden===true,"single-tab section hides subnav");
openTab("Работа");stepTab(1);ok(state.tab==="Образование","hotkey: next tab");
stepTab(-1);stepTab(-1);ok(state.tab==="Медицина","hotkey: tabs wrap around");
openTab("Работа");stepGroup(1);ok(groupOf(state.tab).name==="Имущество","hotkey: next section");
state.tab="Бизнес";state.bs="m";render();ok(state.tab==="Ферма","old save: business/farm -> Ферма tab");
var d0=state.day;onGameKey({key:" ",target:{tagName:"BODY"},preventDefault:function(){}});ok(state.day===d0+1,"space = next day");
d0=state.day;onGameKey({key:" ",target:{tagName:"INPUT"},preventDefault:function(){}});ok(state.day===d0,"space ignored in input");
state.farm={racks:2,gpus:[{t:0,l:1},{t:1,l:1}],lube:0,cool:100,off:0,debt:0,wc:2,worker:0};state.bal=1e7;
farmToggleWorker();ok(state.farm.worker===1,"farm: worker hired");
ok(estimatedSalaries()>=FARM_WORKER_SALARY,"farm: worker salary goes into salaries bill");
var b0=state.bal;var note=autoLube();ok(state.farm.lube>0&&state.bal<b0&&note.length>0,"farm: worker restocks lube");
var lv0=state.farm.gpus.map(function(g){return g.l}).join();b0=state.bal;gpuUpgradeAll();
ok(state.bal<b0,"farm: upgrade-all spends money");
state.bal=0;b0=0;var lv1=state.farm.gpus.map(function(g){return g.l}).join();gpuUpgradeAll();ok(state.farm.gpus.map(function(g){return g.l}).join()===lv1,"farm: upgrade-all does nothing without money");
state.bal=1e7;farmSell("all");ok(state.farm.worker===0&&!state.farm.gpus.length,"farm: selling farm dismisses worker");
state.tab="Ферма";render();var fh=getEl("view").innerHTML;ok(fh.indexOf("NaN")<0&&fh.indexOf("undefined")<0,"farm screen renders");
ok(state.hist.days.length>=90&&state.hist.days.length<=HIST_RAW_DAYS&&state.hist.months.length>=1,"history: stored and compacted");
ok(state.hist.days.concat(state.hist.months).every(function(p){return p[0]>=0&&p[1]>=0&&isFinite(p[0]+p[1])}),"history: values sane");
[30,90,0].forEach(function(r){state.histRange=r;state.tab="Стата";render();var sh=getEl("view").innerHTML;ok(sh.indexOf("<polyline")>-1&&sh.indexOf("NaN")<0,"history: chart renders for range "+r)});
ledger.on=false;ledger.income=0;ledger.expense=0;state.bal-=5000;ok(ledger.expense===0,"history: spending outside the day tick is not counted");
ledger.on=true;state.bal-=5000;state.bal+=300;ok(ledger.expense===5000&&ledger.income===300,"history: tick money flow is counted");ledger.on=false;
ok(JSON.parse(JSON.stringify(state)).bal===state.bal,"history: balance still serialises");
ok(RANDOM_EVENTS.length===24&&new Set(RANDOM_EVENTS.map(function(e){return e.name})).size===24,"events: 24 unique");
state.evLast={};state.job=0;state.day=360;var seas=RANDOM_EVENTS.filter(function(e){return e.season&&eventAllowed(e,5000)}).map(function(e){return e.name});
ok(seas.indexOf("Новогодняя премия")>-1&&seas.indexOf("Налоговый вычет")<0,"events: new-year window open, spring window closed");
state.day=365+110;ok(eventAllowed(RANDOM_EVENTS.filter(function(e){return e.name==="Налоговый вычет"})[0],5000),"events: season repeats every 365 days");
state.day=500;state.cars={};ok(!eventAllowed(RANDOM_EVENTS.filter(function(e){return e.name==="Поломка машины"})[0],5000),"events: car event needs a car");
state.cars={0:1};ok(eventAllowed(RANDOM_EVENTS.filter(function(e){return e.name==="Поломка машины"})[0],5000),"events: car event with a car");
ok(JOB_PRESTIGE.length===JOBS.length,"jobs: prestige for every job");
ok(JOBS.every(function(j,i){return !j[3]||COURSE_PRICE[i]>0}),"jobs: every course has a price");
ok(Object.keys(JOB_MIN_HOME).every(function(k){return JOBS[k]&&JOB_MIN_HOME[k]<HOMES.length}),"jobs: min-home table is valid");
ok(jobOrder().every(function(k,n,a){return !n||JOBS[a[n-1]][1]<=JOBS[k][1]})&&jobOrder().length===JOBS.length,"jobs: sorted by salary");
state.tab="Работа";render();var wh=getEl("view").innerHTML;ok(wh.indexOf("Курьер")>-1&&wh.indexOf("Юрист")>-1&&wh.indexOf("Курьер")<wh.indexOf("Банкир"),"jobs: new jobs shown, poorest first");
state.tab="Образование";render();var eh=getEl("view").innerHTML;ok(eh.indexOf("Юридический факультет")>-1&&eh.indexOf("NaN")<0,"education: new courses shown");
ok(HOME_PRESTIGE.length===HOMES.length&&HOMES.every(function(h,i,a){return !i||!h[3]&&h[1]>0||!a[i-1][3]&&!a[i-1][1]||!h[3]||h[3]>=a[i-1][3]}),"homes: prestige table matches and prices ascend");
var oldSave={day:400,house:6,hm:{3:3000000,6:10000000},bal:5,tab:"Дома"};
store.lifesim_v01=JSON.stringify(oldSave);
load();fixS();
ok(state.house===8&&HOMES[8][0]==="Загородный дом"&&state.hm[8]===10000000&&state.hm[5]===3000000&&HOMES[5][0]==="Однокомнатная квартира"&&state.hm[3]===undefined,"save v1 -> v2: bought homes keep their names");
ok(state.saveVer===SAVE_VERSION,"save version updated");
store.lifesim_v01=JSON.stringify({day:10,house:2,hm:{}});load();fixS();ok(state.house===2,"save v1: rented homes (index <3) stay put");
store.lifesim_v01=JSON.stringify(Object.assign({},JSON.parse(JSON.stringify(state)),{house:8,hm:{8:1}}));load();fixS();ok(state.house===8,"save v2: no double shift");
state.tab="Дома";render();var hv=getEl("view").innerHTML;ok(hv.indexOf("Небоскрёб")>-1&&hv.indexOf("Дом в деревне")>-1&&hv.indexOf("NaN")<0,"homes: new homes shown");
state.bal=1e13;payTax("all");state.bal=1e8;state.teeth=40;state.implant=0;medicineAction(11);ok(state.teeth===100&&state.implant===IMPLANT_DAYS&&state.bal===1e8-2000000,"implant: bought, teeth restored");
medicineAction(3);ok(state.bal===1e8-2000000,"implant: cheap dental procedures blocked while active");
var bI=state.bal;medicineAction(11);ok(state.bal===bI,"implant: cannot re-buy early");
state.teeth=100;for(var di=0;di<10;di++)medDay();ok(state.teeth===100&&state.implant===IMPLANT_DAYS-10,"implant: teeth do not decay, timer ticks");
state.implant=1;medDay();ok(state.implant===0,"implant: expires");medDay();ok(state.teeth<100,"implant: teeth decay again after expiry");
state.implant=300;bI=state.bal;medicineAction(11);ok(state.bal===bI-2000000&&state.implant===IMPLANT_DAYS,"implant: renewable in the last year");
state.implant=0;state.tab="Медицина";render();ok(getEl("view").innerHTML.indexOf("Полный имплант зубов")>-1,"implant: shown in medicine");
ok(CARS.length===12&&carOrder().every(function(k,n,a){return !n||CARS[a[n-1]][1]<=CARS[k][1]}),"cars: 12 models, sorted by price");
state.tab="Машины";render();var chv=getEl("view").innerHTML;ok(chv.indexOf("Жук Городской")<chv.indexOf("Комета Спорт")&&chv.indexOf("Призрак Гиперкар")>chv.indexOf("Комета Спорт"),"cars: shown cheapest first");
state.bal=1e9;carAction("b11");ok(state.cars[11]!==undefined&&carBonus()===0.28,"cars: new model works");carAction("s11");ok(state.cars[11]===undefined,"cars: sold");
fixS();state.mood=100;state.teeth=100;state.implant=0;state.rest=0;state.bal=1e13;payTax("all");
ok(BUSINESSES.length===10&&EMPLOYEE_SALARY.length===10&&state.B.length===10&&BUSINESSES.every(function(b){return b.length===10&&b[8].length===3}),"business: 10 defined, tables consistent");
ok(Object.keys(BUSINESS_DIPLOMA).every(function(i){return JOBS[BUSINESS_DIPLOMA[i]][3]>0}),"business: diploma courses exist");
ok(businessOrder().every(function(k,n,a){return !n||businessSortValue(a[n-1])<=businessSortValue(k)})&&businessOrder().length===10,"business: sorted by earnings");
for(var bi=5;bi<10;bi++){
  var dp=BUSINESS_DIPLOMA[bi];state.done[dp]=false;
  if(dp!==undefined){businessAction("L"+bi);ok(!state.B[bi].own,"business "+bi+": license refused without diploma");state.done[dp]=true}
  businessAction("L"+bi);businessAction("U"+bi);businessAction("E"+bi);
  var inc=businessIncome(bi);ok(state.B[bi].own&&isFinite(inc)&&inc>0&&inc<=BUSINESSES[bi][5]*1.2,"business "+bi+": works, income "+Math.round(inc));
}
state.tab="Бизнес";state.bs="home";render();var bh=getEl("view").innerHTML;ok(["Сеть ресторанов","Строительная компания","Девелопер","Нефтедобыча","Электростанция"].every(function(n){return bh.indexOf(n)>-1})&&bh.indexOf("NaN")<0,"business: hub lists new businesses");
for(bi=5;bi<10;bi++){state.bs=bi;render();var bv2=getEl("view").innerHTML;ok(bv2.indexOf("NaN")<0&&bv2.indexOf("undefined")<0,"business "+bi+": screen renders")}
var bal0=state.bal;businessDay();ok(state.bal>bal0,"business: daily income arrives");
state.B[1]={own:1,n:1,emp:1,up:[0,0,0],u2:[0,0,0],x:0};state.tech.cur=-1;
ok(TECH.length===10&&Object.keys(TECH_FOR_BUSINESS).length===8&&state.tech.d.length>=TECH.length,"tech: 10 defined");
state.B[5].own=0;ok(techReq(5).indexOf("Нужен бизнес")===0,"tech: new tech needs its business");state.B[5].own=1;ok(techReq(5)==="","tech: new tech available with business");
var ib=businessIncome(5);state.tech.d[5]=1;ok(Math.abs(businessIncome(5)/ib-1.2)<1e-9,"tech: +20% for restaurants");
state.tab="Технологии";render();ok(getEl("view").innerHTML.indexOf("Сейсморазведка")>-1,"tech: new techs shown");
ok(formatMoneyShort(1e12)==="1кккк ₽"&&formatMoneyShort(1e15)==="1ккккк ₽"&&formatMoneyShort(1e18)==="1кккккк ₽","money: кккк, ккккк, кккккк");
ok(formatMoneyShort(2.5e13)==="25кккк ₽"&&formatMoneyShort(999999999999)==="1кккк ₽"&&formatMoneyShort(1.5e6)==="1,5кк ₽"&&formatMoneyShort(-3e12)==="−3кккк ₽","money: rounding and sign");
ok(formatMoneyShort(7.77e17)==="777ккккк ₽"&&formatMoneyShort(1e21)==="1000кккккк ₽","money: values above 1кккккк still format");
ok(formatMoneyShort(5000)===formatMoney(5000)&&formatMoneyShort(0)===formatMoney(0),"money: small values shown in full");
lastNextDayAt=0;var cd0=state.day;requestNextDay();requestNextDay();ok(state.day===cd0+1,"cooldown: second quick click ignored");
lastNextDayAt=Date.now()-NEXT_DAY_COOLDOWN_MS-1;requestNextDay();ok(state.day===cd0+2,"cooldown: click after the pause works");
ok(NEXT_DAY_COOLDOWN_MS===250,"cooldown: 250 ms");
state.farm={racks:2,gpus:[{t:0,l:1}],lube:3,cool:50,off:0,debt:0,wc:0,worker:0};state.tab="Ферма";render();var fo=getEl("view").innerHTML;
var ix=function(x){return fo.indexOf(x)};
ok(ix('data-b="rack"')<ix('data-b="cool"')&&ix('data-b="cool"')<ix('data-b="lube"')&&ix('data-b="lube"')<ix('data-b="g0"')&&ix('data-b="g0"')<ix("Особые улучшения")&&ix("Особые улучшения")<ix('data-b="worker"')&&ix('data-b="worker"')<ix('data-b="wc"')&&ix('data-b="wc"')<ix("Видеокарты</h1>"),"farm: order rack, coolant, lube, GPUs, then special upgrades");
state.farm={racks:0,gpus:[],lube:0,cool:0,off:0,debt:0,wc:0,worker:0};
// --- налоги: просрочка останавливает имущество, ничего не отбирают ---
function clearBills(){for(var bk in state.tx){state.tx[bk].a=0;state.tx[bk].d=0}}
state.bal=1e13;payTax("all");clearBills();state.suspended=0;state.cars={11:1};state.char=0;render();
ok(!propertySuspended()&&carBonus()===0.28,"arrears: no debt, car works");
addTax("job",1000);state.tx.job.d=6;ok(!propertySuspended(),"arrears: 6 days is still fine");
state.tx.job.d=7;ok(propertySuspended()&&carBonus()===0&&businessIncome(5)===0&&farmInc()===0,"arrears: 7 days stops cars, businesses and farm");
var fairNow=ownCompanyFairPrice();ok(fundamentalIncome()>0&&fairNow>10,"arrears: company valuation ignores the stoppage");
var cars0=JSON.stringify(state.cars),hm0=JSON.stringify(state.hm),h0=state.house;state.bal=5e6;state.dep=1e6;state.ap={own:0,off:{}};
for(var td=0;td<60;td++)taxDay();
ok(JSON.stringify(state.cars)===cars0&&JSON.stringify(state.hm)===hm0&&state.house===h0&&state.dep===1e6&&state.bal===5e6,"arrears: 60 days of debt, nothing confiscated");
var emp0=state.B[5].emp;state.B[5].emp=1;state.tx.sal={a:1000,d:30};taxDay();ok(state.B[5].emp===1,"arrears: employees do not quit");
state.house=1;state.tx.rent={a:1000,d:30};taxDay();ok(state.house===1,"arrears: no eviction");
state.bal=1e13;payTax("all");ok(!propertySuspended()&&carBonus()===0.28&&businessIncome(5)>0,"arrears: after payment everything works again");
clearBills();state.suspended=0;
// --- благотворительность: все счета, кроме зарплат ---
state.char=8;render();ok(Math.abs(charityFactor()-5/13)<1e-9&&Math.round(TAX_RATE*100)===5,"charity: level 8 = rate 5%, factor 5/13");
addTax("prop",13000);addTax("veh",13000);addTax("elec",13000);addTax("opx",13000);addTax("rent",13000);addTax("sal",13000);
ok(state.tx.prop.a===5000&&state.tx.veh.a===5000&&state.tx.elec.a===5000&&state.tx.opx.a===5000&&state.tx.rent.a===5000,"charity: property, vehicle, electricity, points and rent bills cheaper");
ok(state.tx.sal.a===13000,"charity: employee salaries not reduced");
ok(charityDiscountPercent("sal")===0&&charityDiscountPercent("prop")>60,"charity: discount percent per bill");
clearBills();state.char=0;render();addTax("prop",13000);ok(state.tx.prop.a===13000,"charity: no discount without donations");clearBills();
ok(NAV_GROUPS.filter(function(g){return g.name==="Финансы"})[0].tabs.join()==="Банк,Счета,Благотворительность,Биржа","bank: split into Bank, Bills, Charity tabs");
state.char=3;["Банк","Счета","Благотворительность"].forEach(function(t){state.tab=t;render();var th=getEl("view").innerHTML;ok(th.indexOf("NaN")<0&&th.indexOf("undefined")<0&&th.length>200,"tab "+t+" renders")});
state.tab="Благотворительность";render();ok(getEl("view").innerHTML.indexOf("не снижается")>-1,"charity screen lists salaries as not reduced");
state.char=0;state.tab="Счета";render();
// --- миграция 1.1.3: торговый центр и агентство убраны, вложения возвращаются ---
var oldB=[];for(var ob=0;ob<12;ob++)oldB.push({own:0,n:0,up:[0,0,0],x:0,emp:0,u2:[0,0,0]});
oldB[4]={own:1,n:2,up:[1,0,0],x:0,emp:1,u2:[0,0,0]};oldB[6]={own:1,n:0,up:[0,0,1],x:0,emp:2,u2:[0,0,0]};oldB[5]={own:1,n:3,up:[0,0,0],x:0,emp:3,u2:[0,0,0]};
store.lifesim_v01=JSON.stringify({day:50,house:2,hm:{},bal:100,saveVer:2,B:oldB,ag:{lvl:2,ct:[]},bs:5,tab:"Бизнес"});
load();fixS();
ok(state.B.length===10&&state.B[4].n===3&&state.B[4].own===1&&state.ag===undefined&&state.bs===4,"business removal: indices shifted, IT kept its data, agency state gone, open screen remapped");
ok(state.bal===100+51380000+13650000,"business removal: investments refunded ("+state.bal+")");
ok(state.saveVer===3,"business removal: save version 3");
var bAfter=JSON.stringify(state.B),balAfter=state.bal;fixS();ok(JSON.stringify(state.B)===bAfter&&state.bal===balAfter,"business removal: runs once");
var v1B=[];for(var vb=0;vb<7;vb++)v1B.push({own:0,n:0,up:[0,0,0],x:0});v1B[5]={own:1,n:1,up:[0,0,0],x:0};
store.lifesim_v01=JSON.stringify({day:50,house:6,hm:{6:10000000},bal:100,B:v1B,bs:"home",tab:"Бизнес"});load();fixS();
ok(state.B.length===10&&state.B[4].own===1&&state.bal===100&&state.house===8&&state.hm[8]===10000000,"business removal + homes: oldest saves migrate through both steps");
ok(state.B.every(function(b){return Array.isArray(b.u2)&&typeof b.emp==="number"}),"business removal: all businesses have u2 and emp");
// --- биржа: своя компания (капитализация, боты-инвесторы, дивиденды, антиабуз) ---
var tbiOrig=totalBusinessIncome,rngOrig=Math.random;
function seedRng(seed){Math.random=function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function setupCoin(inc){state.mk={p:[],h:[],q:[],c:[],own:null,fair:0,growth:0,flows:[]};totalBusinessIncome=function(){return inc};marketInit();getEl("mn").value="Моя монета";getEl("mt").value="MYC";state.bal=1e8;marketIpo();return {I:OWN_INDEX,K:state.mk}}
var C=setupCoin(100000);
ok(C.K.own&&C.K.q[C.I]===OWN_SHARES&&C.K.fair>0,"coin: IPO gives all shares and sets valuation");
ok(Math.abs(C.K.p[C.I]*OWN_SHARES-ownCompanyFairPrice()*OWN_SHARES)/(ownCompanyFairPrice()*OWN_SHARES)<0.01,"coin: capitalization at IPO equals business valuation");
// сделки двигают капитализацию рубль в рубль, исполнение крупных сделок хуже
var p0=C.K.p[C.I],cap0=p0*OWN_SHARES;
var cost=ownBuyCost(p0,0.01*OWN_SHARES),p1=ownPriceAfter(p0,0.01*OWN_SHARES,true);
ok(Math.abs((p1*OWN_SHARES-cap0)/cost-1)<0.05,"coin: buying X rubles raises capitalization by about X");
var big=0.3*OWN_SHARES,bc=ownBuyCost(p0,big),pb=ownPriceAfter(p0,big,true);ok(ownSellProceeds(pb,big)/bc<0.9,"coin: big round trip loses over 10%");
var sm=0.001*OWN_SHARES,sc=ownBuyCost(p0,sm),ps=ownPriceAfter(p0,sm,true);ok(ownSellProceeds(ps,sm)/sc>0.99,"coin: tiny round trip is almost free");
// продажа 49%: цена падает, выручка меньше рыночной стоимости, внешние акционеры получают дивиденды
var bal0=state.bal;getEl("mamt").value=String(Math.floor(C.K.q[C.I]*0.49*p0));marketTrade(C.I,"s");
var got=state.bal-bal0;ok(C.K.p[C.I]<p0*0.85&&got<0.9*0.49*cap0&&got>0.5*0.49*cap0,"coin: selling 49% lowers price and executes below mark");
ok(Math.abs(outsideShare()-0.49)<0.001&&dividendPerDay()===Math.round(0.49*OWN_DIVIDEND_SHARE*totalBusinessIncome()),"coin: outside holders get dividends by their share");
var bb=state.bal;var dvTxt=dividendDay();ok(state.bal<bb&&dvTxt.indexOf("Дивиденды")===0,"coin: dividends are paid out of the balance");
// нельзя купить больше 100% акций
state.bal=1e13;getEl("mamt").value=String(1e13);marketTrade(C.I,"b");ok(C.K.q[C.I]<=OWN_SHARES+1e-6&&C.K.q[C.I]>OWN_SHARES*0.999,"coin: cannot own more than 100%");
ok(dividendPerDay()===0&&outsideShare()<0.001,"coin: no dividends when you own everything");
// выкуп считается по той же модели
getEl("mamt").value=String(Math.floor(C.K.q[C.I]*C.K.p[C.I]*0.3));marketTrade(C.I,"s");
var out2=OWN_SHARES-C.K.q[C.I];ok(buyoutCost()>=Math.round(out2*C.K.p[C.I]*BUYOUT_PREMIUM),"coin: buyout costs at least mark price with premium");
// боты-инвесторы: поток считается и ограничен 30 днями, в среднем около нуля
seedRng(5);setupCoin(100000);var flows=[],fr=0;for(var bd=0;bd<400;bd++){fr+=ownBotFlow()}
ok(Math.abs(fr/400)<0.01,"coin: investor flow averages near zero");
seedRng(7);setupCoin(100000);for(bd=0;bd<45;bd++)marketDay();
ok(state.mk.flows.length===30&&investorFlow30()===state.mk.flows.reduce(function(a,b){return a+b},0),"coin: 30-day investor flow stored");
// старое сохранение: монета есть, а полей fair/flows нет
state.mk.fair=0;state.mk.growth=0;delete state.mk.flows;var thrown=false;try{marketDay();marketDay()}catch(e){thrown=true}ok(!thrown&&Array.isArray(state.mk.flows),"coin: old saves without fair/flows keep working");
// рост доходов подтягивает оценку постепенно
setupCoin(100000);var f0=state.mk.fair;totalBusinessIncome=function(){return 200000};for(bd=0;bd<100;bd++)ownFairStep();
ok(state.mk.fair>f0*1.5&&Math.abs(state.mk.fair/ownCompanyFairPrice()-1)<0.02,"coin: valuation follows income gradually");
// главное: цена не притягивается к оценке, «качели» не приносят прибыли
var sw=[];for(var sd=1;sd<=10;sd++){seedRng(100+sd);var Cs=setupCoin(100000),I=Cs.I,Ks=Cs.K,start=state.bal+Ks.q[I]*Ks.p[I];
  for(bd=0;bd<250;bd++){marketDay();var fr2=ownCompanyFairPrice(),pp=Ks.p[I];
    if(pp<fr2*0.92&&state.bal>1000){getEl("mamt").value=String(Math.floor(state.bal));marketTrade(I,"b")}
    else if(pp>fr2*1.08&&Ks.q[I]>1)marketTrade(I,"sa")}
  sw.push((state.bal+Ks.q[I]*Ks.p[I])/start-1)}
var swAvg=sw.reduce(function(a,b){return a+b},0)/sw.length;ok(swAvg<0.05,"coin: buy-low-sell-high bot no longer profits (avg "+Math.round(swAvg*100)+"%)");
totalBusinessIncome=tbiOrig;Math.random=rngOrig;
state.cars={};
render();
var snap=JSON.parse(store.lifesim_v01);ok(snap.day===state.day,"autosave works");
var tb=getEl("toasts");tb.children.length=0;toast("x","1","");toast("x","1","");ok(tb.children.length===1,"identical toasts merge");
if(fails){console.log(fails+" FAILED");process.exit(1)}else console.log("ALL OK");
`;
new Function('global', stub + game + test)(global);
