/**
 * Точка входа: подключает обработчики, загружает сохранение и рисует первый кадр.
 */

document.addEventListener("click", onGameClick);
document.addEventListener("keydown", onGameKey);
document.getElementById("next").onclick = requestNextDay;
document.getElementById("log").onclick = function () {
  this.classList.toggle("open");
};

installLedger();
var loaded = load();
fixS();
marketInit();
applyCfg();
render();
if (loaded) log("Сохранение загружено. День " + state.day + ".");
