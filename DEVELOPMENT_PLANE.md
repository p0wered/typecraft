# TypeCraft — Development Plan

> Веб-сервис для практики быстрой печати и печати вслепую

---

## Стек технологий

### Frontend

| Технология | Назначение |
|---|---|
| React 19 + TypeScript | UI-фреймворк |
| Vite | Сборка и dev-сервер |
| CSS Modules | Стилизация (изолированные стили) |
| React Router v7 | Маршрутизация |
| Zustand | Стейт-менеджмент |
| Recharts | Графики статистики |

### Backend

| Технология | Назначение |
|---|---|
| Node.js + Express + TypeScript | HTTP-сервер и API |
| Drizzle ORM | TypeScript-native ORM для SQLite |
| better-sqlite3 | Драйвер SQLite |
| jsonwebtoken + bcryptjs | JWT-аутентификация |
| zod | Валидация запросов |

### Инструменты

| Технология | Назначение |
|---|---|
| npm workspaces | Управление монорепо |
| ESLint + Prettier | Линтинг и форматирование |
| Vitest | Тестирование |
| concurrently | Параллельный запуск frontend + backend |

---

## Структура монорепозитория

```
typecraft/
├── frontend/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # UI-компоненты
│   │   │   ├── typing/        # TypingArea, Word, Caret, Timer, Results
│   │   │   ├── layout/        # Header, Footer, Sidebar
│   │   │   ├── profile/       # ProfileCard, StatsChart, History
│   │   │   └── ui/            # Button, Modal, Select, Toggle (общие)
│   │   ├── pages/             # Страницы (Home, Profile, Settings, Login)
│   │   ├── hooks/             # Кастомные хуки (useTyping, useTimer, useAuth)
│   │   ├── store/             # Zustand-сторы (typingStore, authStore, settingsStore)
│   │   ├── services/          # API-клиент (api.ts, authService, statsService)
│   │   ├── types/             # TypeScript-типы
│   │   ├── utils/             # Утилиты (wpm-калькулятор, генераторы текста)
│   │   ├── data/              # Словари слов, цитаты, код-сниппеты (JSON)
│   │   ├── styles/            # Глобальные стили, темы, CSS-переменные
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                   # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── routes/            # Express-роуты (auth, users, results, settings)
│   │   ├── controllers/       # Логика обработки запросов
│   │   ├── middleware/         # auth middleware, error handler, validation
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle-схема (users, results, settings)
│   │   │   └── migrations/    # Миграции
│   │   ├── services/          # Бизнес-логика (statsService, userService)
│   │   └── utils/             # Хелперы (jwt, password hashing)
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   └── package.json
├── shared/                    # Общие типы frontend ↔ backend
│   ├── types.ts
│   └── package.json
├── DEVELOPMENT_PLANE.md       # Этот документ
├── README.md
└── package.json               # Root: npm workspaces config
```

---

## Схема базы данных (SQLite + Drizzle)

### Таблица `users`

| Поле | Тип | Описание |
|---|---|---|
| id | INTEGER (PK) | Автоинкремент |
| username | TEXT (UNIQUE) | Имя пользователя |
| email | TEXT (UNIQUE) | Email |
| password_hash | TEXT | Хеш пароля (bcrypt) |
| created_at | TEXT | Дата создания (ISO 8601) |
| updated_at | TEXT | Дата обновления (ISO 8601) |

### Таблица `results`

| Поле | Тип | Описание |
|---|---|---|
| id | INTEGER (PK) | Автоинкремент |
| user_id | INTEGER (FK → users) | Ссылка на пользователя |
| mode | TEXT | Режим: "words" / "time" / "quote" / "code" |
| mode_value | TEXT | Параметр режима (кол-во слов, секунды, id цитаты, язык кода) |
| language | TEXT | Язык текста (en, ru, javascript, python и т.д.) |
| wpm | REAL | Слов в минуту |
| raw_wpm | REAL | Сырой WPM (без учёта ошибок) |
| accuracy | REAL | Точность (%) |
| consistency | REAL | Консистентность (%) |
| correct_chars | INTEGER | Правильных символов |
| incorrect_chars | INTEGER | Неправильных символов |
| extra_chars | INTEGER | Лишних символов |
| missed_chars | INTEGER | Пропущенных символов |
| test_duration_sec | INTEGER | Длительность теста (сек) |
| created_at | TEXT | Дата прохождения (ISO 8601) |

### Таблица `user_settings`

| Поле | Тип | Описание |
|---|---|---|
| id | INTEGER (PK) | Автоинкремент |
| user_id | INTEGER (FK → users, UNIQUE) | Ссылка на пользователя |
| theme | TEXT | Тема: "dark" / "light" |
| language | TEXT | Язык интерфейса: "ru" / "en" |
| font_size | INTEGER | Размер шрифта (px) |
| smooth_caret | INTEGER | Плавная каретка: 0/1 |
| sound_enabled | INTEGER | Звук: 0/1 |
| custom_config | TEXT | JSON с дополнительными настройками |

### Связи

