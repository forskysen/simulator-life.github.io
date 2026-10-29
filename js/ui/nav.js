/**
 * Навигация: 5 разделов верхнего уровня и подвкладки внутри.
 *
 * state.tab хранит имя ПОДВКЛАДКИ, раздел определяется по нему (groupOf).
 * Чтобы добавить вкладку: впишите её в tabs нужного раздела NAV_GROUPS,
 * добавьте иконку в TAB_ICON и функцию экрана в TAB_VIEWS (ui/render.js).
 */

var NAV_GROUPS = [
  { name: "Жизнь", icon: "🧍", tabs: ["Работа", "Образование", "Отношения", "Медицина"] },
  { name: "Имущество", icon: "🏠", tabs: ["Дома", "Машины"] },
  { name: "Финансы", icon: "💰", tabs: ["Банк", "Счета", "Благотворительность", "Биржа"] },
  { name: "Бизнес", icon: "🏢", tabs: ["Бизнес", "Ферма", "Технологии"] },
  { name: "Стата", icon: "📊", tabs: ["Стата"] },
];

var TAB_ICON = {
  Работа: "💼",
  Образование: "🎓",
  Отношения: "❤️",
  Медицина: "🩺",
  Дома: "🏠",
  Машины: "🚗",
  Банк: "🏦",
  Счета: "🧾",
  Благотворительность: "🎗️",
  Биржа: "📈",
  Бизнес: "🏢",
  Ферма: "⛏️",
  Технологии: "🔬",
  Стата: "📊",
};

/** Подпись вкладки, если она отличается от имени (имя Бизнес занято разделом). */
var TAB_LABEL = { Бизнес: "Бизнесы" };

/** Раздел, которому принадлежит вкладка (или null, например для «Настроек»). */
function groupOf(tab) {
  for (var i = 0; i < NAV_GROUPS.length; i++) {
    if (NAV_GROUPS[i].tabs.indexOf(tab) >= 0) return NAV_GROUPS[i];
  }
  return null;
}

/** Старые сохранения: «Бизнес → ферма/технологии» стали отдельными вкладками. */
function normalizeTab() {
  if (state.tab === "Бизнес" && state.bs === "m") {
    state.tab = "Ферма";
    state.bs = "home";
  } else if (state.tab === "Бизнес" && state.bs === "t") {
    state.tab = "Технологии";
    state.bs = "home";
  }
}

/** Верхний ряд: разделы. */
function nav() {
  var cur = groupOf(state.tab),
    h = "";
  NAV_GROUPS.forEach(function (g) {
    h +=
      '<button data-g="' +
      g.name +
      '"' +
      (cur === g ? ' aria-current="true"' : "") +
      '><span aria-hidden="true">' +
      g.icon +
      "</span> " +
      g.name +
      "</button>";
  });
  document.getElementById("nav").innerHTML = h;
}

/** Второй ряд: подвкладки текущего раздела (у раздела из одной вкладки скрыт). */
function subnav() {
  var g = groupOf(state.tab),
    el = document.getElementById("subnav"),
    h = "";
  if (g && g.tabs.length > 1) {
    g.tabs.forEach(function (t) {
      h +=
        '<button data-t="' +
        t +
        '"' +
        (t === state.tab ? ' aria-current="true"' : "") +
        '><span aria-hidden="true">' +
        TAB_ICON[t] +
        "</span> " +
        (TAB_LABEL[t] || t) +
        "</button>";
    });
  }
  el.innerHTML = h;
  el.hidden = !h;
}

/** Открыть вкладку, вернуться наверх страницы. */
function openTab(name) {
  if (name === "Бизнес") state.bs = "home";
  state.tab = name;
  var g = groupOf(name);
  if (g) state.navLast[g.name] = name;
  window.scrollTo(0, 0);
  render();
  playEnterAnimation();
}

/** Плавное появление экрана при смене вкладки (при обычных кликах внутри экрана не повторяется). */
function playEnterAnimation() {
  var el = document.getElementById("view");
  if (!el || !el.classList) return;
  el.classList.remove("enter");
  void el.offsetWidth; // перезапуск CSS-анимации
  el.classList.add("enter");
}

/** Открыть раздел: последнюю посещённую в нём вкладку или первую. */
function openGroup(groupName) {
  var g = NAV_GROUPS.filter(function (x) {
    return x.name === groupName;
  })[0];
  if (g) openTab(state.navLast[g.name] || g.tabs[0]);
}

/** Соседняя вкладка внутри раздела (по кругу). dir: -1 или +1. */
function stepTab(dir) {
  var g = groupOf(state.tab);
  if (!g || g.tabs.length < 2) return;
  var i = g.tabs.indexOf(state.tab);
  openTab(g.tabs[(i + dir + g.tabs.length) % g.tabs.length]);
}

/** Соседний раздел (по кругу). dir: -1 или +1. */
function stepGroup(dir) {
  var g = groupOf(state.tab);
  if (!g) return;
  var i = NAV_GROUPS.indexOf(g),
    next = NAV_GROUPS[(i + dir + NAV_GROUPS.length) % NAV_GROUPS.length];
  openGroup(next.name);
}
