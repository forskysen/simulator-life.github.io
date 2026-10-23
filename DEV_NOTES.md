# Карта кода (V1.1.1.1, после рефакторинга)

Игра разложена на файлы по темам. Логика и поведение не менялись — только структура, форматирование и имена.
Файлы — обычные `<script>` без сборки и без модулей (ES-модули не работают при открытии `index.html` с диска),
поэтому все функции и данные — глобальные. **Порядок подключения задан в `index.html`**, `main.js` всегда последний.

## 1. Структура

```
js/
  core/
    utils.js       форматирование чисел, escapeHtml, toast (уведомления), log
    state.js       объект state, save/load, fixS (миграция сохранений), SETTINGS
  features/        по одному файлу на раздел игры: данные + функции раздела
    work.js        работы, курсы, образ жизни, доход (dailyIncome)
    housing.js     жильё           events.js     случайные события, плашки-предупреждения
    rest.js        отдых, экономика  medicine.js   медицина
    bank.js        банк, вклад      farm.js       майнинг-ферма
    business.js    бизнесы          agency.js     агентство
    tech.js        технологии       relations.js  отношения, дети
    market.js      биржа            realestate.js перекуп домов
    cars.js        машины           taxes.js      счета, налоги, автоплатёж, monthEnd
    stats.js       экран «Стата»    settings.js   экран «Настройки»
  ui/render.js     вкладки, nav, view (экран по вкладке), profile, render
  game/
    input.js       таблица CLICK_ACTIONS: data-атрибут кнопки -> функция
    day.js         nextDay(): порядок ежедневных расчётов
  main.js          подписка на события, загрузка сохранения, первый render
tools/smoke-test.js   быстрая проверка без браузера
```

## 2. Как это работает

- **Состояние:** глобальный `state`. Сохранение: `save()` (вызывается из `render()`), `load()`, ключ `SAVE_KEY`.
  `fixS()` дозаполняет поля и мигрирует старые сохранения (**все новые поля `state` добавлять туда**).
  Настройки: `SETTINGS`, `saveCfg()`, `applyCfg()`.
- **Отрисовка:** `render()` = `nav()` + `view()` + `profile()` + `save()`. `view()` собирает HTML строкой по `state.tab`,
  перед ним вставляется `warningBanners()`.
- **Клики:** один обработчик `onGameClick` (`game/input.js`). Кнопки несут `data-*`; соответствие атрибут -> функция
  описано таблицей `CLICK_ACTIONS`. Порядок строк = приоритет, если у кнопки и её родителей несколько атрибутов.
- **Тик дня** (`nextDay` в `game/day.js`): день+1, `autoLifestyle()`, расходы быта, болезнь/зарплата, учёба, затем
  `dailyRandomEvents` → `farmDay` → `medDay` → `businessDay` → `agencyDay` → `relDay` → `flipDay` → `restDay` →
  `ecoDay` → `taxDay` → `kidDay` → `techDay` → `marketDay`; раз в 30 дней `monthEnd()`; потом `log()` и `render()`.
- **Уведомления:** `toast(заголовок, текст, "good"|"bad")`. Одинаковые заголовки склеиваются в «×N».

## 3. Состояние `state` (главные поля)
`day, bal, job, tab, done` (пройденные курсы) `, study/prog, house` (индекс в `HOMES`) `, mood, teeth, sick, dead, life`
`, mInc/mJob` (доход месяца) `, tot` (заработано за всё время) `, tx` (счета) `, ap` (автоплатёж) `, farm, B[]`
(бизнесы) `, astro, tech, mk` (биржа) `, re` (перекуп) `, rel, kids, cars, eco, infl, rest, banned, dep, char`.

## 4. Куда идти, если нужно...
- изменить зарплаты/цены/события — данные вверху нужного файла (`JOBS`, `COURSE_PRICE`, `HOMES`, `RANDOM_EVENTS`,
  `GPU_TYPES`, `BUSINESSES`, `MARKET_ASSETS`, `AGENCY_CONTRACTS`, `CARS`, `MED`, `TECH` …);
- понять, откуда берётся доход — `dailyIncome()` в `work.js` (× `healthIncomeMultiplier` × `economyMultiplier` × инфляция × машина);
- понять, откуда берутся счета — `addTax`, `taxDay`, `monthEnd` в `taxes.js`, а начисляют `farmMonth` / `businessMonth` / `flipMonthTax`.

## 5. Грабли
- Индексы `HOMES` связаны с `JOB_MIN_HOME`, `HOME_PRESTIGE` и миграцией в `fixS` (массив MAP). Добавляя жильё — правьте всё.
- Новая вкладка: `TABS` + `ICON` + ветка в `view()` (+ `data-t` в кнопке).
- Новая кнопка: `data-xxx` в HTML + строка в `CLICK_ACTIONS`.
- Новый регулярный платёж: ключ в `BILL_NAMES`, порядок в `AUTOPAY_ORDER`, начисление в `monthEnd`/`*Month`.
- Новое поле `state`: значение по умолчанию в `fixS`, иначе у старых сохранений будет `undefined`.
- `TAX_RATE`, `DEPOSIT_LIMIT`, `DEPOSIT_RATE` — глобальные переменные, которые пересчитывает `render()` (и `charity()`).
  Читать их можно везде, но актуальны они только после `render()`.
- После правок: `node tools/smoke-test.js`.

## 6. Таблица переименований (старое имя -> новое)
Если в старых заметках, чатах или коде встретите короткое имя — вот что оно значит теперь.

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
