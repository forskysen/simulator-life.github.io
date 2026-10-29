/**
 * Майнинг-ферма: стойки, видеокарты, заточка, продажа, экран фермы.
 */

var GPU_TYPES = [
  ["GTX 1050", 15000, 250, 1800],
  ["GTX 1660", 40000, 650, 3600],
  ["RTX 3060", 90000, 1450, 6500],
  ["RTX 3080", 200000, 3200, 11000],
  ["RTX 4090", 450000, 6500, 19000],
];

var RACK_PRICE = 25000,
  RACK_SLOTS = 4,
  GPU_UPGRADE_CHANCE = [95, 90, 80, 70, 60, 50, 40, 30, 20],
  LUBE_PRICE = 300,
  LUBE_PACK = 10, // единиц смазки в одной покупке
  COOLANT_PRICE = 400,
  FARM_WORKER_SALARY = 30000; // зарплата смазчика в месяц

function gpuInc(g) {
  return GPU_TYPES[g.t][2] * (1 + (g.l - 1) * 0.35);
}

function upCost(g) {
  return Math.round(GPU_TYPES[g.t][1] * 0.25 * g.l);
}

function farmInc() {
  var F = state.farm;
  if (blackout() || propertySuspended() || !F.gpus.length) return 0;
  var s = 0;
  F.gpus.forEach(function (g) {
    s += gpuInc(g);
  });
  if (F.lube <= 0) s *= 0.5;
  if (F.cool <= 0 && airCooledGpuCount() > 0) s *= 0.7;
  return s * (1 + relBonus()) * healthIncomeMultiplier() * economyMultiplier() * restMultiplier();
}

function farmBill() {
  var s = 0;
  state.farm.gpus.forEach(function (g) {
    s += GPU_TYPES[g.t][3];
  });
  return s * (state.tech.d[0] ? 0.75 : 1);
}

function farmDay() {
  var F = state.farm,
    n = F.gpus.length;
  if (!n) return "";
  if (blackout()) return "Свет на ферме отключён за неуплату. ";
  if (propertySuspended()) return "Ферма остановлена: долг по счетам. ";
  var note = autoLube();
  var inc = farmInc();
  F.lube = Math.max(0, F.lube - n * 0.05);
  F.cool = Math.max(0, F.cool - airCooledGpuCount() * 0.1);
  state.bal += inc;
  state.mInc += inc;
  if (Math.random() < 0.0001 * (F.cool <= 0 && airCooledGpuCount() > 0 ? 10 : 1)) {
    F.racks = 0;
    F.wc = 0;
    F.gpus = [];
    F.lube = 0;
    F.cool = 0;
    toast("🔥 Ферма сгорела", "Все стойки и видеокарты уничтожены.", "bad");
    return "Ферма сгорела дотла. ";
  }
  return "Майнинг: +" + formatMoney(inc) + ". " + note;
}

function farmMonth() {
  var b = farmBill();
  if (b > 0) addTax("elec", b);
  return "";
}

/** Нанять или уволить смазчика (нужна хотя бы одна стойка). */
function farmToggleWorker() {
  var F = state.farm;
  if (!F.worker && !F.racks) {
    toast("Нет фермы", "Сначала купите стойку.", "bad");
    return;
  }
  F.worker = F.worker ? 0 : 1;
  if (F.worker)
    toast(
      "🧑‍🔧 Смазчик нанят",
      "Зарплата " + formatMoney(FARM_WORKER_SALARY) + " в месяц, смазку докупает сам.",
      "good",
    );
  else toast("Смазчик уволен", "Смазку снова нужно докупать вручную.", "");
  render();
}

/** Смазчик докупает смазку за счёт игрока, когда её остаётся меньше чем на 2 дня. */
function autoLube() {
  var F = state.farm,
    need = F.gpus.length * 0.05 * 2,
    cost = LUBE_PRICE * LUBE_PACK,
    spent = 0;
  if (!F.worker) return "";
  while (F.lube < need && state.bal >= cost) {
    state.bal -= cost;
    F.lube += LUBE_PACK;
    spent += cost;
  }
  if (F.lube < need) toast("🧴 Нет денег на смазку", "Смазчик не смог её докупить.", "bad");
  return spent ? "Смазчик докупил смазку (−" + formatMoney(spent) + "). " : "";
}

