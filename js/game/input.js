/**
 * Обработка кликов.
 *
 * Каждая кнопка в разметке несёт data-атрибут (например data-j="3" — «выбрать работу №3»).
 * Здесь атрибут превращается в вызов нужной функции раздела.
 *
 * ВАЖНО: порядок строк в CLICK_ACTIONS — это приоритет. Если у кнопки или её родителей
 * сразу несколько data-атрибутов, сработает самый верхний из списка.
 *
 * Чтобы добавить новую кнопку: поставьте ей data-xxx в HTML раздела и добавьте строку сюда.
 */

/** Показать другой экран и прокрутить страницу вверх. */
function goTo(apply) {
  apply();
  window.scrollTo(0, 0);
  render();
}

var CLICK_ACTIONS = [
  // [data-атрибут, обработчик(значение атрибута)]
  [
    "g",
    function (v) {
      openGroup(v);
    },
  ], // раздел (верхний ряд)
  [
    "t",
    function (v) {
      openTab(v);
    },
  ], // вкладка внутри раздела
  [
    "j",
    function (v) {
      pickJob(+v);
    },
  ], // работа
  [
    "r",
    function (v) {
      relationAction(v);
    },
  ], // отношения
  [
    "q",
    function (v) {
      techAction(+v);
    },
  ], // технологии
  [
    "ms",
    function (v) {
      goTo(function () {
        state.ms = +v;
      });
    },
  ], // биржа: открыть актив
  [
    "mt",
    function (v) {
      marketTrade(state.ms, v);
    },
  ], // биржа: купить/продать
  [
    "ipo",
    function () {
      marketIpo();
    },
  ], // биржа: IPO
  [
    "sg",
    function (v) {
      gpuSell(+v);
    },
  ], // ферма: продать видеокарту
  [
    "sr",
    function (v) {
      farmSell(v);
    },
  ], // ферма: продать стойку/всё
  [
    "re",
    function (v) {
      flipAction(v);
    },
  ], // перекуп домов
  [
    "rest",
    function () {
      startRest();
    },
  ], // отдых
  [
    "tax",
    function (v) {
      payTax(v);
    },
  ], // оплата счёта
  [
    "car",
    function (v) {
      carAction(v);
    },
  ], // машины
  [
    "set",
    function (v) {
      settingsAction(v);
    },
  ], // настройки
  [
    "ap",
    function (v) {
      autoPayAction(v);
    },
  ], // автоплатёж
  [
    "bs",
    function (v) {
      // навигация по бизнесам
      goTo(function () {
        state.bs = v === "home" ? v : +v;
      });
    },
  ],
  [
    "z",
    function (v) {
      businessAction(v);
    },
  ], // действия бизнеса
  [
    "k",
    function (v) {
      bankAction(v);
    },
  ], // банк
  [
    "m",
    function (v) {
      medicineAction(+v);
    },
  ], // медицина
  [
    "b",
    function (v) {
      farmBuy(v);
    },
  ], // ферма: покупки
  [
    "hp",
    function (v) {
      state.histRange = +v;
      render();
    },
  ], // стата: период графика
  [
    "ua",
    function () {
      gpuUpgradeAll();
    },
  ], // ферма: заточить все карты
  [
    "u",
    function (v) {
      gpuUpgrade(+v);
    },
  ], // ферма: заточка
  [
    "l",
    function (v) {
      setLifestyle(+v);
    },
  ], // образ жизни
  [
    "h",
    function (v) {
      homeAction(v);
    },
  ], // жильё
  [
    "e",
    function (v) {
      startCourse(+v);
    },
  ], // курс обучения
];

function onGameClick(e) {
  for (var i = 0; i < CLICK_ACTIONS.length; i++) {
    var attr = CLICK_ACTIONS[i][0];
    var el = e.target.closest("[data-" + attr + "]");
    if (el) {
      CLICK_ACTIONS[i][1](el.dataset[attr]);
      return;
    }
  }
}
