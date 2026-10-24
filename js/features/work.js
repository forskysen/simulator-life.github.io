/**
 * Работа, образование, уровень жизни, престиж и доход (множители зарплаты).
 */

var JOBS = [
  ["Полиция", 3200, "Охрана порядка", 30, "Полицейская академия"],
  ["Пожарные", 3000, "Спасение и тушение", 20, "Пожарная школа"],
  ["Скорая помощь", 3400, "Выезды к пациентам", 60, "Медицинский колледж"],
  ["Повар", 2400, "Кухня ресторана", 10, "Кулинарные курсы"],
  ["Учитель", 2600, "Школа", 90, "Педагогический вуз"],
  ["Уборщик", 1800, "Чистота и порядок", 0, ""],
  ["Тренер", 2700, "Спортзал", 20, "Курсы тренеров"],
  ["Строители", 3100, "Стройплощадка, перекуп домов (вкладка «Дома»)", 15, "Строительные курсы"],
  ["Продавец", 2000, "Магазин", 0, ""],
  ["Грузчик", 2200, "Склад", 0, ""],
  ["Завод", 2900, "Производство", 10, "Заводское обучение"],
  ["Водители", 2800, "Перевозки", 15, "Автошкола"],
  ["Программист", 5500, "Разработка", 120, "Курсы программирования"],
  ["Банкир", 6000, "Банк", 150, "Финансовый университет"],
  // добавлено в 1.1.2 (в конец, чтобы не сдвигать индексы в сохранениях; на экране всё равно по зарплате)
  ["Курьер", 1500, "Доставка пешком и на самокате", 0, ""],
  ["Электрик", 3700, "Монтаж и ремонт проводки", 25, "Колледж электриков"],
  ["Менеджер", 4200, "Продажи и работа с клиентами", 40, "Курсы менеджмента"],
  ["Врач", 4600, "Поликлиника", 180, "Медицинский университет"],
  ["Инженер", 4900, "Проектирование и расчёты", 100, "Технический университет"],
  ["Юрист", 5100, "Договоры и суды", 120, "Юридический факультет"],
];

var LIFESTYLES = [
  ["Базовый", 400, "Простая еда, минимум трат"],
  ["Средний", 900, "Нормальное питание и отдых"],
  ["Высокий", 1800, "Рестораны, развлечения, такси"],
  ["Люкс", 4000, "Дорогие рестораны, путешествия, личный водитель"],
];

var JOB_PRESTIGE = [3, 3, 3, 1, 3, 0, 2, 1, 1, 0, 1, 2, 4, 5, 0, 2, 3, 4, 3, 4];

function livingStandard() {
  return HOME_PRESTIGE[state.house] + state.life;
}

function prestigeGap(k) {
  return livingStandard() - JOB_PRESTIGE[k];
}

function autoLifestyle() {
  var p = state.job < 0 ? 0 : JOBS[state.job][1],
    l = p < 2500 ? 0 : p < 4000 ? 1 : p < 5800 ? 2 : 3;
  if (state.bal < 3000) l = 0;
  else if (state.bal > 300000) l = Math.min(3, l + 1);
  if (state.rel && state.rel.m) l = Math.min(3, l + 1);
  return l;
}

function quitIfBelowStandard() {
  if (state.job >= 0 && prestigeGap(state.job) >= 3) {
    var n = JOBS[state.job][0];
    state.job = -1;
    toast(
      "😤 Вы уволились сами",
      "Работа «" + n + "» слишком низка для вашего уровня жизни.",
      "bad",
    );
    return " Вы ушли с работы «" + n + "»: для вашего уровня жизни это слишком низко.";
  }
  return "";
}

function healthIncomeMultiplier() {
  return state.mood < 30 || state.teeth < 30 ? 0 : state.teeth < 60 ? 0.7 : 1;
}

function isFiredFrom(k) {
  var d = state.banned[k];
  return d !== undefined && d !== false && state.day - d < 365;
}

var COURSE_PRICE = {
  0: 20000,
  1: 12000,
  2: 45000,
  3: 5000,
  4: 70000,
  6: 12000,
  7: 8000,
  10: 6000,
  11: 10000,
  12: 150000,
  13: 250000,
  15: 14000,
  16: 30000,
  17: 220000,
  18: 95000,
  19: 120000,
};

function playerLevel() {
  var s = livingStandard();
  return s <= 1
    ? "Бедность"
    : s === 2
      ? "Скромный"
      : s <= 4
        ? "Комфортный"
        : s === 5
          ? "Высокий"
          : "Роскошный";
}

// профессия -> минимальное жильё (индекс в HOMES): 1 общежитие, 5 однокомнатная, 8 загородный дом
var JOB_MIN_HOME = {
  0: 1,
  1: 1,
  2: 1,
  4: 1,
  6: 1,
  11: 1,
  12: 5,
  13: 8,
  15: 1,
  16: 1,
  17: 5,
  18: 1,
  19: 5,
};

function jobsRequiringHome(l) {
  var r = [];
  for (var k in JOB_MIN_HOME) if (JOB_MIN_HOME[k] === l) r.push(JOBS[k][0]);
  return r.join(", ");
}

function dailyIncome() {
  return state.job < 0 || state.sick > 0
    ? 0
    : JOBS[state.job][1] *
        (1 + relBonus()) *
        healthIncomeMultiplier() *
        economyMultiplier() *
        state.infl *
        (1 + carBonus());
}

