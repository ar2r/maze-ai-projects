const grid = document.querySelector('#games-grid');
const template = document.querySelector('#game-card-template');
const filterRoot = document.querySelector('#program-filters');
const statGames = document.querySelector('#stat-games');
const statPrograms = document.querySelector('#stat-programs');
const statModels = document.querySelector('#stat-models');

let games = [];
let activeProgram = 'All';

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function setStats(items) {
  statGames.textContent = String(items.length);
  statPrograms.textContent = String(new Set(items.map((item) => item.program)).size);
  statModels.textContent = String(new Set(items.map((item) => item.model)).size);
}

function createFilterButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'filter-chip';
  button.textContent = label;
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
  const programs = ['All', ...new Set(games.map((game) => game.program))];
  filterRoot.replaceChildren(...programs.map(createFilterButton));
}

function createHighlightPills(container, highlights) {
  container.replaceChildren(
    ...highlights.map((highlight) => {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = highlight;
      return pill;
    }),
  );
}

function bindCard(card, game) {
  card.style.setProperty('--card-accent', game.accent);
  card.querySelector('[data-program]').textContent = game.program;
  card.querySelector('[data-model]').textContent = game.model;
  card.querySelector('[data-title]').textContent = game.title;
  card.querySelector('[data-tagline]').textContent = game.tagline;
  card.querySelector('[data-summary]').textContent = game.summary;
  card.querySelector('[data-program-meta]').textContent = game.program;
  card.querySelector('[data-model-meta]').textContent = game.model;
  card.querySelector('[data-stack]').textContent = game.stack.join(' / ');
  card.querySelector('[data-provenance]').textContent = `Built in ${game.program} with ${game.model}`;
  card.querySelector('[data-fallback-title]').textContent = game.title;

  const links = card.querySelectorAll('[data-card-link], [data-cta]');
  for (const link of links) {
    link.href = game.route;
    link.setAttribute('aria-label', `Open ${game.title}`);
  }

  createHighlightPills(card.querySelector('[data-highlights]'), game.highlights);

  const image = card.querySelector('.card-shot');
  const fallback = card.querySelector('.card-fallback');

  if (game.screenshot) {
    image.src = game.screenshot;
    image.alt = `${game.title} screenshot`;
    image.hidden = false;
    fallback.hidden = true;
  } else {
    image.hidden = true;
    fallback.hidden = false;
  }
}

function renderGames() {
  const visibleGames =
    activeProgram === 'All'
      ? games
      : games.filter((game) => game.program === activeProgram);

  grid.replaceChildren(
    ...visibleGames.map((game) => {
      const fragment = template.content.cloneNode(true);
      const card = fragment.querySelector('.game-card');
      bindCard(card, game);
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

  document.documentElement.style.setProperty(
    '--program-count',
    titleCase(String(new Set(games.map((item) => item.program)).size)),
  );
}

init().catch((error) => {
  grid.innerHTML = `<p class="error-state">Failed to load game catalog: ${error.message}</p>`;
});
