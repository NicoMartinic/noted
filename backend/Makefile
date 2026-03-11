.PHONY: format lint test

# Auto-fix formatting (run this before committing)
format:
	black .
	isort .

# Check only (what CI runs)
lint:
	flake8 .
	black --check .
	isort --check-only .

# Run tests with coverage
test:
	pytest
