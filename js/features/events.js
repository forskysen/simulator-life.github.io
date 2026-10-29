/**
 * Случайные события, болезни, увольнения и красные плашки-предупреждения.
 */

/**
 * Случайные события. Поля:
 *   name      название (по нему хранится «когда было в последний раз», не меняйте у существующих)
 *   money     сумма при среднем доходе до 2500 ₽/день, дальше растёт вместе с доходом
 *   mood      изменение настроения
 *   cooldown  минимум дней между повторами
 *   needJob   нужна работа        needHome  нужно своё жильё (не бездомный)   street  только бездомным
 *   maxIncome событие только при среднем доходе не выше этого
 *   needCar   нужна машина        needBiz   нужен хотя бы один бизнес
 *   season    [с, по] день года (0-364), события окна происходят раз в год; окно может переходить через конец года
 */
var RANDOM_EVENTS = [
  // --- бытовые ---
  { name: "Премия на работе", money: 3000, mood: 5, cooldown: 30, needJob: true },
  { name: "Нашли деньги на улице", money: 1000, mood: 3, cooldown: 14, maxIncome: 25000 },
  { name: "Сломалась бытовая техника", money: -3000, mood: -4, cooldown: 30, needHome: true },
  { name: "Штраф за нарушение", money: -1500, mood: -3, cooldown: 21 },
  { name: "Подарок от родственников", money: 5000, mood: 8, cooldown: 60 },
  { name: "Кража кошелька", money: -2500, mood: -8, cooldown: 14 },
  { name: "Подработка на выходных", money: 3000, mood: 2, cooldown: 14, maxIncome: 20000 },
  { name: "Ссора с коллегой", money: 0, mood: -6, cooldown: 14, needJob: true },
  { name: "Хороший день", money: 0, mood: 10, cooldown: 7 },
  { name: "Протечка в доме", money: -8000, mood: -3, cooldown: 60, needHome: true },
  { name: "Украли вещи на улице", money: -2000, mood: -5, cooldown: 14, street: true },
  {
    name: "Подработка у соседей",
    money: 2500,
    mood: 2,
    cooldown: 14,
    needHome: true,
    maxIncome: 20000,
  },
  { name: "Скидка в магазине", money: 1500, mood: 2, cooldown: 30 },
  { name: "Застряли в пробке", money: 0, mood: -4, cooldown: 14, needJob: true },
  { name: "Встретили старого друга", money: 0, mood: 7, cooldown: 30 },
  { name: "Нашли старую заначку", money: 2000, mood: 4, cooldown: 90 },
  { name: "Потеряли ключи", money: -1200, mood: -3, cooldown: 30, needHome: true },
  { name: "Сломался телефон", money: -4500, mood: -4, cooldown: 90 },
  // --- сезонные ---
  {
    name: "Новогодняя премия",
    money: 8000,
    mood: 8,
    cooldown: 300,
    needJob: true,
    season: [352, 364],
  },
  { name: "Подарки к Новому году", money: -6000, mood: 6, cooldown: 300, season: [345, 364] },
  {
    name: "Налоговый вычет",
    money: 6000,
    mood: 3,
    cooldown: 300,
    needJob: true,
    season: [100, 130],
  },
  // --- про имущество и бизнес ---
  { name: "Поломка машины", money: -12000, mood: -4, cooldown: 60, needCar: true },
  { name: "Проверка в бизнесе", money: -10000, mood: -3, cooldown: 90, needBiz: true },
  { name: "Крупный заказ", money: 15000, mood: 5, cooldown: 60, needBiz: true },
];

/** Попадает ли сегодняшний день в сезонное окно события (у несезонных всегда да). */
function inSeason(e) {
  if (!e.season) return true;
  var d = state.day % 365,
    from = e.season[0],
    to = e.season[1];
  return from <= to ? d >= from && d <= to : d >= from || d <= to;
}

/** Выполняются ли условия события сегодня (avgIncome — средний доход в день). */
function eventAllowed(e, avgIncome) {
  return (
    (!e.needJob || state.job >= 0) &&
    (!e.needHome || state.house > 0) &&
    (!e.street || state.house === 0) &&
    (!e.maxIncome || avgIncome <= e.maxIncome) &&
    (!e.needCar || Object.keys(state.cars).length > 0) &&
    (!e.needBiz ||
      state.B.some(function (b) {
        return b.own;
      })) &&
    inSeason(e) &&
    state.day - (state.evLast[e.name] || -999) >= e.cooldown
  );
}

