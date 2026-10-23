/**
 * Бизнесы: точки, сотрудники, улучшения, доход и расходы.
 */

var BUSINESSES = [
  [
    "🛒 Сеть продуктовых магазинов",
    100000,
    "Закупка, склады, новые точки. Стабильный доход.",
    "Открыть новую точку",
    150000,
    2000,
    18000,
    10,
    [
      ["Склад", 250000, 0.15, "+15% к доходу"],
      ["Логистика", 400000, 0.2, "+20% к доходу"],
      ["Маркетинг", 300000, 0.15, "+15% к доходу"],
    ],
    "Кража и порча товара",
  ],
  [
    "⚙️ Инновационная инженерная компания",
    500000,
    "Разработки и патенты. Дорого, но прибыльно.",
    "Нанять исследовательскую группу",
    400000,
    5200,
    60000,
    8,
    [
      ["Лаборатория", 600000, 0.15, "+15% к доходу"],
      ["Патентный отдел", 1000000, 0.25, "+25% к доходу"],
      ["Госконтракт", 1500000, 0.3, "+30% к доходу"],
    ],
    "Утечка технологий",
  ],
  [
    "✈️ Авиакомпания",
    3000000,
    "Самолёты, маршруты, ангары. Большие деньги и большие расходы.",
    "Купить самолёт",
    6000000,
    60000,
    700000,
    10,
    [
      ["Ангар", 4000000, 0.15, "+15% к доходу"],
      ["Сервисный центр", 6000000, 0.15, "+15% к доходу"],
      ["Международные рейсы", 10000000, 0.3, "+30% к доходу"],
    ],
    "Лётное происшествие",
  ],
  [
    "🚀 Космическая компания",
    20000000,
    "Спутники, запуски, станции. Нужна для величайшего открытия.",
    "Запустить космический аппарат",
    30000000,
    250000,
    3500000,
    10,
    [
      ["Космодром", 30000000, 0.2, "+20% к доходу"],
      ["Центр управления полётами", 50000000, 0.2, "+20% к доходу"],
      ["Лунная база", 100000000, 0.4, "+40% к доходу"],
    ],
    "Авария ракеты",
  ],
  [
    "🏬 Торговый центр",
    8000000,
    "Арендаторы, парковка, реклама. Открывайте сколько угодно, но каждый следующий дороже (×1,35).",
    "Открыть торговый центр",
    12000000,
    90000,
    1200000,
    0,
    [
      ["Парковка", 15000000, 0.15, "+15% к доходу"],
      ["Кинотеатр", 25000000, 0.2, "+20% к доходу"],
      ["Фуд-корт", 20000000, 0.15, "+15% к доходу"],
    ],
    "Ограбление и пожар",
  ],
  [
    "💻 IT-компания",
    1500000,
    "Разработка приложений и сервисов. Нужен диплом программиста (Образование).",
    "Нанять команду разработчиков",
    600000,
    8500,
    90000,
    10,
    [
      ["Облачная инфраструктура", 800000, 0.15, "+15% к доходу"],
      ["Патент на ПО", 1500000, 0.2, "+20% к доходу"],
      ["Собственный продукт", 2500000, 0.3, "+30% к доходу"],
    ],
    "Утечка данных",
  ],
  [
    "📣 Рекламное агентство",
    3000000,
    "Подписывайте контракты, вечно улучшайте агентство и заключайте договоры с государством.",
    "—",
    2000000,
    0,
    0,
    0,
    [
      ["Креативная студия", 3000000, 0.1, "+10% к доходу"],
      ["Медиабаза", 5000000, 0.15, "+15% к доходу"],
      ["Связи в госорганах", 8000000, 0.2, "+20% к доходу"],
    ],
    "Скандал вокруг кампании",
  ],
];

function businessIncome(i) {
  var s = state.B[i],
    m = 1;
  BUSINESSES[i][8].forEach(function (u, j) {
    if (s.up[j]) m += u[2];
  });
  if (s.u2[0]) m += 0.1;
  var u = i === 6 ? agencyBase() : Math.min(s.n, s.emp) * BUSINESSES[i][5];
  return u * m * (1 + relBonus()) * techBonus(i) * healthIncomeMultiplier() * economyMultiplier() * restMultiplier();
}

function businessDay() {
  var t = 0,
    o = "";
  state.B.forEach(function (s, i) {
    if (!s.own || (!s.n && i !== 6)) return;
    var inc = businessIncome(i);
    state.bal += inc;
    state.mInc += inc;
    t += inc;
    if (Math.random() < 0.01) {
      var l = Math.round(inc * 5 * (s.u2[1] ? 0.3 : 1));
      state.bal -= l;
      state.mInc -= l;
      toast("⚠️ " + BUSINESSES[i][0], BUSINESSES[i][9] + ": −" + formatMoney(l), "bad");
      o += BUSINESSES[i][9] + " −" + formatMoney(l) + ". ";
    }
  });
  return (t ? "Бизнесы: +" + formatMoney(t) + ". " : "") + o;
}

