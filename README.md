# maze-ai-projects

Единая AI-витрина для 13 игр-лабиринтов, собранных разными программами и моделями.  
Одна страница показывает, чем отличается каждая сборка: `программа`, `модель`, `обновлено`, `запуск`.

## Что это

В репозитории собраны отдельные реализации одной и той же игры, сделанные через:
- `Claude`
- `Codex`
- `GitHub Copilot`
- `Gemini`

Поверх них сделан общий web-интерфейс в папке `showcase/`.  
Он открывает все игры из одного места и позволяет быстро сравнивать результаты разных AI-инструментов.

## Что видно в витрине

- программа, которой была собрана игра
- модель
- относительное время последнего обновления
- прямой запуск каждой игры
- фильтры по программам

По умолчанию самые свежие изменения находятся сверху.

## Быстрый запуск

Для локальной разработки витрины:

```bash
npm run dev
```

UI откроется на `http://127.0.0.1:3000`.

Если порт занят:

```bash
PORT=3001 npm run dev
```

## Production-сборка

Собрать unified site:

```bash
npm run site:build
```

Локально посмотреть готовую сборку:

```bash
npm run site:preview
```

## Docker

Весь UI и все игры собираются в одном контейнере.

```bash
make docker-build
make docker-run
```

По умолчанию контейнер поднимается на `http://127.0.0.1:3000`.

## CI/CD

В репозитории используется двухэтапный workflow, аналогичный `fidonet`:

- `pull_request` в `master`: проверка сборки через `npm run site:install` и `npm run site:build`
- `push` в `master`: после успешной проверки собирается и публикуется Docker-образ в `ghcr.io/<owner>/<repo>:latest`
- после публикации образа вызывается deployment webhook, если в GitHub Variables задан `DEPLOY_WEBHOOK_URL`

Для включения выката нужны настройки репозитория на GitHub:

- `Actions` должны иметь право `Read and write permissions` для `GITHUB_TOKEN`, чтобы workflow мог публиковать образ в GHCR
- `Repository variable`: `DEPLOY_WEBHOOK_URL`

Workflow лежит в [.github/workflows/ci.yml](/Users/artur/AiTesting/maze-ai-projects/.github/workflows/ci.yml).

## Программы и модели

| Папка | Программа | Модель |
| --- | --- | --- |
| `claude-sonnet-4.5` | Claude | Sonnet 4.5 |
| `codex-gpt-5.1-codex-max-xhigh` | Codex | GPT-5.1 Codex Max xhigh |
| `codex-gpt-5.2-codex-xhigh` | Codex | GPT-5.2 Codex xhigh |
| `codex-gpt-5.3-codex-xhigh` | Codex | GPT-5.3 Codex xhigh |
| `codex-gpt-5.4` | Codex | GPT-5.4 |
| `copilot-gemini-3` | GitHub Copilot | Gemini 3 |
| `copilot-gpt-5.3-codex` | GitHub Copilot | GPT-5.3 Codex |
| `copilot-gpt-5.4` | GitHub Copilot | GPT-5.4 |
| `copilot-haiku-4.5` | GitHub Copilot | Haiku 4.5 |
| `copilot-opus-4.5` | GitHub Copilot | Opus 4.5 |
| `copilot-opus-4.6` | GitHub Copilot | Opus 4.6 |
| `copilot-sonnet-4.5` | GitHub Copilot | Sonnet 4.5 |
| `gemini-3` | Gemini | Gemini 3 |

## Полезные файлы

- [showcase/index.html](/Users/artur/AiTesting/maze-ai-projects/showcase/index.html)
- [showcase/main.js](/Users/artur/AiTesting/maze-ai-projects/showcase/main.js)
- [showcase/styles.css](/Users/artur/AiTesting/maze-ai-projects/showcase/styles.css)
- [games.manifest.json](/Users/artur/AiTesting/maze-ai-projects/games.manifest.json)
- [package.json](/Users/artur/AiTesting/maze-ai-projects/package.json)
- [Dockerfile](/Users/artur/AiTesting/maze-ai-projects/Dockerfile)
