FROM alpine AS base

ARG BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=${BUN_RUNTIME_TRANSPILER_CACHE_PATH}
RUN apk add libgcc libstdc++ ripgrep

FROM base AS build-amd64
COPY dist/orbi-linux-x64/bin/orbi /usr/local/bin/orbi

FROM base AS build-arm64
COPY dist/orbi-linux-x64/bin/orbi /usr/local/bin/orbi

ARG TARGETARCH
FROM build-${TARGETARCH}
RUN orbi --version
ENTRYPOINT ["orbi"]
