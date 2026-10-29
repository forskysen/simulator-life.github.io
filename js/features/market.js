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

/**
 * Своя компания на бирже (тикер, который вы создаёте через IPO).
 *
 * Цена = капитализация / число акций. Капитализацию двигают четыре вещи:
 *   1. рост бизнеса: оценка (4 года дохода + 10 млн) подтягивается постепенно, OWN_FAIR_SMOOTH;
 *   2. настроение рынка и случайный шум;
 *   3. деньги внешних инвесторов (боты): ежедневный приток или отток и редкие крупные сделки фондов;
 *   4. ваши сделки: вложенный рубль поднимает капитализацию на рубль, изъятый опускает (OWN_IMPACT = 1).
 *
 * Цена НЕ притягивается к «справедливой» (иначе на качелях можно бесконечно зарабатывать: купил дёшево,
 * продал дорого); привязка включается только при отходе больше чем на OWN_LEASH (примерно в 1,8 раза).
 * Крупные сделки исполняются хуже на OWN_SLIPPAGE × доля акций, поэтому «купить и тут же продать» убыточно.
 *
 * Внешние акционеры (все, кроме вас) получают дивиденды: их доля × OWN_DIVIDEND_SHARE × доход бизнесов.
 */
var OWN_SHARES = 1000000, // всего акций; сразу после IPO все у вас
  OWN_VOLATILITY = 0.015, // дневной шум настроения рынка
  OWN_LEASH = 0.6,
  OWN_LEASH_PULL = 0.01,
  OWN_FAIR_SMOOTH = 0.04, // доля разрыва «оценка − сглаженная оценка», которую рынок «замечает» за день
  OWN_IMPACT = 1,
  OWN_SLIPPAGE = 0.2,
  OWN_DIVIDEND_SHARE = 0.5,
  OWN_FLOW_NOISE = 0.012, // обычный приток или отток денег инвесторов за день, доля капитализации
  OWN_BLOCK_CHANCE = 0.03, // шанс крупной сделки фонда в день
  OWN_BLOCK_MIN = 0.02,
  OWN_BLOCK_MAX = 0.06,
  OWN_INVESTORS = ["Фонд «Рассвет»", "Частные инвесторы", "Пенсионный фонд", "Хедж-фонд «Волк»"],
  MARKET_FEE = 0.002,
  BUYOUT_PREMIUM = 1.1;

function ownCompanyFairPrice() {
  return (fundamentalIncome() * 365 * 4 + 10000000) / OWN_SHARES;
}

/**
 * Деньги внешних инвесторов за день (доля капитализации): обычный шум притока и оттока
 * и редкие крупные сделки фондов. Возвращает долю, > 0 вложили, < 0 вывели.
 */
function ownBotFlow() {
  var f = OWN_FLOW_NOISE * gaussianRandom();
  if (Math.random() < OWN_BLOCK_CHANCE) {
    var size = OWN_BLOCK_MIN + Math.random() * (OWN_BLOCK_MAX - OWN_BLOCK_MIN),
      sign = Math.random() < 0.5 ? -1 : 1,
      who = OWN_INVESTORS[Math.floor(Math.random() * OWN_INVESTORS.length)],
      cap = state.mk.p[OWN_INDEX] * OWN_SHARES;
    f += sign * size;
    toast(
      sign > 0 ? "💼 Инвестор вложил деньги" : "💼 Инвестор вышел из акций",
      who +
        ": " +
        (sign > 0 ? "+" : "−") +
        formatMoneyShort(cap * size) +
        " (капитализация " +
        (sign > 0 ? "+" : "−") +
        Math.round(size * 100) +
        "%)",
      sign > 0 ? "good" : "bad",
    );
  }
  return f;
}

/** Сумма денег внешних инвесторов за последние 30 дней (> 0 вложили, < 0 вывели). */
function investorFlow30() {
  var s = 0;
  (state.mk.flows || []).forEach(function (x) {
    s += x;
  });
  return s;
}

/** Номер своей компании в списке активов (сразу после обычных). */
var OWN_INDEX = MARKET_ASSETS.length;

/** Доля акций у внешних инвесторов, 0..1 (0, если компании на бирже нет). */
function outsideShare() {
  var K = state.mk;
  return K.own ? Math.max(0, 1 - (K.q[OWN_INDEX] || 0) / OWN_SHARES) : 0;
}

/** Дивиденды внешним акционерам за день. */
function dividendPerDay() {
  return Math.round(outsideShare() * OWN_DIVIDEND_SHARE * totalBusinessIncome());
}

