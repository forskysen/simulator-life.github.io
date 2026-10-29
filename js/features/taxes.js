/**
 * Счета и налоги: начисление, пени, последствия, автоплатёж, конец месяца.
 */

/** Скидка благотворительности на счёт k в процентах (0 для зарплат сотрудников). */
function charityDiscountPercent(k) {
  return k === "sal" ? 0 : Math.round((1 - charityFactor()) * 1000) / 10;
}

/** Экран вкладки «Счета»: просрочка, автоплатёж, список счетов и ожидаемые платежи. */
function billsView() {
  var left = 30 - (state.day % 30),
    disc = Math.round((1 - charityFactor()) * 1000) / 10,
    v =
      '<h1>Счета и налоги</h1><p class="sub">Всё регулярное собрано здесь: налоги, электричество фермы, зарплаты, аренда. Счета начисляются раз в месяц, платить нужно самому или подключить автоплатёж. Каждый день неуплаты пени +0,5%. Если любой счёт не оплачен ' +
      ARREARS_DAYS +
      " дней, бизнесы, ферма и машины перестают работать и не приносят доход. Ничего не отбирают: после оплаты всё возвращается.</p>";
  if (propertySuspended())
    v +=
      '<div class="panel" style="border-left:6px solid var(--bad);margin-bottom:12px"><p><b>⛔ Имущество остановлено.</b> Оплатите просроченные счета ниже, и бизнесы, ферма и машины заработают снова.</p></div>';
  v +=
    '<div class="panel"><div class="row"><span>🤖 Автоплатёж за всё</span><b>' +
    (state.ap.own ? "подключён" : formatMoney(APCOST)) +
    "</b></div>";
  if (!state.ap.own)
    v +=
      '<p style="font-size:13px;color:var(--muted)">Разовая покупка. Счета оплачиваются сами сразу при начислении, а если денег не хватает, он пробует снова каждый день.</p><button class="learn" data-ap="buy" style="margin-bottom:8px">Подключить за ' +
      formatMoney(APCOST) +
      "</button>";
  else {
    v +=
      '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0"><button class="learn" data-ap="all">Включить/выключить всё</button>';
    AUTOPAY_ORDER.forEach(function (k) {
      v +=
        '<button class="learn" data-ap="' +
        k +
        '" aria-pressed="' +
        !state.ap.off[k] +
        '">' +
        BILL_NAMES[k] +
        ": " +
        (state.ap.off[k] ? "выкл" : "вкл") +
        "</button>";
    });
    v += "</div>";
  }
  v += '</div><div class="panel" style="margin-top:12px">';
  for (var k in BILL_NAMES) {
    var t = state.tx[k] || (state.tx[k] = { a: 0, d: 0 });
    v +=
      '<div class="row" style="flex-wrap:wrap"><span>' +
      BILL_NAMES[k] +
      (t.a > 0 ? " · " + t.d + " дн." + (t.d >= ARREARS_DAYS ? " ⛔" : "") : "") +
      "</span><b>" +
      formatMoney(t.a) +
      "</b>" +
      (t.a > 0 ? '<button class="learn" data-tax="' + k + '">Оплатить</button>' : "") +
      "</div>";
  }
  v +=
    '<div class="row"><span>Итого к оплате</span><b class="money">' +
    formatMoney(taxTotal()) +
    "</b></div>" +
    (taxTotal() > 0
      ? '<button class="learn" data-tax="all" style="margin-bottom:8px">Оплатить всё</button>'
      : "") +
    "</div>";
  v +=
    '<div class="panel" style="margin-top:12px"><div class="row"><span>Ставка налога</span><b>' +
    Math.round(TAX_RATE * 100) +
    "%" +
    (disc ? " (благотворительность −" + disc + "%)" : "") +
    '</b></div><div class="row"><span>Ожидается в следующем счёте: зарплата и бизнес (налог)</span><b>' +
    formatMoney(state.mJob * TAX_RATE + Math.max(0, state.mInc - state.mJob) * TAX_RATE) +
    '</b></div><div class="row"><span>Электричество фермы</span><b>' +
    formatMoney(farmBill() * charityFactor()) +
    '</b></div><div class="row"><span>Зарплаты сотрудников</span><b>' +
    formatMoney(estimatedSalaries()) +
    '</b></div><div class="row"><span>Аренда точек и жилья</span><b>' +
    formatMoney(
      (estimatedOperatingCosts() + Math.round(HOMES[state.house][1] * state.infl)) *
        charityFactor(),
    ) +
    '</b></div><div class="row"><span>До начисления</span><b>' +
    left +
    " дн.</b></div></div>";
  return v;
}
var BILL_NAMES = {
  job: "Налог с зарплаты",
  biz: "Налог с бизнесов",
  prop: "Налог на недвижимость",
  veh: "Транспортный налог",
  gain: "Налог с продаж и прибыли",
  elec: "Электричество фермы",
  sal: "Зарплаты сотрудников",
  opx: "Аренда и расходы точек",
  rent: "Аренда жилья",
};

