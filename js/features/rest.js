/**
 * Экономика (инфляция, кризисы) и отдых.
 */

function economyMultiplier() {
  return state.eco.ph === 1 ? 1.1 : state.eco.ph === 2 ? 0.9 : 1;
}

function ecoDay() {
  var E = state.eco,
    o = "";
  state.infl *= 1.0001;
  E.left--;
  if (E.left <= 0) {
    var r = Math.random();
    E.ph = r < 0.4 ? 0 : r < 0.7 ? 1 : 2;
    E.left = 60 + Math.floor(Math.random() * 90);
    toast(
      E.ph === 1
        ? "📈 Экономический подъём"
        : E.ph === 2
          ? "📉 Экономический спад"
          : "⚖️ Экономика стабилизировалась",
      E.ph === 1
        ? "Доходы +10% на ближайшие месяцы."
        : E.ph === 2
          ? "Доходы −10% на ближайшие месяцы."
          : "Доходы в норме.",
      E.ph === 1 ? "good" : E.ph === 2 ? "bad" : "",
    );
    o = "Экономика: " + ["стабильность", "подъём", "спад"][E.ph] + ". ";
  }
  return o;
}

function restMultiplier() {
  return state.rest > 0 ? 0.4 : 1;
}

function startRest() {
  var c = Math.round(150000 * state.infl);
  if (state.rest > 0) return;
  if (state.day - state.restDay < 365) {
    toast("Отдых", "Следующий месячный отдых через " + (365 - (state.day - state.restDay)) + " дн.", "bad");
    return;
  }
  if (state.bal < c) {
    toast("Не хватает денег", "Путёвка стоит " + formatMoney(c), "bad");
    return;
  }
  state.bal -= c;
  state.rest = 30;
  state.restDay = state.day;
  toast("🏖️ Вы уехали отдыхать", "30 дней. Доход бизнесов −60%.", "good");
  render();
}

function restDay() {
  if (state.rest <= 0) return "";
  state.rest--;
  state.mood = clampPercent(state.mood + 1);
  if (state.rest === 0) {
    state.mood = 100;
    if (state.rel) state.rel.love = 100;
    toast("🏖️ Отдых закончился", "Настроение и чувства восстановлены до 100%.", "good");
    return "Отдых закончился. ";
  }
  return "";
}

function restBlock() {
  var left = 365 - (state.day - state.restDay);
  return (
    '<h1 style="margin-top:24px">Отдых</h1><p class="sub">Месячный отдых раз в год: настроение и чувства к партнёрше вернутся к 100%. Пока вы отдыхаете, доход бизнесов −60%.</p><div class="jobs"><button class="job" data-rest="1"><span class="n">Месячный отдых</span><span class="p">' +
    formatMoney(Math.round(150000 * state.infl)) +
    '</span><span class="t">' +
    (state.rest > 0
      ? "Идёт отдых: осталось " + state.rest + " дн."
      : left > 0
        ? "Следующий отдых через " + left + " дн."
        : "Доступно сейчас") +
    "</span></button></div>"
  );
}
