# Maze Game 🎮

A fully client-side web-based maze game with progressive difficulty, built with TypeScript and HTML5 Canvas.

## AI Agent prompt

```
Ты — команда из 3 ролей одновременно:
1) Frontend Developer (Web): проектирование архитектуры, UI, управление состоянием, производительность.
2) Game Designer: придумываешь интересный геймплей, прогрессию уровней и ощущения “становится сложнее”.
3) QA Engineer: пишешь тест-план, edge-cases, проверки для ПК/мобайла, а также авто-проверки где уместно.

Задача: создать полностью клиентскую веб-игру без бэкенда, где игрок проходит лабиринты. Лабиринты должны генерироваться случайно и усложняться с каждым уровнем. Играть должно быть удобно на ПК (мышь) и на смартфоне (сенсорный экран).

Требования (обязательные):
A) Технологии:
- Только фронтенд (никаких серверов/БД).
- Ванильный стек: TypeScript + Vite + HTML/CSS/Canvas (или SVG). Предпочтительно Canvas для производительности.
- Без тяжелых зависимостей. Допустимы мелкие утилиты, но лучше без них.

B) Генерация лабиринта:
- Генерируй “идеальный лабиринт” (один уникальный путь между клетками) алгоритмом типа DFS backtracker / Kruskal / Prim.
- Добавь усложнение по уровням: рост размеров (ширина/высота), уменьшение толщины коридоров, добавление “ложных” петель/комнат (опционально), рост длины оптимального пути.
- Гарантируй проходимость: старт и финиш всегда достижимы.
- Дай детерминированность по seed (например, seed = level + timestamp), чтобы можно было воспроизводить лабиринт.

C) Геймплей:
- Игрок управляет “точкой/шариком” и должен добраться от старта до выхода.
- Управление:
  - ПК: управление мышью (перетаскивание/следование курсору с ограничением по стенам) + альтернативно WASD/стрелки.
  - Мобайл: виртуальный джойстик (touch) или drag, на выбор — но должен быть удобный и не конфликтовать со скроллом страницы.
- Коллизии со стенами: нельзя проходить сквозь стены. Реализуй аккуратную физику (скольжение вдоль стен) и анти-залипание.
- Система уровней: после прохождения показывай краткий экран результатов (время, количество касаний стен/ошибок) и кнопки Next/Retry.
- Сохраняй прогресс в localStorage (текущий уровень, лучший результат по времени).
- Пауза/перезапуск. Виброотклик на мобильных (если доступно) при столкновениях.

D) UX/UI:
- Адаптивная верстка: корректно на 360x640 и на десктопе.
- Отключи нежелательный скролл/зум во время игры (аккуратно, без ломания страницы).
- Поддержка ретина/hiDPI canvas.
- Меню: Start, Continue, Settings (звук/вибрация, режим управления).
- Визуальные подсказки: старт/финиш, прогресс уровня, мини-инструкция управления.
- Доступность: крупные кнопки на мобильном, фокус-стили на десктопе.

E) QA/Качество:
- Напиши тест-план (чеклист) для ПК+мобайл: разные браузеры, ориентация экрана, события pointer/touch/mouse, производительность.
- Добавь минимальные unit-тесты (например, генерация: связность, отсутствие “дыр”, корректные границы; collision: не проходит через стену).
- Добавь “debug overlay” (включаемый флагом) для отображения FPS, seed, размера сетки, позиции игрока, количества столкновений.
- Включи обработку edge cases: очень быстрые свайпы, потеря фокуса вкладки, смена ориентации, ресайз.

F) Производительность:
- Генерация лабиринта и рендер должны работать плавно (цель 60 FPS на телефоне среднего уровня).
- Не перерисовывай всё без необходимости: используй offscreen буфер (canvas) для стен, отдельный слой для игрока/эффектов.
- Избегай тяжелых аллокаций в игровом цикле.

Что нужно сделать (пошагово):
1) Сгенерируй структуру проекта (Vite + TS), перечисли файлы и их ответственность.
2) Реализуй генератор лабиринта (grid cells + стены), seedable RNG, и функцию проверки проходимости.
3) Реализуй движок игры: состояние, игровой цикл, ввод (pointer events), коллизии и движение.
4) Реализуй UI (меню/результаты/настройки), localStorage, адаптивность.
5) Добавь тесты и debug overlay.
6) Напиши краткую инструкцию запуска (npm scripts) и описание управления.

Ограничения:
- Никакого бэкенда, никаких внешних API.
- Не использовать ассеты, требующие лицензий. Если нужны звуки/иконки — генерируй простые в коде или используй inline SVG.
- Код должен быть читаемым: типы, небольшие функции, комментарии к сложным местам.
- Дай итог в виде готового репозитория-скелета (все файлы с кодом) прямо в ответе.

Критерии “готово”:
- Игра запускается локально, лабиринты рандомные, уровни усложняются.
- Управление удобно на мыши и на таче.
- Коллизии корректные, нет очевидных багов.
- Есть сохранение прогресса и базовые тесты.
```

