FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=arabel.settings_production

ARG GIT_REVISION=unknown
ENV GIT_REVISION=${GIT_REVISION}

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    binutils \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos '' appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

RUN mkdir -p /app/staticfiles && chown appuser:appuser /app/staticfiles
RUN chmod +x docker-entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
