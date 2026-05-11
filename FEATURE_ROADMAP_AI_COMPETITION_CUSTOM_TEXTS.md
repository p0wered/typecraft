# Roadmap: Adaptive AI, Custom Texts, Weekly Leaderboards

Документ описывает подробный план развития TypeCraft вокруг трёх направлений:

1. Импорт и тренировка на своих текстах.
2. Еженедельные лидерборды.
3. Адаптивная сложность с использованием ИИ.

Отложенные идеи вроде лиг, сезонов, друзей, стран и командных челленджей в этот план не входят. `Ghost race` оставлен как низкоприоритетное будущее расширение, потому что он хорошо ложится на данные лидербордов, но не нужен для MVP.

Обновление приоритета: после фаз 1-3 сначала выполняется adaptive/AI-track, а weekly leaderboards переносятся после AI-функций как менее приоритетное направление.

## Статус и актуальный порядок

1. ✅ Фаза 1: подготовка модели данных.
2. ✅ Фаза 2: custom texts MVP.
3. ✅ Фаза 3: custom texts UX и file import.
4. ✅ Фаза 4: adaptive recommendation foundation с локальным fallback.
5. ✅ Фаза 5: structured AI recommendations через AI provider abstraction.
6. ✅ Фаза 6: AI-generated adaptive tests.
7. ⬜ Фаза 7: адаптация imported/custom texts через AI.
8. ⬜ Фаза 8: weekly leaderboards MVP.
9. ⬜ Фаза 9: weekly leaderboards integration.
10. ⬜ Фаза 10: ghost race как низкоприоритетное future-направление.

---

## Цели

### Пользовательские цели

- Пользователь может тренироваться на своих материалах: статьи, README, заметки, код, документация.
- Пользователь видит честную недельную конкуренцию по сравнимым категориям.
- Пользователь получает следующий тест, который подстраивается под его уровень и слабые места.
- Пользователь понимает, почему ему предлагается конкретная тренировка.

### Продуктовые цели

- Увеличить удержание за счёт персональных тренировок.
- Добавить соревновательную мотивацию без сложной социальной системы.
- Подготовить основу для AI-тренера и ghost race без преждевременного усложнения.

### Технические цели

- Не ломать существующие режимы `words`, `time`, `quote`, `code`.
- Расширять API и БД постепенно.
- Сохранять fallback без ИИ, чтобы основные сценарии работали при недоступности AI API.
- Делать AI-ответы структурированными и валидируемыми.

---

## Основные концепции

### Custom Text

Пользовательский материал для тренировки.

Типы:

- `text`: обычный текст, заметка, статья, цитата, README.
- `code`: код с сохранением переносов строк, отступов и пробелов.

Поля:

- `title`
- `content`
- `contentType`
- `language`
- `isPublic`
- `createdAt`
- `updatedAt`

### Weekly Leaderboard

Рейтинг лучших результатов за текущую неделю в конкретной категории.

Категория должна включать:

- `mode`
- `modeValue`
- `language`
- опционально `contentType`

Пример:

- `time / 60 / en`
- `words / 50 / ru`
- `code / typescript`
- `custom / text / en`

### Adaptive Recommendation

Рекомендация следующего теста на основе результатов пользователя.

Рекомендация должна объяснять:

- какой режим запустить;
- почему он выбран;
- какие слабые клавиши или паттерны тренируются;
- какая целевая сложность;
- какой ожидаемый фокус: accuracy, speed, consistency, weak keys, code punctuation.

---

## Фаза 1. Подготовка модели данных ✅

Статус: выполнено. Добавлены `custom_texts` в Drizzle schema, shared-типы для custom texts / leaderboards / adaptive recommendations, frontend API-клиенты и базовая поддержка режима `custom` в контрактах.

### Цель

Подготовить БД, типы и API-контракты для пользовательских текстов, leaderboard-выборок и будущих adaptive recommendations.

