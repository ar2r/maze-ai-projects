.PHONY: help games game

NPM ?= npm
GAME ?=
GAME_ARGS ?=

help:
	@echo "Available commands:"
	@echo "  make games                         List games, optionally run one by number, or press Enter to exit"
	@echo "  make game                          Select and run a game interactively"
	@echo "  make game GAME=1                   Run game #1 from the list"
	@echo "  make game GAME=copilot-gemini-3    Run game by folder name"
	@echo "  make game GAME_ARGS=\"--open=false\"  Pass extra Vite dev args"

games:
	@$(NPM) run games -- --prompt-after-list

game:
	@$(NPM) run game -- $(GAME) -- $(GAME_ARGS)
