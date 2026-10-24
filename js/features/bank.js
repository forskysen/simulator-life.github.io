/**
 * Банк: вклад, проценты, улучшения вклада.
 */

var DEPOSIT_LIMIT = 200000000,
  DEPOSIT_RATE = 0.04;

function bankMonth() {
  var i = Math.round(state.dep * DEPOSIT_RATE);
  if (i > 0) {
    state.bal += i;
    toast("🏦 Проценты по вкладу", "+" + formatMoney(i), "good");
    return " Проценты по вкладу: +" + formatMoney(i) + ".";
  }
  return "";
}

function bankAction(k) {
  if (k === "char") {
    charity();
    return;
  }
  if (k === "ur" || k === "ul") {
    bankUpgradeAction(k);
    return;
  }
  var a = Math.floor(+document.getElementById("bamt").value) || 0,
    room = DEPOSIT_LIMIT - state.dep;
  if (k === "dep" || k === "depall") {
    if (k === "depall") a = Math.floor(Math.min(state.bal, room));
    if (a <= 0) {
      toast("Банк", "Укажите сумму или проверьте баланс.", "bad");
      return;
    }
    if (a > state.bal) {
      toast("Банк", "Не хватает денег на балансе.", "bad");
      return;
    }
    if (a > room) {
      toast(
        "Банк",
        "Лимит вклада " + formatMoney(DEPOSIT_LIMIT) + ". Можно доложить ещё " + formatMoney(room),
        "bad",
      );
      return;
    }
    state.bal -= a;
    state.dep += a;
    toast("🏦 Вклад пополнен", formatMoney(a), "good");
  } else {
    if (k === "wdall") a = state.dep;
    if (a <= 0) {
      toast("Банк", "Укажите сумму или вклад пуст.", "bad");
      return;
    }
    if (a > state.dep) {
      toast("Банк", "На вкладе только " + formatMoney(state.dep), "bad");
      return;
    }
    state.dep -= a;
    state.bal += a;
    toast("🏦 Снятие со вклада", formatMoney(a), "");
  }
  render();
}

function bankView() {
  var room = DEPOSIT_LIMIT - state.dep;
  return (
    '<h1>Банк</h1><p class="sub">Вклад под ' +
    (DEPOSIT_RATE * 100).toFixed(1) +
    "% в месяц. Проценты поступают на баланс раз в месяц. Максимум на вкладе: " +
    formatMoney(DEPOSIT_LIMIT) +
    '.</p><div class="panel"><div class="row"><span>На вкладе</span><b class="money">' +
    formatMoney(state.dep) +
    '</b></div><div class="row"><span>Можно ещё положить</span><b>' +
    formatMoney(room) +
    '</b></div><div class="row"><span>Проценты в месяц</span><b>' +
    formatMoney(state.dep * DEPOSIT_RATE) +
    '</b></div><div class="row"><span>Ваш баланс</span><b>' +
    formatMoney(state.bal) +
    '</b></div></div><div class="panel" style="margin-top:12px"><input id="bamt" type="number" min="0" inputmode="numeric" placeholder="Сумма" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit;margin-bottom:10px"><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="learn" data-k="dep">Положить</button><button class="learn" data-k="depall">Положить всё</button><button class="learn" data-k="wd">Снять</button><button class="learn" data-k="wdall">Снять всё</button></div></div>' +
    taxPanel() +
    '<h1 style="margin-top:24px">Благотворительность</h1><p class="sub">Каждое пожертвование снижает налог на 1%, каждое следующее в 10 раз дороже. Налог сейчас: ' +
    Math.round(TAX_RATE * 100) +
    '%.</p><div class="panel">' +
    (state.char >= 8
      ? "<p>Максимум: налог 5%.</p>"
      : '<button class="learn" data-k="char">Пожертвовать ' +
        formatMoney(1000000 * Math.pow(10, state.char)) +
        " (налог −1%)</button>") +
    "</div>" +
    bankUpView()
  );
}

function depMax() {
  return [2e8, 5e8, 1e9, 5e9][state.bu.l];
}

var DEPOSIT_RATE_UPGRADE_PRICES = [2000000, 10000000, 50000000, 200000000],
  DEPOSIT_LIMIT_UPGRADE_PRICES = [10000000, 50000000, 250000000];

function bankUpView() {
  var r = state.bu.r,
    l = state.bu.l;
  return (
    '<h1 style="margin-top:24px">Улучшения вклада</h1><div class="jobs">' +
    (r < 4
      ? '<button class="job" data-k="ur"><span class="n">Повышенная ставка</span><span class="p">' +
        formatMoney(DEPOSIT_RATE_UPGRADE_PRICES[r]) +
        '</span><span class="t">Ставка +0,5% (сейчас ' +
        (DEPOSIT_RATE * 100).toFixed(1) +
        "%)</span></button>"
      : '<div class="job"><span class="n">Ставка</span><span class="t">✔ Максимум 6%</span></div>') +
    (l < 3
      ? '<button class="job" data-k="ul"><span class="n">Расширение лимита</span><span class="p">' +
        formatMoney(DEPOSIT_LIMIT_UPGRADE_PRICES[l]) +
        '</span><span class="t">Лимит до ' +
        formatMoney([5e8, 1e9, 5e9][l]) +
        "</span></button>"
      : '<div class="job"><span class="n">Лимит</span><span class="t">✔ Максимум ' +
        formatMoney(5e9) +
        "</span></div>") +
    "</div>"
  );
}

function bankUpgradeAction(k) {
  var r = state.bu.r,
    l = state.bu.l,
    c = k === "ur" ? DEPOSIT_RATE_UPGRADE_PRICES[r] : DEPOSIT_LIMIT_UPGRADE_PRICES[l];
  if (c === undefined) return; // все улучшения этого вида уже куплены
  if (state.bal < c) {
    toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
    return;
  }
  state.bal -= c;
  if (k === "ur") state.bu.r++;
  else state.bu.l++;
  toast("🏦 Улучшение вклада", "Установлено", "good");
  render();
}
