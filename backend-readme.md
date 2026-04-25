# Quickshop Local Database (Docker)

This repo contains a complete local PostgreSQL + PostGIS database environment for **Quickshop**, plus **pgAdmin**.

## Requirements

- Docker Desktop (or Docker Engine) installed and running
- Docker Compose (Docker Desktop includes this)

## Start the database

From this directory:

```bash
docker-compose up -d
```

## Check running containers

```bash
docker ps
```

You should see:
- `quickshop_db`
- `quickshop_pgadmin`

## Open pgAdmin

Go to:

- `http://localhost:5050`

Login with:
- Email: `admin@quickshop.com`
- Password: `admin`

### Connect pgAdmin to PostgreSQL

Create a new server in pgAdmin and use:
- Host: `postgres` (NOT `localhost`)
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `quickshop_db`

## Run a test query

In pgAdmin Query Tool:

```sql
SELECT * FROM users;
```

## Reset everything (fresh database)

Stop containers:

```bash
docker-compose down
```

Remove volumes (THIS DELETES ALL DB DATA) and start fresh:

```bash
docker-compose down -v
docker-compose up -d
```

## Common errors & fixes

### Port 5432 already in use

- **Fix**: stop whatever is using port 5432 (often a local Postgres install), or change the host port mapping.

Option A (free the port):

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

Option B (change mapping to 5433 on your machine):

In `docker-compose.yml` change:

- `5432:5432` → `5433:5432`

Then connect with port `5433` from your host (pgAdmin can still use `postgres:5432` inside Docker).

### pgAdmin not loading

- **Fix**: ensure the container is running and check logs.

```bash
docker ps
docker logs quickshop_pgadmin
```

Also confirm you’re using `http://localhost:5050` (pgAdmin is exposed on container port 80).

### Connection refused (from pgAdmin to DB)

- **Fix**: in pgAdmin, set **Host** to `postgres` (service name on the Docker network), not `localhost`.
- **Fix**: wait for Postgres to become healthy.

```bash
docker logs quickshop_db
```

### Tables not created

This usually happens when the DB volume already existed, because init scripts only run on the **first** startup of a fresh data directory.

- **Fix**: reset volumes and restart:

```bash
docker-compose down -v
docker-compose up -d
```

## Files

- `docker-compose.yml`: Postgres (with PostGIS) + pgAdmin
- `db/init.sql`: creates extensions, enums, tables, and indexes on first startup