function businessMonth() {
  var sal = estimatedSalaries(),
    opx = estimatedOperatingCosts();
  addTax("sal", sal);
  addTax("opx", opx);
  return sal + opx;
}

function businessAction(id) {
  var k = id[0],
    p = id.slice(1).split("_"),
    i = +p[0],
    b = BUSINESSES[i],
    s = state.B[i],
    c;
  if (k === "L") {
    if (s.own) return;
    if (BUSINESS_DIPLOMA[i] !== undefined && !state.done[BUSINESS_DIPLOMA[i]]) {
      toast("Лицензия", "Нужен диплом: " + JOBS[BUSINESS_DIPLOMA[i]][4], "bad");
      return;
    }
    c = b[1];
  } else if (k === "U") {
    if (s.n >= businessMaxPoints(i)) {
      toast("Лимит", "Максимум: " + businessMaxPoints(i) + ". Расширьте лимит в улучшениях.", "bad");
      return;
    }
    c = pointPrice(i);
  } else if (k === "E") {
    if ((i !== 6 && s.emp >= s.n) || (i === 6 && s.emp >= 12)) {
      toast(
        "Сотрудники",
        i === 6
          ? "Максимум 12 сотрудников."
          : "Сотрудников не больше, чем точек. Сначала откройте точку.",
        "bad",
      );
      return;
    }
    c = EMPLOYEE_SALARY[i];
  } else if (k === "H") {
    if (s.u2[+p[1]]) return;
    c = Math.round(b[4] * SHARED_UPGRADES[+p[1]][1]);
  } else if (k === "X") {
    if (s.x >= 4) return;
    c = b[4] * 3 * (s.x + 1);
  } else if (k === "A") {
    if (state.astro >= 30) {
      toast("Лимит", "Максимум 30 космонавтов.", "bad");
      return;
    }
    c = 2000000;
  } else {
    if (s.up[+p[1]]) return;
    c = b[8][+p[1]][1];
  }
  if (state.bal < c) {
    toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
    return;
  }
  state.bal -= c;
  if (k === "L") {
    s.own = 1;
    toast("🏢 Бизнес открыт", b[0], "good");
  } else if (k === "U") {
    s.n++;
    toast("➕ " + b[3], "Всего: " + s.n, "good");
  } else if (k === "E") {
    s.emp++;
    toast("👤 Сотрудник нанят", "Сотрудников: " + s.emp, "good");
  } else if (k === "H") {
    s.u2[+p[1]] = 1;
    toast("🔧 Улучшение куплено", SHARED_UPGRADES[+p[1]][0], "good");
  } else if (k === "X") {
    s.x++;
    toast("📈 Лимит расширен", "Максимум: " + businessMaxPoints(i), "good");
  } else if (k === "A") {
    state.astro++;
    toast("👨‍🚀 Космонавт нанят", "Всего: " + state.astro, "good");
  } else {
    s.up[+p[1]] = 1;
    toast("🔧 Улучшение куплено", b[8][+p[1]][0], "good");
  }
  render();
}

function businessHub() {
  var v =
    '<h1>Бизнес</h1><p class="sub">Выберите бизнес. Прибыль за месяц облагается налогом 13%.</p><div class="jobs">';
  v +=
    '<button class="job" data-bs="m"><span class="n">⛏️ Майнинг-ферма</span><span class="p">' +
    (state.farm.gpus.length ? formatMoney(farmInc()) + "/день" : "Не запущена") +
    '</span><span class="t">Стойки, видеокарты, заточка</span></button>';
  BUSINESSES.forEach(function (b, i) {
    var s = state.B[i];
    v +=
      '<button class="job" data-bs="' +
      i +
      '"><span class="n">' +
      b[0] +
      '</span><span class="p">' +
      (s.own ? formatMoney(businessIncome(i)) + "/день" : "Лицензия " + formatMoney(b[1])) +
      '</span><span class="t">' +
      b[2] +
      "</span></button>";
  });
  v +=
    '<button class="job" data-bs="t"><span class="n">🔬 Технологии</span><span class="p">' +
    state.tech.d.filter(Boolean).length +
    ' из 5</span><span class="t">Исследования, уникальная технология</span></button>';
  return v + "</div>";
}

