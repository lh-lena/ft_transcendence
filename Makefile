# Detect docker compose command (v2 vs v1)
DOCKER_COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

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
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml build
	@echo "$(YELLOW)🔄 Starting containers...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d
	@echo ""
	@echo "$(GREEN)✅ Production running at https://localhost$(NC)"
	@echo "$(YELLOW)💡 Run 'make logs' to view logs$(NC)"
	@echo "$(YELLOW)💡 Run 'make status' to check service health$(NC)"

# Start development environment
.PHONY: dev
dev: check-docker
	@echo "$(BLUE)🛠️  Starting development environment...$(NC)"
	@./scripts/generate-ssl.sh
	@echo "$(YELLOW)📦 Building images...$(NC)"
	$(DOCKER_COMPOSE) up -d --build
	@echo ""
	@echo "$(GREEN)✅ Development running at https://localhost$(NC)"

# Stop everything
.PHONY: down
down:
	@echo "$(YELLOW)🛑 Stopping services...$(NC)"
	@$(DOCKER_COMPOSE) down 2>/dev/null || true
	@$(DOCKER_COMPOSE) -f docker-compose.prod.yml down 2>/dev/null || true
	@echo "$(GREEN)✅ Services stopped$(NC)"

# Restart dev
.PHONY: restart
restart: down dev

# Rebuild specific service
.PHONY: rebuild-service
rebuild-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ Usage: make rebuild-service SERVICE=backend$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)🔨 Rebuilding $(SERVICE)...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d --build --no-deps $(SERVICE)
	@echo "$(GREEN)✅ $(SERVICE) rebuilt$(NC)"

# View logs
.PHONY: logs
logs:
	$(DOCKER_COMPOSE) logs -f

# View logs for specific service
.PHONY: logs-service
logs-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Usage: make logs-service SERVICE=backend$(NC)"; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) logs -f $(SERVICE)

# Shell access
.PHONY: shell
shell:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Usage: make shell SERVICE=backend$(NC)"; \
		exit 1; \
	fi
	docker exec -it ft_transcendence_$(SERVICE) sh

# Service status
.PHONY: status
status:
	@echo "$(BLUE)📊 Service Status:$(NC)"
	@$(DOCKER_COMPOSE) ps 2>/dev/null || $(DOCKER_COMPOSE) -f docker-compose.prod.yml ps
	@echo ""
	@echo "$(BLUE)🏥 Health Status:$(NC)"
	@docker ps --filter "name=ft_transcendence" --format "table {{.Names}}\t{{.Status}}"

# Clean up
.PHONY: clean
clean: down
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	@$(DOCKER_COMPOSE) down -v --remove-orphans 2>/dev/null || true
	@$(DOCKER_COMPOSE) -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

# Deep clean
.PHONY: fclean
fclean: clean
	@echo "$(YELLOW)🗑️  Deep cleaning...$(NC)"
	@docker system prune -af --volumes
	@echo "$(GREEN)✅ Deep clean complete$(NC)"

# Full rebuild
.PHONY: re
re: fclean all

# Optional: Force rebuild without cache (for troubleshooting)
.PHONY: rebuild-clean
rebuild-clean: check-docker
	@echo "$(YELLOW)🔨 Rebuilding without cache (this will be slow)...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml build --no-cache
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Rebuilt successfully$(NC)"

# Verify installations
.PHONY: verify
verify:
	@echo "$(BLUE)🔍 Verifying installations...$(NC)"
	@docker exec ft_transcendence_frontend node -e "console.log('✅ Frontend dependencies OK')" 2>/dev/null || echo "$(RED)❌ Frontend not running$(NC)"
	@docker exec ft_transcendence_backend node -e "console.log('✅ Backend dependencies OK')" 2>/dev/null || echo "$(RED)❌ Backend not running$(NC)"
	@docker exec ft_transcendence_realtime node -e "console.log('✅ Realtime dependencies OK')" 2>/dev/null || echo "$(RED)❌ Realtime not running$(NC)"
	@docker exec ft_transcendence_auth node -e "console.log('✅ Auth dependencies OK')" 2>/dev/null || echo "$(RED)❌ Auth not running$(NC)"

# Help
.PHONY: help
help:
	@echo "$(BLUE)🏓 ft_transcendence - Available Commands:$(NC)"
	@echo ""
	@echo "  $(GREEN)make all$(NC)          Start production (evaluation-ready)"
	@echo "  $(GREEN)make dev$(NC)          Start development (hot-reload)"
	@echo "  $(GREEN)make down$(NC)         Stop all services"
	@echo "  $(GREEN)make restart$(NC)      Restart development"
	@echo "  $(GREEN)make logs$(NC)         View all logs"
	@echo "  $(GREEN)make logs-service SERVICE=<name>$(NC)  View specific logs"
	@echo "  $(GREEN)make shell SERVICE=<name>$(NC)         Container shell"
	@echo "  $(GREEN)make rebuild-service SERVICE=<name>$(NC) Rebuild specific service"
	@echo "  $(GREEN)make rebuild-clean$(NC) Force rebuild without cache"
	@echo "  $(GREEN)make status$(NC)       Service status"
	@echo "  $(GREEN)make verify$(NC)       Verify all installations"
	@echo "  $(GREEN)make clean$(NC)        Clean resources"
	@echo "  $(GREEN)make fclean$(NC)       Deep clean"
	@echo "  $(GREEN)make re$(NC)           Full rebuild"
	@echo ""
	@echo "$(YELLOW)🌐 Access: https://localhost$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Use 'make dev' for development$(NC)"
	@echo "$(YELLOW)🏫 Use 'make all' for production/evaluation$(NC)"

.DEFAULT_GOAL := help