### Backend

Добавить таблицу `custom_texts`.

Поля:

- `id INTEGER PRIMARY KEY`
- `user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `content TEXT NOT NULL`
- `content_type TEXT NOT NULL`
- `language TEXT NOT NULL`
- `is_public INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL DEFAULT datetime('now')`
- `updated_at TEXT NOT NULL DEFAULT datetime('now')`

Ограничения:

- `content_type`: `text | code`
- `title`: 1-120 символов
- `content`: 20-20000 символов для MVP
- `language`: строка, совместимая с текущими языками проекта

### Shared types

Добавить:

- `CustomText`
- `CreateCustomTextRequest`
- `UpdateCustomTextRequest`
- `CustomTextsQuery`
- `LeaderboardEntry`
- `LeaderboardQuery`
- `AdaptiveRecommendation`
- `AdaptiveRecommendationRequest`

Предлагаемый `AdaptiveRecommendation`:

```ts
interface AdaptiveRecommendation {
  mode: TypingMode | "custom";
  modeValue: string;
  language: string;
  difficulty: "easy" | "normal" | "hard";
  focus: Array<
    | "accuracy"
    | "speed"
    | "consistency"
    | "weak_keys"
    | "punctuation"
    | "code_structure"
  >;
  weakKeys: string[];
  title: string;
  description: string;
  generatedContent?: string;
  customTextId?: number;
}
```

### Frontend

Подготовить сервисы:

- `customTextsApi`
- `leaderboardsApi`
- `adaptiveApi`

### Acceptance Criteria

- Есть миграция/схема для `custom_texts`.
- Shared types экспортируются из `@typecraft/shared`.
- API-клиенты добавлены, но UI может быть минимальным или отсутствовать.
- Существующая сборка и тесты проходят.

---

## Фаза 2. Импорт своих текстов: MVP ✅

Статус: выполнено. Реализованы authenticated CRUD endpoints для `custom_texts`, страница `/custom` со списком и формой, запуск custom-текста в char-based typing flow и сохранение результата как `mode = "custom"`.

### Цель

Дать пользователю возможность создать свой текст и пройти по нему тест.

### Backend API

Добавить routes:

- `POST /api/custom-texts`
- `GET /api/custom-texts`
- `GET /api/custom-texts/:id`
- `PUT /api/custom-texts/:id`
- `DELETE /api/custom-texts/:id`

Все private CRUD endpoints требуют auth.

Поведение:

- Пользователь видит только свои private тексты.
- Public-тексты можно будет использовать позже, но в MVP публичный каталог не нужен.
- `DELETE` удаляет текст пользователя.
- При попытке открыть чужой private текст возвращать `404`, не `403`.

### Frontend UI

Добавить страницу или секцию:

- `/custom`
- либо вкладку/панель на главной странице рядом с режимами.

MVP UI:

- список своих текстов;
- кнопка `new custom text`;
- форма:
  - title;
  - content;
  - content type: text/code;
  - language;
  - save;
  - start test.

### Typing mode

Лучшее долгосрочное решение: добавить режим `custom`.

Изменить:

```ts
type TypingMode = "words" | "time" | "quote" | "code" | "custom";
```

Для `custom`:

- если `contentType = text`, использовать char-based тест как quote;
- если `contentType = code`, использовать char-based тест как code;
- `modeValue` хранит `customTextId`;
- `language` хранит язык custom text.

### Result persistence

Сохранять результат как:

- `mode = "custom"`
- `modeValue = String(customTextId)`
- `language = customText.language`

Опционально позже добавить `custom_text_id` в `results`, но для MVP можно использовать `modeValue`.

### Validation

Frontend:

- title required;
- content min length;
- предупреждение для очень длинного текста;
- code mode сохраняет whitespace.

Backend:

- zod validation;
- trimming title;
- content не trim полностью, чтобы не ломать code indentation.

### Acceptance Criteria

- Пользователь может создать текст.
- Пользователь может запустить тест по своему тексту.
- Результат сохраняется в историю.
- Custom test отображается в истории профиля.
- `npm run build`, `npm run lint`, `npm run test` проходят.

---

## Фаза 3. Импорт своих текстов: улучшение UX ✅

Статус: выполнено. Добавлены фильтр `text/code`, сортировка по последнему запуску / обновлению / названию, быстрый запуск последнего текста, duplicate, character count, примерная длительность и frontend-only импорт файлов с определением типа и языка.

### Цель

Сделать custom texts удобными, но не перегрузить проект.

### Улучшения

- Поиск по title.
- Фильтр `text/code`.
- Last used сортировка.
- Duplicate text.
- Character count и примерная длительность.
- Быстрый запуск последнего custom text.

### File Import

Добавить импорт файлов:

- `.txt`
- `.md`
- `.js`
- `.ts`
- `.tsx`
- `.py`
- `.go`
- `.rs`
- `.json`

Frontend-only MVP:

- использовать `<input type="file">`;
- читать файл через `FileReader`;
- автоматически определить `contentType` и `language` по extension;
- пользователь подтверждает сохранение.

### Acceptance Criteria

- Можно вставить текст вручную.
- Можно импортировать файл.
- Для кода сохраняются переносы и отступы.
- Большие файлы ограничиваются понятной ошибкой.

---

## Фаза 8. Weekly Leaderboards: MVP ⬜

Статус: не выполнено. Перенесено после AI/adaptive-фаз как менее приоритетное направление.

### Цель

Добавить честные недельные рейтинги по сравнимым категориям.

### Scoring

Для MVP использовать score:

```ts
score = wpm * (accuracy / 100) ** 2;
```

Причины:

- WPM остаётся основной метрикой.
- Accuracy сильно влияет на итог.
- Грязные попытки не должны побеждать.

Минимальный порог:

- `accuracy >= 90`
- `testDurationSec >= 10`

Можно показывать raw `wpm` и `accuracy`, но сортировать по `score`.

### Backend API

Добавить:

- `GET /api/leaderboards/weekly`

Query:

- `mode`
- `modeValue`
- `language`
- `limit`

Пример:

```txt
GET /api/leaderboards/weekly?mode=time&modeValue=60&language=en&limit=50
```

Ответ:

```ts
interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  mode: TypingMode;
  modeValue: string;
  language: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  score: number;
  createdAt: string;
}
```

### SQL logic

Для каждого пользователя брать лучший результат недели в категории.

Сначала можно сделать простой запрос:

- join `results` + `users`;
- фильтр по неделе;
- фильтр по category;
- вычисление score;
- сортировка по score desc;
- limit.

Если у пользователя несколько результатов, в leaderboard должен попадать только лучший.

### Week boundary

MVP:

- использовать UTC-неделю;
- старт недели: Monday 00:00 UTC.

Позже можно добавить timezone, но сейчас не нужно.

### Frontend UI

Добавить страницу:

- `/leaderboards`

Навигация:

- добавить пункт `leaderboards` в header.

UI:

- category picker:
  - mode;
  - mode value;
  - language;
- leaderboard table:
  - rank;
  - username;
  - score;
  - wpm;
  - accuracy;
  - consistency;
  - date.

Empty state:

- “No results this week yet.”

### Anti-abuse MVP

Без сложной античит-системы, но добавить минимальные ограничения:

- не включать результаты с accuracy ниже порога;
- не включать слишком короткие тесты;
- не включать custom texts в основной leaderboard, если тексты разные.

Важно:

- custom leaderboard можно сделать позже отдельной категорией только для одинакового `customTextId`.

### Acceptance Criteria

- Есть weekly leaderboard по category.
- В рейтинг попадает лучший результат пользователя за неделю.
- Рейтинг сортируется по score.
- UI показывает leaderboard и пустое состояние.
- Existing results page/history не ломаются.

---

## Фаза 9. Weekly Leaderboards: интеграция в мотивацию ⬜

Статус: не выполнено. Делать после MVP лидербордов.

### Цель

Сделать лидерборды видимыми и полезными без добавления сезонов, друзей и социальных систем.

### Улучшения

- После теста показывать:
  - “This result would rank #N this week”
  - или “You need +4 WPM to enter top 10”
- На профиле добавить карточку:
  - best weekly rank;
  - best category;
  - current week best score.

### Backend helper endpoint

Опционально:

- `GET /api/leaderboards/weekly/me?mode=...`

Ответ:

- current user best entry;
- rank;
- next rank delta.

### Acceptance Criteria

- Пользователь видит связь между тестом и рейтингом.
- После результата есть CTA перейти к leaderboard.
- Нет дополнительных социальных механик.

---

## Фаза 4. Adaptive Difficulty: локальный MVP без ИИ ✅

Статус: выполнено как первая фаза AI/adaptive-трека. Добавлен `POST /api/adaptive/recommendation`, локальная fallback-логика рекомендаций, карточка `recommended next test` после результата и запуск рекомендованного теста из UI.

### Цель

Сначала сделать адаптивность через локальную аналитику, чтобы фича работала стабильно и без внешнего API.

### Input data

Использовать:

- последний результат;
- `keyMistakes` из heatmap;
- `wpm`
- `accuracy`
- `consistency`
- `mode`
- `language`
- последние N результатов из history.

### Recommendation rules

Пример правил:

1. Если `accuracy < 92`:
   - focus: `accuracy`;
   - снизить сложность;
   - уменьшить длину;
   - предложить weak keys practice.

2. Если `accuracy >= 97` и `consistency >= 85`:
   - focus: `speed`;
   - немного повысить длину или duration.

3. Если есть `keyMistakes`:
   - focus: `weak_keys`;
   - сгенерировать words-тренировку с повышенной частотой этих клавиш.

4. Если mode `code` и много ошибок на `{}`, `()`, `;`, `enter`, `tab`:
   - focus: `punctuation` или `code_structure`;
   - предложить code snippet.

### Local content generation

Для `words`:

- использовать существующий словарь;
- выбирать слова, содержащие weak keys;
- смешивать с обычными словами;
- не делать текст неестественным.

Для `quote/code`:

- в MVP можно не генерировать новый контент;
- только рекомендовать режим и параметры.

### UI

На экране результата добавить блок:

- `Recommended next test`
- title;
- explanation;
- focus tags;
- button `start recommended test`.

### State changes

Нужно уметь программно запускать рекомендованный тест:

- установить `mode`;
- установить `modeValue`;
- установить `typingLanguage`;
- если это generated/custom content, передать target content.

Для первого MVP лучше начать с режимов, которые уже есть:

- `words`
- `time`
- `code`
- `quote`

### Acceptance Criteria

- После теста появляется рекомендация.
- Рекомендация объясняет причину.
- Можно запустить следующий рекомендованный тест.
- Фича работает без AI API.

---

## Фаза 5. Adaptive AI: структурированные рекомендации ✅

Статус: выполнено. Добавлен backend AI provider abstraction для structured recommendations, OpenAI-compatible вызов, zod-валидация ответа и fallback на локальную рекомендацию при отсутствии конфигурации, ошибке провайдера или невалидном JSON.

### Цель

Подключить ИИ для более качественного выбора сложности и объяснений, но оставить локальный fallback.

### AI input

Отправлять только нужный минимум:

```ts
interface AdaptiveRecommendationRequest {
  recentResults: Array<{
    mode: TypingMode;
    modeValue: string;
    language: string;
    wpm: number;
    accuracy: number;
    consistency: number;
    keyMistakes?: Record<string, number>;
    createdAt: string;
  }>;
  currentSettings: {
    preferredLanguage: string;
    fontSize: number;
  };
  availableModes: TypingMode[];
}
```

Не отправлять:

- email;
- password;
- JWT;
- лишний profile data.

### AI output

Только JSON, валидируемый zod:

```ts
interface AIAdaptiveResponse {
  mode: TypingMode | "custom";
  modeValue: string;
  language: string;
  difficulty: "easy" | "normal" | "hard";
  focus: string[];
  weakKeys: string[];
  title: string;
  description: string;
  generatedContent?: string;
}
```

### Backend endpoint

Добавить:

- `POST /api/adaptive/recommendation`

Поведение:

1. Собрать recent results пользователя.
2. Построить локальный summary.
3. Вызвать AI provider.
4. Провалидировать JSON.
5. Если AI недоступен или ответ невалидный, вернуть local fallback.

### AI provider abstraction

Добавить слой:

- `aiProvider.generateAdaptiveRecommendation(input)`

Чтобы не привязывать код к конкретному провайдеру.

Environment:

- `AI_BASE_URL` (опционально, по умолчанию OpenAI-compatible `/v1/chat/completions`)
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL`

