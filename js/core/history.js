/**
 * История доходов и расходов по дням (график во вкладке «Стата»).
 *
 * Все изменения денег во время тика дня проходят через state.bal, поэтому installLedger()
 * подменяет это поле на свойство-«счётчик»: пока тик идёт (ledger.on), каждый плюс считается
 * доходом, каждый минус расходом. Покупки по кнопкам вне тика в график не попадают.
 *
 * Хранение (state.hist) компактное: последние HIST_RAW_DAYS дней подробно, всё старше
 * сворачивается в средние значения за HIST_CHUNK дней.
 */

var HIST_RAW_DAYS = 120,
  HIST_CHUNK = 30;

var ledger = { on: false, income: 0, expense: 0 };

/** Подключить счётчик к state.bal (вызывать один раз перед load()). */
function installLedger() {
  var bal = state.bal;
  Object.defineProperty(state, "bal", {
    enumerable: true,
    configurable: true,
    get: function () {
      return bal;
    },
    set: function (v) {
      if (ledger.on) {
        var d = v - bal;
        if (d > 0) ledger.income += d;
        else if (d < 0) ledger.expense -= d;
      }
      bal = v;
    },
  });
}

/** Начало тика дня: обнулить счётчики. */
function ledgerBegin() {
  ledger.income = 0;
  ledger.expense = 0;
  ledger.on = true;
}

/** Конец тика дня: записать итоги дня в историю и сжать старые данные. */
function ledgerEnd() {
  ledger.on = false;
  var h = state.hist;
  h.days.push([Math.round(ledger.income), Math.round(ledger.expense)]);
  if (h.days.length > HIST_RAW_DAYS) h.months.push(averageOf(h.days.splice(0, HIST_CHUNK)));
}

/** Среднее по списку пар [доход, расход]. */
function averageOf(list) {
  var si = 0,
    se = 0;
  list.forEach(function (p) {
    si += p[0];
    se += p[1];
  });
  return [Math.round(si / list.length), Math.round(se / list.length)];
}

/**
 * Точки для графика: range = 30 или 90 (по дням) или 0 (всё время, средние по месяцам).
 * Возвращает массив пар [доход, расход].
 */
function histPoints(range) {
  var h = state.hist;
  if (range === 30 || range === 90) return h.days.slice(-range);
  var pts = h.months.slice();
  for (var i = 0; i < h.days.length; i += HIST_CHUNK)
    pts.push(averageOf(h.days.slice(i, i + HIST_CHUNK)));
  return pts;
}
