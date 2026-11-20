# -------------------------------------------------
#  Multi-stage build – Frontend (Next.js)
# -------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build   # produces .next/ output

# -------------------------------------------------
#  Backend build – Python FastAPI/Flask
# -------------------------------------------------
FROM python:3.12-slim AS backend-builder
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# -------------------------------------------------
#  Final runtime image – Nginx (static) + Uvicorn (API)
# -------------------------------------------------
FROM nginx:alpine AS runtime
# 1️⃣ Copy static site
COPY --from=frontend-builder /app/frontend/.next /usr/share/nginx/html
COPY --from=frontend-builder /app/frontend/public /usr/share/nginx/html/public
# 2️⃣ Copy backend code & virtual env
COPY --from=backend-builder /opt/venv /opt/venv
COPY --from=backend-builder /app/backend /app/backend

# Expose ports
EXPOSE 80
EXPOSE 8000

# 3️⃣ Entrypoint script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