function farmBuy(id) {
  if (id === "worker") {
    farmToggleWorker();
    return;
  }
  var F = state.farm,
    c = 0,
    t = 0;
  if (id === "rack") c = RACK_PRICE;
  else if (id === "lube") c = LUBE_PRICE * 10;
  else if (id === "cool") c = COOLANT_PRICE * 10;
  else if (id === "wc") c = 60000;
  else {
    t = +id.slice(1);
    c = GPU_TYPES[t][1];
  }
  if (id === "wc" && (F.wc || 0) >= F.racks) {
    toast("Нет стоек", "Водяное охлаждение ставится на каждую стойку. Купите стойку.", "bad");
    return;
  }
  if (id === "rack" && F.racks >= 10) {
    toast("Лимит", "Максимум 10 стоек.", "bad");
    return;
  }
  if (id[0] === "g" && F.gpus.length >= F.racks * RACK_SLOTS) {
    toast("Нет места", "Нет свободных слотов. Купите стойку.", "bad");
    return;
  }
  if (state.bal < c) {
    toast(
      "Не хватает денег",
      "Нужно " + formatMoney(c) + ", у вас " + formatMoney(state.bal),
      "bad",
    );
    return;
  }
  state.bal -= c;
  if (id === "rack") F.racks++;
  else if (id === "wc") F.wc = (F.wc || 0) + 1;
  else if (id === "lube") F.lube += 10;
  else if (id === "cool") F.cool += 10;
  else F.gpus.push({ t: t, l: 1 });
  if (id === "rack") toast("🗄️ Стойка", "Куплена за " + formatMoney(c), "good");
  else if (id === "wc") toast("💧 Водяное охлаждение", "Установлено за " + formatMoney(c), "good");
  else if (id === "lube" || id === "cool")
    toast(
      id === "lube" ? "🧴 Смазка" : "🧪 Охлаждающая жидкость",
      "+10 ед. за " + formatMoney(c),
      "good",
    );
  else toast("🖥️ " + GPU_TYPES[t][0], "Куплена видеокарта за " + formatMoney(c), "good");
  render();
}

/** Одна попытка заточки карты. Возвращает "poor" (нет денег), "up", "same" или "down". */
function tryGpuUpgrade(g) {
  var cost = upCost(g),
    chance = GPU_UPGRADE_CHANCE[g.l - 1];
  if (state.bal < cost) return "poor";
  state.bal -= cost;
  if (Math.random() * 100 < chance) {
    g.l++;
    return "up";
  }
  if (g.l >= 6) {
    g.l--;
    return "down";
  }
  return "same";
}

/** Заточка одной карты (кнопка «Заточить»). */
function gpuUpgrade(i) {
  var g = state.farm.gpus[i];
  if (!g || g.l >= 10) return; // карты нет или уровень уже максимальный
  var name = GPU_TYPES[g.t][0],
    cost = upCost(g),
    r = tryGpuUpgrade(g);
  if (r === "poor") {
    toast("Не хватает денег", "Заточка стоит " + formatMoney(cost), "bad");
    return;
  }
  if (r === "up") toast("✨ Заточка удалась", name + " теперь уровня " + g.l, "good");
  else if (r === "down") toast("💥 Заточка провалилась", name + " упала до уровня " + g.l, "bad");
  else toast("Заточка не удалась", "Уровень остался прежним.", "bad");
  render();
}

/** Кнопка «Заточить все на +1»: по одной попытке на каждую карту, шансы и риски обычные. */
function gpuUpgradeAll() {
  var before = state.bal,
    res = { up: 0, same: 0, down: 0, poor: 0 };
  state.farm.gpus.forEach(function (g) {
    if (g.l < 10) res[tryGpuUpgrade(g)]++;
  });
  var tried = res.up + res.same + res.down;
  if (!tried) {
    toast("Заточка", res.poor ? "Не хватает денег на заточку." : "Нечего точить.", "bad");
    return;
  }
  var text =
    "Удалось: " +
    res.up +
    ", не удалось: " +
    res.same +
    (res.down ? ", упали: " + res.down : "") +
    (res.poor ? ", не хватило денег: " + res.poor : "") +
    ". Потрачено " +
    formatMoney(before - state.bal) +
    ".";
  toast("🔧 Заточка всех карт", text, res.up >= res.same + res.down ? "good" : "bad");
  render();
}