/** Ежедневная выплата дивидендов. Возвращает строку для лога дня. */
function dividendDay() {
  var d = dividendPerDay();
  if (!d) return "";
  state.bal -= d;
  return "Дивиденды акционерам: −" + formatMoney(d) + ". ";
}

/** Сглаженная справедливая цена: рынок замечает рост доходов постепенно. Вызывать раз в день. */
function ownFairStep() {
  var K = state.mk;
  if (!K.own) return;
  var fair = Math.max(0.01, ownCompanyFairPrice());
  if (!(K.fair > 0)) K.fair = fair;
  var next = K.fair + (fair - K.fair) * OWN_FAIR_SMOOTH;
  K.growth = Math.log(next / K.fair);
  K.fair = next;
}

// --- цена исполнения сделок со своей монетой (p0 — текущая цена, s — доля всех акций в сделке) ---

/** Стоимость покупки доли s в единицах p0 × OWN_SHARES: интеграл растущей цены плюс проскальзывание. */
function ownBuyCostFrac(s) {
  return ((Math.exp(OWN_IMPACT * s) - 1) / OWN_IMPACT) * (1 + OWN_SLIPPAGE * s);
}

/** Сколько рублей стоит купить shares акций по текущей цене p0. */
function ownBuyCost(p0, shares) {
  return p0 * OWN_SHARES * ownBuyCostFrac(shares / OWN_SHARES);
}

/** Выручка от продажи shares акций по текущей цене p0 (до комиссии). */
function ownSellProceeds(p0, shares) {
  var s = shares / OWN_SHARES;
  return p0 * OWN_SHARES * ((1 - Math.exp(-OWN_IMPACT * s)) / OWN_IMPACT) * (1 - OWN_SLIPPAGE * s);
}

/** Сколько акций купить на сумму spend (не больше, чем есть у других). Возвращает {shares, cost}. */
function ownBuyShares(p0, spend) {
  var maxShares = Math.max(0, OWN_SHARES - (state.mk.q[OWN_INDEX] || 0)),
    maxCost = ownBuyCost(p0, maxShares);
  if (spend >= maxCost) return { shares: maxShares, cost: maxCost };
  var lo = 0,
    hi = maxShares;
  for (var k = 0; k < 60; k++) {
    var mid = (lo + hi) / 2;
    if (ownBuyCost(p0, mid) > spend) hi = mid;
    else lo = mid;
  }
  return { shares: lo, cost: spend };
}

/** Новая цена после сделки на shares акций (buy = true: цена растёт, иначе падает). */
function ownPriceAfter(p0, shares, buy) {
  var s = shares / OWN_SHARES;
  return Math.max(1, Math.round(p0 * Math.exp((buy ? 1 : -1) * OWN_IMPACT * s) * 100) / 100);
}

/** Цена выкупа всех акций у внешних инвесторов с премией. */
function buyoutCost() {
  var K = state.mk,
    out = Math.max(0, OWN_SHARES - (K.q[OWN_INDEX] || 0));
  return Math.round(ownBuyCost(K.p[OWN_INDEX], out) * BUYOUT_PREMIUM);
}
function assetInfo(i) {
  return i < MARKET_ASSETS.length
    ? { t: MARKET_ASSETS[i][0], n: MARKET_ASSETS[i][1] }
    : { t: escapeHtml(state.mk.own.t), n: escapeHtml(state.mk.own.n) };
}

