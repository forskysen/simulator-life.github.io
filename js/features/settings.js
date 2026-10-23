/**
 * Экран «Настройки».
 */

function settingsView() {
  var th = SETTINGS.theme || "auto",
    mx = SETTINGS.maxToasts || 0;
  var seg = function (arr, key, cur) {
    return arr
      .map(function (x) {
        return (
          '<button class="learn" data-set="' +
          key +
          x[0] +
          '" aria-pressed="' +
          (cur === x[0]) +
          '">' +
          x[1] +
          "</button>"
        );
      })
      .join("");
  };
  var v = '<h1>Настройки</h1><p class="sub">Тема, уведомления, сохранение и новая игра.</p>';
  v +=
    '<div class="panel"><div class="row"><span>Тема</span></div><div style="display:flex;flex-wrap:wrap;gap:8px;padding-bottom:8px">' +
    seg(
      [
        ["auto", "Как в системе"],
        ["light", "Светлая"],
        ["dark", "Тёмная"],
      ],
      "th_",
      th,
    ) +
    "</div></div>";
  v +=
    '<div class="panel" style="margin-top:12px"><div class="row"><span>Сколько уведомлений показывать сразу</span></div><div style="display:flex;flex-wrap:wrap;gap:8px;padding-bottom:8px">' +
    seg(
      [
        [0, "Авто"],
        [1, "1"],
        [2, "2"],
        [3, "3"],
        [5, "5"],
      ],
      "mx_",
      mx,
    ) +
    "</div></div>";
  v +=
    '<div class="panel" style="margin-top:12px"><div class="row"><span>Сохранение</span></div><p style="font-size:13px;color:var(--muted)">Код сохранения можно скопировать и вставить на другом устройстве.</p><textarea id="sv" class="inp" placeholder="Код сохранения"></textarea><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="learn" data-set="exp">Показать код</button><button class="learn" data-set="imp">Загрузить из кода</button></div></div>';
  v +=
    '<div class="panel" style="margin-top:12px"><div class="row"><span>Новая игра</span></div><p style="font-size:13px;color:var(--muted)">Сбросит весь прогресс. Нужно нажать дважды.</p><button class="learn" id="rstbtn" data-set="reset">Новая игра</button></div>';
  return v;
}

function settingsAction(a) {
  if (a.indexOf("th_") === 0) {
    SETTINGS.theme = a.slice(3);
    saveCfg();
    applyCfg();
    render();
  } else if (a.indexOf("mx_") === 0) {
    SETTINGS.maxToasts = +a.slice(3);
    saveCfg();
    render();
  } else if (a === "exp") {
    var t = document.getElementById("sv");
    t.value = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    if (t.select) t.select();
  } else if (a === "imp") {
    var t2 = document.getElementById("sv");
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob((t2.value || "").trim()))));
      if (!o || typeof o.day !== "number" || !o.B) throw 0;
      localStorage.setItem(SAVE_KEY, JSON.stringify(o));
      location.reload();
    } catch (e) {
      toast("Загрузка", "Код не подошёл. Проверьте, что скопировали его целиком.", "bad");
    }
  } else if (a === "reset") {
    var b = document.getElementById("rstbtn");
    if (RS) {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (e) {}
      location.reload();
      return;
    }
    RS = 1;
    b.textContent = "Точно сбросить? Нажмите ещё раз";
    clearTimeout(RT2);
    RT2 = setTimeout(function () {
      RS = 0;
      b.textContent = "Новая игра";
    }, 4000);
  }
}