function farmView() {
  var F = state.farm,
    free = F.racks * RACK_SLOTS - F.gpus.length;
  var v =
    '<h1>Майнинг-ферма</h1><p class="sub">Покупайте стойки и видеокарты, следите за расходниками и электричеством. Доход фермы облагается налогом 13%.</p>';
  v +=
    '<div class="panel"><div class="row"><span>Стойки</span><b>' +
    F.racks +
    " (свободно слотов: " +
    free +
    ")</b></div>" +
    '<div class="row"><span>Видеокарты</span><b>' +
    F.gpus.length +
    "</b></div>" +
    '<div class="row"><span>Доход в день</span><b class="money">' +
    formatMoney(farmInc()) +
    "</b></div>" +
    '<div class="row"><span>Электричество в месяц</span><b>' +
    formatMoney(farmBill()) +
    (state.tx.elec.a ? " + долг " + formatMoney(state.tx.elec.a) : "") +
    "</b></div>" +
    '<div class="row"><span>Смазка</span><b>' +
    F.lube.toFixed(1) +
    " ед.</b></div>" +
    '<div class="row"><span>Смазчик</span><b>' +
    (F.worker ? "нанят, " + formatMoney(FARM_WORKER_SALARY) + " / мес" : "не нанят") +
    "</b></div>" +
    '<div class="row"><span>Охлаждающая жидкость</span><b>' +
    F.cool.toFixed(1) +
    " ед.</b></div>" +
    (blackout()
      ? '<div class="row"><span>Свет</span><b>Отключён за неуплату. Оплатите счёт во вкладке «Счета»</b></div>'
      : "") +
    "</div>";
  v += '<h1 style="margin-top:24px">Покупки</h1><div class="jobs">';
  v +=
    '<button class="job" data-b="rack"><span class="n">Стойка</span><span class="p">' +
    formatMoney(RACK_PRICE) +
    '</span><span class="t">' +
    RACK_SLOTS +
    " слота для видеокарт, максимум 10</span></button>";
  v +=
    '<button class="job" data-b="cool"><span class="n">Охлаждающая жидкость ×10</span><span class="p">' +
    formatMoney(COOLANT_PRICE * 10) +
    '</span><span class="t">Без неё доход −30% и риск пожара ×10</span></button>';
  v +=
    '<button class="job" data-b="lube"><span class="n">Смазка ×10</span><span class="p">' +
    formatMoney(LUBE_PRICE * 10) +
    '</span><span class="t">Без неё доход −50%</span></button>';
  GPU_TYPES.forEach(function (t, i) {
    v +=
      '<button class="job" data-b="g' +
      i +
      '"><span class="n">' +
      t[0] +
      '</span><span class="p">' +
      formatMoney(t[1]) +
      '</span><span class="t">Доход ' +
      formatMoney(t[2]) +
      "/день, электричество " +
      formatMoney(t[3]) +
      "/мес</span></button>";
  });
  v += '</div><h1 style="margin-top:24px">Особые улучшения</h1><div class="jobs">';
  v +=
    '<button class="job" data-b="worker"><span class="n">' +
    (F.worker ? "Уволить смазчика" : "Нанять смазчика") +
    '</span><span class="p">' +
    formatMoney(FARM_WORKER_SALARY) +
    ' / мес</span><span class="t">Сам докупает смазку за ваш счёт, когда она кончается. Зарплата идёт счётом вместе с остальными сотрудниками</span></button>';
  v +=
    '<button class="job" data-b="wc"><span class="n">Водяное охлаждение (на стойку)</span><span class="p">' +
    formatMoney(60000) +
    '</span><span class="t">Стойка с водяным охлаждением не требует охлаждающей жидкости. Сейчас: ' +
    (F.wc || 0) +
    " из " +
    F.racks +
    "</span></button>";
  v += '</div><h1 style="margin-top:24px">Видеокарты</h1>';
  if (!F.gpus.length)
    v += '<div class="panel"><p>Пока нет видеокарт. Купите стойку и карту.</p></div>';
  else {
    var upAll = 0;
    F.gpus.forEach(function (g) {
      if (g.l < 10) upAll += upCost(g);
    });
    if (upAll)
      v +=
        '<div class="jobs" style="margin-bottom:10px"><button class="job" data-ua="1"><span class="n">Заточить все на +1</span><span class="p">' +
        formatMoney(upAll) +
        '</span><span class="t">По одной попытке на каждую карту, шансы и риск падения на уровнях 6+ обычные</span></button></div>';
    v += '<div class="panel">';
    F.gpus.forEach(function (g, i) {
      v +=
        '<div class="row" style="flex-wrap:wrap"><span>' +
        GPU_TYPES[g.t][0] +
        ", уровень " +
        g.l +
        "</span>" +
        (g.l >= 10
          ? "<b>Максимум</b>"
          : '<button class="learn" data-u="' +
            i +
            '">Заточить: ' +
            formatMoney(upCost(g)) +
            ", шанс " +
            GPU_UPGRADE_CHANCE[g.l - 1] +
            "%</button>") +
        '<button class="learn" data-sg="' +
        i +
        '">Продать: ' +
        formatMoneyShort(gpuSalePrice(g)) +
        "</button></div>";
    });
    v += "</div>";
  }
  if (F.racks || F.gpus.length)
    v +=
      '<div class="jobs" style="margin-top:12px">' +
      (F.racks && F.racks * RACK_SLOTS - F.gpus.length >= RACK_SLOTS
        ? '<button class="job" data-sr="rack"><span class="n">Продать пустую стойку</span><span class="p">' +
          formatMoney(RACK_PRICE * 0.5) +
          "</span></button>"
        : "") +
      '<button class="job" data-sr="all"><span class="n">Продать всю ферму</span><span class="p">' +
      formatMoney(farmValue()) +
      '</span><span class="t">Все стойки, видеокарты и расходники (около 50% от цены)</span></button></div>';
  v +=
    '<p class="sub" style="margin-top:12px">Шанс пожара: 0,01% в день, без охлаждающей жидкости 0,1%. При пожаре сгорает вся ферма. Если не оплатить электричество, свет отключат на 7 дней. При провале заточки на уровне 6 и выше карта теряет уровень.</p>';
  return v;
}

