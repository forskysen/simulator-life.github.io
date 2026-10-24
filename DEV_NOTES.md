# Карта кода (V1.1.2)

Игра разложена на файлы по темам. Файлы — обычные `<script>` без сборки и без модулей (ES-модули не работают
при открытии `index.html` с диска), поэтому все функции и данные глобальные. **Порядок подключения задан в
`index.html`**, `main.js` всегда последний. Тесты берут этот порядок оттуда же.

## 1. Структура

```
js/
  core/
    utils.js       форматирование чисел, escapeHtml, toast (уведомления), log
    state.js       объект state, save/load, SAVE_VERSION и миграции (fixS, migrateHomes), SETTINGS
    history.js     учёт доходов и расходов по дням для графика (ledger, state.hist)
  features/        по одному файлу на раздел игры: данные + функции раздела
    work.js        профессии, курсы, образ жизни, доход (dailyIncome); экраны «Работа» и «Образование»
    housing.js     жильё (HOMES), переезд; экран «Дома»
    events.js      случайные события (RANDOM_EVENTS), болезни, красные плашки
    rest.js        отдых, экономика     medicine.js   медицина, полный имплант зубов
    bank.js        банк, вклад          farm.js       майнинг-ферма, смазчик, заточка
    business.js    бизнесы (BUSINESSES) agency.js     агентство
    tech.js        технологии (TECH)    relations.js  отношения, дети
    market.js      биржа                realestate.js перекуп домов
    cars.js        машины               taxes.js      счета, налоги, автоплатёж, monthEnd
    stats.js       экран «Стата» и график доходов/расходов
    settings.js    экран «Настройки»
  ui/
    nav.js         5 разделов и подвкладки (NAV_GROUPS), openTab/openGroup/stepTab/stepGroup
    render.js      TAB_VIEWS (вкладка -> функция экрана), view, profile, render
  game/
    input.js       таблица CLICK_ACTIONS: data-атрибут кнопки -> функция
    keys.js        горячие клавиши
    day.js         nextDay(): порядок ежедневных расчётов
  main.js          подписка на события, загрузка сохранения, первый render
tools/
  browser-stub.js  заглушка браузера для запуска игры в Node
  smoke-test.js    быстрая проверка (несколько секунд): node tools/smoke-test.js
  fuzz-test.js     случайные клики по всем кнопкам: node tools/fuzz-test.js [шагов] [зёрна]
```

## 2. Как это работает

- **Состояние:** глобальный `state`. Сохранение: `save()` (вызывается из `render()`), `load()`, ключ `SAVE_KEY`.
  `fixS()` дозаполняет поля и мигрирует старые сохранения (**все новые поля `state` добавлять туда**).
- **Отрисовка:** `render()` = `normalizeTab()` + `nav()` + `subnav()` + `view()` + `profile()` + `save()`.
  `view()` берёт функцию экрана из `TAB_VIEWS` и добавляет сверху `warningBanners()`.
- **Навигация:** `state.tab` хранит имя подвкладки, раздел определяется по нему (`groupOf`). Разделы и вкладки
  описаны в `NAV_GROUPS`, иконки в `TAB_ICON`. `state.navLast` запоминает последнюю вкладку каждого раздела.
- **Клики:** один обработчик `onGameClick` (`game/input.js`). Кнопки несут `data-*`; соответствие атрибут -> функция
  описано таблицей `CLICK_ACTIONS`. Порядок строк = приоритет, если у кнопки и её родителей несколько атрибутов.
- **Горячие клавиши** (`game/keys.js`): Пробел/Enter — следующий день; ← → — соседняя вкладка; Shift+← → — соседний
  раздел. Не работают в полях ввода; на сфокусированной кнопке Пробел/Enter оставлены самой кнопке.
- **Тик дня** (`nextDay` в `game/day.js`): `ledgerBegin()`, день+1, расходы быта, болезнь/зарплата, учёба, затем
  `dailyRandomEvents` → `farmDay` → `medDay` → `businessDay` → `agencyDay` → `relDay` → `flipDay` → `restDay` →
  `ecoDay` → `taxDay` → `kidDay` → `techDay` → `marketDay`; раз в 30 дней `monthEnd()`; `ledgerEnd()`, `log()`, `render()`.
- **График доходов и расходов:** `state.bal` подменено свойством-«счётчиком» (`installLedger` в `core/history.js`).
  Пока идёт тик дня, каждое увеличение баланса считается доходом, каждое уменьшение расходом; покупки по кнопкам
  вне тика в график не попадают. Хранится компактно: последние 120 дней подробно, старше — средние за 30 дней.
  Не заменяйте объект `state` целиком и не копируйте его через `Object.assign` — счётчик живёт на самом объекте.
- **Сортировка в списках:** профессии (`jobOrder`), машины (`carOrder`), бизнесы (`businessOrder`) и технологии
  (`techOrder`) показываются по зарплате, цене и чистому заработку, а **индексы в массивах и в сохранениях не
  меняются**. Поэтому новое можно добавлять в конец массива: на экране оно встанет на своё место.
  Исключение — дома: сравнения вида «жильё не хуже N» идут по индексу, поэтому `HOMES` отсортирован по цене физически.