function businessView(i) {
  if (i === 6 && state.B[6].own) return agencyView();
  var b = BUSINESSES[i],
    s = state.B[i],
    v =
      '<button class="learn" data-bs="home" style="margin:0 0 12px">← Все бизнесы</button><h1>' +
      b[0] +
      '</h1><p class="sub">' +
      b[2] +
      "</p>";
  if (!s.own)
    return (
      v +
      '<div class="panel"><p>Для запуска нужна лицензия.</p><button class="learn" data-z="L' +
      i +
      '">Купить лицензию: ' +
      formatMoney(b[1]) +
      "</button></div>"
    );
  v +=
    '<div class="panel"><div class="row"><span>Объектов</span><b>' +
    s.n +
    (UNLIMITED_POINTS[i] ? "" : " из " + businessMaxPoints(i)) +
    '</b></div><div class="row"><span>Сотрудники (нужен на каждую точку)</span><b>' +
    s.emp +
    " из " +
    s.n +
    '</b></div><div class="row"><span>Доход в день</span><b class="money">' +
    formatMoney(businessIncome(i)) +
    '</b></div><div class="row"><span>Расходы в месяц</span><b>' +
    formatMoney(s.n * b[6] + s.emp * EMPLOYEE_SALARY[i] * (s.u2[2] ? 0.75 : 1) + (i === 3 ? state.astro * 150000 : 0)) +
    "</b></div>" +
    (i === 3 ? '<div class="row"><span>Космонавты</span><b>' + state.astro + " из 30</b></div>" : "") +
    "</div>";
  v +=
    '<h1 style="margin-top:24px">Расширение</h1><div class="jobs"><button class="job" data-z="U' +
    i +
    '"><span class="n">' +
    b[3] +
    '</span><span class="p">' +
    formatMoney(pointPrice(i)) +
    '</span><span class="t">+' +
    formatMoney(b[5]) +
    "/день, расходы " +
    formatMoney(b[6]) +
    '/мес. Нужен сотрудник</span></button><button class="job" data-z="E' +
    i +
    '"><span class="n">Нанять сотрудника</span><span class="p">' +
    formatMoney(EMPLOYEE_SALARY[i]) +
    '</span><span class="t">Зарплата ' +
    formatMoney(EMPLOYEE_SALARY[i]) +
    " в месяц. Без сотрудника точка не приносит доход</span></button></div>";
  v += '<h1 style="margin-top:24px">Улучшения</h1><div class="jobs">';
  v += upgradesHtml(i);
  if (s.x < 4 && !UNLIMITED_POINTS[i])
    v +=
      '<button class="job" data-z="X' +
      i +
      '"><span class="n">Расширение лимита</span><span class="p">' +
      formatMoney(b[4] * 3 * (s.x + 1)) +
      '</span><span class="t">Максимум объектов +5 (сейчас ' +
      businessMaxPoints(i) +
      ")</span></button>";
  if (i === 3)
    v +=
      '<button class="job" data-z="A3"><span class="n">Нанять космонавта</span><span class="p">' +
      formatMoney(2000000) +
      '</span><span class="t">Нужны для технологий. Зарплата 150 000 ₽/мес. Сейчас: ' +
      state.astro +
      " из 30</span></button>";
  return (
    v +
    '</div><p class="sub" style="margin-top:12px">Раз в месяц списываются расходы (вычитаются из прибыли для налога). Каждый день 1% риска: «' +
    b[9] +
    "».</p>"
  );
}

function businessMaxPoints(i) {
  return UNLIMITED_POINTS[i] ? 1e9 : BUSINESSES[i][7] + 5 * state.B[i].x;
}

function totalBusinessIncome() {
  var t = farmInc();
  state.B.forEach(function (s, i) {
    if (s.own && (s.n || i === 6)) t += businessIncome(i);
  });
  return t;
}

var EMPLOYEE_SALARY = [25000, 80000, 250000, 600000, 180000, 70000, 150000],
  BUSINESS_DIPLOMA = { 5: 12 },
  POINT_PRICE_GROWTH = { 4: 1.35 },
  UNLIMITED_POINTS = { 4: 1 };

function pointPrice(i) {
  return Math.round(BUSINESSES[i][4] * Math.pow(POINT_PRICE_GROWTH[i] || 1, state.B[i].n));
}

var SHARED_UPGRADES = [
  ["Обучение персонала", 1.5, "+10% к доходу"],
  ["Страхование", 1, "Потери от происшествий −70%"],
  ["Автоматизация", 2, "Зарплаты −25%"],
];

function upgradesHtml(i) {
  var b = BUSINESSES[i],
    s = state.B[i],
    v = "";
  b[8].forEach(function (u, j) {
    v += s.up[j]
      ? '<div class="job"><span class="n">' + u[0] + '</span><span class="t">✔ Куплено</span></div>'
      : '<button class="job" data-z="G' +
        i +
        "_" +
        j +
        '"><span class="n">' +
        u[0] +
        '</span><span class="p">' +
        formatMoney(u[1]) +
        '</span><span class="t">' +
        u[3] +
        "</span></button>";
  });
  SHARED_UPGRADES.forEach(function (u, j) {
    var c = Math.round(b[4] * u[1]);
    v += s.u2[j]
      ? '<div class="job"><span class="n">' + u[0] + '</span><span class="t">✔ Куплено</span></div>'
      : '<button class="job" data-z="H' +
        i +
        "_" +
        j +
        '"><span class="n">' +
        u[0] +
        '</span><span class="p">' +
        formatMoney(c) +
        '</span><span class="t">' +
        u[2] +
        "</span></button>";
  });
  return v;
}
