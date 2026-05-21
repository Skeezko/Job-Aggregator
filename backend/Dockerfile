# ===== Stage 1: builder =====
FROM rust:1.95-slim-bookworm AS builder

# Install build dependencies for native crates (sqlx, openssl, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Trick: copy only Cargo manifests first to cache the dependency build
# This means cargo build only re-runs when dependencies change, not on every code change
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release --bin jobaggr-backend
RUN rm -rf src target/release/jobaggr-backend target/release/deps/jobaggr_backend*

# Now copy the actual source code and the sqlx offline cache
COPY src ./src
COPY migrations ./migrations
COPY .sqlx ./.sqlx

# Build the real binary in offline mode (uses cached queries from .sqlx/)
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin jobaggr-backend

# ===== Stage 2: runtime =====
FROM debian:bookworm-slim

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security (don't run as root in containers)
RUN useradd --create-home --shell /bin/bash app
USER app
WORKDIR /home/app

# Copy the binary and migrations from the builder stage
COPY --from=builder /app/target/release/jobaggr-backend ./jobaggr-backend
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./jobaggr-backend"]