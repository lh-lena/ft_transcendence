# Detect docker compose command
DOCKER_COMPOSE := $(shell command -v docker compose 2> /dev/null || echo "docker-compose")

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Check if Docker is running
.PHONY: check-docker
check-docker:
	@docker info > /dev/null 2>&1 || (echo "$(RED)❌ Docker is not running!$(NC)" && exit 1)

# Start production environment
.PHONY: all
all: check-docker
	@echo "$(BLUE)🚀 Starting production environment...$(NC)"
	@./scripts/generate-ssl.sh
	@echo "$(YELLOW)📦 Building images...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml build  # REMOVED --no-cache
	@echo "$(YELLOW)🔄 Starting containers...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d
	@echo ""
	@echo "$(GREEN)✅ Production running at https://localhost$(NC)"
	@echo "$(YELLOW)💡 Run 'make logs' to view logs$(NC)"
	@echo "$(YELLOW)💡 Run 'make status' to check service health$(NC)"

# Optional: Force rebuild without cache (for troubleshooting)
.PHONY: rebuild-clean
rebuild-clean: check-docker
	@echo "$(YELLOW)🔨 Rebuilding without cache (this will be slow)...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml build --no-cache
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d

# Rest of Makefile remains the same...