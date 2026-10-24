/**
 * Медицина: лечение, стоматология, страховки.
 */

var MED = [
  ["Общий осмотр", 5000, "Иммунитет на 60 дней: шанс заболеть ниже в 3 раза"],
  ["Вакцинация", 3000, "Иммунитет на 120 дней"],
  ["Лечение в клинике", 15000, "Мгновенно вылечит болезнь"],
  ["Чистка зубов", 4000, "Здоровье зубов +25"],
  ["Пломба (лечение кариеса)", 8000, "Здоровье зубов +40"],
  ["Имплантация зубов", 60000, "Здоровье зубов восстановится до 100"],
  ["Массаж", 3500, "Настроение +15"],
  ["Приём психолога", 6000, "Настроение +5, не чаще раза в неделю"],
  ["Химиотерапия", 600000, "Лечение рака, шанс успеха 60%"],
  ["Операция по удалению опухоли", 2000000, "Лечение рака, шанс успеха 90%"],
  ["Срочная помощь при боли", 12000, "Снимает острую боль: зубы поднимаются минимум до 35%"],
  [
    "Полный имплант зубов",
    2000000,
    "Зубы восстановятся до 100% и не будут портиться 5 лет, потом нужна замена",
  ],
];

/** Сколько игровых дней служит полный имплант (5 лет). Заменить можно за год до конца срока. */
var IMPLANT_DAYS = 1825,
  IMPLANT_RENEW_WINDOW = 365;

function medDay() {
  var o = "";
  if (state.shield > 0) state.shield--;
  if (state.cancer > 0) {
    state.cancer--;
    if (state.cancer % 30 === 0 && state.cancer > 0)
      toast("🎗️ Рак прогрессирует", "Осталось дней: " + state.cancer, "bad");
    if (state.cancer === 0) {
      state.dead = "рак";
      toast("☠️ Вы умерли", "Рак забрал жизнь.", "bad");
    }
  } else if (Math.random() < 0.00001) {
    state.cancer = 120;
    toast(
      "🎗️ Диагноз: рак",
      "Нужно срочно лечиться: Медицина → Онкология. Осталось около 120 дней.",
      "bad",
    );
  }
  if (state.implant > 0) {
    state.implant--;
    state.teeth = 100;
    if (state.implant === 0)
      toast(
        "🦷 Имплант отслужил срок",
        "Зубы снова начнут портиться. Нужна замена: Медицина → Стоматология.",
        "bad",
      );
  } else state.teeth = Math.max(0, state.teeth - 0.2);
  if (state.teeth < 30) state.mood = clampPercent(state.mood - 1);
  return o;
}

function medicineAction(i) {
  var m = MED[i];
  if (i === 8 || i === 9) {
    if (state.cancer <= 0) {
      toast("Онкология", "Диагноза нет — лечение не нужно.", "bad");
      return;
    }
    if (state.bal < m[1]) {
      toast(
        "Не хватает денег",
        "Нужно " + formatMoney(m[1]) + ". Деньги можно снять со вклада.",
        "bad",
      );
      return;
    }
    state.bal -= m[1];
    if (Math.random() < (i === 8 ? 0.6 : 0.9)) {
      state.cancer = 0;
      toast("💪 Рак побеждён", "Лечение прошло успешно.", "good");
    } else {
      state.cancer += 30;
      toast("Лечение не помогло", "Добавлено 30 дней, можно повторить.", "bad");
    }
    render();
    return;
  }
  if (state.implant > 0 && (i === 3 || i === 4 || i === 5 || i === 10)) {
    toast("Стоматология", "Полный имплант защищает зубы ещё " + state.implant + " дн.", "bad");
    return;
  }
  if (i === 11 && state.implant > IMPLANT_RENEW_WINDOW) {
    toast(
      "Имплант",
      "Ещё служит " + state.implant + " дн. Заменить можно за год до конца срока.",
      "bad",
    );
    return;
  }
  if (i === 7 && state.day - state.psy < 7) {
    toast("Психолог", "Следующий приём через " + (7 - (state.day - state.psy)) + " дн.", "bad");
    return;
  }
  if (i === 2 && state.sick <= 0) {
    toast("Клиника", "Вы здоровы — лечение не нужно.", "bad");
    return;
  }
  if (state.bal < m[1]) {
    toast("Не хватает денег", "Нужно " + formatMoney(m[1]), "bad");
    return;
  }
  state.bal -= m[1];
  if (i === 0) state.shield = 60;
  else if (i === 1) state.shield = 120;
  else if (i === 2) state.sick = 0;
  else if (i === 3) state.teeth = Math.min(100, state.teeth + 25);
  else if (i === 4) state.teeth = Math.min(100, state.teeth + 40);
  else if (i === 5) state.teeth = 100;
  else if (i === 10) state.teeth = Math.max(state.teeth, 35);
  else if (i === 11) {
    state.teeth = 100;
    state.implant = IMPLANT_DAYS;
  } else if (i === 7) {
    state.mood = clampPercent(state.mood + 5);
    state.psy = state.day;
  }
  toast("🩺 " + m[0], "Оплачено " + formatMoney(m[1]), "good");
  render();
}

function medGroup(ids) {
  var v = '<div class="jobs">';
  ids.forEach(function (i) {
    var m = MED[i];
    v +=
      '<button class="job" data-m="' +
      i +
      '"><span class="n">' +
      m[0] +
      '</span><span class="p">' +
      formatMoney(m[1]) +
      '</span><span class="t">' +
      m[2] +
      "</span></button>";
  });
  return v + "</div>";
}

function medView() {
  return (
    '<h1>Медицина</h1><p class="sub">Здоровье стоит денег: профилактика дешевле лечения.</p><div class="panel"><div class="row"><span>Состояние зубов</span><b>' +
    Math.round(state.teeth) +
    '%</b></div><div class="row"><span>Полный имплант</span><b>' +
    (state.implant > 0 ? "служит ещё " + state.implant + " дн." : "нет") +
    '</b></div><div class="row"><span>Иммунитет</span><b>' +
    (state.shield > 0 ? "ещё " + state.shield + " дн." : "нет") +
    '</b></div><div class="row"><span>Болезнь</span><b>' +
    (state.sick > 0 ? "осталось " + state.sick + " дн." : "нет") +
    '</b></div></div><h1 style="margin-top:24px">Процедуры</h1>' +
    medGroup([0, 1, 2, 7]) +
    '<h1 style="margin-top:24px">Стоматология</h1><p class="sub">Зубы портятся со временем. Ниже 60%: вы замыкаетесь в себе, весь доход −30%. Ниже 30%: острая боль, работать невозможно.</p>' +
    medGroup([3, 4, 10, 5, 11]) +
    '<h1 style="margin-top:24px">Онкология</h1><p class="sub">' +
    (state.cancer > 0
      ? "У вас диагноз! Осталось дней: " + state.cancer
      : "Диагноза нет. Шанс заболеть очень мал, но он есть.") +
    "</p>" +
    medGroup([8, 9]) +
    restBlock()
  );
}
