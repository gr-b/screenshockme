# Multi-stage Dockerfile for Screenshock.me
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Python backend with uv and serve everything
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV DEBUG=False
ENV UV_SYSTEM_PYTHON=1

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Create app directory
WORKDIR /app

# Copy Python project files
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy backend code
COPY backend/ ./

# Make run_server.sh executable
RUN chmod +x run_server.sh

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create templates directory and copy index.html for Django to serve
RUN mkdir -p templates
RUN cp frontend/build/index.html templates/index.html

# Copy all static assets from React build
RUN mkdir -p static/
RUN if [ -d "frontend/build/static" ]; then cp -r frontend/build/static/* static/; fi
# Copy any other assets from build root (favicon, manifest, etc.)
RUN find frontend/build -maxdepth 1 -type f ! -name "index.html" -exec cp {} static/ \;

# Generate BAML client
RUN uv run python generate_baml.py

# Collect static files
RUN uv run python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000


# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/monitor/ -X POST -H "Content-Type: application/json" -d '{"base64_encoded_image":"test","focus_description":"test"}' || exit 1

# Run the application using run_server.sh
CMD ["./run_server.sh"]