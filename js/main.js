/**
 * Точка входа: подключает обработчики, загружает сохранение и рисует первый кадр.
 */

document.addEventListener("click", onGameClick);
document.getElementById("next").onclick = nextDay;
document.getElementById("log").onclick = function () {
  this.classList.toggle("open");
};

var loaded = load();
fixS();
marketInit();
applyCfg();
render();
if (loaded) log("Сохранение загружено. День " + state.day + ".");
