/**
 * Вкладки, навигация, сборка экрана и верхней панели.
 */

var TABS = [
  "Образование",
  "Работа",
  "Дома",
  "Бизнес",
  "Медицина",
  "Банк",
  "Биржа",
  "Отношения",
  "Стата",
];

var ICON = {
  Образование: "🎓",
  Работа: "💼",
  Дома: "🏠",
  Бизнес: "🏢",
  Медицина: "🩺",
  Банк: "🏦",
  Биржа: "📈",
  Отношения: "❤️",
  Стата: "📊",
};

function nav() {
  var h = "";
  TABS.forEach(function (t) {
    h +=
      '<button data-t="' +
      t +
      '"' +
      (t === state.tab ? ' aria-current="true"' : "") +
      '><span aria-hidden="true">' +
      ICON[t] +
      "</span> " +
      t +
      "</button>";
  });
  var n = document.getElementById("nav");
  n.innerHTML = h;
}

function view() {
  var v = "";
  if (state.tab === "Работа") {
    v =
      '<h1>Работа</h1><p class="sub">Выберите профессию. Зарплата начисляется каждый день.</p><div class="jobs">';
    JOBS.forEach(function (j, i) {
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
    v += carView();
  } else if (state.tab === "Дома") {
    v =
      '<h1>Дома</h1><p class="sub">Покупайте дома: налог на дом начисляется каждый месяц. Аренда остаётся только для общежития и студии.</p>' +
      homeGrid() +
      '<h1 style="margin-top:24px">Образ жизни</h1><p class="sub">Определяется автоматически: зависит от дохода и накоплений.</p><div class="panel"><div class="row"><span>Сейчас</span><b>' +
      LIFESTYLES[state.life][0] +
      '</b></div><div class="row"><span>Расходы на еду и быт</span><b>' +
      formatMoney(Math.round(LIFESTYLES[state.life][1] * state.infl)) +
      ' / день</b></div><p style="margin-top:8px;color:var(--muted)">' +
      LIFESTYLES[state.life][2] +
      "</p></div>";
    v += flipView();
  } else if (state.tab === "Налоги") {
    var h = HOMES[state.house],
      tx = state.mInc * TAX_RATE,
      left = 30 - (state.day % 30);
    v =
      '<h1>Налоги</h1><p class="sub">Налоги и аренда списываются раз в месяц (каждые 30 дней).</p><div class="panel">' +
      '<div class="row"><span>Ставка налога на доход</span><b>' +
      Math.round(TAX_RATE * 100) +
      "%</b></div>" +
      '<div class="row"><span>Заработано в этом месяце</span><b>' +
      formatMoney(state.mInc) +
      "</b></div>" +
      '<div class="row"><span>Налог к оплате</span><b>' +
      formatMoney(tx) +
      "</b></div>" +
      '<div class="row"><span>Аренда (' +
      h[0] +
      ")</span><b>" +
      formatMoney(h[1]) +
      "</b></div>" +
      '<div class="row"><span>Итого к оплате</span><b class="money">' +
      formatMoney(tx + h[1]) +
      "</b></div>" +
      '<div class="row"><span>До списания</span><b>' +
      left +
      " дн.</b></div></div>";
  } else if (state.tab === "Образование") {
    v =
      '<h1>Образование</h1><p class="sub">Обучение платное: сначала накопите нужную сумму, она списывается при старте. Учёба идёт по дням. Без него часть профессий недоступна. Учиться можно только по одной программе.</p><div class="jobs">';
    JOBS.forEach(function (j, i) {
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
          (state.bal < COURSE_PRICE[i] ? '<span class="t">Не хватает ' + formatMoney(COURSE_PRICE[i] - state.bal) + "</span>" : "");
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
  } else if (state.tab === "Бизнес") {
    v =
      state.bs === "home"
        ? businessHub()
        : state.bs === "m"
          ? farmView()
          : state.bs === "t"
            ? techView()
            : businessView(state.bs);
  } else if (state.tab === "Медицина") {
    v = medView();
  } else if (state.tab === "Банк") {
    v = bankView();
  } else if (state.tab === "Биржа") {
    v = marketView();
  } else if (state.tab === "Стата") {
    v = statView();
  } else if (state.tab === "Настройки") {
    v = settingsView();
  } else if (state.tab === "Отношения") {
    v = relView();
  } else {
    v =
      "<h1>" +
      state.tab +
      '</h1><p class="sub">Раздел в разработке.</p><div class="panel"><p>Эта часть появится в следующих версиях.</p></div>';
  }
  document.getElementById("view").innerHTML = warningBanners() + v;
}

function profile() {
  var g = function (i) {
    return document.getElementById(i);
  };
  ["pbal", "pbal2"].forEach(function (i) {
    g(i).textContent = formatMoneyShort(state.bal);
    g(i).title = formatMoney(state.bal);
    g(i).style.color = state.bal < 0 ? "var(--bad)" : "";
  });
  g("pinc").textContent = formatMoneyShort(dailyIncome());
  g("pexp").textContent = formatMoneyShort(Math.round(LIFESTYLES[state.life][1] * state.infl) + state.kids * childDailyCost());
  g("plvl").textContent = playerLevel();
  g("pmood").textContent =
    Math.round(state.mood) + "%" + (state.sick > 0 ? " · болезнь" : "") + (state.mood < 30 ? " · апатия" : "");
  var b = g("pmbar");
  b.style.width = Math.round(state.mood) + "%";
  b.style.background = state.mood > 60 ? "var(--good)" : state.mood > 30 ? "var(--warn)" : "var(--bad)";
  g("day").textContent = state.day;
}

function render() {
  var y = window.pageYOffset;
  state.life = autoLifestyle();
  TAX_RATE = 0.13 - 0.01 * state.char;
  DEPOSIT_LIMIT = depMax();
  DEPOSIT_RATE = 0.04 + 0.005 * state.bu.r;
  nav();
  view();
  if (state.dead)
    document.getElementById("view").innerHTML =
      '<h1>Вы умерли</h1><p class="sub">Причина: ' +
      state.dead +
      ". Вы прожили " +
      state.day +
      ' дн.</p><div class="panel"><p>Накопления: ' +
      formatMoney(state.bal + state.dep) +
      '</p><button class="learn" onclick="location.reload()">Начать заново</button></div>';
  profile();
  save();
  window.scrollTo(0, y);
}
