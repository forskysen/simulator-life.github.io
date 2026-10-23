/**
 * Отношения, дети, благотворительность.
 */

var PARTNER_REQUESTS = [
  ["Заинька, скинь на маникюрчик 💅", 3000, "Любимый, можно на маникюр? 💅", "маникюр"],
  ["Милый, мне на такси надо 🚕", 1500, "Скинь, пожалуйста, на такси 🚕", "такси"],
  ["Я тут присмотрела сумочку… можно? 👜", 30000, "Тут сумочка понравилась, взять? 👜", "сумочка"],
  [
    "Хочу в ресторанчик с подругами 🍷",
    8000,
    "Можно сходить с подругами в ресторан? 🍷",
    "ресторан",
  ],
  ["Записалась в спа, переведи 💆", 12000, "Хочу в спа, не возражаешь? 💆", "спа"],
  ["Увидела платье, ну пожалуйста 👗", 20000, "Нашла красивое платье, можно? 👗", "платье"],
];

var PARTNER_NAMES = ["Алина", "Виктория", "Карина", "Дарья", "Милана", "Эльвира", "Ангелина", "Софья"];

function relDay() {
  var P = state.rel,
    o = "";
  if (!P) {
    state.mood = clampPercent(state.mood - 0.2);
    return o;
  }
  P.love -= 0.1;
  state.mood = clampPercent(state.mood + (P.m ? 0.3 : P.love >= 50 ? 0.7 : 0.3));
  if (Math.random() < (P.m ? 0.06 : 0.015)) {
    var q = PARTNER_REQUESTS[Math.floor(Math.random() * PARTNER_REQUESTS.length)],
      x = Math.round(
        q[1] * (1 + livingStandard() * 0.7) * (P.m ? 1 : 0.5) +
          (P.m ? Math.min(Math.max(state.bal, 0), 5000000) * 0.005 : 0),
      );
    x = Math.round(x / 100) * 100;
    state.bal -= x;
    if (P.m) P.rev = 1;
    else P.love = Math.min(100, P.love + 2);
    toast(
      "💬 " + P.name + " пишет",
      "«" + (P.m ? q[0] : q[2]) + "» — −" + formatMoney(x),
      P.m ? "bad" : "",
    );
    o += P.name + " просит: " + q[3] + " −" + formatMoney(x) + ". ";
  }
  if (P.love <= 0) {
    toast("💔 Расставание", P.name + " ушла.", "bad");
    state.mood = clampPercent(state.mood - 10);
    state.rel = null;
    o += P.name + " ушла. ";
  }
  return o;
}

function relationAction(a) {
  var P = state.rel;
  if (a === "meet") {
    if (P) return;
    if (state.bal < 3000) {
      toast("Не хватает денег", "Знакомство: 3 000 ₽", "bad");
      return;
    }
    state.bal -= 3000;
    state.rel = {
      name: PARTNER_NAMES[Math.floor(Math.random() * PARTNER_NAMES.length)],
      love: 30,
      m: Math.random() < 0.3,
      rev: 0,
      wed: 0,
    };
    toast("❤️ Новое знакомство", state.rel.name + " — вы начали встречаться.", "good");
  } else if (!P) return;
  else if (a === "date" || a === "gift" || a === "wed") {
    var c = a === "date" ? 5000 : a === "gift" ? giftCost(P) : 200000;
    if (a === "wed" && (P.wed || P.love < 70)) {
      toast("Свадьба", "Нужны чувства от 70%.", "bad");
      return;
    }
    if (a === "date" && P.dt !== undefined && state.day - P.dt < 7) {
      toast(
        "Свидание",
        "Свидание можно раз в неделю. Через " + (7 - (state.day - P.dt)) + " дн.",
        "bad",
      );
      return;
    }
    if (a === "gift" && P.gd !== undefined && state.day - P.gd < 30) {
      toast("Подарок", "Дарить можно раз в месяц. Через " + (30 - (state.day - P.gd)) + " дн.", "bad");
      return;
    }
    if (state.bal < c) {
      toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
      return;
    }
    state.bal -= c;
    if (a === "date") {
      P.love = Math.min(100, P.love + 10);
      P.dt = state.day;
      state.mood = clampPercent(state.mood + 8);
      toast("🍷 Свидание", "Чувства +10, настроение +8", "good");
    } else if (a === "gift") {
      P.love = Math.min(100, P.love + 15);
      P.gd = state.day;
      P.gifts = (P.gifts || 0) + 1;
      toast("🎁 Подарок", "Чувства +15", "good");
    } else {
      P.wed = 1;
      state.mood = clampPercent(state.mood + 20);
      toast("💍 Свадьба", "Вы женаты на " + P.name + ".", "good");
    }
  } else if (a === "break") {
    var d = 0;
    if (P.wed) d = Math.round(Math.max(0, state.bal) * (P.m ? 0.3 : 0.05));
    else if (P.m) d = 20000;
    state.bal -= d;
    state.rel = null;
    state.mood = clampPercent(state.mood - 10);
    toast("💔 Расставание", d ? "Расходы: " + formatMoney(d) : "Вы расстались.", "bad");
  }
  render();
}

