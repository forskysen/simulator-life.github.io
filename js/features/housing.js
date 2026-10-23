/**
 * Жильё: список домов, переезд, аренда и покупка.
 */

function averageDailyIncome() {
  return state.tot / Math.max(30, state.day);
}

function homePrice(i) {
  return Math.round(HOMES[i][3] * state.re.mult);
}

function moveTo(i) {
  state.house = i;
  var lm = "Вы живёте: " + HOMES[i][0] + ".";
  if (state.job >= 0 && state.house < (JOB_MIN_HOME[state.job] || 0)) {
    lm += " Работа " + JOBS[state.job][0] + " потеряна: нужно жильё лучше.";
    state.job = -1;
  }
  lm += quitIfBelowStandard();
  log(lm);
}

function homeGrid() {
  var v = '<div class="jobs">';
  HOMES.forEach(function (h, i) {
    var us = jobsRequiringHome(i),
      own = state.hm[i] !== undefined,
      here = i === state.house,
      rent = h[1],
      pc = homePrice(i),
      bt = "";
    if (i === 0) bt = here ? "" : '<button class="learn" data-h="m0">Уйти на улицу</button>';
    else if (rent)
      bt = here
        ? ""
        : '<button class="learn" data-h="m' +
          i +
          '">Снять: ' +
          formatMoney(Math.round(rent * state.infl)) +
          "/мес</button>";
    else if (own)
      bt =
        (here ? "" : '<button class="learn" data-h="m' + i + '">Жить здесь</button> ') +
        '<button class="learn" data-h="s' +
        i +
        '">Продать: ' +
        formatMoneyShort(pc * 0.9) +
        "</button>";
    else bt = '<button class="learn" data-h="b' + i + '">Купить: ' + formatMoneyShort(pc) + "</button>";
    v +=
      '<div class="job"' +
      (here ? ' aria-pressed="true"' : "") +
      '><span class="n">' +
      h[0] +
      (here ? " · вы живёте здесь" : "") +
      '</span><span class="p">' +
      (rent
        ? formatMoney(Math.round(rent * state.infl)) + " / мес (аренда)"
        : h[3]
          ? formatMoney(pc) + (own ? " · куплен" : "")
          : "Бесплатно") +
      '</span><span class="t">' +
      h[2] +
      "</span>" +
      (h[3]
        ? '<span class="t">Налог на дом: ' + formatMoney(Math.round(pc * 0.002)) + " / мес</span>"
        : "") +
      '<span class="t">' +
      (us ? "Нужно для: " + us : "Для работ не требуется") +
      "</span><div>" +
      bt +
      "</div></div>";
  });
  return v + "</div>";
}

function homeAction(id) {
  var k = id[0],
    i = +id.slice(1),
    h = HOMES[i];
  if (k === "b") {
    var c = homePrice(i);
    if (state.hm[i] !== undefined) return;
    if (state.bal < c) {
      toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
      return;
    }
    state.bal -= c;
    state.hm[i] = c;
    toast("🏠 Дом куплен", h[0] + " · " + formatMoney(c), "good");
    if (i > state.house) moveTo(i);
  } else if (k === "m") {
    if (i > 2 && state.hm[i] === undefined) return;
    moveTo(i);
  } else if (k === "s") {
    if (state.hm[i] === undefined) return;
    var g = Math.round(homePrice(i) * 0.9),
      tx = Math.max(0, g - state.hm[i]) * TAX_RATE;
    state.bal += g;
    addTax("gain", tx);
    delete state.hm[i];
    toast(
      "💰 Дом продан",
      h[0] + ": " + formatMoney(g) + (tx ? " (налог " + formatMoney(tx) + " к оплате в Банке)" : ""),
      "good",
    );
    if (state.house === i) moveTo(0);
  }
  render();
}

var HOMES = [
  ["Улица", 0, "Без жилья", 0],
  ["Комната в общежитии", 9000, "Одна комната, общая кухня (аренда)", 0],
  ["Студия", 16000, "Маленькое самостоятельное жильё в городе (аренда)", 0],
  ["Однокомнатная квартира", 0, "Своя квартира в городе", 3000000],
  ["Двухкомнатная квартира", 0, "Две комнаты, спокойный район", 4500000],
  ["Таунхаус", 0, "Два этажа и маленький двор", 6500000],
  ["Загородный дом", 0, "Частный дом с участком и гаражом", 10000000],
  ["Коттедж с участком", 0, "Просторный коттедж, сад и баня", 15000000],
  ["Пентхаус", 0, "Верхний этаж с террасой и видом на город", 25000000],
  ["Особняк", 0, "Большой дом с парком, бассейном и охраной", 45000000],
  ["Вилла на побережье", 0, "Собственный пляж и причал", 80000000],
  ["Замок", 0, "Старинный замок с башнями и парком", 150000000],
];

var HOME_PRESTIGE = [0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3];
