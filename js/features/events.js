/**
 * Случайные события, болезни, увольнения и красные плашки-предупреждения.
 */

var RANDOM_EVENTS = [
  ["Премия на работе", 3000, 5, 1, 0, 0, 0, 30],
  ["Нашли деньги на улице", 1000, 3, 0, 0, 0, 25000, 14],
  ["Сломалась бытовая техника", -3000, -4, 0, 1, 0, 0, 30],
  ["Штраф за нарушение", -1500, -3, 0, 0, 0, 0, 21],
  ["Подарок от родственников", 5000, 8, 0, 0, 0, 0, 60],
  ["Кража кошелька", -2500, -8, 0, 0, 0, 0, 14],
  ["Подработка на выходных", 3000, 2, 0, 0, 0, 20000, 14],
  ["Ссора с коллегой", 0, -6, 1, 0, 0, 0, 14],
  ["Хороший день", 0, 10, 0, 0, 0, 0, 7],
  ["Протечка в доме", -8000, -3, 0, 1, 0, 0, 60],
  ["Украли вещи на улице", -2000, -5, 0, 0, 1, 0, 14],
  ["Подработка у соседей", 2500, 2, 0, 1, 0, 20000, 14],
];

function warningBanners() {
  var w = [];
  if (state.mood < 30)
    w.push(
      "😶 Апатия (настроение ниже 30%): вы не хотите работать и заниматься бизнесом, доход 0. Помогают приём психолога (Медицина) и свидания.",
    );
  if (taxTotal() > 0) {
    var md = 0;
    for (var tk in state.tx) if (state.tx[tk].a > 0) md = Math.max(md, state.tx[tk].d);
    w.push(
      "🧾 Неоплаченные счета и налоги: " +
        formatMoney(taxTotal()) +
        ". Пени 0,5% в день, приставы придут через " +
        Math.max(0, 30 - md) +
        " дн. Оплатить: «Банк».",
    );
  }
  if (state.rest > 0) w.push("🏖️ Вы в отпуске: осталось " + state.rest + " дн. Доход бизнесов −60%.");
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
  if (Math.random() < 0.15) {
    var e = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)],
      ad = averageDailyIncome();
    if (
      (!e[3] || state.job >= 0) &&
      (!e[4] || state.house > 0) &&
      (!e[5] || state.house === 0) &&
      (!e[6] || ad <= e[6]) &&
      state.day - (state.evLast[e[0]] || -999) >= e[7]
    ) {
      state.evLast[e[0]] = state.day;
      var am = e[1] ? Math.round((e[1] * Math.max(1, ad / 2500)) / 100) * 100 : 0;
      state.bal += am;
      state.mood = clampPercent(state.mood + e[2]);
      var tt = am
        ? (am > 0 ? "+" : "−") + formatMoney(Math.abs(am))
        : "Настроение " + (e[2] > 0 ? "улучшилось" : "ухудшилось");
      toast(e[0], tt, am > 0 || (am === 0 && e[2] > 0) ? "good" : "bad");
      o += e[0] + (am ? " (" + (am > 0 ? "+" : "−") + formatMoney(Math.abs(am)) + ")" : "") + ". ";
    }
  }
  return o;
}