function relView() {
  var P = state.rel,
    v =
      '<h1>Отношения</h1><p class="sub">Отношения поднимают настроение, но не все ищут именно любви. Некоторые партнёрши манипулируют и тянут деньги.</p>';
  if (!P)
    return (
      v +
      '<div class="panel"><p>Вы одиноки. Настроение медленно падает.' +
      (state.kids ? " Детей: " + state.kids + " (−" + formatMoney(state.kids * childDailyCost()) + "/день)." : "") +
      '</p><button class="learn" data-r="meet">Познакомиться: 3 000 ₽</button></div>'
    );
  v +=
    '<div class="panel"><div class="row"><span>Партнёрша</span><b>' +
    P.name +
    (P.wed ? " (жена)" : "") +
    '</b></div><div class="row"><span>Чувства</span><b>' +
    Math.round(P.love) +
    "%</b></div>" +
    (P.rev && P.m
      ? '<div class="row"><span>Характер</span><b>Манипуляторша, тянет деньги</b></div>'
      : "") +
    '<div class="row"><span>Дети</span><b>' +
    state.kids +
    (state.kids ? " (−" + formatMoney(state.kids * childDailyCost()) + "/день)" : "") +
    '</b></div><div class="row"><span>Влияние</span><b>' +
    (P.m
      ? "Расходы на жизнь выше"
      : relBonus()
        ? "Доход +" + Math.round(relBonus() * 100) + "%" + (partnerCareActive() ? ", болезни реже" : "")
        : partnerCareActive()
          ? "Болезни реже"
          : "Нужны чувства от 50–60%") +
    '</b></div></div><div class="jobs" style="margin-top:12px">';
  v +=
    '<button class="job" data-r="date"><span class="n">Свидание</span><span class="p">' +
    formatMoney(5000) +
    '</span><span class="t">Чувства +10, настроение +8, раз в неделю</span></button>';
  v +=
    '<button class="job" data-r="gift"><span class="n">Подарок</span><span class="p">' +
    formatMoney(giftCost(P)) +
    '</span><span class="t">Чувства +15, раз в месяц, цена растёт с каждым подарком</span></button>';
  if (!P.wed)
    v +=
      '<button class="job" data-r="wed"><span class="n">Свадьба</span><span class="p">' +
      formatMoney(200000) +
      '</span><span class="t">Нужны чувства от 70%. При разводе делится имущество</span></button>';
  v +=
    '<button class="job" data-r="break"><span class="n">' +
    (P.wed ? "Развестись" : "Расстаться") +
    '</span><span class="t">Может обойтись дорого</span></button>';
  return v + "</div>";
}

function charity() {
  if (state.char >= 8) return;
  var c = 1000000 * Math.pow(10, state.char);
  if (state.bal < c) {
    toast("Не хватает денег", "Нужно " + formatMoney(c), "bad");
    return;
  }
  state.bal -= c;
  state.char++;
  TAX_RATE = 0.13 - 0.01 * state.char;
  toast("🎗️ Благотворительность", "Налог снижен до " + Math.round(TAX_RATE * 100) + "%", "good");
  render();
}

function relBonus() {
  var P = state.rel;
  return P && !P.m && P.love >= 60 ? (P.wed ? 0.1 : 0.05) : 0;
}

function partnerCareActive() {
  var P = state.rel;
  return !!(P && !P.m && P.love >= 50);
}

function childDailyCost() {
  return Math.round(300 + (state.tot / Math.max(30, state.day)) * 0.15);
}

function kidDay() {
  var P = state.rel;
  if (P && P.wed && P.love >= 50 && state.kids < 3 && Math.random() < 0.003) {
    state.kids++;
    toast(
      "👶 У вас родился ребёнок",
      "Детей: " + state.kids + ". Расходы растут вместе с вашим достатком.",
      "good",
    );
  }
  if (!state.kids) return "";
  var c = state.kids * childDailyCost();
  state.bal -= c;
  state.mood = clampPercent(state.mood + 0.5 * state.kids);
  return "Дети: −" + formatMoney(c) + ". ";
}

function giftCost(P) {
  return Math.round(15000 * Math.pow(1.35, P.gifts || 0));
}
