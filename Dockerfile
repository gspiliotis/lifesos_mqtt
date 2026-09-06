# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Builder: install the full workspace (including devDependencies) and compile
# both vendored packages from source.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so dependency installation is cached independently of
# source changes. The workspace packages' manifests are needed for `npm ci` to
# resolve the workspace layout.
COPY package.json package-lock.json ./
COPY packages/nodesos/package.json           packages/nodesos/package.json
COPY packages/nodesos_mqtt/package.json      packages/nodesos_mqtt/package.json

RUN npm ci --no-audit --no-fund --no-update-notifier

# Now the sources. nodesos builds with parcel, nodesos_mqtt with tsc; npm links
# packages/nodesos into node_modules/, so the adapter compiles against the
# vendored library rather than the published package.
COPY packages/ packages/
RUN npm run build

# Drop devDependencies from the installed tree so it can be copied as-is into
# the runtime stage.
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# Runtime: production dependencies plus compiled output only.
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/nodesos/package.json      ./packages/nodesos/package.json
COPY --from=builder /app/packages/nodesos/dist              ./packages/nodesos/dist
COPY --from=builder /app/packages/nodesos_mqtt/package.json ./packages/nodesos_mqtt/package.json
COPY --from=builder /app/packages/nodesos_mqtt/dist         ./packages/nodesos_mqtt/dist

# Config directory, mounted as a volume at runtime
RUN mkdir -p /config
ENV CONFIG_PATH=/config/lifesos2mqtt.yaml
VOLUME ["/config"]

# Matches on the script path, which contains "nodesos_mqtt"
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f nodesos_mqtt || exit 1

ENTRYPOINT ["node", "/app/packages/nodesos_mqtt/dist/index.js"]
CMD ["start", "-c", "/config/lifesos2mqtt.yaml"]