### Prompt principles

Prompt должен требовать:

- вернуть только JSON;
- не генерировать слишком длинный текст;
- учитывать weak keys;
- не предлагать слишком резкий скачок сложности;
- объяснять рекомендацию коротко.

### Acceptance Criteria

- Endpoint возвращает рекомендацию.
- Ответ всегда валиден по schema.
- При ошибке AI возвращается fallback.
- На frontend нет знания о конкретном AI provider.

---

## Фаза 6. AI-generated Adaptive Tests ✅

Статус: выполнено. Расширены AI prompt и клиентский цикл: `generatedContent` с препросмотром, запуск упражнения как ephemeral custom текст, сохранение в custom texts для авторизованных пользователей, regenerate через `regenerateFromContent`, при отсутствии ИИ — прежний локальный fallback без сгенерированного текста.

### Цель

ИИ не только выбирает режим, но и генерирует контент под слабые места пользователя.

### Scenarios

1. Weak keys text:
   - пользователь ошибается на `r`, `t`, `y`;
   - AI генерирует короткий текст с повышенной частотой этих букв.

2. Code punctuation:
   - пользователь ошибается на `{`, `}`, `(`, `)`, `;`;
   - AI генерирует короткий code snippet.

3. Imported text adaptation:
   - пользователь импортировал README;
   - AI делает тренировочный фрагмент на 60 секунд.

