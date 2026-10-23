/**
 * Биржа: активы, цены, торговля, IPO.
 */

var MARKET_ASSETS = [
  ["AAPL", "Apple", 17500, 0.0004, 0.015, 1.0],
  ["MSFT", "Microsoft", 38000, 0.0004, 0.014, 1.0],
  ["GOOGL", "Alphabet (Google)", 14500, 0.0004, 0.016, 1.05],
  ["AMZN", "Amazon", 16000, 0.0004, 0.018, 1.15],
  ["TSLA", "Tesla", 22000, 0.0003, 0.035, 1.8],
  ["NVDA", "NVIDIA", 11000, 0.0006, 0.03, 1.7],
  ["META", "Meta", 45000, 0.0004, 0.022, 1.2],
  ["NFLX", "Netflix", 60000, 0.0003, 0.022, 1.2],
  ["KO", "Coca-Cola", 5500, 0.0002, 0.008, 0.5],
  ["MCD", "McDonald's", 28000, 0.0002, 0.009, 0.55],
  ["NKE", "Nike", 7500, 0.0002, 0.017, 0.9],
  ["DIS", "Disney", 9000, 0.0002, 0.019, 1.0],
  ["BTC", "Bitcoin", 5500000, 0.0005, 0.035, 1.5],
  ["ETH", "Ethereum", 280000, 0.0005, 0.045, 1.7],
  ["SOL", "Solana", 14000, 0.0005, 0.06, 2.0],
  ["DOGE", "Dogecoin", 12, 0.0002, 0.07, 2.0],
];

function ownCompanyFairPrice() {
  return (totalBusinessIncome() * 365 * 4 + 10000000) / 1000000;
}

function assetInfo(i) {
  return i < MARKET_ASSETS.length ? { t: MARKET_ASSETS[i][0], n: MARKET_ASSETS[i][1] } : { t: escapeHtml(state.mk.own.t), n: escapeHtml(state.mk.own.n) };
}

function marketNextPrice(i, M) {
  var p = state.mk.p[i],
    r;
  if (i < MARKET_ASSETS.length) {
    var a = MARKET_ASSETS[i];
    r = a[3] + a[5] * M + a[4] * gaussianRandom();
    if (Math.random() < 0.012) r += (Math.random() < 0.5 ? -1 : 1) * (0.04 + Math.random() * 0.08);
  } else r = 0.02 * Math.log(Math.max(0.01, ownCompanyFairPrice()) / p) + 0.035 * gaussianRandom() + M;
  return Math.max(i === MARKET_ASSETS.length - 1 ? 0.5 : 1, Math.round(p * Math.exp(r) * 100) / 100);
}

function marketInit() {
  var K = state.mk;
  if (K.p.length >= MARKET_ASSETS.length) return;
  MARKET_ASSETS.forEach(function (a, i) {
    K.p[i] = a[2];
    K.h[i] = [a[2]];
    K.q[i] = 0;
    K.c[i] = 0;
  });
  for (var d = 0; d < 60; d++) {
    var M = gaussianRandom() * 0.008;
    K.p.forEach(function (p, i) {
      K.p[i] = marketNextPrice(i, M);
      K.h[i].push(K.p[i]);
    });
  }
}

function marketDay() {
  marketInit();
  var K = state.mk,
    M = gaussianRandom() * 0.008,
    o = "",
    held = K.q.some(function (x) {
      return x > 0;
    });
  if (Math.random() < 0.006) {
    M -= 0.07;
    if (held) toast("📉 Обвал рынка", "Акции и крипта резко упали.", "bad");
    o = "Обвал рынка. ";
  } else if (Math.random() < 0.006) {
    M += 0.05;
    if (held) toast("📈 Рост рынка", "Рынок резко пошёл вверх.", "good");
    o = "Рост рынка. ";
  }
  K.p.forEach(function (p, i) {
    var n = marketNextPrice(i, M),
      ch = n / p - 1;
    K.p[i] = n;
    K.h[i].push(n);
    if (K.h[i].length > 60) K.h[i].shift();
    if ((K.q[i] || 0) > 0 && Math.abs(ch) >= 0.08)
      toast("📰 " + assetInfo(i).t, formatPercentChange(ch) + " за день", ch >= 0 ? "good" : "bad");
  });
  return o;
}

