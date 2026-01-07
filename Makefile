.PHONY: help build deploy-staging deploy-production test lint clean

# Decision parameters
BACKEND_HOSTING ?= docker
DOCKER_REGISTRY ?= ecr
SECRETS_BACKEND ?= aws-secrets

help:
	@echo "Available targets:"
	@echo "  make build                - Build Docker image"
	@echo "  make deploy-staging       - Deploy to staging (docker)"
	@echo "  make deploy-production    - Deploy to production (docker)"
	@echo "  make test                 - Run test suite"
	@echo "  make lint                 - Run linting"
	@echo ""
	@echo "Current configuration:"
	@echo "  BACKEND_HOSTING = $(BACKEND_HOSTING)"
	@echo "  DOCKER_REGISTRY = $(DOCKER_REGISTRY)"
	@echo "  SECRETS_BACKEND = $(SECRETS_BACKEND)"

build:
	docker build -t app:latest .

deploy-staging:
	@echo "Deploying to $(BACKEND_HOSTING) staging..."
	git push staging main

deploy-production:
	@echo "Deploying to $(BACKEND_HOSTING) production..."
	git push main main

test:
	pnpm test

lint:
	pnpm lint

clean:
	docker rmi app:latest || true
