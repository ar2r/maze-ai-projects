const frame = document.querySelector('#viewer-frame');
const frameShell = document.querySelector('#viewer-frame-shell');
const chips = document.querySelector('#viewer-chips');
const summary = document.querySelector('#viewer-summary');
const highlights = document.querySelector('#viewer-highlights');
const backLink = document.querySelector('#viewer-back');
const externalLink = document.querySelector('#viewer-external');
const prevButton = document.querySelector('#viewer-prev');
const nextButton = document.querySelector('#viewer-next');
const ALL_PROGRAMS_LABEL = 'Все';

const PROGRAM_META = {
  claude: {
    className: 'program-claude',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H12l-3.6 3v-3H7.5A2.5 2.5 0 0 1 5 12.5Z" /></svg>`,
  },
  codex: {
    className: 'program-codex',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 7 4.5 12l3.7 5M15.8 7l3.7 5-3.7 5M13.2 5.5l-2.4 13" /></svg>`,
  },
  copilot: {
    className: 'program-copilot',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7.5A3.5 3.5 0 0 1 11.5 4h1A3.5 3.5 0 0 1 16 7.5v.5h.5A2.5 2.5 0 0 1 19 10.5v3A4.5 4.5 0 0 1 14.5 18h-5A4.5 4.5 0 0 1 5 13.5v-3A2.5 2.5 0 0 1 7.5 8H8Zm1.5 4.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></svg>`,
  },
  gemini: {
    className: 'program-gemini',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 14.5 9 20 12l-5.5 3-2.5 5.5L9.5 15 4 12l5.5-3Z" /></svg>`,
  },
  kilo: {
    className: 'program-default',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M8 12l9-7M8 12l9 7" /></svg>`,
  },
  ollama: {
    className: 'program-default',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 0 0-5 5v1a3 3 0 0 0-1 5.83V17a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2.17A3 3 0 0 0 17 9V8a5 5 0 0 0-5-5Z" /></svg>`,
  },
  default: {
    className: 'program-default',
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" /></svg>`,
  },
};

function getProgramKey(program) {
  if (program === 'Claude') return 'claude';
  if (program === 'Codex') return 'codex';
  if (program === 'GitHub Copilot') return 'copilot';
  if (program === 'Gemini') return 'gemini';
  if (program === 'Kilo') return 'kilo';
  if (program === 'Ollama') return 'ollama';
  return 'default';
}

function buildViewerChips(game) {
  const programKey = getProgramKey(game.program);
  const meta = PROGRAM_META[programKey] || PROGRAM_META.default;

  const programChip = document.createElement('span');
  programChip.className = `viewer-chip ${meta.className}`;
  programChip.innerHTML = `${meta.icon}<span>${game.program}</span>`;

  const modelChip = document.createElement('span');
  modelChip.className = 'viewer-chip viewer-chip-model';
  modelChip.textContent = game.model;

  return [programChip, modelChip];
}

let games = [];
let activeProgram = ALL_PROGRAMS_LABEL;
let activeSlug = null;

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

function buildCatalogHref() {
  const params = new URLSearchParams();
  if (activeProgram !== ALL_PROGRAMS_LABEL) {
    params.set('program', activeProgram);
  }
  const query = params.toString();
  return `./${query ? `?${query}` : ''}#games`;
}

function buildHighlightPills(items) {
  return (items || []).slice(0, 3).map((item) => {
    const pill = document.createElement('span');
    pill.className = 'highlight-pill';
    pill.textContent = item;
    return pill;
  });
}

function updateNav() {
  const visibleGames = getVisibleGames();
  const index = visibleGames.findIndex((game) => game.slug === activeSlug);
  const previousGame = index > 0 ? visibleGames[index - 1] : null;
  const nextGame = index >= 0 && index < visibleGames.length - 1 ? visibleGames[index + 1] : null;

  prevButton.disabled = !previousGame;
  nextButton.disabled = !nextGame;
  prevButton.onclick = previousGame ? () => navigateToGame(previousGame.slug) : null;
  nextButton.onclick = nextGame ? () => navigateToGame(nextGame.slug) : null;
}

function navigateToGame(slug, replace = false) {
  const target = games.find((game) => game.slug === slug);
  if (!target) {
    return;
  }

  activeSlug = target.slug;
  chips.replaceChildren(...buildViewerChips(target));
  summary.textContent = target.description || 'Подробности скоро появятся.';
  highlights.replaceChildren(...buildHighlightPills(target.highlights));
  frameShell.dataset.loading = 'true';
  frame.src = target.route;
  frame.title = `Просмотр игры ${target.title}`;
  externalLink.href = target.route;
  backLink.href = buildCatalogHref();
  updateNav();

  const params = new URLSearchParams();
  params.set('game', activeSlug);
  if (activeProgram !== ALL_PROGRAMS_LABEL) {
    params.set('program', activeProgram);
  }

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  if (replace) {
    window.history.replaceState({ game: activeSlug, program: activeProgram }, '', nextUrl);
  } else {
    window.history.pushState({ game: activeSlug, program: activeProgram }, '', nextUrl);
  }
}

async function init() {
  frame.addEventListener('load', () => {
    delete frameShell.dataset.loading;
  });

  const response = await fetch('./games.manifest.json');
  games = await response.json();

  const params = new URLSearchParams(window.location.search);
  const requestedProgram = params.get('program');
  const requestedGame = params.get('game');

  if (requestedProgram && games.some((game) => game.program === requestedProgram)) {
    activeProgram = requestedProgram;
  }

  const initialGame = requestedGame && getVisibleGames().some((game) => game.slug === requestedGame)
    ? requestedGame
    : getVisibleGames()[0]?.slug;

  if (!initialGame) {
    throw new Error('Каталог игр пуст');
  }

  navigateToGame(initialGame, true);

  window.addEventListener('popstate', () => {
    const nextParams = new URLSearchParams(window.location.search);
    const nextProgram = nextParams.get('program');
    const nextGame = nextParams.get('game');
    activeProgram = nextProgram && games.some((game) => game.program === nextProgram)
      ? nextProgram
      : ALL_PROGRAMS_LABEL;
    navigateToGame(nextGame || getVisibleGames()[0]?.slug, true);
  });
}

init().catch((error) => {
  summary.textContent = error.message;
  summary.textContent = 'Попробуйте вернуться в каталог и выбрать игру повторно.';
  frame.removeAttribute('src');
  prevButton.disabled = true;
  nextButton.disabled = true;
  externalLink.hidden = true;
});
