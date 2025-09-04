# start everything for prod environment
NAME = ft_transcendence

all:
	docker-compose -f docker-compose.prod.yml up --build
# start everything for dev environment
dev:
	docker-compose up -d --build 

# stop everything
down:
	docker-compose down

# view logs
logs:
	docker-compose logs -f

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

# clean and recreate all
re: clean all

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
	@echo "  make re 					 Clean up all resources and restart"
	@echo ""
	@echo "🌐 Access: https://localhost:443"
	@echo ""
	@echo "💡 Development: Use 'make dev' for fast development (hot-reload)"
	@echo "🏫 Evaluation: Use 'make all' for campus/evaluation (campus-safe)"

.PHONY: all dev down restart logs logs-service shell clean status help
