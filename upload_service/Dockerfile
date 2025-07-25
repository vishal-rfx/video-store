# Builder stage
FROM --platform=linux/amd64 python:3.12-slim AS builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && pip install uv

COPY pyproject.toml uv.lock ./
RUN uv venv /app/.venv && . /app/.venv/bin/activate && uv pip install .

COPY . .

# Final stage
FROM --platform=linux/amd64 python:3.12-slim
WORKDIR /app

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Set environment to use the virtualenv
ENV PATH="/app/.venv/bin:$PATH"

USER app
EXPOSE 8000

CMD ["./start.sh"]