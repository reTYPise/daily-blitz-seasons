# daily-blitz-seasons

Тренажёр кварталов и сезонов с дашбордом прогресса. Статический сайт на GitHub Pages.

**Сайт:** https://retypise.github.io/daily-blitz-seasons/

## Структура

| Файл | Назначение |
|------|------------|
| `index.html` | Разметка: дашборд, игра, экран счёта |
| `css/styles.css` | Стили, mobile-first, ширина до 1240px |
| `js/app.js` | Игра, вопросы, UI |
| `js/db.js` | SQLite (sql.js) → `localStorage` |
| `js/vendor/` | sql-wasm.js + sql-wasm.wasm |
| `agents.md` | Контекст для AI-агентов |

База создаётся в браузере каждого пользователя (ключ `daily-blitz-seasons-sqlite-v1`). Сервер не нужен.

## Локальный запуск

```bash
npx serve -l 3000
```

## GitHub Pages

1. **Settings → Pages → Source:** GitHub Actions (или branch `main`, folder `/`)
2. Пуш в `main` — workflow `.github/workflows/pages.yml` публикует сайт

URL: `https://<username>.github.io/daily-blitz-seasons/`

## Для разработчиков / AI

См. [`agents.md`](agents.md) — архитектура, QA-процесс, падежи в вопросах, что не коммитить.