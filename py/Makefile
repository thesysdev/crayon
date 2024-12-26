.PHONY: format lint test install check clean mypy flake8

# Colors for pretty output
BLUE=\033[0;34m
NC=\033[0m # No Color

# Python source directories
SOURCES=stream/src

# Install all dependencies
install:
	@echo "${BLUE}Installing dependencies...${NC}"
	poetry install
	cd stream && poetry install

# Format code
format:
	@echo "${BLUE}Formatting code...${NC}"
	poetry run black $(SOURCES)
	poetry run isort $(SOURCES)

# Run all linters and type checks
lint: mypy
	@echo "${BLUE}Running Black and isort in check mode...${NC}"
	poetry run black --check $(SOURCES)
	poetry run isort --check $(SOURCES)

# Run mypy
mypy:
	@echo "${BLUE}Running mypy...${NC}"
	poetry run mypy $(SOURCES)

# Run all checks (useful for CI)
ci: lint mypy

# Clean Python cache files
clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type d -name "*.egg-info" -exec rm -r {} +
	find . -type d -name ".pytest_cache" -exec rm -r {} +
	find . -type d -name ".mypy_cache" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
