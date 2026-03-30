# Deployment Guide

## Prerequisites

Install Docker Desktop (Mac/Windows) or Docker Engine + the Compose plugin (Linux).
Verify with:

    docker compose version

## First-Time Setup

1. Copy the environment file template and open it in a text editor:

       cp .env.example .env

2. In `.env`, replace the two `changeme` values:

   - `POSTGRES_PASSWORD` - choose a strong password (no spaces or quotes)
   - `DJANGO_SECRET_KEY` - choose a long random string (50+ characters)

   Leave all other values as-is unless you know you need to change them.

## Start the Application

    docker compose up -d

The first start will take a couple of minutes while Docker downloads the required images and
builds the application container. Subsequent starts are much faster.

The application is available at: http://localhost:8000

## Load the Database Dump

Once the application is running, load the `.dump` file provided by your supplier:

    docker compose exec -T db pg_restore \
        --username=$POSTGRES_USER \
        --dbname=$POSTGRES_DB \
        --no-owner \
        --no-privileges \
        /dev/stdin < /path/to/arabel.dump

Replace `/path/to/arabel.dump` with the actual path to the dump file on your machine.

After loading, restart the web container to clear any cached state:

    docker compose restart web

## Stop the Application

    docker compose down

This stops all containers. Your database data is preserved in a Docker volume and will
be available on the next `docker compose up`.

## View Logs

    docker compose logs -f web

Press Ctrl+C to stop following the logs.

## Restart After a Server Reboot

If the server restarts, run `docker compose up -d` again from the project directory.
To start automatically on boot, consult the Docker documentation for your operating system.
