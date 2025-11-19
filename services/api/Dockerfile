# Multi-stage build for Python API service with Prisma support
# Stage 1: Build stage with Node.js for Prisma generation
FROM python:3.13-slim AS builder

# Install Node.js, npm, and system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements from services/api
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Prisma schema from the monorepo (build context is repo root)
COPY packages/db/prisma/schema.prisma /tmp/schema.prisma

# Generate Prisma client with the schema
RUN python -m prisma generate --schema /tmp/schema.prisma

# Stage 2: Runtime stage (Python only, smaller image)
FROM python:3.13-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python packages from builder (includes generated Prisma client)
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code from services/api (build context is repo root)
COPY services/api/ .

# Create necessary directories
RUN mkdir -p /app/uploads /app/temp_files /app/logs

# Expose port (Render will provide the PORT env var)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

# Run the application using run.py (which reads PORT env var)
CMD ["python", "run.py"]
