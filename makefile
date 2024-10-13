include .env
export

.DEFAULT_GOAL := help

help:
	@echo "Available targets:"
	@echo "  up              - Start all services"
	@echo "  down            - Stop all services"
	@echo "  start           - Build and run all services"
	@echo "  logs            - View logs for only the api service"
	@echo "  logs-all        - View logs of all services"
up:
	docker-compose up -d

down:
	docker-compose down

start:
	docker-compose up --build -d

logs:
	docker-compose logs -f api

logs-all:
	docker-compose logs -f

.PHONY: help up down start logs logs-all