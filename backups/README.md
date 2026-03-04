# Database Backups

This folder contains database backup files.

## Creating Backups

### Automatic Backup
```bash
make backup
```

### Manual Backup
```bash
docker-compose exec postgres pg_dump -U gpsadmin gpstrack > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

## Restoring Backups

```bash
# Copy backup into container
docker cp backup_file.sql gps_postgres:/tmp/

# Restore
docker-compose exec postgres psql -U gpsadmin -d gpstrack -f /tmp/backup_file.sql
```

## Backup Schedule

Recommended: Daily backups at off-peak hours

```cron
0 2 * * * cd /opt/gps && make backup
```

## Retention Policy

Keep backups for 30 days:
```bash
find backups -name "*.sql" -mtime +30 -delete
```
