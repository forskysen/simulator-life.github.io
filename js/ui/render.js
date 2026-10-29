/**
 * Сборка экрана: таблица «вкладка → функция», верхняя панель, главная функция render().
 */

/** Какая функция рисует экран каждой вкладки. */
var TAB_VIEWS = {
  Работа: workView,
  Образование: educationView,
  Отношения: relView,
  Медицина: medView,
  Дома: homesView,
  Машины: carView,
  Банк: bankView,
  Счета: billsView,
  Благотворительность: charityView,
  Биржа: marketView,
  Бизнес: businessesView,
  Ферма: farmView,
  Технологии: techView,
  Стата: statView,
  Настройки: settingsView,
};

/** Собирает HTML текущей вкладки (с красными плашками-предупреждениями сверху). */
function view() {
  var make = TAB_VIEWS[state.tab];
  var v = make
    ? make()
    : "<h1>" +
      state.tab +
      '</h1><p class="sub">Раздел в разработке.</p><div class="panel"><p>Эта часть появится в следующих версиях.</p></div>';
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
  g("pexp").textContent = formatMoneyShort(
    Math.round(LIFESTYLES[state.life][1] * state.infl) + state.kids * childDailyCost(),
  );
  g("plvl").textContent = playerLevel();
  g("pmood").textContent =
    Math.round(state.mood) +
    "%" +
    (state.sick > 0 ? " · болезнь" : "") +
    (state.mood < 30 ? " · апатия" : "");
  var b = g("pmbar");
  b.style.width = Math.round(state.mood) + "%";
  b.style.background =
    state.mood > 60 ? "var(--good)" : state.mood > 30 ? "var(--warn)" : "var(--bad)";
  g("day").textContent = state.day;
}

function render() {
  var y = window.pageYOffset;
  state.life = autoLifestyle();
  TAX_RATE = BASE_TAX_RATE - 0.01 * state.char;
  DEPOSIT_LIMIT = depMax();
  DEPOSIT_RATE = 0.04 + 0.005 * state.bu.r;
  normalizeTab();
  nav();
  subnav();
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
