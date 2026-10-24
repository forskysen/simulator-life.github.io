/**
 * Один игровой день: порядок всех ежедневных расчётов (кнопка «Следующий день»).
 */

function nextDay() {
  if (state.dead) return;
  ledgerBegin();
  state.day++;
  state.life = autoLifestyle();
  var m = "День " + state.day + ". ";
  var ex = Math.round(LIFESTYLES[state.life][1] * state.infl);
  state.bal -= ex;
  var sk = state.sick > 0,
    mi0 = state.mInc;
  if (state.sick > 0) {
    state.sick--;
    state.bal -= partnerCareActive() ? 350 : 700;
    if (!state.sick) toast("💪 Вы выздоровели", "Можно снова работать.", "good");
    m +=
      "Болезнь: работать нельзя, лекарства " +
      formatMoney(partnerCareActive() ? 350 : 700) +
      ". " +
      (state.sick ? "Осталось дней: " + state.sick + ". " : "Вы выздоровели. ");
  } else if (state.job < 0) {
    m += "Работы нет — доходов нет. ";
  } else {
    var n = dailyIncome();
    state.bal += n;
    state.mInc += n;
    state.mJob += n;
    m += "Заработано " + formatMoney(n) + ". ";
  }
  m += "Расходы " + formatMoney(ex) + ". ";
  if (state.study >= 0 && !sk) {
    state.prog++;
    var k = JOBS[state.study];
    if (state.prog >= k[3]) {
      state.done[state.study] = true;
      m += "Обучение завершено: " + k[4] + ". Открыта профессия: " + k[0] + ".";
      state.study = -1;
      state.prog = 0;
    }
  }
  m += dailyRandomEvents();
  m += farmDay();
  m += medDay();
  m += businessDay();
  m += agencyDay();
  m += relDay();
  m += flipDay();
  m += restDay();
  m += ecoDay();
  m += taxDay();
  state.tot += Math.max(0, state.mInc - mi0);
  m += kidDay();
  m += techDay();
  m += marketDay();
  if (state.mood < 30 && !state.apa) {
    state.apa = 1;
    toast("😶 Апатия", "Настроение ниже 30%: вы не хотите работать и заниматься бизнесом.", "bad");
  } else if (state.mood >= 30) state.apa = 0;
  if (state.teeth < 30 && !state.pain) {
    state.pain = 1;
    toast("🦷 Зубная боль", "Через боль никто не работает. Нужна стоматология.", "bad");
  } else if (state.teeth >= 30) state.pain = 0;
  if (state.day % 30 === 0) {
    m += monthEnd();
  }
  ledgerEnd();
  log(m);
  render();
}