function marketNextPrice(i, M) {
  var K = state.mk,
    p = K.p[i],
    r;
  if (i < MARKET_ASSETS.length) {
    var a = MARKET_ASSETS[i];
    r = a[3] + a[5] * M + a[4] * gaussianRandom();
    if (Math.random() < 0.012) r += (Math.random() < 0.5 ? -1 : 1) * (0.04 + Math.random() * 0.08);
  } else {
    // случайное блуждание + постепенный рост вслед за доходами; привязка только при сильном отходе
    var dev = Math.log(p / Math.max(0.01, K.fair || ownCompanyFairPrice())),
      excess = Math.abs(dev) - OWN_LEASH,
      pull = excess > 0 ? -Math.sign(dev) * OWN_LEASH_PULL * excess : 0;
    r = (K.growth || 0) + pull + OWN_VOLATILITY * gaussianRandom() + M;
    var f = ownBotFlow(),
      capBefore = p * Math.exp(r) * OWN_SHARES;
    K.flows = K.flows || [];
    K.flows.push(Math.round(capBefore * f));
    if (K.flows.length > 30) K.flows.shift();
    r += Math.log(1 + f);
  }
  return Math.max(
    i === MARKET_ASSETS.length - 1 ? 0.5 : 1,
    Math.round(p * Math.exp(r) * 100) / 100,
  );
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
  ownFairStep();
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
      '<div class="panel"><p>Выведите свою компанию на биржу (IPO): 1 000 000 акций, вся доля у вас. Цена = капитализация / число акций: её двигают рост доходов ваших бизнесов, деньги внешних инвесторов (приток и отток) и ваши сделки. Акции можно продавать, чтобы привлечь деньги, но крупные продажи двигают цену, а внешние акционеры получают дивиденды: их доля × 50% дохода бизнесов.</p><input id="mn" class="inp" placeholder="Название компании" maxlength="24"><input id="mt" class="inp" placeholder="Тикер (2–5 букв)" maxlength="5"><p style="font-size:12.5px;color:var(--muted)">Стартовая цена акции: около ' +
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
    (i === OWN_INDEX && K.own
      ? '<div class="row"><span>Ваша доля</span><b>' +
        ((q / OWN_SHARES) * 100).toFixed(1).replace(".", ",") +
        '%</b></div><div class="row"><span>Капитализация</span><b>' +
        formatMoneyShort(p * OWN_SHARES) +
        '</b></div><div class="row"><span>Оценка бизнеса (4 года дохода)</span><b>' +
        formatMoneyShort(ownCompanyFairPrice() * OWN_SHARES) +
        '</b></div><div class="row"><span>Инвесторы за 30 дней</span><b ' +
        col(investorFlow30()) +
        ">" +
        (investorFlow30() >= 0 ? "вложили " : "вывели ") +
        formatMoneyShort(Math.abs(investorFlow30())) +
        '</b></div><div class="row"><span>Дивиденды акционерам в день</span><b>' +
        (dividendPerDay() ? "−" + formatMoney(dividendPerDay()) : "нет") +
        "</b></div>"
      : "") +
    "</div>";
  v +=
    '<div class="panel" style="margin-top:12px"><input id="mamt" class="inp" type="number" min="0" inputmode="numeric" placeholder="Сумма в ₽"><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="learn" data-mt="b">Купить</button><button class="learn" data-mt="ba">Купить на всё</button><button class="learn" data-mt="s">Продать</button><button class="learn" data-mt="sa">Продать всё</button></div><p style="font-size:12.5px;color:var(--muted)">Комиссия 0,2%. С прибыли при продаже берётся налог ' +
    Math.round(TAX_RATE * 100) +
    "%." +
    (i === OWN_INDEX
      ? " Сделки со своей компанией двигают цену: чем больше доля акций в сделке, тем сильнее сдвиг цены и хуже цена исполнения. Внешние акционеры получают дивиденды: их доля × 50% дохода ваших бизнесов."
      : "") +
    "</p></div>";
  if (i === OWN_INDEX && K.own) {
    var out = Math.max(0, Math.round(OWN_SHARES - q));
    v +=
      '<div class="panel" style="margin-top:12px"><p>У других инвесторов: ' +
      out.toLocaleString("ru-RU") +
      " акций. Выкуп с премией 10%: " +
      formatMoney(buyoutCost()) +
      '.</p><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="learn" data-mt="bb"' +
      (out < 1 ? " disabled" : "") +
      '>Выкупить компанию полностью</button><button class="learn" data-mt="dl"' +
      (out < 1 ? "" : " disabled") +
      ">Снять с биржи</button></div></div>";
  }
  return v;
}

function marketTrade(i, mode) {
  var amt = Math.floor(+document.getElementById("mamt").value) || 0;
  if (mode === "bb") marketBuyout(i);
  else if (mode === "dl") marketDelist(i);
  else if (mode === "b" || mode === "ba") marketBuy(i, mode === "ba" ? Math.floor(state.bal) : amt);
  else marketSell(i, mode === "sa" ? Infinity : amt);
}

