/**
 * Состояние игры (объект S), сохранение/загрузка, миграция старых сохранений, настройки (CFG).
 */

/** Налоговая ставка без благотворительности; TAX_RATE = базовая − 1% за каждое пожертвование. */
var BASE_TAX_RATE = 0.13,
  TAX_RATE = BASE_TAX_RATE;

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
  suspended: 0,
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
  mk: { p: [], h: [], q: [], c: [], own: null, fair: 0, growth: 0, flows: [] },
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
  if (state.saveVer >= 2 || !state.hm) return; // совсем старые сохранения (без hm) чинит блок в fixS
  var shift = function (i) {
    return i >= 3 ? i + 2 : i;
  };
  state.house = shift(state.house);
  var hm = {};
  for (var k in state.hm) hm[shift(+k)] = state.hm[k];
  state.hm = hm;
  state.saveVer = 2;
}

/**
 * Версия 3: убраны «Торговый центр» (был индекс 4) и «Рекламное агентство» (индекс 6).
 * Остальные бизнесы сдвигаются вниз по номерам, а вложения в убранные возвращаются деньгами:
 * лицензия, точки, улучшения, расширения, наём сотрудников и уровни агентства.
 */
var LEGACY_BUSINESS_COUNT = 12, // сколько бизнесов было до версии 3
  REMOVED_BUSINESSES = [
    // i: старый индекс; point: цена точки; growth: рост цены каждой следующей; hire: цена найма
    {
      i: 4,
      name: "Торговый центр",
      license: 8000000,
      point: 12000000,
      growth: 1.35,
      hire: 180000,
      upgrades: [15000000, 25000000, 20000000],
    },
    {
      i: 6,
      name: "Рекламное агентство",
      license: 3000000,
      point: 2000000,
      growth: 1,
      hire: 150000,
      upgrades: [3000000, 5000000, 8000000],
    },
  ];

function migrateBusinesses() {
  if (state.saveVer >= 3) return;
  while (state.B.length < LEGACY_BUSINESS_COUNT)
    state.B.push({ own: 0, n: 0, up: [0, 0, 0], x: 0 });
  var refund = 0,
    removed = REMOVED_BUSINESSES.map(function (r) {
      return r.i;
    });
  REMOVED_BUSINESSES.forEach(function (r) {
    var s = state.B[r.i];
    if (!s || !s.own) return;
    var sum = r.license;
    for (var k = 0; k < (s.n || 0); k++) sum += Math.round(r.point * Math.pow(r.growth, k));
    (s.up || []).forEach(function (u, j) {
      if (u) sum += r.upgrades[j];
    });
    (s.u2 || []).forEach(function (u, j) {
      if (u) sum += Math.round(r.point * SHARED_UPGRADES[j][1]);
    });
    for (var x = 0; x < (s.x || 0); x++) sum += r.point * 3 * (x + 1);
    sum += (s.emp || 0) * r.hire;
    if (r.i === 6 && state.ag)
      for (var l = 0; l < (state.ag.lvl || 0); l++) sum += Math.round(1000000 * Math.pow(1.35, l));
    refund += sum;
  });
  var newIndex = {},
    n = 0;
  for (var i = 0; i < LEGACY_BUSINESS_COUNT; i++) if (removed.indexOf(i) < 0) newIndex[i] = n++;
  state.B = state.B.filter(function (b, i) {
    return removed.indexOf(i) < 0;
  });
  delete state.ag;
  if (typeof state.bs === "number")
    state.bs = newIndex[state.bs] === undefined ? "home" : newIndex[state.bs];
  if (refund > 0) {
    state.bal += refund;
    toast(
      "🏢 Бизнесы закрыты",
      "Торговый центр и Рекламное агентство убраны из игры. Возврат вложений: " +
        formatMoney(refund),
      "good",
    );
  }
  state.saveVer = 3;
}

function fixS() {
  migrateHomes();
  migrateBusinesses();
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
  if (state.suspended === undefined) state.suspended = 0;
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

/**
 * Версия формата сохранения.
 *   2 = список жилья расширен (индексы домов 3+ сдвинуты на 2)
 *   3 = убраны бизнесы «Торговый центр» и «Рекламное агентство» (индексы бизнесов сдвинуты)
 */
var SAVE_VERSION = 3;

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
