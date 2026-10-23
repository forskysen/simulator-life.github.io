/**
 * Мелкие утилиты: форматирование чисел, математика, экранирование, всплывающие уведомления, строка лога.
 */

function toast(h, t, c) {
  var b = document.getElementById("toasts"),
    mx = SETTINGS.maxToasts || (window.innerWidth < 700 ? 2 : 4),
    d = null,
    i;
  for (i = 0; i < b.children.length; i++)
    if (b.children[i].dataset.h === h) {
      d = b.children[i];
      break;
    }
  if (d) {
    d.dataset.n = (+d.dataset.n || 1) + 1;
    clearTimeout(d._t);
  } else {
    d = document.createElement("div");
    d.dataset.h = h;
    d.dataset.n = 1;
    d.onclick = function () {
      clearTimeout(d._t);
      d.remove();
    };
    b.appendChild(d);
    while (b.children.length > mx) b.firstChild.remove();
  }
  d.className = "toast " + (c || "");
  d.innerHTML = "<b>" + h + (+d.dataset.n > 1 ? " ×" + d.dataset.n : "") + "</b>" + t;
  d._t = setTimeout(function () {
    d.remove();
  }, 4500);
}

function gaussianRandom() {
  var u = 1 - Math.random(),
    v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPercentChange(x) {
  return (
    (x >= 0 ? "+" : "−") +
    Math.abs(x * 100)
      .toFixed(1)
      .replace(".", ",") +
    "%"
  );
}

function formatPrice(p) {
  return p < 1000 ? p.toFixed(2).replace(".", ",") + " ₽" : formatMoney(p);
}

function clampPercent(x) {
  return Math.max(0, Math.min(100, x));
}

function formatMoney(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽";
}

function formatMoneyShort(n) {
  var a = Math.abs(n),
    s = n < 0 ? "−" : "",
    u = [
      [1e9, 1e9, "ккк"],
      [1e6, 1e6, "кк"],
      [1e4, 1e3, "к"],
    ];
  for (var i = 0; i < 3; i++) {
    if (a >= u[i][0]) {
      var k = i;
      if (i > 0 && Math.round(a / u[i][1]) >= 1000) k = i - 1;
      var v = a / u[k][1];
      return (
        s +
        (v < 100 ? (Math.round(v * 10) / 10 + "").replace(".", ",") : Math.round(v)) +
        u[k][2] +
        " ₽"
      );
    }
  }
  return formatMoney(n);
}

function log(t) {
  document.getElementById("log").innerHTML = "<p>" + t + "</p>";
}
