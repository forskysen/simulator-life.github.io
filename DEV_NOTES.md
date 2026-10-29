# Карта кода (V1.1.3)

Игра разложена на файлы по темам. Файлы — обычные `<script>` без сборки и без модулей (ES-модули не работают
при открытии `index.html` с диска), поэтому все функции и данные глобальные. **Порядок подключения задан в
`index.html`**, `main.js` всегда последний. Тесты берут этот порядок оттуда же.

## 1. Структура

```
js/
  core/
    utils.js       форматирование чисел (formatMoney, formatMoneyShort до «кккккк»), escapeHtml, toast, log
    state.js       объект state, save/load, SAVE_VERSION и миграции (migrateHomes, migrateBusinesses), SETTINGS
    history.js     учёт доходов и расходов по дням для графика (ledger, state.hist)
  features/        по одному файлу на раздел игры: данные + функции раздела
    work.js        профессии, курсы, образ жизни, доход (dailyIncome); экраны «Работа» и «Образование»
    housing.js     жильё (HOMES), переезд; экран «Дома»
    events.js      случайные события (RANDOM_EVENTS), болезни, красные плашки
    rest.js        отдых, экономика     medicine.js   медицина, полный имплант зубов
    bank.js        банк, вклад, благотворительность (вкладки «Банк» и «Благотворительность»)
    farm.js        майнинг-ферма, смазчик, заточка
    business.js    бизнесы (BUSINESSES) tech.js        технологии (TECH)
    relations.js   отношения, дети      market.js     биржа, своя компания (капитализация, боты-инвесторы)
    realestate.js  перекуп домов        cars.js       машины
    taxes.js       счета и налоги, просрочка, автоплатёж, monthEnd (вкладка «Счета»)
    stats.js       экран «Стата» и график доходов/расходов
    settings.js    экран «Настройки»
  ui/
    nav.js         5 разделов и подвкладки (NAV_GROUPS), openTab/openGroup/stepTab/stepGroup
    render.js      TAB_VIEWS (вкладка -> функция экрана), view, profile, render
  game/
    input.js       таблица CLICK_ACTIONS: data-атрибут кнопки -> функция
    keys.js        горячие клавиши
    day.js         nextDay(): порядок ежедневных расчётов; requestNextDay(): кнопка/клавиши с паузой 250 мс
  main.js          подписка на события, загрузка сохранения, первый render
tools/
  browser-stub.js  заглушка браузера для запуска игры в Node
  smoke-test.js    быстрая проверка (несколько секунд): node tools/smoke-test.js
  fuzz-test.js     случайные клики по всем кнопкам: node tools/fuzz-test.js [шагов] [зёрна]
```

Разделы и вкладки: **Жизнь** (Работа, Образование, Отношения, Медицина), **Имущество** (Дома, Машины),
**Финансы** (Банк, Счета, Благотворительность, Биржа), **Бизнес** (Бизнес, Ферма, Технологии), **Стата**.

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
- **Пауза «Следующий день»:** кнопка и клавиши идут через `requestNextDay()`, не чаще раза в `NEXT_DAY_COOLDOWN_MS`
  (250 мс). Тесты и код вызывают `nextDay()` напрямую.
- **Тик дня** (`nextDay` в `game/day.js`): `ledgerBegin()`, день+1, расходы быта, болезнь/зарплата, учёба, затем
  `dailyRandomEvents` → `farmDay` → `medDay` → `businessDay` → `dividendDay` → `relDay` → `flipDay` → `restDay` →
  `ecoDay` → `taxDay` → `kidDay` → `techDay` → `marketDay`; раз в 30 дней `monthEnd()`; `ledgerEnd()`, `log()`, `render()`.
- **Деньги на экране:** `formatMoneyShort`: к = тысяча, кк = миллион, ккк = миллиард, кккк = триллион,
  ккккк = квадриллион, кккккк = 10^18. Таблица единиц `MONEY_UNITS`.
- **График доходов и расходов:** `state.bal` подменено свойством-«счётчиком» (`installLedger` в `core/history.js`).
  Пока идёт тик дня, каждое увеличение баланса считается доходом, каждое уменьшение расходом; покупки по кнопкам
  вне тика в график не попадают. Хранится компактно: последние 120 дней подробно, старше — средние за 30 дней.
  Не заменяйте объект `state` целиком и не копируйте его через `Object.assign` — счётчик живёт на самом объекте.