- `users` 1 → N `results` (у пользователя много результатов)
- `users` 1 → 1 `user_settings` (у пользователя одна запись настроек)

---

## Режимы печати

### 1. Words (по количеству слов)

- Генерация случайных слов из словаря выбранного языка
- Варианты: 10 / 25 / 50 / 100 слов
- Источники: JSON-словари для каждого языка (en, ru и др.)

### 2. Time (на время)

- Бесконечная генерация слов, таймер обратного отсчёта
- Варианты: 15 / 30 / 60 / 120 секунд

### 3. Quote (цитаты)

- Печать готовых цитат разной длины (short / medium / long)
- Источник: JSON-коллекция цитат

### 4. Code (фрагменты кода)

- Фрагменты кода на выбранном языке программирования
- Поддерживаемые языки: JavaScript, TypeScript, Python, Go, Rust, Java, C++
- Корректная обработка отступов, спецсимволов, многострочности
- Источник: курированная коллекция сниппетов в JSON

---

## Ключевые компоненты фронтенда

### TypingArea — ядро сервиса

- Отображение текста для печати (посимвольная подсветка: correct / incorrect / current / upcoming)
- Анимированная каретка (smooth caret опционально)
- Live-отображение WPM, accuracy, таймера
- Обработка ввода с клавиатуры через `onKeyDown` (без `<input>`, прямой перехват нажатий)
- Адаптация для кода: моноширинный шрифт, сохранение отступов

### Результаты теста

- WPM, raw WPM, accuracy, consistency
- График WPM по секундам (Recharts)
- Breakdown по символам: correct / incorrect / extra / missed
- Кнопки: "Next test", "Repeat"

### Профиль пользователя

- Личные рекорды по каждому режиму
- Графики прогресса (WPM за последние N тестов, по дням)
- История тестов с фильтрацией
- Общая статистика: среднее WPM, средняя accuracy, количество тестов

### Настройки

- Тема: dark / light (CSS-переменные)
- Язык интерфейса: русский / английский
- Язык текста для печати
- Размер шрифта
- Smooth caret: вкл/выкл
- Звуковые эффекты: вкл/выкл

---

## API-эндпоинты (REST)

### Auth

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация нового пользователя |
| POST | `/api/auth/login` | Логин (возвращает JWT) |
| GET | `/api/auth/me` | Получить текущего пользователя по токену |

### Results

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/results` | Сохранить результат теста |
| GET | `/api/results` | История тестов (пагинация + фильтры) |
| GET | `/api/results/stats` | Агрегированная статистика |
| GET | `/api/results/personal-best` | Личные рекорды по режимам |

### Settings

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/settings` | Получить настройки пользователя |
| PUT | `/api/settings` | Обновить настройки |

### Content

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/words/:language` | Получить набор слов для языка |
| GET | `/api/quotes` | Получить случайную цитату |
| GET | `/api/snippets/:language` | Получить код-сниппет для ЯП |

---

## Этапы разработки

### Фаза 1: Инфраструктура и скелет

- [ ] Инициализация монорепо (npm workspaces)
- [ ] Настройка Vite + React + TypeScript (frontend)
- [ ] Настройка Express + TypeScript (backend)
- [ ] Общие типы (shared/)
- [ ] Настройка ESLint, Prettier, Vitest
- [ ] Базовый layout: Header + роутинг страниц

### Фаза 2: Ядро — механика печати

- [ ] Компонент TypingArea (посимвольный ввод, подсветка)
- [ ] Хук useTyping (логика ввода, сравнение, статистика в реальном времени)
- [ ] Режим Words (генерация слов, подсчёт WPM/accuracy)
- [ ] Режим Time (таймер обратного отсчёта)
- [ ] Экран результатов с базовой статистикой
- [ ] Хранение настроек и результатов в Zustand + localStorage (пока без бэка)

### Фаза 3: Бэкенд и аутентификация

- [ ] Схема БД (Drizzle + SQLite)
- [ ] Auth-эндпоинты (register, login, JWT)
- [ ] CRUD для результатов
- [ ] API для настроек
- [ ] Интеграция фронта с API

### Фаза 4: Режимы Quote и Code

- [ ] Коллекция цитат (JSON)
- [ ] Коллекция код-сниппетов по языкам (JSON)
- [ ] Адаптация TypingArea для многострочного кода
- [ ] UI выбора языка программирования

### Фаза 5: Профиль и статистика

- [ ] Страница профиля
- [ ] Графики прогресса (Recharts)
- [ ] История тестов с фильтрацией
- [ ] Личные рекорды

### Фаза 6: Темы и настройки

- [ ] Система тем (CSS-переменные, dark/light)
- [ ] Страница настроек
- [ ] Локализация интерфейса (i18n: ru/en)
- [ ] Smooth caret, звуковые эффекты

### Фаза 7: Полировка

- [ ] Адаптивная вёрстка (mobile-friendly)
- [ ] Анимации и микровзаимодействия
- [ ] Оптимизация производительности
- [ ] Тесты (Vitest)
