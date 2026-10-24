/**
 * Состояние игры (объект S), сохранение/загрузка, миграция старых сохранений, настройки (CFG).
 */

var TAX_RATE = 0.13;

var state = {
  day: 1,
  bal: 5000,
  job: -1,
  tab: "Работа",
  done: {},
  study: -1,
  prog: 0,
  house: 0,
  mInc: 0,
  life: 0,
  mood: 70,
  sick: 0,
  farm: { racks: 0, gpus: [], lube: 0, cool: 0, off: 0, debt: 0, worker: 0 },
  dep: 0,
  teeth: 100,
  implant: 0,
  shield: 0,
  banned: {},
  bs: "home",
  B: [
    { own: 0, n: 0, up: [0, 0, 0], x: 0 },
    { own: 0, n: 0, up: [0, 0, 0], x: 0 },
    { own: 0, n: 0, up: [0, 0, 0], x: 0 },
    { own: 0, n: 0, up: [0, 0, 0], x: 0 },
  ],
  rel: null,
  cancer: 0,
  dead: false,
  char: 0,
  kids: 0,
  tot: 0,
  astro: 0,
  bu: { r: 0, l: 0 },
  tech: { d: [0, 0, 0, 0, 0], cur: -1, left: 0 },
  mk: { p: [], h: [], q: [], c: [], own: null },
  ms: -1,
  psy: -99,
  taxPaid: 0,
  apa: 0,
  pain: 0,
  saveVer: SAVE_VERSION,
  navLast: {},
  hist: { days: [], months: [] },
  histRange: 30,
};

/** Сохранения версии 1: в HOMES вставлены 2 дома (индексы 3 и 4), остальные покупные сдвинулись на 2. */
function migrateHomes() {
  if (state.saveVer >= 2) return;
  var shift = function (i) {
    return i >= 3 ? i + 2 : i;
  };
  state.house = shift(state.house);
  var hm = {};
  for (var k in state.hm) hm[shift(+k)] = state.hm[k];
  state.hm = hm;
  state.saveVer = 2;
}

function fixS() {
  if (!state.navLast) state.navLast = {};
  if (!state.hist) state.hist = { days: [], months: [] };
  if (!state.histRange && state.histRange !== 0) state.histRange = 30;
  normalizeTab();
  while (state.B.length < BUSINESSES.length) state.B.push({ own: 0, n: 0, up: [0, 0, 0], x: 0 });
  while (state.tech.d.length < TECH.length) state.tech.d.push(0);
  state.B.forEach(function (s) {
    if (s.emp === undefined) s.emp = s.n || 0;
    if (!s.u2) s.u2 = [0, 0, 0];
  });
  if (state.implant === undefined) state.implant = 0;
  if (state.farm.wc === undefined) state.farm.wc = 0;
  if (state.farm.worker === undefined) state.farm.worker = 0;
  if (!state.eco) state.eco = { ph: 0, left: 90 };
  if (!state.infl) state.infl = 1;
  if (state.rest === undefined) {
    state.rest = 0;
    state.restDay = -999;
  }
  if (!state.re) state.re = { mkt: [], own: [], au: [], mult: 1, day: 0 };
  if (!state.re.mkt.length) state.re.mkt = [flipNewHouse(), flipNewHouse(), flipNewHouse()];
  if (!state.ag) state.ag = { lvl: 0, ct: [] };
  if (!state.tx)
    state.tx = {
      job: { a: 0, d: 0 },
      biz: { a: 0, d: 0 },
      prop: { a: 0, d: 0 },
      veh: { a: 0, d: 0 },
      gain: { a: 0, d: 0 },
    };
  if (state.mJob === undefined) state.mJob = 0;
  if (!state.cars) state.cars = {};
  if (!state.evLast) state.evLast = {};
  if (!state.ap) state.ap = { own: false, off: {} };
  for (var tk in BILL_NAMES) if (!state.tx[tk]) state.tx[tk] = { a: 0, d: 0 };
  if (state.farm.debt > 0) {
    addTax("elec", state.farm.debt);
    state.farm.debt = 0;
  }
  state.farm.off = 0;
  if (!state.hm) {
    // совсем старые сохранения: сразу в нумерацию версии 2
    var MAP = [0, 1, 2, 5, 7, 8, 10, 11];
    state.house = MAP[state.house] !== undefined ? MAP[state.house] : 0;
    state.hm = {};
    if (state.house >= 3) state.hm[state.house] = homePrice(state.house);
    state.saveVer = SAVE_VERSION;
  }
  migrateHomes();
  for (var k in state.banned) if (state.banned[k] === true) state.banned[k] = state.day;
}

var SETTINGS = { theme: "auto", maxToasts: 0 },
  RS = 0,
  RT2 = 0;

try {
  var c0 = JSON.parse(localStorage.getItem("lifesim_cfg") || "{}");
  for (var k0 in c0) SETTINGS[k0] = c0[k0];
} catch (e) {}

function saveCfg() {
  try {
    localStorage.setItem("lifesim_cfg", JSON.stringify(SETTINGS));
  } catch (e) {}
}

function applyCfg() {
  var r = document.documentElement;
  if (!r || !r.setAttribute) return;
  if (SETTINGS.theme === "light" || SETTINGS.theme === "dark")
    r.setAttribute("data-theme", SETTINGS.theme);
  else r.removeAttribute("data-theme");
}

var SAVE_KEY = "lifesim_v01";

/** Версия формата сохранения: 2 = список жилья расширен (индексы домов 3+ сдвинуты на 2). */
var SAVE_VERSION = 2;

function save() {
  try {
    if (state.dead) localStorage.removeItem(SAVE_KEY);
    else localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function load() {
  try {
    var r = localStorage.getItem(SAVE_KEY);
    if (!r) return false;
    var o = JSON.parse(r);
    for (var k in o) state[k] = o[k];
    state.saveVer = o.saveVer || 1;
    while (state.B.length < 4) state.B.push({ own: 0, n: 0, up: [0, 0, 0], x: 0 });
    if (state.tab === "Налоги") state.tab = "Банк";
    return true;
  } catch (e) {
    return false;
  }
}