- **Сортировка в списках:** профессии (`jobOrder`), машины (`carOrder`), бизнесы (`businessOrder`) и технологии
  (`techOrder`) показываются по зарплате, цене и чистому заработку, а **индексы в массивах и в сохранениях не
  меняются**. Поэтому новое можно добавлять в конец массива: на экране оно встанет на своё место.
  Исключение — дома: сравнения вида «жильё не хуже N» идут по индексу, поэтому `HOMES` отсортирован по цене физически.
- **Версия сохранения:** `SAVE_VERSION` (сейчас 3). Если меняете смысл индексов, поднимите версию и допишите миграцию
  по образцу `migrateHomes` / `migrateBusinesses`. Миграции запускаются в начале `fixS()` по порядку версий.
- **Уведомления:** `toast(заголовок, текст, "good"|"bad"|"")`. Одинаковые заголовки склеиваются в «×N».

### Просрочка счетов (taxes.js)
Ничего не отбирается. Если любой счёт не оплачен `ARREARS_DAYS` (7) дней, `propertySuspended()` возвращает true:
бизнесы (`businessIncome`), ферма (`farmInc`/`farmDay`) и машины (`carBonus`) не приносят доход, пока долги не
оплачены. Каждый день неуплаты пени +0,5%. `syncSuspension()` показывает уведомления об остановке и возобновлении.
Оценка компании на бирже считается по `fundamentalIncome()` (без учёта остановки), чтобы она не проваливалась из-за долга.
Дома не отключаются (иначе упал бы уровень жизни и можно было бы потерять работу).

### Благотворительность (bank.js, taxes.js)
8 пожертвований (цена ×10 каждое): ставка `TAX_RATE` падает с 13% до 5%, а все счета, кроме зарплат сотрудников
(`sal`), дешевеют в `charityFactor()` = `TAX_RATE / BASE_TAX_RATE` раз. Налоги с зарплаты, бизнеса и продаж
(`job`, `biz`, `gain`) уже считаются по сниженной ставке, остальные (`prop`, `veh`, `elec`, `opx`, `rent`)
умножаются в `addTax` (список `CHARITY_FACTOR_BILLS`).

### Своя компания на бирже (market.js)
Цена = капитализация / `OWN_SHARES` (1 000 000 акций). Капитализацию двигают: рост доходов бизнесов (оценка подтягивается
постепенно), шум рынка, деньги внешних инвесторов-ботов (ежедневный приток/отток и редкие крупные сделки фондов,
`ownBotFlow`) и ваши сделки (вложенный рубль поднимает капитализацию на рубль, `OWN_IMPACT = 1`). Цена не
притягивается к оценке (иначе дыра «купил дёшево, продал дорого»), привязка только при отходе в 1,8 раза.
Крупные сделки исполняются хуже на `OWN_SLIPPAGE × доля`, больше 100% акций купить нельзя. Внешние акционеры получают
дивиденды: их доля × 50% дохода бизнесов (`dividendDay`). Все константы и пояснение лежат над `ownCompanyFairPrice`.

## 3. Как добавить...

- **Профессию:** строка в `JOBS` (в конец), значение в `JOB_PRESTIGE` (в конец), цена курса в `COURSE_PRICE[i]` (если
  `JOBS[i][3] > 0` дней обучения), при необходимости `JOB_MIN_HOME[i]` (индекс в `HOMES`). Порядок на экране — по зарплате.
- **Бизнес:** строка в `BUSINESSES` (в конец; поля: название, цена лицензии, описание, подпись кнопки точки, цена точки,
  доход точки в день, расходы точки в месяц, максимум точек, 3 улучшения `[название, цена, +доля, текст]`, название
  происшествия) и значение в `EMPLOYEE_SALARY` (в конец). По желанию: `BUSINESS_DIPLOMA[i]` (нужный курс),
  `TECH_FOR_BUSINESS[i]` (технология +20%). `state.B` дополняется автоматически. Ориентир: чистая прибыль точки за месяц
  примерно цена точки / 8. **Убирая бизнес, поднимите `SAVE_VERSION` и напишите миграцию с возвратом вложений** (см. `migrateBusinesses`).
