# daily-blitz-seasons

Тренажёр кварталов и сезонов с дашбордом прогресса. Полностью статический сайт — работает на бесплатном [GitHub Pages](https://pages.github.com/).

**Сайт:** https://retypise.github.io/daily-blitz-seasons/

## Как это устроено

| Что | Где |
|-----|-----|
| Страница | `index.html` в корне репозитория |
| Стили | `css/styles.css` |
| Логика | `js/app.js` |
| База данных | `js/db.js` + sql.js (`js/vendor/`) |
| Статистика | SQLite в браузере → `localStorage` (ключ `daily-blitz-seasons-sqlite-v1`) |

Отдельный сервер и файла БД на диске не нужны: база создаётся автоматически при первом открытии сайта у каждого пользователя в его браузере.

## Бесплатный хостинг на GitHub Pages

### Вариант A — через Actions (рекомендуется)

1. Запушьте репозиторий на GitHub.
2. **Settings → Pages → Build and deployment**
3. **Source:** `GitHub Actions`
4. При пуше в `main` workflow `.github/workflows/pages.yml` сам опубликует сайт.

### Вариант B — напрямую из ветки

1. **Settings → Pages**
2. **Source:** `Deploy from a branch`
3. **Branch:** `main` → папка `/ (root)`
4. Сохранить — через 1–2 минуты сайт будет доступен.

### URL сайта

Для репозитория `username/daily-blitz-seasons`:

```
https://username.github.io/daily-blitz-seasons/
```

## Локальный запуск

```bash
npx serve -l 3000
```

Откройте http://localhost:3000

## Файлы для деплоя

В репозитории должны быть (уже включены):

```
index.html
css/styles.css
js/app.js
js/db.js
js/vendor/sql-wasm.js
js/vendor/sql-wasm.wasm   ← обязателен для SQLite
.nojekyll                 ← чтобы GitHub не ломал wasm
```

## Лицензия

Проект для личного использования.