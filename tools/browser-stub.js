// Общая «заглушка браузера»: позволяет запускать игру в Node без DOM.
// Используется smoke-test.js и fuzz-test.js.
//
// stub        код с подделками localStorage / document / window (вставляется перед кодом игры)
// gameSource  скрипты игры, склеенные в порядке подключения из index.html
// listeners   (внутри заглушки) обработчики document.addEventListener: listeners.click, listeners.keydown
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function gameSource() {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  return scripts.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
}

const stub = `
var listeners={};var store={};var localStorage={getItem:function(k){return k in store?store[k]:null},setItem:function(k,v){store[k]=v},removeItem:function(k){delete store[k]}};
function mkEl(id){var el={id:id,style:{},dataset:{},children:[],value:"",textContent:"",innerHTML:"",title:"",className:"",classList:{toggle:function(){},add:function(){},remove:function(){}},
 appendChild:function(c){c.parent=el;el.children.push(c)},remove:function(){if(el.parent){var i=el.parent.children.indexOf(el);if(i>=0)el.parent.children.splice(i,1)}},querySelector:function(){return null},select:function(){}};
 Object.defineProperty(el,"firstChild",{get:function(){return el.children[0]}});return el}
var els={};function getEl(id){return els[id]||(els[id]=mkEl(id))}
var window={pageYOffset:0,innerWidth:400,scrollTo:function(){}};var setTimeout=function(){return 0},clearTimeout=function(){};
var location={reload:function(){}};var btoa=global.btoa,atob=global.atob;
var document={getElementById:getEl,addEventListener:function(t,f){listeners[t]=f},createElement:function(){return mkEl("x")},documentElement:{setAttribute:function(){},removeAttribute:function(){}}};
`;

module.exports = { stub, gameSource };
