# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && pip install uv

COPY pyproject.toml uv.lock ./
RUN uv venv /app/.venv && . /app/.venv/bin/activate && uv pip install .

COPY . .

# Final stage
FROM python:3.12-slim
WORKDIR /app

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Set environment to use the virtualenv
ENV PATH="/app/.venv/bin:$PATH"

USER app
EXPOSE 8003

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]