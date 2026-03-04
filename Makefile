.PHONY: help install dev build deploy logs backup clean

help:
	@echo "GPS-Free-SaaS Commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development environment"
	@echo "  make build      - Build production images"
	@echo "  make deploy     - Deploy to production"
	@echo "  make logs       - View logs"
	@echo "  make backup     - Create database backup"
	@echo "  make clean      - Clean up containers and volumes"

install:
	cd backend && npm install
	cd frontend && npm install
	cd gps-server && npm install

dev:
	docker-compose up -d postgres redis
	cd backend && npm run start:dev &
	cd frontend && npm run dev &
	cd gps-server && npm run start:dev

build:
	docker-compose -f docker-compose.prod.yml build

deploy:
	docker-compose -f docker-compose.prod.yml up -d

logs:
	docker-compose -f docker-compose.prod.yml logs -f

backup:
	docker-compose exec postgres pg_dump -U gpsadmin gpstrack > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql

clean:
	docker-compose down -v
	docker system prune -f

seed:
	docker-compose exec backend npx prisma db seed

migrate:
	docker-compose exec backend npx prisma migrate deploy
