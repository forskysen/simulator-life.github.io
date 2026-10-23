/**
 * Технологии: исследования и их бонусы.
 */

function techBonus(i) {
  var t = i === 0 ? 1 : i === 2 ? 2 : i === 3 ? 3 : -1;
  return t >= 0 && state.tech.d[t] ? 1.2 : 1;
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
];

function techReq(i) {
  var e = state.B[1],
    sp = state.B[3];
  if (!e.own || e.n < 1) return "Нужна инженерная компания хотя бы с 1 группой";
  if (i === 3 && !sp.own) return "Нужна космическая компания";
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
    '<button class="learn" data-bs="home" style="margin:0 0 12px">← Все бизнесы</button><h1>🔬 Технологии</h1><p class="sub">Исследования ведёт инженерная компания. Каждое стоит денег, занимает время и может провалиться.</p><div class="jobs">';
  TECH.forEach(function (T, i) {
    var r = techReq(i),
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
