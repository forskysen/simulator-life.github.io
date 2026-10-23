/**
 * Перекуп домов (строитель): покупка, ремонт, аукцион.
 */

var FLIP_HOUSES = [
  ["Старая квартира", 800000],
  ["Дом в посёлке", 1500000],
  ["Таунхаус", 3000000],
  ["Коттедж", 5000000],
  ["Усадьба", 9000000],
];

var FLIP_UPGRADES = [
  ["Кухня", 0.08, 0.07],
  ["Ванная", 0.06, 0.05],
  ["Ландшафт", 0.07, 0.05],
  ["Умный дом", 0.12, 0.09],
];

function flipHouseValue(p) {
  var m = 1;
  FLIP_UPGRADES.forEach(function (u, j) {
    if (p.u[j]) m += u[2];
  });
  return Math.round(p.b * state.re.mult * (0.55 + (0.45 * p.c) / 100) * m);
}

function flipNewHouse() {
  var t = FLIP_HOUSES[Math.floor(Math.random() * FLIP_HOUSES.length)];
  return { n: t[0], b: t[1], c: 20 + Math.floor(Math.random() * 51), u: [0, 0, 0, 0], inv: 0 };
}

function flipDiscount() {
  return state.job === 7 ? 0.7 : 1;
}

function flipTotalValue() {
  var t = 0;
  state.re.own.forEach(function (p) {
    t += flipHouseValue(p);
  });
  return t;
}

function flipDay() {
  var R = state.re,
    o = "";
  R.mult *= Math.exp(0.0002 + 0.004 * gaussianRandom());
  R.day++;
  if (R.day % 7 === 0) R.mkt = [flipNewHouse(), flipNewHouse(), flipNewHouse()];
  R.au = R.au.filter(function (a) {
    var p = a.p,
      V = flipHouseValue(p),
      b = V * (0.9 + Math.random() * 0.5);
    a.left--;
    var cap = !p.imp && a.ask > 2 * (p.buy || p.inv);
    if (!cap && b >= a.ask) {
      var g = a.ask,
        fee = Math.round(g * 0.03),
        tx = Math.max(0, g - fee - p.inv) * TAX_RATE;
      state.bal += g - fee;
      addTax("gain", tx);
      toast(
        "🔨 Дом продан на аукционе",
        p.n + ": " + formatMoney(g) + (tx ? " (налог " + formatMoney(tx) + " в Банке)" : ""),
        "good",
      );
      o += "Аукцион: " + p.n + " продан за " + formatMoney(g) + ". ";
      return false;
    }
    if (a.left > 0) return true;
    R.own.push(p);
    toast(
      "🔨 Аукцион без продажи",
      p.n + ": покупателей по цене " + formatMoneyShort(a.ask) + " не нашлось. Дом вернулся к вам.",
      "bad",
    );
    return false;
  });
  return o;
}

function flipMonthTax() {
  var t = 0;
  state.re.own.forEach(function (p) {
    t += flipHouseValue(p) * 0.0025;
  });
  return t;
}

function flipAction(id) {
  var R = state.re,
    k = id[0],
    p = id.slice(1).split("_"),
    i = +p[0],
    q,
    c;
  if (k === "b") {
    if (state.job !== 7) {
      toast("Недвижимость", "Покупать дома могут только строители.", "bad");
      return;
    }
    q = R.mkt[i];
    if (!q) return;
    c = Math.round(flipHouseValue(q) * 0.85);
    if (state.bal < c) {
      toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
      return;
    }
    state.bal -= c;
    q.inv = c;
    q.buy = c;
    R.mkt.splice(i, 1);
    R.own.push(q);
    toast("🏠 Дом куплен на перепродажу", q.n + " · " + formatMoney(c), "good");
  } else if (k === "r" || k === "u") {
    if (state.job !== 7) {
      toast("Недвижимость", "Ремонтировать и улучшать могут только строители.", "bad");
      return;
    }
    q = R.own[i];
    if (!q) return;
    if (k === "r") {
      if (q.c >= 100) return;
      c = Math.round(q.b * 0.03 * flipDiscount());
      if (state.bal < c) {
        toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
        return;
      }
      state.bal -= c;
      q.inv += c;
      q.imp = 1;
      q.c = Math.min(100, q.c + 10);
      toast("🔨 Ремонт", q.n + ": состояние " + q.c + "%", "good");
    } else {
      var j = +p[1];
      if (q.u[j]) return;
      c = Math.round(q.b * FLIP_UPGRADES[j][1] * flipDiscount());
      if (state.bal < c) {
        toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
        return;
      }
      state.bal -= c;
      q.inv += c;
      q.imp = 1;
      q.u[j] = 1;
      toast("✨ Улучшение", q.n + ": " + FLIP_UPGRADES[j][0], "good");
    }
  } else if (k === "s") {
    q = R.own[i];
    if (!q) return;
    var g = Math.round(flipHouseValue(q) * 0.92),
      tx = Math.max(0, g - q.inv) * TAX_RATE;
    state.bal += g;
    addTax("gain", tx);
    R.own.splice(i, 1);
    toast(
      "💰 Дом продан",
      q.n + ": " + formatMoney(g) + (tx ? " (налог " + formatMoney(tx) + " в Банке)" : ""),
      g >= q.inv ? "good" : "bad",
    );
  } else if (k === "a") {
    q = R.own[i];
    if (!q) return;
    var el = document.getElementById("ask" + i),
      ask = Math.round(el ? +el.value : 0);
    if (!(ask > 0)) {
      toast("Аукцион", "Укажите цену.", "bad");
      return;
    }
    R.own.splice(i, 1);
    R.au.push({ p: q, ask: ask, left: 4 });
    toast("🔨 Аукцион", "«" + q.n + "» выставлен за " + formatMoney(ask) + " на 4 дня", "");
  }
  render();
}