/**
 * Счета, которые дешевеют от благотворительности вместе со ставкой налога (все, кроме зарплат сотрудников).
 * Налоги с зарплаты, бизнеса и продаж уже считаются по сниженной ставке TAX_RATE, остальные
 * (недвижимость, транспорт, электричество, аренда) умножаются на charityFactor() при начислении.
 */
var CHARITY_FACTOR_BILLS = { prop: 1, veh: 1, elec: 1, opx: 1, rent: 1 };

/** Во сколько раз благотворительность удешевила счета: 1 без пожертвований, 0,385 на максимуме. */
function charityFactor() {
  return TAX_RATE / BASE_TAX_RATE;
}

function addTax(k, a) {
  if (CHARITY_FACTOR_BILLS[k]) a *= charityFactor();
  a = Math.round(a);
  if (!(a > 0)) return;
  var t = state.tx[k] || (state.tx[k] = { a: 0, d: 0 });
  if (t.a <= 0) t.d = 0;
  t.a += a;
}
function taxTotal() {
  var s = 0;
  for (var k in state.tx) s += state.tx[k].a;
  return Math.round(s);
}

function payTax(k) {
  if (k === "all") {
    var tot = taxTotal();
    if (!tot) return;
    if (state.bal < tot) {
      toast("Не хватает денег", "Нужно " + formatMoney(tot), "bad");
      return;
    }
    state.bal -= tot;
    state.taxPaid = (state.taxPaid || 0) + tot;
    for (var j in state.tx) {
      state.tx[j].a = 0;
      state.tx[j].d = 0;
    }
    toast("🧾 Все налоги оплачены", formatMoney(tot), "good");
    syncSuspension();
    render();
    return;
  }
  var t = state.tx[k],
    a = Math.round(t.a);
  if (a <= 0) return;
  if (state.bal < a) {
    toast("Не хватает денег", "Нужно " + formatMoney(a), "bad");
    return;
  }
  state.bal -= a;
  state.taxPaid = (state.taxPaid || 0) + a;
  t.a = 0;
  t.d = 0;
  toast("🧾 " + BILL_NAMES[k], "Оплачено " + formatMoney(a), "good");
  if (k === "elec" && state.farm.gpus.length)
    toast("💡 Свет включён", "Ферма снова работает.", "good");
  syncSuspension();
  render();
}

function propTax() {
  var t = 0;
  for (var i in state.hm) t += homePrice(+i) * 0.002;
  return t;
}

function vehTax() {
  var t = 0;
  for (var i in state.cars) t += CARS[+i][1] * 0.0015;
  return t;
}

function taxDay() {
  var o = "",
    k,
    t;
  for (k in state.tx) {
    t = state.tx[k];
    if (t.a > 0) {
      t.d++;
      t.a = Math.round(t.a * 1.005);
      if (t.d === ARREARS_DAYS && k === "elec" && state.farm.gpus.length)
        toast("🔌 Отключение света", "Электричество не оплачено 7 дней: ферма остановлена", "bad");
      if (t.d === 15)
        toast("⚠️ Счёт не оплачен", BILL_NAMES[k] + ": пени растут на 0,5% в день", "bad");
    }
  }
  o += autoPay();
  syncSuspension();
  return o;
}

