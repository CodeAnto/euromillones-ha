# ---------- Stage 1: build del frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /build
# El frontend habla con el backend a través de nginx en "api" (ruta RELATIVA, sin / inicial).
# Así funciona igual bajo el Ingress (/api/hassio_ingress/<token>/api/...) que en el puerto directo (/api/...)
ENV VITE_API_URL=api
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: imagen final (backend + nginx) ----------
FROM python:3.12-slim

# nginx para servir el frontend + bash para run.sh
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx gcc bash \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencias Python del backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código del backend
COPY backend/app ./app

# Frontend ya compilado
COPY --from=frontend /build/dist /usr/share/nginx/html

# Config nginx del add-on
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default

# Script de arranque
COPY run.sh /run.sh
RUN chmod +x /run.sh

ENV DB_PATH=/data/euromillones.db

EXPOSE 8099
CMD ["/run.sh"]
