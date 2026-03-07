.PHONY: help games game site site-preview docker-build docker-run

NPM ?= npm
GAME ?=
GAME_ARGS ?=
IMAGE ?= maze-ai-showcase
PORT ?= 3000

help:
	@echo "Available commands:"
	@echo "  make games                         List games, optionally run one by number, or press Enter to exit"
	@echo "  make game                          Select and run a game interactively"
	@echo "  make game GAME=1                   Run game #1 from the list"
	@echo "  make game GAME=copilot-gemini-3    Run game by folder name"
	@echo "  make game GAME_ARGS=\"--open=false\"  Pass extra Vite dev args"
	@echo "  make site                          Build the unified showcase site into site-dist/"
	@echo "  make site-preview                  Serve the built site locally at http://127.0.0.1:4173"
	@echo "  make docker-build                  Build the Docker image ($(IMAGE))"
	@echo "  make docker-run                    Run the Docker image on http://127.0.0.1:$(PORT)"

games:
	@$(NPM) run games -- --prompt-after-list

game:
	@$(NPM) run game -- $(GAME) -- $(GAME_ARGS)

site:
	@$(NPM) run site:build

site-preview:
	@$(NPM) run site:preview

docker-build:
	@docker build -t $(IMAGE) .

docker-run:
	@docker run --rm -p $(PORT):3000 $(IMAGE)
