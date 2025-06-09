# start everything
dev:
	docker-compose up --build

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

.PHONY: dev down logs