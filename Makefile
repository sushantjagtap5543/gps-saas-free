.PHONY: help install dev build deploy logs backup clean stop restart migrate seed status

# Colors for output
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help:
	@echo "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
	@echo "${BLUE}║           GPS-Free-SaaS Make Commands                    ║${NC}"
	@echo "${BLUE}╠══════════════════════════════════════════════════════════╣${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make install${NC}    - Install all dependencies            ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make dev${NC}        - Start development environment        ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make build${NC}      - Build production images            ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make deploy${NC}     - Deploy to production               ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make stop${NC}       - Stop all services                  ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make restart${NC}    - Restart all services               ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make logs${NC}       - View logs                          ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make status${NC}     - Check service status               ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make backup${NC}     - Create database backup             ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make migrate${NC}    - Run database migrations            ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make seed${NC}       - Seed database with default data    ${BLUE}║${NC}"
	@echo "${BLUE}║${NC}  ${GREEN}make clean${NC}      - Clean up containers and volumes    ${BLUE}║${NC}"
	@echo "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"

install:
	@echo "${YELLOW}Installing backend dependencies...${NC}"
	cd backend && npm install
	@echo "${YELLOW}Installing frontend dependencies...${NC}"
	cd frontend && npm install
	@echo "${YELLOW}Installing gps-server dependencies...${NC}"
	cd gps-server && npm install
	@echo "${GREEN}✅ All dependencies installed!${NC}"

dev:
	@echo "${YELLOW}Starting development environment...${NC}"
	docker-compose up -d postgres redis
	cd backend && npm run start:dev &
	cd frontend && npm run dev &
	cd gps-server && npm run start:dev &
	@echo "${GREEN}✅ Development servers started!${NC}"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:3001"
	@echo "GPS Server: ports 5000, 5001, 5002"

build:
	@echo "${YELLOW}Building production images...${NC}"
	docker-compose -f docker-compose.prod.yml build
	@echo "${GREEN}✅ Production images built!${NC}"

deploy:
	@echo "${YELLOW}Deploying to production...${NC}"
	docker-compose -f docker-compose.prod.yml up -d
	@echo "${GREEN}✅ Production deployment complete!${NC}"
	@echo "Access your application at: http://localhost"

stop:
	@echo "${YELLOW}Stopping all services...${NC}"
	docker-compose -f docker-compose.prod.yml down
	@echo "${GREEN}✅ All services stopped!${NC}"

restart: stop deploy

logs:
	@echo "${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"
	docker-compose -f docker-compose.prod.yml logs -f

status:
	@echo "${YELLOW}Service Status:${NC}"
	docker-compose -f docker-compose.prod.yml ps

backup:
	@echo "${YELLOW}Creating database backup...${NC}"
	@mkdir -p backups
	docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U gpsadmin gpstrack > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}✅ Backup created in backups/ folder!${NC}"

migrate:
	@echo "${YELLOW}Running database migrations...${NC}"
	docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
	@echo "${GREEN}✅ Migrations complete!${NC}"

seed:
	@echo "${YELLOW}Seeding database...${NC}"
	docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
	@echo "${GREEN}✅ Database seeded!${NC}"

shell-backend:
	docker-compose -f docker-compose.prod.yml exec backend sh

shell-frontend:
	docker-compose -f docker-compose.prod.yml exec web sh

shell-gps:
	docker-compose -f docker-compose.prod.yml exec gps-server sh

clean:
	@echo "${YELLOW}Cleaning up containers and volumes...${NC}"
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f
	@echo "${GREEN}✅ Cleanup complete!${NC}"

update:
	@echo "${YELLOW}Updating application...${NC}"
	git pull
	docker-compose -f docker-compose.prod.yml build
	docker-compose -f docker-compose.prod.yml up -d
	@echo "${GREEN}✅ Update complete!${NC}"

health-check:
	@echo "${YELLOW}Checking service health...${NC}"
	@curl -s http://localhost/health || echo "Nginx: DOWN"
	@curl -s http://localhost:3001/health || echo "Backend: DOWN"
	@echo "${GREEN}✅ Health check complete!${NC}"
