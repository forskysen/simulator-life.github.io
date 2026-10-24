// Случайные сессии кликов и горячих клавиш: node tools/fuzz-test.js [шагов=3000] [зёрна=1,2,3]
//
// Для каждого зерна и четырёх стартовых состояний (от нищего до миллиардера) игра получает
// тысячи случайных нажатий по всем кнопкам, которые встречаются на экранах, плюс клавиши и «следующий день».
// Ищет: исключения в обработчиках, NaN/undefined/Infinity в HTML и нечисловой баланс.
// Код выхода 1, если что-то найдено.
const { stub, gameSource } = require("./browser-stub");

const steps = +process.argv[2] || 3000;
const seeds = (process.argv[3] || "1,2,3,4,5,6").split(",").map(Number);
const starts = [
  { job: -1, bal: 5e3 },
  { job: 5, bal: 5e6 },
  { job: 13, bal: 5e9 },
  { job: 19, bal: 1e13 },
];

function seeded(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Код, который выполняется внутри «игры» (имеет доступ ко всем её глобальным именам).
const session = `
return (function () {
  var R = __rnd, problems = [], errors = {}, lastAction = "";
  state.job = __start.job;
  state.bal = __start.bal;
  var KEYS = ["ArrowLeft", "ArrowRight", " ", "Enter"];

  function html() {
    return getEl("view").innerHTML + getEl("nav").innerHTML + getEl("subnav").innerHTML;
  }
  function scan(where) {
    var h = html(), m = h.match(/.{0,40}(NaN|undefined|Infinity|\\[object).{0,40}/);
    if (m) problems.push(where + ": " + m[0]);
    if (!isFinite(state.bal)) problems.push(where + ": баланс не число (" + lastAction + ")");
  }
  // все data-атрибуты и их значения, которые встречаются на экранах
  function collect() {
    var pool = {}, tabs = NAV_GROUPS.reduce(function (a, g) { return a.concat(g.tabs); }, ["Настройки"]);
    tabs.forEach(function (t) {
      var screens = t === "Бизнес" ? ["home"].concat(BUSINESSES.map(function (b, i) { return i; })) : ["home"];
      screens.forEach(function (b) {
        state.tab = t; state.bs = b; render();
        var re = /data-([a-z]+)="([^"]*)"/g, m, h = html();
        while ((m = re.exec(h))) (pool[m[1]] = pool[m[1]] || {})[m[2]] = 1;
      });
    });
    for (var k in pool) pool[k] = Object.keys(pool[k]);
    return pool;
  }
  function click(attrs) {
    listeners.click({ target: { closest: function (sel) {
      var k = sel.slice(6, -1);
      if (!(k in attrs)) return null;
      var d = {}; d[k] = attrs[k];
      return { dataset: d };
    } } });
  }

  var pool = collect(), names = Object.keys(pool);
  state.tab = "Работа"; state.bs = "home"; render();
  for (var i = 0; i < __steps; i++) {
    var r = R();
    try {
      if (r < 0.2) { lastAction = "nextDay"; if (!state.dead) nextDay(); }
      else if (r < 0.25) {
        lastAction = "key";
        listeners.keydown({ key: KEYS[Math.floor(R() * 4)], shiftKey: R() < 0.3, target: { tagName: "BODY" }, preventDefault: function () {} });
      } else {
        var attrs = {}, n = R() < 0.15 ? 2 : 1;
        for (var j = 0; j < n; j++) {
          var name = names[Math.floor(R() * names.length)], vals = pool[name];
          if (vals && vals.length) attrs[name] = vals[Math.floor(R() * vals.length)];
        }
        if (("mt" in attrs) && state.ms < 0) delete attrs.mt; // «купить актив» без открытой карточки невозможно
        lastAction = JSON.stringify(attrs);
        click(attrs);
      }
    } catch (e) {
      var key = (e && e.message || String(e)).slice(0, 80) + " <= " + lastAction;
      errors[key] = (errors[key] || 0) + 1;
    }
    if (state.dead) { state.dead = false; state.bal = Math.max(state.bal, __start.bal); }
    if (i % 250 === 0) {
      scan("шаг " + i);
      var fresh = collect();
      for (var f in fresh) pool[f] = fresh[f];
      names = Object.keys(pool);
      state.tab = NAV_GROUPS[Math.floor(R() * NAV_GROUPS.length)].tabs[0]; state.bs = "home"; render();
    }
  }
  scan("конец");
  return { problems: problems.slice(0, 3), errors: errors };
})();`;

const code = gameSource();
let failed = 0;
for (const seed of seeds) {
  for (const start of starts) {
    const rnd = seeded(seed);
    const r = new Function(
      "global",
      "__rnd",
      "__start",
      "__steps",
      "Math.random=__rnd;" + stub + code + session,
    )(global, rnd, start, steps);
    const errKeys = Object.keys(r.errors);
    if (r.problems.length || errKeys.length) {
      failed++;
      console.log(`зерно ${seed}, старт ${JSON.stringify(start)}:`);
      r.problems.forEach((p) => console.log("  проблема: " + p));
      errKeys.forEach((k) => console.log(`  исключение x${r.errors[k]}: ${k}`));
    }
  }
}
if (failed) {
  console.log(`НАЙДЕНО ПРОБЛЕМ: ${failed} из ${seeds.length * starts.length} сессий`);
  process.exit(1);
}
console.log(
  `OK: ${seeds.length * starts.length} сессий по ${steps} действий, без исключений и NaN`,
);
