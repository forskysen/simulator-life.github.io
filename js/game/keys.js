/**
 * Горячие клавиши.
 *   Пробел / Enter ... следующий день
 *   ← →            ... соседняя вкладка внутри раздела
 *   Shift + ← →    ... соседний раздел
 *
 * Не срабатывают в полях ввода. Пробел и Enter на сфокусированной кнопке оставляем ей самой,
 * иначе действие выполнится дважды.
 */
function onGameKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  var el = e.target,
    tag = el && el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el && el.isContentEditable))
    return;

  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    var dir = e.key === "ArrowLeft" ? -1 : 1;
    if (e.shiftKey) stepGroup(dir);
    else stepTab(dir);
  } else if (e.key === " " || e.key === "Enter") {
    if (tag === "BUTTON" || tag === "A") return;
    e.preventDefault();
    nextDay();
  }
}
