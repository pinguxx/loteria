# Build stage
FROM rust:1.83-slim AS builder
WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Copy actual source code
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Production runtime stage (tiny image)
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/loteria /app/loteria
COPY public /app/public

ENV PORT=3000
EXPOSE 3000

CMD ["/app/loteria"]
