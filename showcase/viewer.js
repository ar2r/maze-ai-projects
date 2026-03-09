const frame = document.querySelector('#viewer-frame');
const title = document.querySelector('#viewer-title');
const meta = document.querySelector('#viewer-meta');
const summary = document.querySelector('#viewer-summary');
const highlights = document.querySelector('#viewer-highlights');
const backLink = document.querySelector('#viewer-back');
const externalLink = document.querySelector('#viewer-external');
const prevButton = document.querySelector('#viewer-prev');
const nextButton = document.querySelector('#viewer-next');
const ALL_PROGRAMS_LABEL = 'Все';

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
  title.textContent = target.title;
  meta.textContent = `${target.program} · ${target.model}${target.description ? ` · ${target.description}` : ''}`;
  summary.textContent = target.summary || target.tagline || 'Подробности скоро появятся.';
  highlights.replaceChildren(...buildHighlightPills(target.highlights));
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
  title.textContent = 'Не удалось открыть игру';
  meta.textContent = error.message;
  summary.textContent = 'Попробуйте вернуться в каталог и выбрать игру повторно.';
  frame.removeAttribute('src');
  prevButton.disabled = true;
  nextButton.disabled = true;
  externalLink.hidden = true;
});
