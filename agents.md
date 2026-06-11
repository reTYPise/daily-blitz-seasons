# agents.md — daily-blitz-seasons

Контекст для AI-агента при пустой истории чата.

## Проект

Статический веб-тренажёр **кварталов и сезонов** (без математики). Репозиторий: `reTYPise/daily-blitz-seasons`.

- **Live:** https://retypise.github.io/daily-blitz-seasons/
- **Локально:** `npx serve -l 3000` → http://localhost:3000

## Структура

```
index.html          # дашборд + game + score (экраны .screen)
css/styles.css      # mobile-first, max-width 1240px (--dash-max)
js/app.js           # логика игры, генераторы вопросов, дашборд
js/db.js            # SQLite через sql.js → localStorage
js/vendor/          # sql-wasm.js + sql-wasm.wasm
.github/workflows/pages.yml
.nojekyll
```

## База данных

- Ключ localStorage: `daily-blitz-seasons-sqlite-v1`
- Таблица `sessions`: date, trainer, game_mode, correct, wrong, answered, best_streak, elapsed_sec
- `trainer`: `seasons` | `quarters` | `mixed`
- Миграция из старых JSON-ключей в `db.js`

## Экраны

1. `#screen-menu` — дашборд (сегодня, KPI, календарь, breakdown, сессии, настройки + СТАРТ)
2. `#screen-game` — игра (sticky header, quit, справочник справа/снизу)
3. `#screen-score` — итог сессии

## Генераторы вопросов (js/app.js)

Падежи русского языка обязательны:
- «у апреля» (род.), «к зиме» (дат.), «в осень» (вин.), «В каком квартале декабрь?» (им.)

## Деплой

GitHub Pages из `main`, корень репо. В `<head>` — скрипт `APP_BASE_PATH` для подкаталога Pages.

## QA-процесс (по запросу пользователя)

Запускать **двух субагентов параллельно**:
1. **Визуал** — скриншоты 1280/768/375/320, шрифты, контраст, overflow, грамматика
2. **Кнопки** — все контролы, особенно `#quit-btn` на mobile без скролла

Отчёты → правки → повторный прогон тех же двух.

## Не коммитить

`mcps/`, `terminals/`, `qa-screenshots/`, `*.png` — в `.gitignore`.

## Связанный проект

Исходник математики: `C:\personal\development\math-blitz` — отдельный репозиторий, тот же стек UI/дашборда.