function gpuSalePrice(g) {
  return Math.round(GPU_TYPES[g.t][1] * 0.5 * (1 + (g.l - 1) * 0.3));
}

function farmValue() {
  var F = state.farm,
    s =
      F.racks * RACK_PRICE * 0.5 +
      (F.wc || 0) * 30000 +
      F.lube * LUBE_PRICE * 0.5 +
      F.cool * COOLANT_PRICE * 0.5;
  F.gpus.forEach(function (g) {
    s += gpuSalePrice(g);
  });
  return Math.round(s);
}

function farmSell(k) {
  var F = state.farm;
  if (k === "rack") {
    if (F.racks * RACK_SLOTS - F.gpus.length < RACK_SLOTS) return;
    F.racks--;
    F.wc = Math.min(F.wc || 0, F.racks);
    state.bal += RACK_PRICE * 0.5;
    toast("💰 Стойка продана", formatMoney(RACK_PRICE * 0.5), "good");
  } else {
    var v = farmValue();
    if (!v) return;
    state.bal += v;
    F.racks = 0;
    F.wc = 0;
    F.gpus = [];
    F.lube = 0;
    F.cool = 0;
    F.worker = 0;
    toast("💰 Ферма продана", formatMoney(v), "good");
  }
  render();
}

function gpuSell(i) {
  var F = state.farm,
    g = F.gpus[i];
  if (!g) return;
  var c = gpuSalePrice(g);
  state.bal += c;
  F.gpus.splice(i, 1);
  toast("💰 Видеокарта продана", GPU_TYPES[g.t][0] + " · " + formatMoney(c), "good");
  render();
}

function airCooledGpuCount() {
  var F = state.farm;
  return Math.max(0, F.gpus.length - (F.wc || 0) * RACK_SLOTS);
}
