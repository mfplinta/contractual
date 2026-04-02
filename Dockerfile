# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

# ---------- Python deps ----------
FROM base AS python-deps
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# ---------- Frontend build ----------
FROM node:25-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ---------- Dev ----------
FROM python-deps AS dev
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl nodejs npm libreoffice && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 8000 3000

# ---------- Prod ----------
FROM python-deps AS prod
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir gunicorn
COPY --from=caddy:2 /usr/bin/caddy /usr/bin/caddy

COPY backend/ backend/
COPY --from=frontend-build /app/frontend/dist frontend/dist
COPY Caddyfile Caddyfile

WORKDIR /app/backend
RUN SECRET_KEY=build python manage.py collectstatic --noinput

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data/media /app/data

EXPOSE 80

CMD ["sh", "-c", "python manage.py migrate --no-input && python manage.py create_initial_user && gunicorn contractual.wsgi:application --bind 127.0.0.1:8000 & exec caddy run --config /app/Caddyfile"]