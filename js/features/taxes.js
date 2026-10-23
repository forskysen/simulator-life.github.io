/**
 * Счета и налоги: начисление, пени, последствия, автоплатёж, конец месяца.
 */

function taxPanel() {
  var left = 30 - (state.day % 30),
    v =
      '<h1 style="margin-top:24px">Счета и налоги</h1><p class="sub">Всё регулярное собрано здесь: налоги, электричество фермы, зарплаты, аренда. Счета начисляются раз в месяц, платить нужно самому или подключить автоплатёж. Каждый день неуплаты пени +0,5%. Через 7 дней без оплаты: свет отключают, сотрудники уходят, из съёмного жилья выселяют. Через 30 дней приходят амбалы.</p>';
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
      (t.a > 0 ? " · " + t.d + " дн." : "") +
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
    '%</b></div><div class="row"><span>Ожидается в следующем счёте: зарплата и бизнес (налог)</span><b>' +
    formatMoney(state.mJob * TAX_RATE + Math.max(0, state.mInc - state.mJob) * TAX_RATE) +
    '</b></div><div class="row"><span>Электричество фермы</span><b>' +
    formatMoney(farmBill()) +
    '</b></div><div class="row"><span>Зарплаты сотрудников</span><b>' +
    formatMoney(estimatedSalaries()) +
    '</b></div><div class="row"><span>Аренда точек и жилья</span><b>' +
    formatMoney(estimatedOperatingCosts() + Math.round(HOMES[state.house][1] * state.infl)) +
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

function addTax(k, a) {
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
  if (k === "elec" && state.farm.gpus.length) toast("💡 Свет включён", "Ферма снова работает.", "good");
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
      if (t.d === 7 && k === "elec" && state.farm.gpus.length)
        toast("🔌 Отключение света", "Электричество не оплачено 7 дней: ферма остановлена", "bad");
      if (t.d === 7 && k === "sal") {
        var q = state.astro;
        state.astro = 0;
        state.B.forEach(function (s) {
          q += s.emp;
          s.emp = 0;
        });
        if (q > 0)
          toast(
            "🚪 Сотрудники ушли",
            "Зарплаты не выплачены неделю: уволились " +
              q +
              " чел. Точки без сотрудников не работают",
            "bad",
          );
      }
      if (t.d === 7 && k === "rent" && (state.house === 1 || state.house === 2)) {
        var hn = HOMES[state.house][0];
        moveTo(0);
        toast("🏚️ Вас выселили", "Аренда (" + hn + ") не оплачена 7 дней", "bad");
      }
      if (t.d === 15) toast("⚠️ Счёт не оплачен", BILL_NAMES[k] + ": пени растут на 0,5% в день", "bad");
      if (t.d === 25)
        toast("🚨 Скоро придут приставы", "Через 5 дней: " + BILL_NAMES[k] + " всё ещё не оплачен", "bad");
    }
  }
  o += autoPay();
  var en = false;
  for (k in state.tx) if (state.tx[k].a > 0 && state.tx[k].d >= 30) en = true;
  if (en) o += enforce();
  return o;
}

function enforce() {
  var T = taxTotal(),
    got = 0,
    why = [],
    i,
    k,
    t;
  var c = Math.max(0, state.bal) * 0.5;
  if (c > 0) {
    state.bal -= c;
    got += c;
    why.push("наличные " + formatMoney(c));
  }
  if (got < T && state.dep > 0) {
    var d = state.dep * 0.3;
    state.dep -= d;
    got += d;
    why.push("часть вклада " + formatMoney(d));
  }
  if (got < T && state.re.own.length) {
    var s = 0;
    state.re.own.forEach(function (p) {
      s += flipHouseValue(p) * 0.6;
    });
    state.re.own = [];
    got += s;
    why.push("дома на перепродажу " + formatMoney(s));
  }
  if (got < T) {
    Object.keys(state.hm)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      })
      .forEach(function (n) {
        if (got < T && n !== state.house) {
          got += homePrice(n) * 0.6;
          why.push("дом: " + HOMES[n][0]);
          delete state.hm[n];
        }
      });
    if (got < T && state.hm[state.house] !== undefined) {
      got += homePrice(state.house) * 0.6;
      why.push("ваш дом: " + HOMES[state.house][0]);
      delete state.hm[state.house];
      moveTo(0);
    }
  }
  if (got < T) {
    for (i in state.cars) {
      if (got < T) {
        got += CARS[+i][1] * 0.5;
        why.push("машина: " + CARS[+i][0]);
        delete state.cars[i];
      }
    }
  }
  var pay = Math.min(got, T),
    rest = T - pay;
  state.bal += got - pay;
  state.taxPaid = (state.taxPaid || 0) + pay;
  for (k in state.tx) {
    t = state.tx[k];
    if (t.a > 0) {
      t.a = T > 0 ? Math.round((t.a * rest) / T) : 0;
      t.d = 0;
    }
  }
  state.mood = clampPercent(state.mood - 20);
  toast(
    "💪 Пришли амбалы",
    "Забрали: " +
      why.join(", ") +
      ". Долг погашен на " +
      formatMoney(pay) +
      (rest > 0 ? ", остаток " + formatMoney(rest) : "") +
      ".",
    "bad",
  );
  return "Пришли амбалы за налоги. ";
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
    "Начислены счета и налоги" + (state.ap.own ? "." : ": оплатите их в «Банке»."),
    "",
  );
  o += autoPay();
  return (
    " Конец месяца: начислены счета и налоги" + (state.ap.own ? "" : " (оплатить в «Банке»)") + ". " + o
  );
}

function blackout() {
  var t = state.tx.elec;
  return t.a > 0 && t.d >= 7;
}

var AUTOPAY_ORDER = ["elec", "sal", "rent", "opx", "prop", "veh", "job", "biz", "gain"],
  APCOST = 300000;

function estimatedSalaries() {
  var s = state.astro * 150000;
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
