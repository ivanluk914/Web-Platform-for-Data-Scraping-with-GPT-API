include .env
export

.DEFAULT_GOAL := help

help:
	@echo "Available targets:"
	@echo "  up              - Start all services"
	@echo "  down            - Stop all services"
	@echo "  start           - Build and run all services"
	@echo "  logs            - View docker logs of all services"
	@echo "  deploy          - Deploy local minikube environment"

up:
	docker-compose up -d

down:
	docker-compose down

start:
	docker-compose up --build -d

logs:
	docker-compose logs -f

deploy:
	./infra/scripts/bootstrap_cluster.sh

.PHONY: help up down start logs deploy