function sparklineSvg(h, hh) {
  var mn = Math.min.apply(null, h),
    mx = Math.max.apply(null, h),
    w = 120,
    pts = h
      .map(function (x, i) {
        return (
          ((i * w) / (h.length - 1)).toFixed(1) +
          "," +
          (hh - ((x - mn) / (mx - mn || 1)) * hh).toFixed(1)
        );
      })
      .join(" ");
  return (
    '<svg viewBox="0 0 120 ' +
    hh +
    '" width="100%" height="' +
    (hh < 40 ? hh : 110) +
    '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' +
    pts +
    '" fill="none" stroke-width="2" vector-effect="non-scaling-stroke" style="stroke:var(--' +
    (h[h.length - 1] >= h[0] ? "good" : "bad") +
    ')"/></svg>'
  );
}

function marketCard(i) {
  var K = state.mk,
    a = assetInfo(i),
    p = K.p[i],
    h = K.h[i],
    ch = p / h[h.length - 2] - 1,
    val = (K.q[i] || 0) * p;
  return (
    '<button class="job" data-ms="' +
    i +
    '"><span class="n">' +
    a.t +
    " · " +
    a.n +
    '</span><span class="p">' +
    formatPrice(p) +
    '</span><span class="t" style="color:var(--' +
    (ch >= 0 ? "good" : "bad") +
    ')">' +
    formatPercentChange(ch) +
    " за день</span>" +
    sparklineSvg(h, 32) +
    (val > 0 ? '<span class="t">В портфеле: ' + formatMoneyShort(val) + "</span>" : "") +
    "</button>"
  );
}

function marketView() {
  marketInit();
  var K = state.mk;
  if (state.ms >= 0 && K.p[state.ms]) return marketDetail(state.ms);
  var tv = 0,
    tc = 0,
    i;
  K.p.forEach(function (p, j) {
    tv += (K.q[j] || 0) * p;
    tc += K.c[j] || 0;
  });
  var v =
    '<h1>Биржа</h1><p class="sub">Акции и криптовалюты. Цены меняются каждый день, как на реальном рынке: общий фон, новости, обвалы. Комиссия 0,2%.</p><div class="panel"><div class="row"><span>Портфель</span><b>' +
    formatMoney(tv) +
    '</b></div><div class="row"><span>Прибыль / убыток</span><b style="color:var(--' +
    (tv >= tc ? "good" : "bad") +
    ')">' +
    (tv >= tc ? "+" : "−") +
    formatMoney(Math.abs(tv - tc)) +
    "</b></div></div>";
  v += '<h1 style="margin-top:20px">Акции</h1><div class="jobs">';
  for (i = 0; i < 12; i++) v += marketCard(i);
  v += '</div><h1 style="margin-top:20px">Криптовалюты</h1><div class="jobs">';
  for (i = 12; i < 16; i++) v += marketCard(i);
  v += '</div><h1 style="margin-top:20px">Своя компания</h1>';
  if (K.own) v += '<div class="jobs">' + marketCard(MARKET_ASSETS.length) + "</div>";
  else
    v +=
      '<div class="panel"><p>Выведите свою компанию на биржу (IPO): 1 000 000 акций, вся доля у вас. Цена акций растёт вместе с доходами ваших бизнесов. Акции можно продавать, чтобы привлечь деньги.</p><input id="mn" class="inp" placeholder="Название компании" maxlength="24"><input id="mt" class="inp" placeholder="Тикер (2–5 букв)" maxlength="5"><p style="font-size:12.5px;color:var(--muted)">Стартовая цена акции: около ' +
      formatPrice(Math.max(10, Math.round(ownCompanyFairPrice()))) +
      '</p><button class="learn" data-ipo="1">Открыть за 2 000 000 ₽</button></div>';
  return v;
}

