# start everything for prod environment
all:
	@echo "Starting production environment..."
	@./scripts/generate-ssl.sh
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ Production environment started at https://localhost:443"

# start everything for dev environment
dev:
	@echo "Starting development environment..."
	@./scripts/generate-ssl.sh
	docker-compose up -d --build
	@echo "✅ Development environment started at https://localhost:443"

# stop everything
down:
	@echo "🛑 Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
	@echo "✅ All services stopped"

# restart development environment
restart: down dev

# view logs
logs:
	docker-compose logs -f

# view logs for specific service
logs-service:
	@echo "Usage: make logs-service SERVICE=backend"
	docker-compose logs -f $(SERVICE)

# access a container's shell
shell:
	@echo "Usage: make shell SERVICE=backend"
	docker exec -it ft_transcendence_$(SERVICE) sh

# clean up everything (volumes, images, networks)
clean: down
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans 2>/dev/null || true
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
	docker system prune -f
	@echo "✅ Cleanup completed"

# show status of all services
status:
	@echo "📊 Service Status:"
	docker-compose ps

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
	@echo "  make help         Show this help message"
	@echo ""
	@echo "🌐 Access: https://localhost:443"
	@echo ""
	@echo "💡 Development: Use 'make dev' for fast development (hot-reload)"
	@echo "🏫 Evaluation: Use 'make all' for campus/evaluation (campus-safe)"

.PHONY: all dev down restart logs logs-service shell clean status help