/** Выкуп компании у внешних инвесторов с премией. */
function marketBuyout(i) {
  var K = state.mk,
    q0 = K.q[i] || 0,
    out = OWN_SHARES - q0;
  if (i !== OWN_INDEX || out < 1) {
    toast("Выкуп", "Все акции уже у вас.", "bad");
    return;
  }
  var bc = buyoutCost();
  if (state.bal < bc) {
    toast("Не хватает денег", "Для выкупа нужно " + formatMoney(bc), "bad");
    return;
  }
  state.bal -= bc;
  K.q[i] = OWN_SHARES;
  K.c[i] = (K.c[i] || 0) + bc;
  K.p[i] = ownPriceAfter(K.p[i], out, true);
  toast("🏁 Компания выкуплена", "Вы владеете 100% акций. Потрачено " + formatMoney(bc), "good");
  render();
}

/** Снять компанию с биржи (только если все акции у вас). */
function marketDelist(i) {
  var K = state.mk;
  if (i !== OWN_INDEX || OWN_SHARES - (K.q[i] || 0) >= 1) {
    toast("Делистинг", "Сначала выкупите все акции.", "bad");
    return;
  }
  K.own = null;
  K.fair = 0;
  K.growth = 0;
  K.flows = [];
  K.p.length = MARKET_ASSETS.length;
  K.h.length = MARKET_ASSETS.length;
  K.q.length = MARKET_ASSETS.length;
  K.c.length = MARKET_ASSETS.length;
  state.ms = -1;
  toast("🏁 Делистинг", "Компания снята с биржи. Можно запустить новое IPO.", "");
  render();
}

/** Покупка на сумму sp. Свою компанию можно купить не больше, чем есть у других инвесторов. */
function marketBuy(i, sp) {
  var K = state.mk,
    p = K.p[i],
    a = assetInfo(i),
    q0 = K.q[i] || 0;
  if (sp <= 0) {
    toast("Биржа", "Укажите сумму.", "bad");
    return;
  }
  if (sp > state.bal) {
    toast("Биржа", "Не хватает денег. Баланс: " + formatMoney(state.bal), "bad");
    return;
  }
  var shares, paid;
  if (i === OWN_INDEX) {
    var deal = ownBuyShares(p, sp * (1 - MARKET_FEE));
    if (deal.shares < 1e-9) {
      toast("Биржа", "Все акции уже у вас.", "bad");
      return;
    }
    shares = deal.shares;
    paid = Math.min(sp, deal.cost / (1 - MARKET_FEE));
    K.p[i] = ownPriceAfter(p, shares, true);
    K.h[i][K.h[i].length - 1] = K.p[i];
  } else {
    shares = (sp * (1 - MARKET_FEE)) / p;
    paid = sp;
  }
  K.q[i] = q0 + shares;
  K.c[i] = (K.c[i] || 0) + paid;
  state.bal -= paid;
  toast("📈 Покупка " + a.t, formatMoney(paid) + " по " + formatPrice(p), "good");
  render();
}

/** Продажа на сумму g по текущей цене (g = Infinity — всё). Свою компанию крупные продажи роняют в цене. */
function marketSell(i, g) {
  var K = state.mk,
    p = K.p[i],
    a = assetInfo(i),
    q0 = K.q[i] || 0,
    have = q0 * p;
  if (q0 <= 0 || g <= 0) {
    toast("Биржа", "Нечего продавать или не указана сумма.", "bad");
    return;
  }
  if (g > have) g = have;
  var fr = Math.min(1, g / have),
    sold = q0 * fr,
    gross = g;
  if (i === OWN_INDEX) {
    gross = ownSellProceeds(p, sold);
    K.p[i] = ownPriceAfter(p, sold, false);
    K.h[i][K.h[i].length - 1] = K.p[i];
  }
  var cp = (K.c[i] || 0) * fr,
    net = gross * (1 - MARKET_FEE),
    prof = net - cp,
    tax = prof > 0 ? prof * TAX_RATE : 0;
  K.q[i] = q0 * (1 - fr);
  K.c[i] = (K.c[i] || 0) - cp;
  state.bal += net;
  addTax("gain", tax);
  toast(
    "📉 Продажа " + a.t,
    "Получено " +
      formatMoney(net) +
      (tax ? " (налог " + formatMoney(tax) + " к оплате в Банке)" : ""),
    prof >= 0 ? "good" : "bad",
  );
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
    i = OWN_INDEX;
  K.own = { t: t, n: n };
  K.fair = Math.max(0.01, ownCompanyFairPrice());
  K.growth = 0;
  K.flows = [];
  K.p[i] = p;
  K.h[i] = [];
  for (var d = 0; d < 30; d++) K.h[i].push(p);
  K.q[i] = OWN_SHARES;
  K.c[i] = 0;
  toast("🎉 Компания на бирже", t + " · цена " + formatPrice(p), "good");
  render();
}
