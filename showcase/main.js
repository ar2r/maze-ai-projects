const tableBody = document.querySelector('#games-table-body');
const cardList = document.querySelector('#games-mobile-list');
const tableTemplate = document.querySelector('#game-row-template');
const cardTemplate = document.querySelector('#game-card-template');
const filterRoot = document.querySelector('#program-filters');
const statGames = document.querySelector('#stat-games');
const statPrograms = document.querySelector('#stat-programs');
const statModels = document.querySelector('#stat-models');
const modalRoot = document.querySelector('#game-modal');
const modalFrame = document.querySelector('#game-modal-frame');
const modalChips = document.querySelector('#game-modal-chips');
const modalSummary = document.querySelector('#game-modal-summary');
const modalExternal = document.querySelector('#game-modal-external');
const modalClose = document.querySelector('#game-modal-close');
const modalPrev = document.querySelector('#game-modal-prev');
const modalNext = document.querySelector('#game-modal-next');
const DESKTOP_MEDIA = '(min-width: 900px)';
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
  kilo: {
    className: 'program-default',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5v14M8 12l9-7M8 12l9 7" />
      </svg>
    `,
  },
  ollama: {
    className: 'program-default',
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a5 5 0 0 0-5 5v1a3 3 0 0 0-1 5.83V17a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2.17A3 3 0 0 0 17 9V8a5 5 0 0 0-5-5Z" />
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
let activeGameSlug = null;
let lastFocusedLaunch = null;

function getProgramKey(program) {
  if (program === 'Claude') return 'claude';
  if (program === 'Codex') return 'codex';
  if (program === 'GitHub Copilot') return 'copilot';
  if (program === 'Gemini') return 'gemini';
  if (program === 'Kilo') return 'kilo';
  if (program === 'Ollama') return 'ollama';
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

function isDesktopLauncher() {
  return window.matchMedia(DESKTOP_MEDIA).matches;
}

function getGameBySlug(slug) {
  return games.find((game) => game.slug === slug) ?? null;
}

function getVisibleGames() {
  const visibleGames = activeProgram === ALL_PROGRAMS_LABEL
    ? games
    : games.filter((game) => game.program === activeProgram);

  return [...visibleGames].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || '');
    const rightTime = Date.parse(right.updatedAt || '');
    const timeDiff = (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);

    return timeDiff
      || left.program.localeCompare(right.program, 'ru')
      || left.model.localeCompare(right.model, 'ru')
      || left.title.localeCompare(right.title, 'ru');
  });
}

function buildHighlightPills(items) {
  return (items || []).slice(0, 3).map((item) => {
    const pill = document.createElement('span');
    pill.className = 'highlight-pill';
    pill.textContent = item;
    return pill;
  });
}

function buildViewerChips(game) {
  const programKey = (game.program || '').toLowerCase();
  const meta = PROGRAM_META[programKey] || PROGRAM_META.default;

  const programChip = document.createElement('span');
  programChip.className = `table-badge table-badge-program ${meta.className}`.trim();
  const programIcon = document.createElement('span');
  programIcon.className = 'badge-icon';
  programIcon.innerHTML = meta.icon;
  const programLabel = document.createElement('span');
  programLabel.textContent = game.program;
  programChip.append(programIcon, programLabel);

  const modelChip = document.createElement('span');
  modelChip.className = `table-badge table-badge-model ${meta.className}`.trim();
  const modelLabel = document.createElement('span');
  modelLabel.textContent = game.model;
  modelChip.append(modelLabel);

  return [programChip, modelChip];
}

function getViewerRoute(game) {
  const params = new URLSearchParams();
  params.set('game', game.slug);
  if (activeProgram !== ALL_PROGRAMS_LABEL) {
    params.set('program', activeProgram);
  }
  return `./play.html?${params.toString()}`;
}

function syncUrlState(options = {}) {
  const params = new URLSearchParams(window.location.search);

  if (activeProgram === ALL_PROGRAMS_LABEL) {
    params.delete('program');
  } else {
    params.set('program', activeProgram);
  }

  if (options.keepGame && activeGameSlug) {
    params.set('game', activeGameSlug);
  } else {
    params.delete('game');
  }

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
  const state = { modalGame: options.keepGame ? activeGameSlug : null, activeProgram };

  if (options.push) {
    window.history.pushState(state, '', nextUrl);
  } else {
    window.history.replaceState(state, '', nextUrl);
  }
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

    if (activeGameSlug && !getVisibleGames().some((game) => game.slug === activeGameSlug)) {
      closeModal({ updateHistory: false });
    }

    syncUrlState({ keepGame: Boolean(activeGameSlug) && isDesktopLauncher() });
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

function attachLaunchBehavior(link, game) {
  link.href = isDesktopLauncher() ? game.route : getViewerRoute(game);
  link.setAttribute('aria-label', `Открыть ${game.title}`);
  link.addEventListener('click', (event) => {
    lastFocusedLaunch = link;
    if (isDesktopLauncher()) {
      event.preventDefault();
      openModal(game.slug, { pushHistory: true });
    }
  });
}

function bindRow(row, game) {
  const programKey = getProgramKey(game.program);
  const programMeta = PROGRAM_META[programKey] ?? PROGRAM_META.default;

  row.dataset.slug = game.slug;
  setBadge(row.querySelector('[data-program]'), game.program, 'table-badge table-badge-program', {
    className: programMeta.className,
    icon: programMeta.icon,
  });
  setBadge(row.querySelector('[data-model]'), game.model, 'table-badge table-badge-model', {
    className: programMeta.className,
  });
  row.querySelector('[data-description]').textContent = game.description || '';
  row.querySelector('[data-updated-at]').textContent = formatUpdatedAt(game.updatedAt);
  attachLaunchBehavior(row.querySelector('[data-cta]'), game);
}

function bindCard(card, game) {
  const programKey = getProgramKey(game.program);
  const programMeta = PROGRAM_META[programKey] ?? PROGRAM_META.default;

  setBadge(card.querySelector('[data-program]'), game.program, 'table-badge table-badge-program', {
    className: programMeta.className,
    icon: programMeta.icon,
  });
  setBadge(card.querySelector('[data-model]'), game.model, 'table-badge table-badge-model', {
    className: programMeta.className,
  });
  card.querySelector('[data-updated-at]').textContent = formatUpdatedAt(game.updatedAt);
  card.querySelector('[data-description]').textContent = game.description || game.summary || '';
  const highlightsRoot = card.querySelector('[data-highlights]');
  highlightsRoot.replaceChildren(...buildHighlightPills(game.highlights));
  attachLaunchBehavior(card.querySelector('[data-cta]'), game);
}

function renderGames() {
  const orderedGames = getVisibleGames();

  tableBody.replaceChildren(
    ...orderedGames.map((game) => {
      const fragment = tableTemplate.content.cloneNode(true);
      bindRow(fragment.querySelector('.game-row'), game);
      return fragment;
    }),
  );

  cardList.replaceChildren(
    ...orderedGames.map((game) => {
      const fragment = cardTemplate.content.cloneNode(true);
      bindCard(fragment.querySelector('.game-card'), game);
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
    { threshold: 0.05, rootMargin: '0px 0px 0px 0px' },
  );

  for (const item of items) {
    if (!item.classList.contains('is-visible')) {
      observer.observe(item);
    }
  }
}

function updateModalNavigation() {
  const visibleGames = getVisibleGames();
  const index = visibleGames.findIndex((game) => game.slug === activeGameSlug);
  const previousGame = index > 0 ? visibleGames[index - 1] : null;
  const nextGame = index >= 0 && index < visibleGames.length - 1 ? visibleGames[index + 1] : null;

  modalPrev.disabled = !previousGame;
  modalNext.disabled = !nextGame;
  modalPrev.onclick = previousGame ? () => openModal(previousGame.slug, { pushHistory: false }) : null;
  modalNext.onclick = nextGame ? () => openModal(nextGame.slug, { pushHistory: false }) : null;
}

function trapFocus(event) {
  if (event.key !== 'Tab' || modalRoot.hidden) return;

  const focusable = [...modalRoot.querySelectorAll('button, a[href], iframe')].filter((element) => !element.disabled);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleModalKeydown(event) {
  if (event.key === 'Escape') {
    closeModal();
    return;
  }
  trapFocus(event);
}

function fillModalDetails(game) {
  modalChips.replaceChildren(...buildViewerChips(game));
  modalSummary.textContent = game.description || '';
  modalExternal.href = game.route;
}

function openModal(slug, options = {}) {
  if (!isDesktopLauncher()) {
    const game = getGameBySlug(slug);
    if (game) {
      window.location.href = getViewerRoute(game);
    }
    return;
  }

  const game = getGameBySlug(slug);
  if (!game) return;

  activeGameSlug = game.slug;
  fillModalDetails(game);
  modalFrame.src = game.route;
  modalFrame.title = `Просмотр игры ${game.title}`;
  modalRoot.hidden = false;
  document.body.classList.add('has-modal-open');
  updateModalNavigation();

  if (options.pushHistory) {
    syncUrlState({ keepGame: true, push: true });
  } else {
    syncUrlState({ keepGame: true });
  }

  window.requestAnimationFrame(() => modalClose.focus());
}

function closeModal(options = {}) {
  if (modalRoot.hidden) {
    activeGameSlug = null;
    syncUrlState({ keepGame: false });
    return;
  }

  modalRoot.hidden = true;
  modalFrame.src = 'about:blank';
  document.body.classList.remove('has-modal-open');
  activeGameSlug = null;

  if (options.updateHistory !== false) {
    syncUrlState({ keepGame: false });
  }

  if (lastFocusedLaunch instanceof HTMLElement) {
    lastFocusedLaunch.focus();
  }
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const requestedProgram = params.get('program');
  const requestedGame = params.get('game');

  if (requestedProgram && games.some((game) => game.program === requestedProgram)) {
    activeProgram = requestedProgram;
  }

  renderFilters();
  renderGames();
  syncUrlState({ keepGame: false });

  if (requestedGame) {
    if (isDesktopLauncher()) {
      openModal(requestedGame, { pushHistory: false });
    } else {
      const game = getGameBySlug(requestedGame);
      if (game) {
        window.location.replace(getViewerRoute(game));
      }
    }
  }
}

function registerGlobalEvents() {
  modalClose.addEventListener('click', () => closeModal());
  modalRoot.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute('data-modal-close')) {
      closeModal();
    }
  });
  window.addEventListener('keydown', handleModalKeydown);
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const nextProgram = params.get('program');
    const nextGame = params.get('game');
    activeProgram = nextProgram && games.some((game) => game.program === nextProgram)
      ? nextProgram
      : ALL_PROGRAMS_LABEL;
    renderFilters();
    renderGames();

    if (nextGame && isDesktopLauncher()) {
      openModal(nextGame, { pushHistory: false });
      return;
    }

    closeModal({ updateHistory: false });
  });

  window.matchMedia(DESKTOP_MEDIA).addEventListener('change', (event) => {
    renderGames();

    if (!event.matches && activeGameSlug) {
      const game = getGameBySlug(activeGameSlug);
      if (game) {
        window.location.href = getViewerRoute(game);
      }
      return;
    }

    if (event.matches) {
      const params = new URLSearchParams(window.location.search);
      const requestedGame = params.get('game');
      if (requestedGame) {
        openModal(requestedGame, { pushHistory: false });
      }
    }
  });
}

async function init() {
  const response = await fetch('./games.manifest.json');
  games = await response.json();

  setStats(games);
  applyUrlState();
  registerGlobalEvents();
}

init().catch((error) => {
  tableBody.innerHTML = `<tr><td colspan="5" class="error-state">Не удалось загрузить каталог игр: ${error.message}</td></tr>`;
  cardList.innerHTML = `<article class="error-state">Не удалось загрузить каталог игр: ${error.message}</article>`;
});
