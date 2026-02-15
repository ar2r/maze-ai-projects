.PHONY: help games game

NPM ?= npm
GAME_ARGS ?=

help:
	@echo "Available commands:"
	@echo "  make games                         List all game folders"
	@echo "  make game                          Select and run a game interactively"
	@echo "  make game GAME_ARGS=\"--open=false\"  Pass extra Vite dev args"

games:
	@$(NPM) run games

game:
	@$(NPM) run game -- -- $(GAME_ARGS)