/** Применить событие: деньги, настроение, уведомление. Возвращает строку для лога дня. */
function applyEvent(e, avgIncome) {
  state.evLast[e.name] = state.day;
  var am = e.money ? Math.round((e.money * Math.max(1, avgIncome / 2500)) / 100) * 100 : 0;
  state.bal += am;
  state.mood = clampPercent(state.mood + e.mood);
  var text = am
    ? (am > 0 ? "+" : "−") + formatMoney(Math.abs(am))
    : "Настроение " + (e.mood > 0 ? "улучшилось" : "ухудшилось");
  toast(e.name, text, am > 0 || (am === 0 && e.mood > 0) ? "good" : "bad");
  return e.name + (am ? " (" + (am > 0 ? "+" : "−") + formatMoney(Math.abs(am)) + ")" : "") + ". ";
}

function warningBanners() {
  var w = [];
  if (state.mood < 30)
    w.push(
      "😶 Апатия (настроение ниже 30%): вы не хотите работать и заниматься бизнесом, доход 0. Помогают приём психолога (Медицина) и свидания.",
    );
  if (propertySuspended())
    w.push(
      "⛔ Счёт не оплачен " +
        ARREARS_DAYS +
        "+ дней: бизнесы, ферма и машины остановлены и не приносят доход. Оплатите долги во вкладке «Счета», и всё заработает снова.",
    );
  else if (taxTotal() > 0) {
    var md = 0;
    for (var tk in state.tx) if (state.tx[tk].a > 0) md = Math.max(md, state.tx[tk].d);
    w.push(
      "🧾 Неоплаченные счета и налоги: " +
        formatMoney(taxTotal()) +
        ". Пени 0,5% в день. Через " +
        Math.max(0, ARREARS_DAYS - md) +
        " дн. бизнесы, ферма и машины остановятся. Оплатить: вкладка «Счета».",
    );
  }
  if (state.rest > 0)
    w.push("🏖️ Вы в отпуске: осталось " + state.rest + " дн. Доход бизнесов −60%.");
  if (state.teeth < 30)
    w.push(
      "🦷 Острая зубная боль: через боль никто не работает. Доход 0, пока не вылечите зубы (Медицина → Стоматология).",
    );
  else if (state.teeth < 60)
    w.push("🙁 Плохие зубы: вы замкнулись в себе, весь доход −30%. Нужна стоматология.");
  return w.length
    ? '<div class="panel" style="margin-bottom:14px;border-left:6px solid var(--bad)">' +
        w
          .map(function (x) {
            return "<p>" + x + "</p>";
          })
          .join("") +
        "</div>"
    : "";
}

function dailyRandomEvents() {
  var o = "",
    low = state.mood < 25,
    dm = state.life - 0.5;
  if (state.job < 0) dm -= 1;
  else if (prestigeGap(state.job) >= 2) dm -= 2;
  else if (prestigeGap(state.job) <= 0) dm += 0.5;
  state.mood = clampPercent(state.mood + dm);
  if (
    state.sick <= 0 &&
    Math.random() <
      (0.02 + (low ? 0.03 : 0) + (state.life === 0 ? 0.01 : 0)) *
        (state.shield > 0 ? 0.05 : 1) *
        (partnerCareActive() ? 0.8 : 1)
  ) {
    state.sick = 3 + Math.floor(Math.random() * 8);
    toast(
      "🤒 Вы заболели",
      "На " + state.sick + " дн.: работать нельзя, лекарства 700 ₽ в день.",
      "bad",
    );
    o += "Вы заболели на " + state.sick + " дн.: работать нельзя, нужны лекарства. ";
  }
  if (state.job >= 0 && state.sick <= 0 && Math.random() < 0.0002 + (low ? 0.0003 : 0)) {
    state.banned[state.job] = state.day;
    toast("📄 Вас уволили", "Работа «" + JOBS[state.job][0] + "» закрыта для вас на год.", "bad");
    o += "Вас уволили с работы «" + JOBS[state.job][0] + "». ";
    state.job = -1;
    state.mood = clampPercent(state.mood - 15);
  }
  var ad = averageDailyIncome();
  // сезонные события: в окне каждый день есть шанс, раз в год (cooldown)
  var seasonal = RANDOM_EVENTS.filter(function (e) {
    return e.season && eventAllowed(e, ad);
  });
  if (seasonal.length && Math.random() < 0.3)
    o += applyEvent(seasonal[Math.floor(Math.random() * seasonal.length)], ad);
  // обычные события: 15% в день, одно случайное из несезонных
  if (Math.random() < 0.15) {
    var regular = RANDOM_EVENTS.filter(function (e) {
      return !e.season;
    });
    var e = regular[Math.floor(Math.random() * regular.length)];
    if (eventAllowed(e, ad)) o += applyEvent(e, ad);
  }
  return o;
}
