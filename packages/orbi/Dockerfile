FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ripgrep ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY dist/orbi-linux-x64/bin/orbi /usr/local/bin/orbi
RUN chmod +x /usr/local/bin/orbi && orbi --version

ENTRYPOINT ["orbi"]
