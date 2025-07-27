# start everything for prod environment
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

.PHONY: dev down logs