function marketDetail(i) {
  var K = state.mk,
    a = assetInfo(i),
    p = K.p[i],
    h = K.h[i],
    q = K.q[i] || 0,
    val = q * p,
    c = K.c[i] || 0,
    ch = p / h[h.length - 2] - 1,
    m30 = p / h[Math.max(0, h.length - 31)] - 1;
  var col = function (x) {
    return 'style="color:var(--' + (x >= 0 ? "good" : "bad") + ')"';
  };
  var v =
    '<button class="learn" data-ms="-1">← Все активы</button><h1 style="margin-top:8px">' +
    a.t +
    " · " +
    a.n +
    '</h1><div class="panel">' +
    sparklineSvg(h, 120) +
    '<div class="row"><span>Цена</span><b class="money">' +
    formatPrice(p) +
    '</b></div><div class="row"><span>За день</span><b ' +
    col(ch) +
    ">" +
    formatPercentChange(ch) +
    '</b></div><div class="row"><span>За 30 дней</span><b ' +
    col(m30) +
    ">" +
    formatPercentChange(m30) +
    "</b></div></div>";
  v +=
    '<div class="panel" style="margin-top:12px"><div class="row"><span>У вас</span><b>' +
    (q < 1 ? q.toFixed(4) : q.toFixed(2)).replace(".", ",") +
    ' шт.</b></div><div class="row"><span>Стоимость</span><b>' +
    formatMoney(val) +
    '</b></div><div class="row"><span>Прибыль / убыток</span><b ' +
    col(val - c) +
    ">" +
    (val >= c ? "+" : "−") +
    formatMoney(Math.abs(val - c)) +
    "</b></div>" +
    (i === MARKET_ASSETS.length && K.own
      ? '<div class="row"><span>Ваша доля</span><b>' +
        ((q / 1000000) * 100).toFixed(1).replace(".", ",") +
        '%</b></div><div class="row"><span>Капитализация</span><b>' +
        formatMoneyShort(p * 1000000) +
        "</b></div>"
      : "") +
    "</div>";
  v +=
    '<div class="panel" style="margin-top:12px"><input id="mamt" class="inp" type="number" min="0" inputmode="numeric" placeholder="Сумма в ₽"><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="learn" data-mt="b">Купить</button><button class="learn" data-mt="ba">Купить на всё</button><button class="learn" data-mt="s">Продать</button><button class="learn" data-mt="sa">Продать всё</button></div><p style="font-size:12.5px;color:var(--muted)">Комиссия 0,2%. С прибыли при продаже берётся налог ' +
    Math.round(TAX_RATE * 100) +
    "%.</p></div>";
  if (i === MARKET_ASSETS.length && K.own) {
    var out = Math.max(0, Math.round(1000000 - q));
    v +=
      '<div class="panel" style="margin-top:12px"><p>У других инвесторов: ' +
      out.toLocaleString("ru-RU") +
      " акций. Выкуп с премией 10%: " +
      formatMoney(Math.round(out * p * 1.1)) +
      '.</p><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="learn" data-mt="bb"' +
      (out < 1 ? " disabled" : "") +
      '>Выкупить компанию полностью</button><button class="learn" data-mt="dl"' +
      (out < 1 ? "" : " disabled") +
      ">Снять с биржи</button></div></div>";
  }
  return v;
}