## Features

✨ **Progressive Difficulty**: Mazes grow larger and more complex with each level  
🎲 **Procedural Generation**: Unique mazes using DFS backtracker algorithm  
🎯 **Cross-Platform Controls**: Mouse, keyboard, and touch support  
💾 **Progress Saving**: Auto-save to localStorage  
📱 **Mobile Optimized**: Responsive design with virtual joystick  
🎨 **Clean UI**: Modern dark theme with smooth animations  
🧪 **Well Tested**: Unit tests for core game logic  

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

The game will open automatically at http://localhost:3000

## How to Play

### Goal
Navigate from the green start point to the orange exit point without touching the walls!

### Controls

**Desktop:**
- **Mouse**: Click and drag or just move the mouse - your character will follow
- **Keyboard**: Use WASD or Arrow keys to move
- **Pause**: Press ESC or click the pause button

**Mobile:**
- **Virtual Joystick**: Use the on-screen joystick in the bottom-left corner
- **Direct Touch**: Tap and drag on the maze

### Gameplay

- Complete each level to unlock the next one
- Try to minimize collisions and complete time
- Levels get progressively harder with:
  - Larger grid sizes
  - Narrower corridors
  - More complex paths
  - Additional loops (from level 12+)

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── types.ts                # TypeScript type definitions
├── constants.ts            # Game constants and configuration
├── utils/
│   ├── rng.ts              # Seedable random number generator
│   └── math.ts             # Math utility functions
├── maze/
│   ├── generator.ts        # DFS backtracker maze generation
│   ├── validator.ts        # Connectivity validation
│   └── difficulty.ts       # Difficulty scaling logic
├── engine/
│   ├── game.ts             # Main game loop and state management
│   ├── collision.ts        # Collision detection with wall sliding
│   └── player.ts           # Player physics and movement
├── input/
│   └── manager.ts          # Unified input handling (mouse/keyboard/touch)
└── storage/
    └── persistence.ts      # localStorage save/load system
```

## Technical Details

### Technologies
- **TypeScript**: Type-safe game logic
- **Vite**: Fast development and optimized builds
- **HTML5 Canvas**: High-performance rendering
- **Vitest**: Unit testing framework

### Maze Generation
Uses the **DFS (Depth-First Search) Backtracker** algorithm to create perfect mazes:
1. Start at a random cell
2. Mark it as visited
3. While there are unvisited neighbors:
   - Choose a random unvisited neighbor
   - Remove the wall between them
   - Move to that neighbor
4. Backtrack when stuck
5. Optionally add loops for higher difficulty

### Physics & Collision
- **AABB collision detection** for player-wall interactions
- **Wall sliding** algorithm prevents getting stuck in corners
- **Sub-pixel positioning** for smooth movement
- **Velocity-based physics** with acceleration and friction

### Performance
- **Double buffering**: Static maze rendered once to offscreen canvas
- **60 FPS target**: Optimized game loop with delta time
- **HiDPI support**: Automatic scaling for retina displays
- **Minimal allocations**: Reuse objects in game loop

## Testing

Run the test suite:

```bash
npm test           # Run once
npm test -- --watch # Watch mode
npm test -- --ui    # UI mode
```

Tests cover:
- Maze generation (connectivity, determinism, dimensions)
- RNG (determinism, value ranges)
- Collision detection (walls, boundaries)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Optimized with touch controls

## Development

### Adding New Features

**New Level Config:**
Edit `src/constants.ts` and add to `LEVEL_CONFIGS`

**New Control Scheme:**
Extend `InputManager` in `src/input/manager.ts`

**Visual Changes:**
Edit `public/styles.css` or rendering methods in `src/engine/game.ts`

### Debug Mode

Press `D` during gameplay to toggle debug overlay showing:
- FPS counter
- Current seed
- Grid dimensions
- Player position
- Collision count

## License

MIT

## Credits

Built with ❤️ using TypeScript and HTML5 Canvas  
Maze generation algorithm: DFS Backtracker  
No external game frameworks or libraries!