### Constraints

- Максимальная длина generated content.
- Запрет небезопасного или токсичного контента.
- Для code snippets не нужно выполнять код.
- Для copyrighted text не нужно генерировать длинные похожие копии.

### Storage

AI-generated content можно:

- не сохранять в БД в MVP;
- хранить временно в client state;
- позже сохранять как `custom_texts` с флагом `source = ai`.

### UI

В recommendation card:

- preview generated content;
- regenerate;
- start;
- save as custom text.

### Acceptance Criteria

- AI может сгенерировать короткий typing challenge.
- Пользователь может сразу начать тест.
- Пользователь может сохранить challenge как custom text.
- Есть fallback на local recommendation.

---

## Фаза 7. Связка Custom Texts + Adaptive AI ⬜

Статус: не выполнено. Делать после AI-generated adaptive tests.

### Цель

Сделать импортированные тексты частью адаптивной системы.

### Features

- “Practice this text adaptively”
- “Simplify this text”
- “Make this harder”
- “Extract a 60-second challenge”
- “Focus on my weak keys inside this text”
- “Turn this code into a typing drill”

### Backend

Endpoint:

- `POST /api/custom-texts/:id/adapt`

Request:

```ts
interface AdaptCustomTextRequest {
  goal: "simplify" | "harder" | "weak_keys" | "short_challenge";
  targetDurationSec?: number;
}
```