function monthEnd() {
  var bc = businessMonth(),
    tj = state.mJob * TAX_RATE,
    tb = Math.max(0, state.mInc - state.mJob - bc) * TAX_RATE,
    rent = Math.round(HOMES[state.house][1] * state.infl),
    o = "";
  state.mInc = 0;
  state.mJob = 0;
  addTax("rent", rent);
  addTax("job", tj);
  addTax("biz", tb);
  addTax("prop", propTax() + flipMonthTax());
  addTax("veh", vehTax());
  o += farmMonth();
  toast(
    "🧾 Конец месяца",
    "Начислены счета и налоги" + (state.ap.own ? "." : ": оплатите их во вкладке «Счета»."),
    "",
  );
  o += autoPay();
  return (
    " Конец месяца: начислены счета и налоги" +
    (state.ap.own ? "" : " (оплатить во вкладке «Счета»)") +
    ". " +
    o
  );
}

/** Через сколько дней просрочки любого счёта имущество перестаёт работать. */
var ARREARS_DAYS = 7,
  suspensionIgnored = false;

/**
 * Есть ли счёт, не оплаченный ARREARS_DAYS дней и дольше. Пока да, бизнесы, ферма и машины не приносят доход.
 * Ничего не отбирается: как только долги оплачены, всё работает снова.
 */
function propertySuspended() {
  if (suspensionIgnored) return false;
  for (var k in state.tx) if (state.tx[k].a > 0 && state.tx[k].d >= ARREARS_DAYS) return true;
  return false;
}

/** Доход бизнесов и фермы без учёта остановки: на нём держатся оценка компании и расчёты. */
function fundamentalIncome() {
  suspensionIgnored = true;
  var t = totalBusinessIncome();
  suspensionIgnored = false;
  return t;
}

/** Сообщает игроку, когда имущество остановилось или снова заработало. */
function syncSuspension() {
  var now = propertySuspended();
  if (now === !!state.suspended) return;
  state.suspended = now ? 1 : 0;
  if (now)
    toast(
      "⛔ Имущество остановлено",
      "Счёт не оплачен " +
        ARREARS_DAYS +
        "+ дней: бизнесы, ферма и машины не приносят доход. Оплатите счета, и всё заработает снова.",
      "bad",
    );
  else toast("✅ Имущество снова работает", "Долги оплачены.", "good");
}

function blackout() {
  var t = state.tx.elec;
  return !!t && t.a > 0 && t.d >= 7;
}

var AUTOPAY_ORDER = ["elec", "sal", "rent", "opx", "prop", "veh", "job", "biz", "gain"],
  APCOST = 300000;

function estimatedSalaries() {
  var s = state.astro * 150000 + (state.farm.worker ? FARM_WORKER_SALARY : 0);
  state.B.forEach(function (b, i) {
    if (b.own) s += b.emp * EMPLOYEE_SALARY[i] * (b.u2[2] ? 0.75 : 1);
  });
  return s;
}

function estimatedOperatingCosts() {
  var s = 0;
  state.B.forEach(function (b, i) {
    if (b.own) s += b.n * BUSINESSES[i][6];
  });
  return s;
}

function autoPay() {
  if (!state.ap.own) return "";
  var paid = 0;
  AUTOPAY_ORDER.forEach(function (k) {
    var t = state.tx[k],
      a = Math.round(t.a);
    if (a > 0 && !state.ap.off[k] && state.bal >= a) {
      state.bal -= a;
      state.taxPaid = (state.taxPaid || 0) + a;
      t.a = 0;
      t.d = 0;
      paid += a;
    }
  });
  if (paid > 0) {
    toast("🤖 Автоплатёж", "Списано " + formatMoney(paid), "good");
    syncSuspension();
    return "Автоплатёж: " + formatMoney(paid) + ". ";
  }
  return "";
}

function autoPayAction(a) {
  if (a === "buy") {
    if (state.ap.own) return;
    if (state.bal < APCOST) {
      toast("Не хватает денег", "Автоплатёж стоит " + formatMoney(APCOST), "bad");
      return;
    }
    state.bal -= APCOST;
    state.ap.own = true;
    toast(
      "🤖 Автоплатёж подключён",
      "Счета и налоги будут оплачиваться сами, пока хватает денег",
      "good",
    );
    autoPay();
  } else if (a === "all") {
    var any = AUTOPAY_ORDER.some(function (k) {
      return !state.ap.off[k];
    });
    AUTOPAY_ORDER.forEach(function (k) {
      state.ap.off[k] = any;
    });
  } else if (state.ap.own) state.ap.off[a] = !state.ap.off[a];
  render();
}
