const tableBody = document.querySelector('#games-table-body');
const template = document.querySelector('#game-row-template');
const filterRoot = document.querySelector('#program-filters');
const statGames = document.querySelector('#stat-games');
const statPrograms = document.querySelector('#stat-programs');
const statModels = document.querySelector('#stat-models');
const ALL_PROGRAMS_LABEL = 'Все';
const PROGRAM_META = {
  claude: {
    className: 'program-claude',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H12l-3.6 3v-3H7.5A2.5 2.5 0 0 1 5 12.5Z" />
      </svg>
    `,
  },
  codex: {
    className: 'program-codex',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.2 7 4.5 12l3.7 5M15.8 7l3.7 5-3.7 5M13.2 5.5l-2.4 13" />
      </svg>
    `,
  },
  copilot: {
    className: 'program-copilot',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 7.5A3.5 3.5 0 0 1 11.5 4h1A3.5 3.5 0 0 1 16 7.5v.5h.5A2.5 2.5 0 0 1 19 10.5v3A4.5 4.5 0 0 1 14.5 18h-5A4.5 4.5 0 0 1 5 13.5v-3A2.5 2.5 0 0 1 7.5 8H8Zm1.5 4.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
      </svg>
    `,
  },
  gemini: {
    className: 'program-gemini',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 14.5 9 20 12l-5.5 3-2.5 5.5L9.5 15 4 12l5.5-3Z" />
      </svg>
    `,
  },
  default: {
    className: 'program-default',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="6" />
      </svg>
    `,
  },
};

let games = [];
let activeProgram = ALL_PROGRAMS_LABEL;

function getProgramKey(program) {
  if (program === 'Claude') {
    return 'claude';
  }
  if (program === 'Codex') {
    return 'codex';
  }
  if (program === 'GitHub Copilot') {
    return 'copilot';
  }
  if (program === 'Gemini') {
    return 'gemini';
  }
  return 'default';
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Неизвестно';
  }

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' }).format(-diffDays, 'day');
}

function setStats(items) {
  statGames.textContent = String(items.length);
  statPrograms.textContent = String(new Set(items.map((item) => item.program)).size);
  statModels.textContent = String(new Set(items.map((item) => item.model)).size);
}

function createFilterButton(label) {
  const button = document.createElement('button');
  const programKey = label === ALL_PROGRAMS_LABEL ? 'default' : getProgramKey(label);
  const programMeta = PROGRAM_META[programKey] ?? PROGRAM_META.default;

  button.type = 'button';
  button.className = `filter-chip ${programMeta.className}`;

  if (label !== ALL_PROGRAMS_LABEL) {
    const icon = document.createElement('span');
    icon.className = 'badge-icon';
    icon.innerHTML = programMeta.icon;
    button.append(icon);
  }

  const text = document.createElement('span');
  text.textContent = label;
  button.append(text);

  if (label === activeProgram) {
    button.dataset.active = 'true';
  }

  button.addEventListener('click', () => {
    activeProgram = label;
    renderFilters();
    renderGames();
  });

  return button;
}

function renderFilters() {
  const programs = [ALL_PROGRAMS_LABEL, ...new Set(games.map((game) => game.program))];
  filterRoot.replaceChildren(...programs.map(createFilterButton));
}

function setBadge(cell, text, className, options = {}) {
  const badge = document.createElement('span');
  badge.className = `${className} ${options.className ?? ''}`.trim();

  if (options.icon) {
    const icon = document.createElement('span');
    icon.className = 'badge-icon';
    icon.innerHTML = options.icon;
    badge.append(icon);
  }

  const label = document.createElement('span');
  label.textContent = text;
  badge.append(label);
  cell.replaceChildren(badge);
}

function bindRow(row, game) {
  const programKey = getProgramKey(game.program);
  const programMeta = PROGRAM_META[programKey] ?? PROGRAM_META.default;

  setBadge(row.querySelector('[data-program]'), game.program, 'table-badge table-badge-program', {
    className: programMeta.className,
    icon: programMeta.icon,
  });
  setBadge(row.querySelector('[data-model]'), game.model, 'table-badge table-badge-model', {
    className: programMeta.className,
  });
  row.querySelector('[data-updated-at]').textContent = formatUpdatedAt(game.updatedAt);

  const link = row.querySelector('[data-cta]');
  link.href = game.route;
  link.setAttribute('aria-label', `Открыть ${game.title}`);
}

function renderGames() {
  const visibleGames =
    activeProgram === ALL_PROGRAMS_LABEL
      ? games
      : games.filter((game) => game.program === activeProgram);

  const orderedGames = [...visibleGames].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || '');
    const rightTime = Date.parse(right.updatedAt || '');
    const timeDiff = (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);

    return timeDiff
      || left.program.localeCompare(right.program, 'ru')
      || left.model.localeCompare(right.model, 'ru')
      || left.title.localeCompare(right.title, 'ru');
  });

  tableBody.replaceChildren(
    ...orderedGames.map((game) => {
      const fragment = template.content.cloneNode(true);
      const row = fragment.querySelector('.game-row');
      bindRow(row, game);
      return fragment;
    }),
  );

  attachRevealObserver();
}

function attachRevealObserver() {
  const items = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    },
  );

  for (const item of items) {
    if (!item.classList.contains('is-visible')) {
      observer.observe(item);
    }
  }
}

async function init() {
  const response = await fetch('./games.manifest.json');
  games = await response.json();

  setStats(games);
  renderFilters();
  renderGames();
}

init().catch((error) => {
  tableBody.innerHTML = `<tr><td colspan="4" class="error-state">Не удалось загрузить каталог игр: ${error.message}</td></tr>`;
});