/** Клик по работе: проверяем учёбу, жильё, бан и престиж, потом устраиваемся. */
function pickJob(k) {
  var job = JOBS[k];
  if (job[3] && !state.done[k]) {
    log("Сначала пройдите обучение: " + job[4] + " (" + job[3] + " дн.).");
  } else if (state.house < (JOB_MIN_HOME[k] || 0)) {
    log("Нужно жильё: " + HOMES[JOB_MIN_HOME[k]][0] + " или лучше.");
  } else if (isFiredFrom(k)) {
    var daysLeft = 365 - (state.day - state.banned[k]);
    log("Вас уволили с этой работы. Вернуться можно через " + daysLeft + " дн.");
    toast(
      "🚫 Доступ закрыт",
      "Вас уволили с работы «" + job[0] + "». Вернуться можно через " + daysLeft + " дн.",
      "bad",
    );
  } else if (prestigeGap(k) >= 3) {
    log("Для вашего уровня жизни это слишком низко: вы не пойдёте на работу «" + job[0] + "».");
  } else {
    state.job = k;
    log("Вы работаете: " + job[0] + ".");
    render();
  }
}

/** Клик по курсу: платим и начинаем учиться (одновременно можно только один курс). */
function startCourse(i) {
  if (state.study < 0 && state.bal >= COURSE_PRICE[i]) {
    state.bal -= COURSE_PRICE[i];
    state.study = i;
    state.prog = 0;
    log("Начато обучение: " + JOBS[i][4] + ". Оплачено " + formatMoney(COURSE_PRICE[i]) + ".");
    render();
  } else if (state.study < 0) {
    log("Не хватает денег на обучение.");
  }
}

/** Клик по образу жизни (после выбора может сработать увольнение из-за престижа). */
function setLifestyle(i) {
  state.life = i;
  log("Образ жизни: " + LIFESTYLES[state.life][0] + "." + quitIfBelowStandard());
  render();
}

/** Индексы профессий от самой низкой зарплаты к самой высокой (индексы в сохранениях не меняются). */
function jobOrder() {
  return JOBS.map(function (j, i) {
    return i;
  }).sort(function (a, b) {
    return JOBS[a][1] - JOBS[b][1] || a - b;
  });
}

/** Экран «Работа»: список профессий. */
function workView() {
  var v = "";

  v =
    '<h1>Работа</h1><p class="sub">Выберите профессию. Зарплата начисляется каждый день.</p><div class="jobs">';
  jobOrder().forEach(function (i) {
    var j = JOBS[i];
    var need = j[3] && !state.done[i];
    var nh = JOB_MIN_HOME[i] || 0,
      noh = state.house < nh,
      low = prestigeGap(i) >= 3,
      ban = isFiredFrom(i);
    var info = !j[3]
      ? "Обучение не нужно"
      : need
        ? "🔒 Нужно: " + j[4] + ", " + j[3] + " дн., " + formatMoney(COURSE_PRICE[i])
        : "✔ Обучение пройдено";
    v +=
      '<button class="job" data-j="' +
      i +
      '" aria-pressed="' +
      (i === state.job) +
      '"' +
      (need || noh || low || ban ? ' style="opacity:.6"' : "") +
      '><span class="n">' +
      j[0] +
      '</span><span class="p">' +
      formatMoney(j[1]) +
      ' / день</span><span class="t">' +
      j[2] +
      '</span><span class="t">' +
      info +
      "</span>" +
      (nh
        ? '<span class="t">' + (noh ? "🔒" : "✔") + " Жильё: " + HOMES[nh][0] + " или лучше</span>"
        : "") +
      (low ? '<span class="t">Слишком низко для вашего уровня жизни</span>' : "") +
      (ban
        ? '<span class="t">🚫 Уволены: вернуться можно через ' +
          (365 - (state.day - state.banned[i])) +
          " дн.</span>"
        : "") +
      "</button>";
  });
  v += "</div>";
  return v;
}

/** Экран «Образование»: курсы и прогресс обучения. */
function educationView() {
  var v = "";

  v =
    '<h1>Образование</h1><p class="sub">Обучение платное: сначала накопите нужную сумму, она списывается при старте. Учёба идёт по дням. Без него часть профессий недоступна. Учиться можно только по одной программе.</p><div class="jobs">';
  jobOrder().forEach(function (i) {
    var j = JOBS[i];
    if (!j[3]) return;
    var st;
    if (state.done[i]) st = '<span class="t">✔ Пройдено</span>';
    else if (state.study === i)
      st =
        '<div class="bar2"><i style="width:' +
        Math.round((state.prog / j[3]) * 100) +
        '%"></i></div><span class="t">День ' +
        state.prog +
        " из " +
        j[3] +
        "</span>";
    else
      st =
        '<span class="t"><button class="learn" data-e="' +
        i +
        '"' +
        (state.study >= 0 || state.bal < COURSE_PRICE[i] ? " disabled" : "") +
        ">Начать обучение</button></span>" +
        (state.bal < COURSE_PRICE[i]
          ? '<span class="t">Не хватает ' + formatMoney(COURSE_PRICE[i] - state.bal) + "</span>"
          : "");
    v +=
      '<div class="job"><span class="n">' +
      j[4] +
      '</span><span class="p">' +
      j[3] +
      " дн., " +
      formatMoney(COURSE_PRICE[i]) +
      '</span><span class="t">Откроет: ' +
      j[0] +
      "</span>" +
      st +
      "</div>";
  });
  v += "</div>";
  return v;
}
