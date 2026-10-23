/**
 * Агентство: контракты, слоты, уровни.
 */

var AGENCY_CONTRACTS = [
  ["Реклама для кафе", 30, 4000, 0, 0],
  ["Кампания для сети магазинов", 60, 15000, 3, 0],
  ["Бренд-кампания", 90, 50000, 6, 0],
  ["Госконтракт: социальная реклама", 120, 120000, 10, 1],
  ["Договор с государством: нацпрограмма", 180, 400000, 15, 1],
];

function agencyBase() {
  var A = state.ag,
    t = 0;
  A.ct.forEach(function (c) {
    t += AGENCY_CONTRACTS[c.k][2];
  });
  return t * (1 + 0.05 * A.lvl);
}

function agencySlots() {
  return Math.min(state.B[6].emp, 2 + Math.floor(state.ag.lvl / 3));
}

function agencyLevelCost() {
  return Math.round(1000000 * Math.pow(1.35, state.ag.lvl));
}

function agencyDay() {
  var A = state.ag,
    o = "";
  A.ct = A.ct.filter(function (c) {
    c.left--;
    if (c.left > 0) return true;
    var T = AGENCY_CONTRACTS[c.k],
      bn = Math.round(T[1] * T[2] * 0.1);
    state.bal += bn;
    toast("📄 Контракт завершён", T[0] + ": бонус " + formatMoney(bn), "good");
    o += "Контракт «" + T[0] + "» завершён. ";
    return false;
  });
  return o;
}

function agencyAction(id) {
  var A = state.ag;
  if (id === "up") {
    var c = agencyLevelCost();
    if (state.bal < c) {
      toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
      return;
    }
    state.bal -= c;
    A.lvl++;
    toast("📣 Уровень агентства", "Уровень " + A.lvl, "good");
  } else {
    var k = +id.slice(1),
      T = AGENCY_CONTRACTS[k],
      fee = Math.round(T[1] * T[2] * 0.1);
    if (A.lvl < T[3]) {
      toast("Контракт", "Нужен уровень агентства " + T[3], "bad");
      return;
    }
    if (A.ct.length >= agencySlots()) {
      toast(
        "Контракт",
        "Нет свободных слотов: нужен сотрудник на каждый контракт и нужный уровень.",
        "bad",
      );
      return;
    }
    if (
      A.ct.some(function (c) {
        return c.k === k;
      })
    ) {
      toast("Контракт", "Этот контракт уже подписан.", "bad");
      return;
    }
    if (state.bal < fee) {
      toast("Не хватает денег", "Взнос " + formatMoney(fee), "bad");
      return;
    }
    state.bal -= fee;
    A.ct.push({ k: k, left: T[1] });
    toast("✍️ Контракт подписан", T[0], "good");
  }
  render();
}

function agencyView() {
  var b = BUSINESSES[6],
    s = state.B[6],
    A = state.ag,
    v =
      '<button class="learn" data-bs="home" style="margin:0 0 12px">← Все бизнесы</button><h1>' +
      b[0] +
      '</h1><p class="sub">' +
      b[2] +
      "</p>";
  v +=
    '<div class="panel"><div class="row"><span>Уровень агентства</span><b>' +
    A.lvl +
    '</b></div><div class="row"><span>Сотрудники</span><b>' +
    s.emp +
    ' из 12</b></div><div class="row"><span>Слоты контрактов</span><b>' +
    A.ct.length +
    " из " +
    agencySlots() +
    '</b></div><div class="row"><span>Доход в день</span><b class="money">' +
    formatMoney(businessIncome(6)) +
    '</b></div><div class="row"><span>Расходы в месяц</span><b>' +
    formatMoney(s.emp * EMPLOYEE_SALARY[6] * (s.u2[2] ? 0.75 : 1)) +
    "</b></div></div>";
  v +=
    '<h1 style="margin-top:20px">Развитие</h1><div class="jobs"><button class="job" data-ag="up"><span class="n">Повысить уровень</span><span class="p">' +
    formatMoney(agencyLevelCost()) +
    '</span><span class="t">Доход контрактов +5% за уровень, новые контракты, больше слотов. Бесконечно, но каждый уровень дороже</span></button><button class="job" data-z="E6"><span class="n">Нанять сотрудника</span><span class="p">' +
    formatMoney(EMPLOYEE_SALARY[6]) +
    '</span><span class="t">Нужен на каждый контракт. Зарплата ' +
    formatMoney(EMPLOYEE_SALARY[6]) +
    " в месяц</span></button></div>";
  v += '<h1 style="margin-top:20px">Контракты</h1><div class="jobs">';
  AGENCY_CONTRACTS.forEach(function (T, k) {
    var act = A.ct.filter(function (c) {
        return c.k === k;
      })[0],
      fee = Math.round(T[1] * T[2] * 0.1);
    v +=
      (act ? '<div class="job">' : '<button class="job" data-ag="c' + k + '">') +
      '<span class="n">' +
      (T[4] ? "🏛️ " : "") +
      T[0] +
      '</span><span class="p">' +
      formatMoney(T[2]) +
      ' / день</span><span class="t">' +
      T[1] +
      " дн., взнос " +
      formatMoneyShort(fee) +
      ", бонус 10% в конце. Уровень от " +
      T[3] +
      "</span>" +
      (act
        ? '<span class="t">✔ Действует, осталось ' + act.left + " дн.</span></div>"
        : "</button>");
  });
  v +=
    '</div><h1 style="margin-top:20px">Улучшения</h1><div class="jobs">' +
    upgradesHtml(6) +
    '</div><p class="sub" style="margin-top:12px">Раз в месяц списываются зарплаты. Каждый день 1% риска: «' +
    b[9] +
    "».</p>";
  return v;
}
