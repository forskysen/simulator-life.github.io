// Быстрая проверка игры без браузера: node tools/smoke-test.js
// Подставляет заглушки DOM, прогоняет 300 дней, рисует все разделы и проверяет сохранение,
// навигацию, ферму, историю, события, работы, дома, машины, имплант, бизнесы и технологии.
const { stub, gameSource } = require('./browser-stub');
const game = gameSource();
const test = `
var fails=0;function ok(c,m){console.log((c?"OK   ":"FAIL ")+m);if(!c)fails++}
state.job=5;state.bal=2e6;
for(var d=0;d<300;d++)els.next.onclick();
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
ok(state.saveVer===2,"save version updated");
store.lifesim_v01=JSON.stringify({day:10,house:2,hm:{}});load();fixS();ok(state.house===2,"save v1: rented homes (index <3) stay put");
store.lifesim_v01=JSON.stringify(Object.assign({},JSON.parse(JSON.stringify(state)),{house:8,hm:{8:1}}));load();fixS();ok(state.house===8,"save v2: no double shift");
state.tab="Дома";render();var hv=getEl("view").innerHTML;ok(hv.indexOf("Небоскрёб")>-1&&hv.indexOf("Дом в деревне")>-1&&hv.indexOf("NaN")<0,"homes: new homes shown");
state.bal=1e8;state.teeth=40;state.implant=0;medicineAction(11);ok(state.teeth===100&&state.implant===IMPLANT_DAYS&&state.bal===1e8-2000000,"implant: bought, teeth restored");
medicineAction(3);ok(state.bal===1e8-2000000,"implant: cheap dental procedures blocked while active");
var bI=state.bal;medicineAction(11);ok(state.bal===bI,"implant: cannot re-buy early");
state.teeth=100;for(var di=0;di<10;di++)medDay();ok(state.teeth===100&&state.implant===IMPLANT_DAYS-10,"implant: teeth do not decay, timer ticks");
state.implant=1;medDay();ok(state.implant===0,"implant: expires");medDay();ok(state.teeth<100,"implant: teeth decay again after expiry");
state.implant=300;bI=state.bal;medicineAction(11);ok(state.bal===bI-2000000&&state.implant===IMPLANT_DAYS,"implant: renewable in the last year");
state.implant=0;state.tab="Медицина";render();ok(getEl("view").innerHTML.indexOf("Полный имплант зубов")>-1,"implant: shown in medicine");
ok(CARS.length===12&&carOrder().every(function(k,n,a){return !n||CARS[a[n-1]][1]<=CARS[k][1]}),"cars: 12 models, sorted by price");
state.tab="Машины";render();var chv=getEl("view").innerHTML;ok(chv.indexOf("Жук Городской")<chv.indexOf("Комета Спорт")&&chv.indexOf("Призрак Гиперкар")>chv.indexOf("Комета Спорт"),"cars: shown cheapest first");
state.bal=1e9;carAction("b11");ok(state.cars[11]!==undefined&&carBonus()===0.28,"cars: new model works");carAction("s11");ok(state.cars[11]===undefined,"cars: sold");
fixS();state.mood=100;state.teeth=100;state.implant=0;state.rest=0;state.bal=1e13;
ok(BUSINESSES.length===12&&EMPLOYEE_SALARY.length===12&&state.B.length===12&&BUSINESSES.every(function(b){return b.length===10&&b[8].length===3}),"business: 12 defined, tables consistent");
ok(Object.keys(BUSINESS_DIPLOMA).every(function(i){return JOBS[BUSINESS_DIPLOMA[i]][3]>0}),"business: diploma courses exist");
ok(businessOrder().every(function(k,n,a){return !n||businessSortValue(a[n-1])<=businessSortValue(k)})&&businessOrder().length===12,"business: sorted by earnings");
for(var bi=7;bi<12;bi++){
  var dp=BUSINESS_DIPLOMA[bi];state.done[dp]=false;
  if(dp!==undefined){businessAction("L"+bi);ok(!state.B[bi].own,"business "+bi+": license refused without diploma");state.done[dp]=true}
  businessAction("L"+bi);businessAction("U"+bi);businessAction("E"+bi);
  var inc=businessIncome(bi);ok(state.B[bi].own&&isFinite(inc)&&inc>0&&inc<=BUSINESSES[bi][5]*1.2,"business "+bi+": works, income "+Math.round(inc));
}
state.tab="Бизнес";state.bs="home";render();var bh=getEl("view").innerHTML;ok(["Сеть ресторанов","Строительная компания","Девелопер","Нефтедобыча","Электростанция"].every(function(n){return bh.indexOf(n)>-1})&&bh.indexOf("NaN")<0,"business: hub lists new businesses");
for(bi=7;bi<12;bi++){state.bs=bi;render();var bv2=getEl("view").innerHTML;ok(bv2.indexOf("NaN")<0&&bv2.indexOf("undefined")<0,"business "+bi+": screen renders")}
var bal0=state.bal;businessDay();ok(state.bal>bal0,"business: daily income arrives");
state.B[1]={own:1,n:1,emp:1,up:[0,0,0],u2:[0,0,0],x:0};state.tech.cur=-1;
ok(TECH.length===10&&Object.keys(TECH_FOR_BUSINESS).length===8&&state.tech.d.length>=TECH.length,"tech: 10 defined");
state.B[7].own=0;ok(techReq(5).indexOf("Нужен бизнес")===0,"tech: new tech needs its business");state.B[7].own=1;ok(techReq(5)==="","tech: new tech available with business");
var ib=businessIncome(7);state.tech.d[5]=1;ok(Math.abs(businessIncome(7)/ib-1.2)<1e-9,"tech: +20% for restaurants");
state.tab="Технологии";render();ok(getEl("view").innerHTML.indexOf("Сейсморазведка")>-1,"tech: new techs shown");
state.cars={};
render();
var snap=JSON.parse(store.lifesim_v01);ok(snap.day===state.day,"autosave works");
var tb=getEl("toasts");tb.children.length=0;toast("x","1","");toast("x","1","");ok(tb.children.length===1,"identical toasts merge");
if(fails){console.log(fails+" FAILED");process.exit(1)}else console.log("ALL OK");
`;
new Function('global', stub + game + test)(global);
