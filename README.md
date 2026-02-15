# maze-ai-projects

## Game launcher

A root launcher is available to run any game from this repository without typing folder names manually.

### Requirements

- `node` and `npm`
- `make`

### Commands

- `make games` - show the numbered list of available games.
- `make game` - open interactive selection, choose a game by number, then start it.
- `make game GAME=1` - skip selection and run game #1.
- `make game GAME=copilot-gemini-3` - skip selection and run game by folder name.
- `make game GAME_ARGS="--open=false"` - pass extra Vite dev args (e.g., disable auto-opening browser).

### Runtime behavior

- After selecting a game, the launcher prints the game URL: `http://127.0.0.1:3000`.
- All games run on a fixed port: `3000`.
- If port `3000` is busy, startup fails (strict port mode).
- The game runs in foreground (not daemonized).
- Stop the running game with `Ctrl+C`.

## Игры в репозитории

Все проекты — клиентские игры-лабиринты (TypeScript + Vite + Canvas), но каждая папка содержит отдельную реализацию.

| Папка | Название игры | Краткий функционал | Чем отличается |
| --- | --- | --- | --- |
| `claude-sonnet-4.5` | Maze Runner - Escape the Labyrinth | Процедурная генерация, прогрессия уровней, управление на ПК/мобайле, сохранение прогресса | Акцент на кроссплатформенный UX: звук + вибрация, performance/debug overlay, HiDPI и offscreen-рендер |
| `codex-gpt-5.1-codex-max-xhigh` | Maze Sprint | Генерация лабиринтов по seed, рост сложности, управление на ПК/мобайле, пауза/результаты/прогресс | Явная воспроизводимость через `?seed=...`, подробный QA-чеклист в README |
| `codex-gpt-5.2-codex-xhigh` | Maze Drift | Классический прогрессивный лабиринт с desktop/mobile управлением и debug-режимом | Более компактная реализация и документация; debug включается через URL или `localStorage['maze-debug']=1` |
| `codex-gpt-5.3-codex-xhigh` | Maze Runner | Случайные лабиринты, рост сложности, настройки/debug overlay, `localStorage` | Более структурированный движок + отдельный `test:run` и QA test plan |
| `copilot-gemini-3` | Maze Runner | Процедурная генерация, бесконечные уровни, адаптивное управление, оффлайн-режим | Реализация на чистом Canvas API без лишних зависимостей, фокус на производительности и простоте |
| `copilot-gpt-5.3-codex` | Maze Runner | Генерация по seed, несколько режимов ввода, пауза/рестарт, сохранение прогресса | Отмечены петли/комнаты на высоких уровнях и anti-tunneling коллизии |
| `copilot-haiku-4.5` | Maze Runner - HTML5 Game | Полный цикл игры, адаптивное управление, счёт/результаты, сохранение, debug overlay | Для тестов используется `node tests/simple-test.js` (без Vitest), есть `VERIFICATION.md` |
| `copilot-opus-4.5` | Maze Game | DFS-генерация, рост сложности, keyboard/mouse/touch управление, сохранение | Подчёркнуто отсутствие runtime-зависимостей; debug overlay по `F3` |
| `copilot-opus-4.6` | Maze Runner | Полноценная игра с настройками, аудио, вибрацией, сохранением, debug overlay | Наиболее явно описана система настроек (Auto/Mouse/Keyboard/Joystick) и QA-чеклист |
| `copilot-sonnet-4.5` | Maze Game | Прогрессивная сложность, кроссплатформенное управление, `localStorage`, unit-тесты | По умолчанию dev-сервер на `http://localhost:3000`; акцент на dark theme и дополнительные петли с 12+ уровня |
| `gemini-3` | Neon Maze Escape | Кроссовер-стилистика (Heroes of Might and Magic + Pacman), процедурная генерация, анимированный персонаж | Уникальный визуальный стиль: каменные стены, пергаментный интерфейс; анимированный Pacman; высокая производительность через Offscreen Canvas |