function marketTrade(i, mode) {
  var K = state.mk,
    p = K.p[i],
    a = assetInfo(i),
    amt = Math.floor(+document.getElementById("mamt").value) || 0,
    q0 = K.q[i] || 0,
    fee = 0.002;
  if (mode === "bb") {
    var out = 1000000 - q0,
      bc = Math.round(out * p * 1.1);
    if (i !== MARKET_ASSETS.length || out < 1) {
      toast("Выкуп", "Все акции уже у вас.", "bad");
      return;
    }
    if (state.bal < bc) {
      toast("Не хватает денег", "Для выкупа нужно " + formatMoney(bc), "bad");
      return;
    }
    state.bal -= bc;
    K.q[i] = 1000000;
    K.c[i] = (K.c[i] || 0) + bc;
    toast("🏁 Компания выкуплена", "Вы владеете 100% акций. Потрачено " + formatMoney(bc), "good");
    render();
    return;
  }
  if (mode === "dl") {
    if (i !== MARKET_ASSETS.length || 1000000 - q0 >= 1) {
      toast("Делистинг", "Сначала выкупите все акции.", "bad");
      return;
    }
    K.own = null;
    K.p.length = MARKET_ASSETS.length;
    K.h.length = MARKET_ASSETS.length;
    K.q.length = MARKET_ASSETS.length;
    K.c.length = MARKET_ASSETS.length;
    state.ms = -1;
    toast("🏁 Делистинг", "Компания снята с биржи. Можно запустить новое IPO.", "");
    render();
    return;
  }
  if (mode === "b" || mode === "ba") {
    var sp = mode === "ba" ? Math.floor(state.bal) : amt;
    if (sp <= 0) {
      toast("Биржа", "Укажите сумму.", "bad");
      return;
    }
    if (sp > state.bal) {
      toast("Биржа", "Не хватает денег. Баланс: " + formatMoney(state.bal), "bad");
      return;
    }
    K.q[i] = q0 + (sp * (1 - fee)) / p;
    K.c[i] = (K.c[i] || 0) + sp;
    state.bal -= sp;
    toast("📈 Покупка " + a.t, formatMoney(sp) + " по " + formatPrice(p), "good");
  } else {
    var have = q0 * p,
      g = mode === "sa" ? have : amt;
    if (q0 <= 0 || g <= 0) {
      toast("Биржа", "Нечего продавать или не указана сумма.", "bad");
      return;
    }
    if (g > have) g = have;
    var fr = Math.min(1, g / have),
      cp = (K.c[i] || 0) * fr,
      net = g * (1 - fee),
      prof = net - cp,
      tax = prof > 0 ? prof * TAX_RATE : 0;
    K.q[i] = q0 * (1 - fr);
    K.c[i] = (K.c[i] || 0) - cp;
    state.bal += net;
    addTax("gain", tax);
    toast(
      "📉 Продажа " + a.t,
      "Получено " + formatMoney(net) + (tax ? " (налог " + formatMoney(tax) + " к оплате в Банке)" : ""),
      prof >= 0 ? "good" : "bad",
    );
  }
  render();
}

function marketIpo() {
  var K = state.mk;
  if (K.own) return;
  var n = (document.getElementById("mn").value || "").trim().slice(0, 24),
    t = (document.getElementById("mt").value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-ZА-Я0-9]/g, "")
      .slice(0, 5);
  if (n.length < 2 || t.length < 2) {
    toast("Своя компания", "Введите название и тикер (2–5 символов).", "bad");
    return;
  }
  if (state.bal < 2000000) {
    toast("Не хватает денег", "Листинг стоит 2 000 000 ₽", "bad");
    return;
  }
  state.bal -= 2000000;
  var p = Math.max(10, Math.round(ownCompanyFairPrice())),
    i = MARKET_ASSETS.length;
  K.own = { t: t, n: n };
  K.p[i] = p;
  K.h[i] = [];
  for (var d = 0; d < 30; d++) K.h[i].push(p);
  K.q[i] = 1000000;
  K.c[i] = 0;
  toast("🎉 Компания на бирже", t + " · цена " + formatPrice(p), "good");
  render();
}