- **Версия сохранения:** `SAVE_VERSION` (сейчас 2). Если меняете смысл индексов, поднимите версию и допишите миграцию
  по образцу `migrateHomes`.
- **Уведомления:** `toast(заголовок, текст, "good"|"bad"|"")`. Одинаковые заголовки склеиваются в «×N».

## 3. Как добавить...

- **Профессию:** строка в `JOBS` (в конец), значение в `JOB_PRESTIGE` (в конец), цена курса в `COURSE_PRICE[i]` (если
  `JOBS[i][3] > 0` дней обучения), при необходимости `JOB_MIN_HOME[i]` (индекс в `HOMES`). Порядок на экране — по зарплате.
- **Бизнес:** строка в `BUSINESSES` (в конец; поля: название, цена лицензии, описание, подпись кнопки точки, цена точки,
  доход точки в день, расходы точки в месяц, максимум точек, 3 улучшения `[название, цена, +доля, текст]`, название
  происшествия) и значение в `EMPLOYEE_SALARY` (в конец). По желанию: `BUSINESS_DIPLOMA[i]` (нужный курс),
  `TECH_FOR_BUSINESS[i]` (технология +20%). `state.B` дополняется автоматически. Ориентир: чистая прибыль точки за месяц
  примерно цена точки / 8.
- **Технологию:** строка в `TECH` (в конец: название, цена, дней, шанс успеха, описание), связь с бизнесом в
  `TECH_FOR_BUSINESS` и `TECH_NEEDS_BUSINESS`. `state.tech.d` дополняется автоматически.
- **Машину:** строка в `CARS` (в конец), на экране встанет по цене.
- **Дом:** вставьте в `HOMES` по цене, поправьте `HOME_PRESTIGE` и значения `JOB_MIN_HOME`, поднимите `SAVE_VERSION`
  и допишите миграцию. Если добавляете дороже всех в конец, миграция не нужна.
- **Событие:** объект в `RANDOM_EVENTS`; поля описаны над таблицей (деньги, настроение, пауза, условия, сезон).
  Сезонные события происходят раз в год в окне дней, остальные берутся случайно (15% в день).
- **Услугу в медицине:** строка в `MED` (в конец), условие и эффект в `medicineAction`, кнопка в `medView`.
- **Вкладку:** имя в нужный раздел `NAV_GROUPS`, иконка в `TAB_ICON`, функция экрана в `TAB_VIEWS`.
- **Кнопку:** `data-xxx` в HTML и строка в `CLICK_ACTIONS`.
- **Регулярный платёж:** ключ в `BILL_NAMES`, порядок в `AUTOPAY_ORDER`, начисление в `monthEnd`/`*Month`.

## 4. Грабли
- Индексы `HOMES` связаны с `JOB_MIN_HOME`, `HOME_PRESTIGE` и миграцией в `migrateHomes`.
- `TAX_RATE`, `DEPOSIT_LIMIT`, `DEPOSIT_RATE` — глобальные переменные, которые пересчитывает `render()`
  (и `charity()`). Читать можно везде, но актуальны они только после `render()`.
- Зарплата смазчика фермы входит в общий счёт зарплат (`estimatedSalaries`); при просрочке он уходит вместе с остальными.
- После правок: `node tools/smoke-test.js` и `node tools/fuzz-test.js`.

## 5. Что нового в 1.1.2
- **Навигация:** 5 разделов (Жизнь, Имущество, Финансы, Бизнес, Стата) с подвкладками; «Машины», «Ферма» и
  «Технологии» стали отдельными вкладками. Старые сохранения переезжают сами.
- **Горячие клавиши:** Пробел/Enter, ← →, Shift+← →.
- **Ферма:** нанимаемый смазчик (30 000 ₽/мес, сам докупает смазку), кнопка «Заточить все на +1».
- **Стата:** график доходов и расходов по дням (30 / 90 дней / всё время).
- **Контент:** событий 24 (было 12, есть сезонные и связанные с имуществом и бизнесом), профессий 20 (было 14),
  бизнесов 12 (было 7), технологий 10 (было 5), машин 12 (было 7), домов 16 (было 12), полный имплант зубов.
- **Внешний вид:** иконки, плавное появление экранов, нажатия, фокус для клавиатуры.
- **Исправлено:** покупка максимальных улучшений вклада и заточка по устаревшей кнопке больше не портят баланс и карты.
- **Код:** `view()` стал таблицей `TAB_VIEWS`, события описаны объектами, тесты разделили общую заглушку, добавлен фазз-тест.

## 6. Таблица переименований 1.1.1 -> 1.1.1.1
Если в старых заметках или чатах встретите короткое имя — вот что оно значит.