- **Технологию:** строка в `TECH` (в конец: название, цена, дней, шанс успеха, описание), связь с бизнесом в
  `TECH_FOR_BUSINESS` и `TECH_NEEDS_BUSINESS`. `state.tech.d` дополняется автоматически.
- **Машину:** строка в `CARS` (в конец), на экране встанет по цене.
- **Дом:** вставьте в `HOMES` по цене, поправьте `HOME_PRESTIGE` и значения `JOB_MIN_HOME`, поднимите `SAVE_VERSION`
  и допишите миграцию. Если добавляете дороже всех в конец, миграция не нужна.
- **Событие:** объект в `RANDOM_EVENTS`; поля описаны над таблицей (деньги, настроение, пауза, условия, сезон).
- **Услугу в медицине:** строка в `MED` (в конец), условие и эффект в `medicineAction`, кнопка в `medView`.
- **Вкладку:** имя в нужный раздел `NAV_GROUPS`, иконка в `TAB_ICON`, функция экрана в `TAB_VIEWS`.
- **Кнопку:** `data-xxx` в HTML и строка в `CLICK_ACTIONS`.
- **Регулярный платёж:** ключ в `BILL_NAMES`, порядок в `AUTOPAY_ORDER`, начисление в `monthEnd`/`*Month`;
  решите, дешевеет ли он от благотворительности (`CHARITY_FACTOR_BILLS`).

## 4. Грабли
- Индексы `HOMES` связаны с `JOB_MIN_HOME`, `HOME_PRESTIGE` и миграцией в `migrateHomes`.
- `TAX_RATE`, `DEPOSIT_LIMIT`, `DEPOSIT_RATE` — глобальные переменные, которые пересчитывает `render()`
  (и `charity()`). Читать можно везде, но актуальны они только после `render()`.
- Зарплата смазчика фермы входит в общий счёт зарплат (`estimatedSalaries`).
- Тестам, которые проверяют доход бизнесов, машин или фермы, нужны оплаченные счета: после просрочки имущество стоит.
- После правок: `node tools/smoke-test.js` и `node tools/fuzz-test.js`.

## 5. Что нового

### 1.1.3
- **Биржа, своя компания:** дыра «купил дёшево, продал дорого» закрыта. Цена = капитализация / акции, её двигают рост бизнеса,
  деньги ботов-инвесторов (приток/отток, крупные сделки фондов) и ваши сделки; крупные сделки двигают цену и исполняются хуже;
  внешние акционеры получают дивиденды; больше 100% акций купить нельзя.
- **Удалены бизнесы** «Торговый центр» и «Рекламное агентство». В старых сохранениях вложения возвращаются деньгами,
  остальные бизнесы сохраняют данные.
- **Деньги:** короткая запись до «кккккк» (10^18).
- **Следующий день:** пауза 250 мс между нажатиями (кнопка и клавиши).
- **Ферма:** порядок «стойка, охлаждение, смазка, видеокарты», затем «Особые улучшения» (смазчик, водяное охлаждение).
- **Налоги:** имущество больше не отбирают; при просрочке 7+ дней бизнесы, ферма и машины не работают, после оплаты всё возвращается.
- **Банк разбит на вкладки** «Банк», «Счета», «Благотворительность». Благотворительность удешевляет все счета, кроме зарплат сотрудников.
- **Исправлено:** покупка максимальных улучшений вклада и заточка по устаревшей кнопке больше не портят баланс и карты.

### 1.1.2
- Навигация из 5 разделов, горячие клавиши, смазчик и «Заточить все», график доходов и расходов, +12 событий,
  +6 профессий, +5 бизнесов, +5 технологий, +5 машин, +4 дома, полный имплант зубов, лоск интерфейса.

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
| `hPrice` | `homePrice` |
| `avgDaily` | `averageDailyIncome` |
| `salEst` | `estimatedSalaries` |
| `opxEst` | `estimatedOperatingCosts` |
| `apAct` | `autoPayAction` |
| `setAct` | `settingsAction` |
| `setView` | `settingsView` |
| `carAct` | `carAction` |
| `homeAct` | `homeAction` |
