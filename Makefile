# ============================================================================
# GPS-FREE-SAAS Makefile
# ============================================================================
# Quick commands for managing the GPS tracking system
# ============================================================================

.PHONY: help deploy start stop restart logs status clean backup diagnose update

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  GPS-FREE-SAAS Management Commands$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

deploy: ## Complete deployment (run once)
	@echo "$(BLUE)Starting deployment...$(NC)"
	@chmod +x deploy.sh
	@./deploy.sh

start: ## Start all services
	@echo "$(BLUE)Starting services...$(NC)"
	@docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)Services started!$(NC)"
	@make status

stop: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	@docker compose -f docker-compose.prod.yml down
	@echo "$(GREEN)Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting services...$(NC)"
	@docker compose -f docker-compose.prod.yml restart
	@echo "$(GREEN)Services restarted$(NC)"

logs: ## View logs (all services)
	@docker compose -f docker-compose.prod.yml logs -f

logs-backend: ## View backend logs only
	@docker compose -f docker-compose.prod.yml logs -f backend

logs-frontend: ## View frontend logs only
	@docker compose -f docker-compose.prod.yml logs -f web

logs-gps: ## View GPS server logs only
	@docker compose -f docker-compose.prod.yml logs -f gps-server

logs-db: ## View database logs only
	@docker compose -f docker-compose.prod.yml logs -f postgres

status: ## Check status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	@docker compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "$(BLUE)Health Checks:$(NC)"
	@curl -sf http://localhost:3001/health && echo "$(GREEN)✓ Backend API: OK$(NC)" || echo "$(RED)✗ Backend API: FAIL$(NC)"
	@curl -sI http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Frontend: OK$(NC)" || echo "$(RED)✗ Frontend: FAIL$(NC)"
	@docker exec gps_postgres pg_isready -U gpsadmin > /dev/null 2>&1 && echo "$(GREEN)✓ Database: OK$(NC)" || echo "$(RED)✗ Database: FAIL$(NC)"
	@docker exec gps_redis redis-cli ping > /dev/null 2>&1 && echo "$(GREEN)✓ Redis: OK$(NC)" || echo "$(RED)✗ Redis: FAIL$(NC)"

health: ## Run health checks
	@echo "$(BLUE)Running health checks...$(NC)"
	@echo ""
	@echo "Backend API:"
	@curl -sf http://localhost:3001/health | jq . || echo "$(RED)Failed$(NC)"
	@echo ""
	@echo "Database:"
	@docker exec gps_postgres pg_isready -U gpsadmin || echo "$(RED)Failed$(NC)"
	@echo ""
	@echo "Redis:"
	@docker exec gps_redis redis-cli ping || echo "$(RED)Failed$(NC)"

build: ## Rebuild all services
	@echo "$(BLUE)Rebuilding services...$(NC)"
	@docker compose -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)Build complete$(NC)"

rebuild: build restart ## Rebuild and restart

clean: ## Stop and remove all containers, volumes
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@docker compose -f docker-compose.prod.yml down -v
	@echo "$(GREEN)Cleanup complete$(NC)"

clean-all: clean ## Remove everything including images
	@echo "$(YELLOW)Removing all Docker resources...$(NC)"
	@docker system prune -a -f
	@echo "$(GREEN)Complete cleanup done$(NC)"

backup: ## Backup database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p backups
	@docker exec gps_postgres pg_dump -U gpsadmin gpstrack > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in backups/ directory$(NC)"

restore: ## Restore database (usage: make restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify FILE=path/to/backup.sql$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restoring database from $(FILE)...$(NC)"
	@cat $(FILE) | docker exec -i gps_postgres psql -U gpsadmin gpstrack
	@echo "$(GREEN)Database restored$(NC)"

shell-backend: ## Open shell in backend container
	@docker exec -it gps_backend sh

shell-db: ## Open PostgreSQL shell
	@docker exec -it gps_postgres psql -U gpsadmin -d gpstrack