| было | стало |
|---|---|
| `S` | `state` |
| `L` | `LIFESTYLES` |
| `H` | `HOMES` |
| `EV` | `RANDOM_EVENTS` |
| `EC` | `COURSE_PRICE` |
| `PR` | `JOB_PRESTIGE` |
| `NEEDH` | `JOB_MIN_HOME` |
| `TIER` | `HOME_PRESTIGE` |
| `GT` | `GPU_TYPES` |
| `UPCH` | `GPU_UPGRADE_CHANCE` |
| `RACK` | `RACK_PRICE` |
| `SLOTS` | `RACK_SLOTS` |
| `LUBE` | `LUBE_PRICE` |
| `COOL` | `COOLANT_PRICE` |
| `BZ` | `BUSINESSES` |
| `SAL` | `EMPLOYEE_SALARY` |
| `GROW` | `POINT_PRICE_GROWTH` |
| `UNL` | `UNLIMITED_POINTS` |
| `REQ` | `BUSINESS_DIPLOMA` |
| `U2` | `SHARED_UPGRADES` |
| `CT` | `AGENCY_CONTRACTS` |
| `RT` | `FLIP_HOUSES` |
| `RU` | `FLIP_UPGRADES` |
| `AS` | `MARKET_ASSETS` |
| `ASK` | `PARTNER_REQUESTS` |
| `NM` | `PARTNER_NAMES` |
| `TXN` | `BILL_NAMES` |
| `APK` | `AUTOPAY_ORDER` |
| `BUR` | `DEPOSIT_RATE_UPGRADE_PRICES` |
| `BUL` | `DEPOSIT_LIMIT_UPGRADE_PRICES` |
| `CFG` | `SETTINGS` |
| `KEY` | `SAVE_KEY` |
| `TAX` | `TAX_RATE` |
| `DEPMAX` | `DEPOSIT_LIMIT` |
| `RATE` | `DEPOSIT_RATE` |
| `gauss` | `gaussianRandom` |
| `esc` | `escapeHtml` |
| `pct` | `formatPercentChange` |
| `fmt` | `formatMoney` |
| `fmtS` | `formatMoneyShort` |
| `fmtP` | `formatPrice` |
| `clamp` | `clampPercent` |
| `rnd` | `dailyRandomEvents` |
| `warn` | `warningBanners` |
| `std` | `livingStandard` |
| `pr` | `prestigeGap` |
| `chk` | `quitIfBelowStandard` |
| `autoLife` | `autoLifestyle` |
| `net` | `dailyIncome` |
| `inMul` | `healthIncomeMultiplier` |
| `ecoMul` | `economyMultiplier` |
| `restMul` | `restMultiplier` |
| `lvl` | `playerLevel` |
| `isBan` | `isFiredFrom` |
| `jobsFor` | `jobsRequiringHome` |
| `buy` | `farmBuy` |
| `upg` | `gpuUpgrade` |
| `gpuSale` | `gpuSalePrice` |
| `airN` | `airCooledGpuCount` |
| `bizView` | `farmView` |
| `bz` | `businessAction` |
| `bizHub` | `businessHub` |
| `bzView` | `businessView` |
| `bizInc` | `businessIncome` |
| `bizDay` | `businessDay` |
| `bizMonth` | `businessMonth` |
| `bizTotal` | `totalBusinessIncome` |
| `bmax` | `businessMaxPoints` |
| `unitCost` | `pointPrice` |
| `upHtml` | `upgradesHtml` |
| `rel` | `relationAction` |
| `kidCost` | `childDailyCost` |
| `careOn` | `partnerCareActive` |
| `med` | `medicineAction` |
| `bank` | `bankAction` |
| `bankUp` | `bankUpgradeAction` |
| `tech` | `techAction` |
| `techMul` | `techBonus` |
| `mkInit` | `marketInit` |
| `mkNext` | `marketNextPrice` |
| `mkDay` | `marketDay` |
| `mkCard` | `marketCard` |
| `mkView` | `marketView` |
| `mkDetail` | `marketDetail` |
| `mkTrade` | `marketTrade` |
| `mkIpo` | `marketIpo` |
| `asset` | `assetInfo` |
| `fairOwn` | `ownCompanyFairPrice` |
| `spark` | `sparklineSvg` |
| `reVal` | `flipHouseValue` |
| `reNew` | `flipNewHouse` |
| `reDisc` | `flipDiscount` |
| `reTot` | `flipTotalValue` |
| `reDay` | `flipDay` |
| `reMonthTax` | `flipMonthTax` |
| `reAct` | `flipAction` |
| `reView` | `flipView` |
| `agBase` | `agencyBase` |
| `agSlots` | `agencySlots` |
| `agLvlCost` | `agencyLevelCost` |
| `agDay` | `agencyDay` |
| `agAct` | `agencyAction` |
| `agView` | `agencyView` |
| `hPrice` | `homePrice` |
| `avgDaily` | `averageDailyIncome` |
| `salEst` | `estimatedSalaries` |
| `opxEst` | `estimatedOperatingCosts` |
| `apAct` | `autoPayAction` |
| `setAct` | `settingsAction` |
| `setView` | `settingsView` |
| `carAct` | `carAction` |
| `homeAct` | `homeAction` |
