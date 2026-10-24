/**
 * Технологии: исследования и их бонусы.
 */

/** Бизнес -> технология, дающая ему +20% к доходу. */
var TECH_FOR_BUSINESS = { 0: 1, 2: 2, 3: 3, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9 };

/** Технология -> бизнес, который должен быть открыт для исследования (кроме космоса, у него своя проверка). */
var TECH_NEEDS_BUSINESS = { 5: 7, 6: 8, 7: 9, 8: 10, 9: 11 };

function techBonus(i) {
  var t = TECH_FOR_BUSINESS[i];
  return t !== undefined && state.tech.d[t] ? 1.2 : 1;
}

var TECH = [
  ["Энергоэффективные чипы", 1500000, 20, 0.85, "Электричество майнинг-фермы −25%"],
  ["Умная автоматизация магазинов", 2000000, 25, 0.8, "Доход магазинов +20%"],
  ["Композитные материалы", 4000000, 30, 0.75, "Доход авиакомпании +20%"],
  ["Ракетные двигатели нового поколения", 8000000, 45, 0.7, "Доход космической компании +20%"],
  [
    "Уникальная технология",
    50000000,
    60,
    0.6,
    "Единоразовая выплата, равная всему заработку за игру (×2)",
  ],
  // добавлено в 1.1.2 (индексы 5-9, по одной технологии к новым бизнесам)
  ["Автоматизированные кухни", 2500000, 25, 0.85, "Доход ресторанов +20%"],
  ["Роботизированная стройплощадка", 6000000, 35, 0.75, "Доход строительной компании +20%"],
  ["BIM-проектирование и 3D-печать домов", 12000000, 40, 0.75, "Доход девелопера +20%"],
  ["Сейсморазведка нового поколения", 20000000, 50, 0.7, "Доход нефтедобычи +20%"],
  ["Умные сети и накопители энергии", 15000000, 45, 0.7, "Доход электростанции +20%"],
];

/** Индексы технологий от самой дешёвой к самой дорогой (ключи в state.tech.d не меняются). */
function techOrder() {
  return TECH.map(function (T, i) {
    return i;
  }).sort(function (a, b) {
    return TECH[a][1] - TECH[b][1] || a - b;
  });
}

function techReq(i) {
  var e = state.B[1],
    sp = state.B[3];
  if (!e.own || e.n < 1) return "Нужна инженерная компания хотя бы с 1 группой";
  if (i === 3 && !sp.own) return "Нужна космическая компания";
  var need = TECH_NEEDS_BUSINESS[i];
  if (need !== undefined && !state.B[need].own) return "Нужен бизнес: " + BUSINESSES[need][0];
  if (i === 4) {
    if (e.n < 8) return "Нужно 8 групп инженеров (сейчас " + e.n + ")";
    if (state.astro < 20) return "Нужно 20 космонавтов (сейчас " + state.astro + ")";
    if (!sp.own || sp.n < 15)
      return "Нужно 15 действующих космических аппаратов (сейчас " + (sp.own ? sp.n : 0) + ")";
  }
  return "";
}

function techAction(i) {
  var T = TECH[i],
    r = techReq(i);
  if (state.tech.d[i]) return;
  if (state.tech.cur >= 0) {
    toast("Исследование", "Уже идёт другое исследование.", "bad");
    return;
  }
  if (r) {
    toast("Требования", r, "bad");
    return;
  }
  if (state.bal < T[1]) {
    toast("Не хватает денег", "Нужно " + formatMoney(T[1]), "bad");
    return;
  }
  state.bal -= T[1];
  state.tech.cur = i;
  state.tech.left = T[2];
  toast("🔬 Исследование начато", T[0] + ", дней: " + T[2], "");
  render();
}

function techDay() {
  var Q = state.tech;
  if (Q.cur < 0) return "";
  Q.left--;
  if (Q.left > 0) return "";
  var i = Q.cur,
    T = TECH[i];
  Q.cur = -1;
  if (Math.random() < T[3]) {
    Q.d[i] = 1;
    if (i === 4) {
      var p = Math.round(state.tot);
      state.bal += p;
      toast(
        "🌟 Уникальная технология!",
        "Вы получили " + formatMoney(p) + " — всё заработанное за игру.",
        "good",
      );
      return "Открыта уникальная технология: +" + formatMoney(p) + ". ";
    }
    toast("✅ Технология открыта", T[0], "good");
    return "Открыта технология: " + T[0] + ". ";
  }
  toast("❌ Исследование провалено", T[0] + ": деньги потрачены впустую.", "bad");
  return "Исследование провалено. ";
}

function techView() {
  var v =
    '<h1>🔬 Технологии</h1><p class="sub">Исследования ведёт инженерная компания. Каждое стоит денег, занимает время и может провалиться.</p><div class="jobs">';
  techOrder().forEach(function (i) {
    var T = TECH[i],
      r = techReq(i),
      off = state.tech.d[i] || state.tech.cur === i || r,
      st = state.tech.d[i]
        ? "✔ Открыто"
        : state.tech.cur === i
          ? "Идёт исследование: " + state.tech.left + " дн."
          : r
            ? "🔒 " + r
            : "Шанс успеха " + Math.round(T[3] * 100) + "%, " + T[2] + " дн.";
    v +=
      (off ? '<div class="job">' : '<button class="job" data-q="' + i + '">') +
      '<span class="n">' +
      T[0] +
      '</span><span class="p">' +
      formatMoney(T[1]) +
      '</span><span class="t">' +
      T[4] +
      '</span><span class="t">' +
      st +
      "</span>" +
      (off ? "</div>" : "</button>");
  });
  return v + "</div>";
}
