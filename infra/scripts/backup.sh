#!/bin/bash
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gps_backup_${TIMESTAMP}.sql"

echo "💾 Starting database backup..."

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Dump database
pg_dump -h postgres -U gpsadmin gpstrack > ${BACKUP_DIR}/${BACKUP_FILE}

# Compress
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "gps_backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backup complete: ${BACKUP_FILE}.gz"
