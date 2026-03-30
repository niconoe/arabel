    # Testing the Docker Setup Before Shipping

## Quick Checklist

Run through these steps in order. Each step must pass before moving to the next.

## 1. Set Up .env

    cp .env.example .env

Edit `.env`: set any non-empty value for `POSTGRES_PASSWORD` and `DJANGO_SECRET_KEY`.

## 2. Build and Start

    docker compose up --build

Watch the output. You should see in order:

- `db` container starts and becomes healthy
- `web` container runs `migrate` (prints applied migration names)
- `web` container runs `collectstatic` (prints copied file count)
- Gunicorn starts: `[INFO] Listening at: http://0.0.0.0:8000`

Any traceback at this stage means something is wrong - read the error before proceeding.

## 3. Check Container Status

In a second terminal:

    docker compose ps

Expected: both `db` and `web` show status `running`. `db` should show `healthy`.

## 4. Smoke Test: Home Page

    curl -I http://localhost:8000/

Expected: HTTP 200 (or a redirect). A 500 means Django crashed - check logs.

## 5. Smoke Test: Admin Page

    curl -I http://localhost:8000/admin/

Expected: HTTP 200 or 302 redirect to login page.

## 6. Smoke Test: Static Files

    curl -I http://localhost:8000/static/admin/css/base.css

Expected: HTTP 200. A 404 here means collectstatic did not run or WhiteNoise is not
configured correctly.

## 7. Inspect Logs

    docker compose logs web

Look for tracebacks or warnings. `DisallowedHost` errors mean `DJANGO_ALLOWED_HOSTS`
in `.env` does not include the hostname you are accessing the app from.

## 8. Toggle Debug Mode

If something looks wrong but you cannot tell why:

1. Edit `.env`: set `DJANGO_DEBUG=True`
2. Restart the web container: `docker compose restart web`
3. Reproduce the issue - Django will now show full error pages with tracebacks
4. Set `DJANGO_DEBUG=False` and restart again before shipping

## 9. Inspect the Database Directly

    docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB

Inside psql:

    \dt          -- list tables
    \q           -- quit

## 10. Test the DB Dump Restore (Optional but Recommended)

If you have a sample dump file, test the full restore flow:

    docker compose exec -T db pg_restore \
        --username=$POSTGRES_USER \
        --dbname=$POSTGRES_DB \
        --no-owner \
        --no-privileges \
        /dev/stdin < /path/to/sample.dump

Then visit the app and verify data is visible.

## 11. Full Teardown and Clean Slate

To reset everything (wipes the database volume):

    docker compose down -v

Then `docker compose up --build` gives you a completely fresh environment.
Use this to verify first-time setup works from scratch.
