// Быстрая проверка игры без браузера: node tools/smoke-test.js
// Подставляет заглушки DOM, прогоняет 300 дней, рисует все разделы и проверяет сохранение.
const fs = require('fs'), path = require('path');
// Список скриптов берём из index.html, чтобы порядок подключения был в одном месте.
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const game = scripts.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
const stub = `
var store={};var localStorage={getItem:function(k){return k in store?store[k]:null},setItem:function(k,v){store[k]=v},removeItem:function(k){delete store[k]}};
function mkEl(id){var el={id:id,style:{},dataset:{},children:[],value:"",textContent:"",innerHTML:"",title:"",className:"",classList:{toggle:function(){}},
 appendChild:function(c){c.parent=el;el.children.push(c)},remove:function(){if(el.parent){var i=el.parent.children.indexOf(el);if(i>=0)el.parent.children.splice(i,1)}},querySelector:function(){return null},select:function(){}};
 Object.defineProperty(el,"firstChild",{get:function(){return el.children[0]}});return el}
var els={};function getEl(id){return els[id]||(els[id]=mkEl(id))}
var window={pageYOffset:0,innerWidth:400,scrollTo:function(){}};var setTimeout=function(){return 0},clearTimeout=function(){};
var location={reload:function(){}};var btoa=global.btoa,atob=global.atob;
var document={getElementById:getEl,addEventListener:function(){},createElement:function(){return mkEl("x")},documentElement:{setAttribute:function(){},removeAttribute:function(){}}};
`;
const test = `
var fails=0;function ok(c,m){console.log((c?"OK   ":"FAIL ")+m);if(!c)fails++}
state.job=5;state.bal=2e6;
for(var d=0;d<300;d++)els.next.onclick();
var bad=["bal","mood","teeth","tot","infl","dep"].filter(function(k){return isNaN(state[k])});
ok(bad.length===0,"300 days, no NaN (day "+state.day+", dead="+(state.dead||false)+")");
state.dead=false;
var probs=[];
["Образование","Работа","Дома","Бизнес","Медицина","Банк","Биржа","Отношения","Стата","Настройки"].forEach(function(t){state.tab=t;state.bs="home";state.ms=-1;render();var h=getEl("view").innerHTML;if(h.indexOf("NaN")>-1||h.indexOf("undefined")>-1)probs.push(t)});
[ "m","t",0,1,2,3,4,5,6].forEach(function(b){state.tab="Бизнес";state.bs=b;render();var h=getEl("view").innerHTML;if(h.indexOf("NaN")>-1||h.indexOf("undefined")>-1)probs.push("biz "+b)});
ok(probs.length===0,"all tabs and business views render"+(probs.length?": "+probs.join():""));
var snap=JSON.parse(store.lifesim_v01);ok(snap.day===state.day,"autosave works");
var tb=getEl("toasts");tb.children.length=0;toast("x","1","");toast("x","1","");ok(tb.children.length===1,"identical toasts merge");
if(fails){console.log(fails+" FAILED");process.exit(1)}else console.log("ALL OK");
`;
new Function('global', stub + game + test)(global);