shell-redis: ## Open Redis CLI
	@docker exec -it gps_redis redis-cli

diagnose: ## Run diagnostic script
	@echo "$(BLUE)Running diagnostics...$(NC)"
	@chmod +x diagnose.sh
	@./diagnose.sh

update: ## Pull latest images and restart
	@echo "$(BLUE)Updating...$(NC)"
	@docker compose -f docker-compose.prod.yml pull
	@docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)Update complete$(NC)"

env-check: ## Validate environment configuration
	@echo "$(BLUE)Checking environment configuration...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ .env file exists$(NC)"
	@grep -q "DB_PASSWORD=" .env && echo "$(GREEN)✓ DB_PASSWORD set$(NC)" || echo "$(RED)✗ DB_PASSWORD missing$(NC)"
	@grep -q "JWT_SECRET=" .env && echo "$(GREEN)✓ JWT_SECRET set$(NC)" || echo "$(RED)✗ JWT_SECRET missing$(NC)"
	@echo ""
	@echo "$(YELLOW)Note: This only checks if variables exist, not their values$(NC)"

migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	@docker exec gps_backend npx prisma migrate deploy
	@echo "$(GREEN)Migrations complete$(NC)"

seed: ## Seed database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	@docker exec gps_backend npx prisma db seed
	@echo "$(GREEN)Database seeded$(NC)"

stats: ## Show Docker resource usage
	@echo "$(BLUE)Resource Usage:$(NC)"
	@docker stats --no-stream

disk: ## Show disk usage
	@echo "$(BLUE)Disk Usage:$(NC)"
	@df -h
	@echo ""
	@echo "$(BLUE)Docker Disk Usage:$(NC)"
	@docker system df

ports: ## Show open ports
	@echo "$(BLUE)Listening Ports:$(NC)"
	@sudo netstat -tlnp | grep -E '(3000|3001|5000|5001|5002|5432|6379)' || echo "No relevant ports found"

test-api: ## Test API endpoint
	@echo "$(BLUE)Testing API...$(NC)"
	@curl -sf http://localhost:3001/health | jq .
	@echo ""
	@echo "$(GREEN)API is responding$(NC)"

test-gps: ## Test GPS server connectivity
	@echo "$(BLUE)Testing GPS ports...$(NC)"
	@for port in 5000 5001 5002; do \
		timeout 1 bash -c "echo > /dev/tcp/localhost/$$port" 2>/dev/null && \
		echo "$(GREEN)✓ Port $$port: Open$(NC)" || \
		echo "$(RED)✗ Port $$port: Closed$(NC)"; \
	done

dev-logs: ## Follow all logs with timestamps
	@docker compose -f docker-compose.prod.yml logs -f --timestamps

quick-deploy: ## Quick deploy (skip checks)
	@docker compose -f docker-compose.prod.yml up -d --build

fix-permissions: ## Fix file permissions
	@echo "$(BLUE)Fixing permissions...$(NC)"
	@chmod 755 deploy.sh diagnose.sh
	@chmod 644 docker-compose.prod.yml .env
	@chmod 755 backups logs
	@echo "$(GREEN)Permissions fixed$(NC)"

version: ## Show version information
	@echo "$(BLUE)GPS-FREE-SAAS Version Info:$(NC)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker compose version)"
	@echo "Docker API: $$(docker version --format '{{.Client.APIVersion}}')"

# Development helpers
dev-rebuild-backend: ## Rebuild only backend
	@docker compose -f docker-compose.prod.yml up -d --build backend

dev-rebuild-frontend: ## Rebuild only frontend
	@docker compose -f docker-compose.prod.yml up -d --build web

dev-restart-backend: ## Restart only backend
	@docker compose -f docker-compose.prod.yml restart backend

dev-restart-frontend: ## Restart only frontend
	@docker compose -f docker-compose.prod.yml restart web
