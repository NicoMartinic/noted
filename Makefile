.PHONY: help up down build logs shell-backend shell-frontend test test-backend test-frontend test-e2e lint format migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── App lifecycle ─────────────────────────────────────────────────────────────
up: ## Start all services (dev)
	docker compose up --build

up-d: ## Start all services in background
	docker compose up --build -d

down: ## Stop and remove containers
	docker compose down

build: ## Rebuild images without cache
	docker compose build --no-cache

logs: ## Tail all service logs
	docker compose logs -f

logs-backend: ## Tail backend logs
	docker compose logs -f backend

logs-frontend: ## Tail frontend logs
	docker compose logs -f frontend

# ─── Shells ────────────────────────────────────────────────────────────────────
shell-backend: ## Open bash in backend container
	docker compose exec backend bash

shell-frontend: ## Open sh in frontend container
	docker compose exec frontend sh

shell-db: ## Open psql in db container
	docker compose exec db psql -U $${DB_USER:-notes_user} $${DB_NAME:-notes_db}

# ─── Testing ───────────────────────────────────────────────────────────────────
test: test-backend test-frontend ## Run all unit tests

test-backend: ## Run backend pytest suite
	docker compose run --rm backend pytest -v

test-frontend: ## Run frontend Jest suite
	docker compose exec frontend npm test

test-e2e: ## Run Playwright end-to-end tests (app must be running)
	docker compose --profile e2e run --rm playwright

test-coverage: ## Run backend tests with coverage report
	docker compose run --rm backend pytest --cov --cov-report=term-missing

# ─── Linting & formatting ──────────────────────────────────────────────────────
lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run flake8 + isort check on backend
	docker compose run --rm backend sh -c "flake8 . && isort --check-only ."

lint-frontend: ## Run ESLint on frontend
	docker compose exec frontend npm run lint

format: format-backend ## Auto-format all code

format-backend: ## Run black + isort on backend
	docker compose run --rm backend sh -c "black . && isort ."

typecheck: ## Run TypeScript type check
	docker compose exec frontend npm run typecheck

# ─── Django ────────────────────────────────────────────────────────────────────
migrate: ## Run Django migrations
	docker compose exec backend python manage.py migrate

makemigrations: ## Generate new Django migrations
	docker compose exec backend python manage.py makemigrations

createsuperuser: ## Create Django superuser
	docker compose exec backend python manage.py createsuperuser

# ─── Production ────────────────────────────────────────────────────────────────
prod-up: ## Start production stack
	docker compose -f docker-compose.production.yml up --build -d

prod-down: ## Stop production stack
	docker compose -f docker-compose.production.yml down

prod-logs: ## Tail production logs
	docker compose -f docker-compose.production.yml logs -f