function flipView() {
  var R = state.re,
    b = state.job === 7,
    v =
      '<h1 style="margin-top:28px">Перекуп домов</h1><p class="sub">' +
      (b
        ? "Вы строитель: ремонт и улучшения на 30% дешевле. Покупайте дома дёшево, ремонтируйте, улучшайте и продавайте."
        : "Чтобы покупать и ремонтировать дома, нужно работать строителем.") +
      " Рынок недвижимости: " +
      (R.mult >= 1 ? "+" : "−") +
      Math.abs((R.mult - 1) * 100)
        .toFixed(1)
        .replace(".", ",") +
      "% к базе. Налог на недвижимость 0,25% в месяц.</p>";
  v += '<h1 style="font-size:18px">В продаже</h1><div class="jobs">';
  R.mkt.forEach(function (q, i) {
    v +=
      '<button class="job" data-re="b' +
      i +
      '"' +
      (b ? "" : ' style="opacity:.6"') +
      '><span class="n">' +
      q.n +
      '</span><span class="p">' +
      formatMoney(flipHouseValue(q) * 0.85) +
      '</span><span class="t">Состояние ' +
      q.c +
      "%, оценка " +
      formatMoneyShort(flipHouseValue(q)) +
      "</span></button>";
  });
  v += '</div><h1 style="font-size:18px;margin-top:20px">Мои объекты</h1>';
  if (!R.own.length) v += '<div class="panel"><p>Пока нет объектов.</p></div>';
  R.own.forEach(function (q, i) {
    v +=
      '<div class="panel" style="margin-bottom:12px"><div class="row"><span>' +
      q.n +
      "</span><b>Оценка " +
      formatMoneyShort(flipHouseValue(q)) +
      '</b></div><div class="row"><span>Состояние</span><b>' +
      q.c +
      '%</b></div><div class="row"><span>Вложено</span><b>' +
      formatMoneyShort(q.inv) +
      '</b></div><div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0">' +
      (q.c < 100
        ? '<button class="learn" data-re="r' +
          i +
          '">Ремонт +10%: ' +
          formatMoneyShort(q.b * 0.03 * flipDiscount()) +
          "</button>"
        : "") +
      FLIP_UPGRADES.map(function (u, j) {
        return q.u[j]
          ? ""
          : '<button class="learn" data-re="u' +
              i +
              "_" +
              j +
              '">' +
              u[0] +
              ": " +
              formatMoneyShort(q.b * u[1] * flipDiscount()) +
              "</button>";
      }).join("") +
      '<button class="learn" data-re="s' +
      i +
      '">Продать сразу: ' +
      formatMoneyShort(flipHouseValue(q) * 0.92) +
      '</button></div><div style="padding-bottom:8px"><span class="t" style="font-size:12.5px;color:var(--muted)">Аукцион: вы сами назначаете цену. Каждый день заходит покупатель с бюджетом 90–140% оценки. Цена выше 2× купленной без улучшений не продаётся.</span><input id="ask' +
      i +
      '" class="inp" type="number" inputmode="numeric" value="' +
      Math.round(flipHouseValue(q)) +
      '" style="max-width:240px"><button class="learn" data-re="a' +
      i +
      '">Выставить на аукцион (4 дня)</button></div></div>';
  });
  if (R.au.length) {
    v += '<h1 style="font-size:18px;margin-top:20px">Аукцион</h1><div class="panel">';
    R.au.forEach(function (a) {
      v +=
        '<div class="row"><span>' +
        a.p.n +
        " · цена " +
        formatMoneyShort(a.ask) +
        "</span><b>осталось " +
        a.left +
        " дн.</b></div>";
    });
    v += "</div>";
  }
  return v;
}
