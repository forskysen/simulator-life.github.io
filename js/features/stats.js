/**
 * Экран «Стата».
 */

function statView() {
  var K = state.mk,
    pv = 0,
    ba = 0;
  K.p.forEach(function (p, i) {
    pv += (K.q[i] || 0) * p;
  });
  state.B.forEach(function (s, i) {
    if (s.own) {
      var b = BUSINESSES[i];
      ba += b[1] + s.n * b[4];
      b[8].forEach(function (u, j) {
        if (s.up[j]) ba += u[1];
      });
    }
  });
  var R = function (k, v) {
      return '<div class="row"><span>' + k + "</span><b>" + v + "</b></div>";
    },
    fv = farmValue();
  return (
    '<h1>Статистика</h1><p class="sub">Итоги вашей жизни.</p>' +
    historyChart() +
    '<h1 style="margin-top:20px">Капитал</h1><div class="panel">' +
    R("Игровых дней", state.day) +
    R("Экономика", ["Стабильность", "Подъём", "Спад"][state.eco.ph]) +
    R("Накопленная инфляция", ((state.infl - 1) * 100).toFixed(1).replace(".", ",") + "%") +
    R("Чистый капитал", formatMoney(state.bal + state.dep + pv + fv + ba + flipTotalValue())) +
    R("Наличные", formatMoney(state.bal)) +
    R("Вклад в банке", formatMoney(state.dep)) +
    R("Портфель на бирже", formatMoney(pv)) +
    R("Майнинг-ферма (цена продажи)", formatMoney(fv)) +
    R("Бизнесы (вложено)", formatMoney(ba)) +
    '</div><h1 style="margin-top:20px">Доходы</h1><div class="panel">' +
    R("Заработано за всё время", formatMoney(state.tot)) +
    R("Работа в день", formatMoney(dailyIncome())) +
    R("Майнинг в день", formatMoney(farmInc())) +
    R("Бизнесы в день", formatMoney(totalBusinessIncome() - farmInc())) +
    R("Налогов уплачено", formatMoney(state.taxPaid || 0)) +
    R("Долг по счетам и налогам", formatMoney(taxTotal())) +
    R("Благотворительность", state.char + " из 8") +
    '</div><h1 style="margin-top:20px">Жизнь</h1><div class="panel">' +
    R("Профессия", state.job < 0 ? "нет" : JOBS[state.job][0]) +
    R("Пройдено образований", Object.keys(state.done).length) +
    R("Жильё", HOMES[state.house][0]) +
    R("Уровень жизни", playerLevel()) +
    R("Настроение", Math.round(state.mood) + "%") +
    R("Зубы", Math.round(state.teeth) + "%") +
    R(
      "Отношения",
      state.rel ? escapeHtml(state.rel.name) + (state.rel.wed ? " (жена)" : "") : "нет",
    ) +
    R("Дети", state.kids) +
    R("Технологий открыто", state.tech.d.filter(Boolean).length + " из 5") +
    "</div>"
  );
}

/** SVG-график: доход (зелёная) и расход (красная) линии. points — пары [доход, расход]. */
function historySvg(points) {
  var W = 320,
    H = 140,
    padX = 4,
    padY = 6,
    max = historyMax(points);
  var line = function (k) {
    return points
      .map(function (p, i) {
        var x = padX + (i * (W - 2 * padX)) / (points.length - 1),
          y = H - padY - (p[k] / max) * (H - 2 * padY);
        return x.toFixed(1) + "," + y.toFixed(1);
      })
      .join(" ");
  };
  var grid = "";
  for (var g = 0; g <= 2; g++) {
    var gy = H - padY - (g * (H - 2 * padY)) / 2;
    grid +=
      '<line x1="0" x2="' +
      W +
      '" y1="' +
      gy +
      '" y2="' +
      gy +
      '" vector-effect="non-scaling-stroke" style="stroke:var(--line)"/>';
  }
  var poly = function (k, color) {
    return (
      '<polyline fill="none" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke:var(--' +
      color +
      ')" points="' +
      line(k) +
      '"/>'
    );
  };
  // preserveAspectRatio="none": график тянется на любую ширину, а толщина линий и подписи остаются постоянными
  return (
    '<svg viewBox="0 0 ' +
    W +
    " " +
    H +
    '" preserveAspectRatio="none" role="img" aria-label="График доходов и расходов" style="width:100%;height:150px;display:block">' +
    grid +
    poly(0, "good") +
    poly(1, "bad") +
    "</svg>"
  );
}

/** Самое большое значение на графике (не меньше 1, чтобы не делить на ноль). */
function historyMax(points) {
  var max = 1;
  points.forEach(function (p) {
    max = Math.max(max, p[0], p[1]);
  });
  return max;
}

/** Блок «Доходы и расходы по дням»: график, переключатель периода и итоги. */
function historyChart() {
  var range = state.histRange,
    pts = histPoints(range),
    btn = function (v, label) {
      return (
        '<button class="learn" data-hp="' +
        v +
        '" aria-pressed="' +
        (range === v) +
        '">' +
        label +
        "</button>"
      );
    },
    v =
      '<h1 style="margin-top:4px">Доходы и расходы</h1><div class="panel">' +
      '<div class="row" style="flex-wrap:wrap;gap:6px;justify-content:flex-start">' +
      btn(30, "30 дней") +
      btn(90, "90 дней") +
      btn(0, "Всё время") +
      "</div>";
  if (pts.length < 2)
    return (
      v +
      '<p class="sub" style="margin-top:10px">График появится через пару игровых дней.</p></div>'
    );
  var avg = averageOf(pts);
  v +=
    '<p class="sub" style="margin:10px 0 2px;font-size:12px">макс. ' +
    formatMoneyShort(historyMax(pts)) +
    " в день</p>" +
    historySvg(pts) +
    '<p class="sub" style="margin:6px 0 0">' +
    '<span style="color:var(--good)">━</span> доход &nbsp; <span style="color:var(--bad)">━</span> расход · ' +
    (range ? "по дням" : "в среднем за день, по месяцам") +
    "</p>" +
    '<div class="row"><span>Средний доход в день</span><b class="money">' +
    formatMoney(avg[0]) +
    "</b></div>" +
    '<div class="row"><span>Средний расход в день</span><b>' +
    formatMoney(avg[1]) +
    "</b></div>" +
    '<div class="row"><span>Разница в день</span><b style="color:var(--' +
    (avg[0] >= avg[1] ? "good" : "bad") +
    ')">' +
    (avg[0] >= avg[1] ? "+" : "−") +
    formatMoney(Math.abs(avg[0] - avg[1])) +
    "</b></div></div>";
  return v;
}