Response:

- generated content;
- explanation;
- weak keys used;
- difficulty.

### Acceptance Criteria

- Пользователь может импортировать текст.
- Пользователь может попросить адаптивную тренировку по этому тексту.
- AI-generated variant можно пройти как тест.
- Variant можно сохранить.

---

## Фаза 10. Future: Ghost Race

### Приоритет

Низкий. Не делать до custom texts, weekly leaderboards и adaptive recommendations.

### Почему оставить в планах

Ghost race хорошо использует:

- leaderboard entries;
- personal bests;
- progress history.

### MVP идея

Пользователь запускает тест против ghost результата:

- своего personal best;
- результата из weekly leaderboard.

На экране печати показывать:

- ghost progress line;
- delta: `+2.3s` / `-1.1s`;
- итог: won/lost vs ghost.

### Что нужно для реализации

Нужно хранить replay data:

- timestamped progress samples;
- WPM samples;
- typed progress over time.

Сейчас `wpmHistory` хранится только локально после теста и не сохраняется в backend. Для ghost race нужно расширить `results`.

### Почему не сейчас

- Усложняет storage.
- Требует новых визуальных элементов во время typing.
- Не нужен для MVP конкурентности, потому что weekly leaderboard проще и полезнее.

---

## Рекомендуемый порядок разработки

