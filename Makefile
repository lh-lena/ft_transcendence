# Detect docker compose command
DOCKER_COMPOSE := $(shell command -v docker-compose 2> /dev/null)
ifndef DOCKER_COMPOSE
    DOCKER_COMPOSE := docker compose
else
    DOCKER_COMPOSE := docker-compose
endif

# Docker paths for 42 school
SGOINFRE_PATH = /sgoinfre/goinfre/Perso/$(USER)/docker
DOCKER_LOCAL_PATH = $(HOME)/.local/share/docker
DOCKER_HOME_PATH = $(HOME)/.docker

# Setup Docker to use sgoinfre via symlinks
setup:
ifneq ($(wildcard /sgoinfre/goinfre/Perso/.),)
	@echo "🏫 Configuring Docker for 42 school (sgoinfre)..."
	@mkdir -p $(SGOINFRE_PATH)
	@if [ ! -L $(DOCKER_LOCAL_PATH) ]; then \
		echo "🔗 Creating symlink $(DOCKER_LOCAL_PATH) -> $(SGOINFRE_PATH)"; \
		rm -rf $(DOCKER_LOCAL_PATH); \
		mkdir -p $$(dirname $(DOCKER_LOCAL_PATH)); \
		ln -s $(SGOINFRE_PATH) $(DOCKER_LOCAL_PATH); \
	fi
	@if [ ! -L $(DOCKER_HOME_PATH) ]; then \
		echo "🔗 Creating symlink $(DOCKER_HOME_PATH) -> $(SGOINFRE_PATH)"; \
		rm -rf $(DOCKER_HOME_PATH); \
		ln -s $(SGOINFRE_PATH) $(DOCKER_HOME_PATH); \
	fi
	@echo "✅ Docker will use: $(SGOINFRE_PATH)"
	@df -h $(SGOINFRE_PATH) 2>/dev/null | tail -1 || true
else
	@echo "💻 Using local development environment"
endif

# start everything for prod environment
NAME = ft_transcendence
all: setup
	@echo "🚀 Starting production environment..."
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up --build

# start everything for dev environment
dev: setup
	@echo "🛠️  Starting development environment..."
	@./scripts/generate-ssl.sh
	$(DOCKER_COMPOSE) up -d --build
	@echo "✅ Development environment started at https://localhost:443"

# stop everything
down:
	@echo "🛑 Stopping all services..."
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml down 2>/dev/null || true
	@echo "✅ All services stopped"

# restart development environment
restart: down dev

# view logs
logs:
	$(DOCKER_COMPOSE) logs -f

# view logs for specific service
logs-service:
	@echo "Usage: make logs-service SERVICE=backend"
	$(DOCKER_COMPOSE) logs -f $(SERVICE)

# access a container's shell
shell:
	@echo "Usage: make shell SERVICE=backend"
	docker exec -it ft_transcendence_$(SERVICE) sh

# clean up everything (volumes, images, networks)
clean: down
	@echo "🧹 Cleaning up Docker resources..."
	$(DOCKER_COMPOSE) down -v --remove-orphans 2>/dev/null || true
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
	# WARNING: The following command removes ALL Docker images and volumes system-wide!
	# If you really want to prune everything, uncomment the next line:
	# docker system prune -af --volumes
	@echo "✅ Cleanup completed"

# deep clean including cache and symlinks
fclean: clean
ifneq ($(wildcard /sgoinfre/goinfre/Perso/.),)
	@echo "🗑️  Removing sgoinfre Docker data and symlinks..."
	@if [ -L $(DOCKER_LOCAL_PATH) ]; then rm -f $(DOCKER_LOCAL_PATH); fi
	@if [ -L $(DOCKER_HOME_PATH) ]; then rm -f $(DOCKER_HOME_PATH); fi
	@rm -rf $(SGOINFRE_PATH)
else
	@echo "🗑️  Removing local Docker cache..."
	@docker builder prune -af
endif
	@echo "✅ Deep cleanup completed"

# show status of all services
status:
	@echo "📊 Service Status:"
	$(DOCKER_COMPOSE) ps

# Show Docker info and disk space
info:
	@echo "🔍 Docker Information:"
	@echo ""
	@echo "Symlink status:"
	@ls -la $(DOCKER_LOCAL_PATH) 2>/dev/null || echo "  ❌ No symlink at $(DOCKER_LOCAL_PATH)"
	@ls -la $(DOCKER_HOME_PATH) 2>/dev/null || echo "  ❌ No symlink at $(DOCKER_HOME_PATH)"
	@echo ""
	@echo "Storage location:"
	@if [ -L $(DOCKER_LOCAL_PATH) ]; then \
		echo "  ✅ Using: $$(readlink $(DOCKER_LOCAL_PATH))"; \
	else \
		echo "  ℹ️  Using default location"; \
	fi
	@echo ""
	@echo "Disk space:"
	@df -h $(SGOINFRE_PATH) 2>/dev/null | tail -1 || df -h $(HOME)/.local/share/docker 2>/dev/null | tail -1 || echo "  Unable to check"

# clean and recreate all
re: fclean all

# help command
help:
	@echo "🏓 ft_transcendence - Available Commands:"
	@echo ""
	@echo "  make dev          Start development environment (bind-mounts)"
	@echo "  make all          Start production environment (campus-safe)"
	@echo "  make down         Stop all services"
	@echo "  make restart      Restart development environment"
	@echo "  make logs         View all service logs"
	@echo "  make logs-service SERVICE=<name>  View specific service logs"
	@echo "  make shell SERVICE=<name>         Access container shell"
	@echo "  make status       Show service status"
	@echo "  make clean        Clean up all Docker resources"
	@echo "  make fclean       Deep clean (including cache)"
	@echo "  make info         Show Docker storage info"
	@echo "  make help         Show this help message"
	@echo "  make re           Full rebuild from scratch"
	@echo ""
	@echo "🌐 Access: https://localhost:443"
	@echo ""
	@echo "💡 Development: Use 'make dev' for fast development (hot-reload)"
	@echo "🏫 Evaluation: Use 'make all' for campus/evaluation (campus-safe)"
	@echo ""
	@echo "🐳 Using: $(DOCKER_COMPOSE)"

.PHONY: all dev down restart logs logs-service shell clean fclean status info help re setup
