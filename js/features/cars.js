/**
 * Машины.
 */

var CARS = [
  ["Стрела Мини", 800000, 0.03],
  ["Волна Седан", 1800000, 0.06],
  ["Орион Кросс", 3500000, 0.1],
  ["Титан Внедорожник", 7000000, 0.14],
  ["Вектор Купе", 15000000, 0.18],
  ["Аврора Люкс", 35000000, 0.22],
  ["Комета Спорт", 80000000, 0.25],
  // добавлено в 1.1.2 (в конец, чтобы не сдвигать ключи купленных машин; на экране всё равно по цене)
  ["Жук Городской", 400000, 0.015],
  ["Ветер Хэтчбек", 1200000, 0.045],
  ["Гранит Пикап", 5000000, 0.12],
  ["Феникс Гран-турисмо", 25000000, 0.2],
  ["Призрак Гиперкар", 200000000, 0.28],
];

/** Индексы машин от самой дешёвой к самой дорогой (ключи в state.cars не меняются). */
function carOrder() {
  return CARS.map(function (c, i) {
    return i;
  }).sort(function (a, b) {
    return CARS[a][1] - CARS[b][1] || a - b;
  });
}

function carBonus() {
  if (propertySuspended()) return 0;
  var b = 0;
  for (var i in state.cars) b = Math.max(b, CARS[+i][2]);
  return b;
}

function carView() {
  var v =
    '<h1>Машины</h1><p class="sub">Машина даёт плюс к зарплате (считается лучшая из ваших). Транспортный налог 0,15% в месяц с каждой. Продажа за 70% цены.</p><div class="jobs">';
  carOrder().forEach(function (i) {
    var c = CARS[i],
      own = state.cars[i] !== undefined;
    v +=
      '<div class="job"><span class="n">' +
      c[0] +
      (own ? " · ваша" : "") +
      '</span><span class="p">' +
      formatMoneyShort(c[1]) +
      '</span><span class="t">+' +
      Math.round(c[2] * 100) +
      "% к зарплате. Налог " +
      formatMoney(Math.round(c[1] * 0.0015)) +
      " / мес</span><div>" +
      (own
        ? '<button class="learn" data-car="s' +
          i +
          '">Продать: ' +
          formatMoneyShort(c[1] * 0.7) +
          "</button>"
        : '<button class="learn" data-car="b' + i + '">Купить</button>') +
      "</div></div>";
  });
  return v + "</div>";
}

function carAction(id) {
  var k = id[0],
    i = +id.slice(1),
    c = CARS[i];
  if (k === "b") {
    if (state.cars[i] !== undefined) return;
    if (state.bal < c[1]) {
      toast("Не хватает денег", "Нужно " + formatMoney(c[1]), "bad");
      return;
    }
    state.bal -= c[1];
    state.cars[i] = c[1];
    toast("🚗 Машина куплена", c[0] + ": +" + Math.round(c[2] * 100) + "% к зарплате", "good");
  } else {
    if (state.cars[i] === undefined) return;
    state.bal += Math.round(c[1] * 0.7);
    delete state.cars[i];
    toast("🚗 Машина продана", c[0] + ": " + formatMoney(c[1] * 0.7), "");
  }
  render();
}
