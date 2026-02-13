#!/bin/bash
# PostgreSQL initialization script
# Creates the test database and enables PostGIS extension

set -e

echo "Creating test database: eccc_db_test"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE eccc_db_test;
    GRANT ALL PRIVILEGES ON DATABASE eccc_db_test TO $POSTGRES_USER;
EOSQL

echo "Enabling PostGIS extension on eccc_db"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL

echo "Enabling PostGIS extension on eccc_db_test"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "eccc_db_test" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL

echo "Database initialization completed successfully"