### Milestone A: Custom Texts

1. Фаза 1: модель данных и типы.
2. Фаза 2: CRUD + запуск custom test.
3. Фаза 3: UX и file import.

Результат:

- пользователь может тренироваться на своих материалах;
- появляется база для AI adaptation.

### Milestone B: Adaptive Difficulty / AI

1. Фаза 4: local adaptive recommendations.
2. Фаза 5: AI recommendations.
3. Фаза 6: AI-generated tests.
4. Фаза 7: custom text adaptation.

Результат:

- проект становится персональным тренажёром;
- AI используется не как украшение, а как часть core loop.

### Milestone C: Weekly Leaderboards

1. Фаза 8: leaderboard MVP.
2. Фаза 9: интеграция с результатами и профилем.

Результат:

- появляется соревновательная мотивация;
- результаты становятся сравнимыми и честными.

---

## MVP границы

### Входит в MVP

- Custom texts CRUD.
- Запуск custom text test.
- Weekly leaderboard по category.
- Score с учётом accuracy.
- Local adaptive recommendation.
- AI recommendation с fallback.

### Не входит в MVP

- Лиги.
- Сезоны.
- Friends.
- Teams.
- Countries.
- Chat/social features.
- Public custom text marketplace.
- Ghost race implementation.
- Anti-cheat beyond simple result filters.

---

## Риски и решения

### Риск: AI генерирует плохой или слишком сложный текст

Решение:

- строгая zod-схема;
- max length;
- fallback;
- preview перед стартом;
- regenerate.

### Риск: leaderboard мотивирует печатать грязно

Решение:

- score штрафует низкую accuracy;
- minimum accuracy threshold;
- показывать WPM и accuracy рядом.

### Риск: custom texts ломают сравнимость leaderboard

Решение:

- не смешивать custom texts с общим leaderboard;
- custom leaderboard только по одному `customTextId`, если понадобится позже.

### Риск: слишком большой scope

Решение:

- сначала custom texts;
- потом leaderboard;
- только после этого AI;
- ghost race не делать до готовности leaderboard data model.

---

## Первые конкретные задачи

1. Добавить `TypingMode = "custom"`.
2. Добавить таблицу `custom_texts`.
3. Добавить shared types для custom texts.
4. Реализовать `customTextsApi`.
5. Сделать `/custom` page.
6. Подключить custom text к char-based typing flow.
7. Сохранять custom results.
8. Добавить Vitest-тесты для validation/helpers.
9. После этого перейти к weekly leaderboard endpoint.
