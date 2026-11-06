# ==============================================================================
# Factory Project Makefile — Standard Interface for Environment & Dark Factory
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

-include .env
export

.PHONY: help env setup install build test stage-check df71\:check check harness clean

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

env: ## Pull and bootstrap environment (.env, runtime dependencies)
	@echo "==> [env] Pulling and verifying environment..."
	@if [ ! -f .env ] && [ -f .env.example ]; then cp .env.example .env && echo "Created .env from .env.example"; fi
	@command -v node >/dev/null 2>&1 || (echo "ERROR: node is required" && exit 1)
	@echo "==> [env] Environment ready."

setup: env install ## Full setup: pull environment and install dependencies

install: ## Install dependencies
	@if [ -f pnpm-lock.yaml ]; then pnpm install; \
	elif [ -f package-lock.json ]; then npm install; \
	elif [ -f yarn.lock ]; then yarn install; \
	elif [ -f Cargo.toml ]; then cargo check; \
	fi

build: ## Build project artifacts
	@if [ -f package.json ]; then npm run build; fi

test: ## Run test suite
	@if [ -f package.json ]; then npm test; fi

stage-check: ## Verify clean git stage and hygiene before a new task
	@if command -v df71 >/dev/null 2>&1; then df71 stage-check --pre-task; \
	elif command -v factory >/dev/null 2>&1; then factory stage-check --pre-task; \
	elif [ -f package.json ]; then npx df71 stage-check --pre-task; fi

df71\:check: env ## Run df71 dark factory verification checks
	@if [ -f package.json ] && npm run | grep -q "df71:check"; then npm run df71:check; \
	elif command -v df71 >/dev/null 2>&1; then df71 check; \
	elif command -v factory >/dev/null 2>&1; then factory check; fi

release: ## Execute full release process: check, tag, push, and GitHub release
	@if command -v df71 >/dev/null 2>&1; then df71 release; \
	elif [ -f package.json ]; then npx df71 release; fi

gh\:init: ## Initialize enterprise GitHub repository settings
	@if command -v df71 >/dev/null 2>&1; then df71 github init; \
	elif [ -f package.json ]; then npx df71 github init; fi

check: env test df71\:check ## Run environment verification, tests, and df71 dark factory checks

harness: df71\:check ## Backward-compatibility alias for df71:check

clean: ## Clean build artifacts and temporary files
	@rm -rf dist dist-next coverage .turbo tmp
