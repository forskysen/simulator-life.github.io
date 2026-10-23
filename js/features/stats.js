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
    '<h1>Статистика</h1><p class="sub">Итоги вашей жизни.</p><div class="panel">' +
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
    R("Отношения", state.rel ? escapeHtml(state.rel.name) + (state.rel.wed ? " (жена)" : "") : "нет") +
    R("Дети", state.kids) +
    R("Технологий открыто", state.tech.d.filter(Boolean).length + " из 5") +
    "</div>"
  );
}
