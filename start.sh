#!/usr/bin/env bash
# -------------------------------------------------
# Run both the static site (nginx) and the API (uvicorn)
# -------------------------------------------------

# 1️⃣ Start nginx in the background
nginx -g "daemon off;" &
NGINX_PID=$!

# 2️⃣ Activate the Python virtual environment
source /opt/venv/bin/activate

# 3️⃣ Set default env vars (Render can override these)
: "${DATABASE_URL:=sqlite:///kyc_audit.db}"
: "${SECRET_KEY:=dummy-secret}"
: "${NEXT_PUBLIC_API_URL:=http://localhost:8000}"

# 4️⃣ Run uvicorn – use the correct import path for the FastAPI app
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
UVICORN_STATUS=$?

# 5️⃣ If uvicorn exits, shut down nginx so the container stops cleanly
kill $NGINX_PID
exit $UVICORN_STATUS
