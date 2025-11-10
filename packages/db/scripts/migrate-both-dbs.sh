#!/bin/bash

# Script to run migrations on both local and Neon databases

set -e

echo "🚀 Running migrations on both databases..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database URLs
LOCAL_DB_URL="postgresql://postgres:admin@localhost:5433/ai_file_cleanup"
NEON_DB_URL="postgresql://neondb_owner:npg_8SR4galwVZcW@ep-divine-fire-a193qywk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

MIGRATION_FILE="prisma/migrations/20250127000000_optimize_vector_indexes/migration.sql"

# Function to run migration on a database
run_migration() {
    local db_url=$1
    local db_name=$2
    
    echo -e "${YELLOW}🔄 Running migration on ${db_name}...${NC}"
    
    # Use psql to execute the migration
    if command -v psql &> /dev/null; then
        # Extract connection details from URL
        if [[ $db_url == postgresql://* ]]; then
            # Parse URL: postgresql://user:pass@host:port/dbname
            local url_part="${db_url#postgresql://}"
            local user_pass="${url_part%%@*}"
            local user="${user_pass%%:*}"
            local pass="${user_pass#*:}"
            local host_port_db="${url_part#*@}"
            local host_port="${host_port_db%%/*}"
            local host="${host_port%%:*}"
            local port="${host_port#*:}"
            local dbname="${host_port_db#*/}"
            # Remove query parameters from dbname
            dbname="${dbname%%\?*}"
            
            # Set PGPASSWORD and run migration
            export PGPASSWORD="$pass"
            
            if psql -h "$host" -p "${port:-5432}" -U "$user" -d "$dbname" -f "$MIGRATION_FILE" 2>&1; then
                echo -e "${GREEN}✅ Migration completed on ${db_name}${NC}"
            else
                echo -e "${RED}❌ Failed to migrate ${db_name}${NC}"
                return 1
            fi
            
            unset PGPASSWORD
        fi
    else
        echo -e "${RED}❌ psql not found. Please install PostgreSQL client tools.${NC}"
        return 1
    fi
}

# Run on local database
echo -e "${YELLOW}📦 Migrating Local Database...${NC}"
if run_migration "$LOCAL_DB_URL" "Local Database"; then
    echo ""
else
    echo -e "${YELLOW}⚠️  Local database migration failed, continuing...${NC}"
    echo ""
fi

# Run on Neon database
echo -e "${YELLOW}☁️  Migrating Neon Database...${NC}"
if run_migration "$NEON_DB_URL" "Neon Database"; then
    echo ""
else
    echo -e "${RED}❌ Neon database migration failed${NC}"
    exit 1
fi

echo -e "${GREEN}✨ All migrations completed successfully!${NC}"

