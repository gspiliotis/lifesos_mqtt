FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install nodesos_mqtt
ARG NODESOS_MQTT_VERSION="3.0.3"

RUN npm install -g nodesos_mqtt@${NODESOS_MQTT_VERSION} \
    --no-audit \
    --no-fund \
    --no-update-notifier \
    --omit=dev

# Create config directory
RUN mkdir -p /config

# Set the default config path
ENV CONFIG_PATH=/config/lifesos2mqtt.yaml

# Expose any ports if needed (not required for MQTT client, but useful for documentation)
# EXPOSE 1680

# Volume for configuration
VOLUME ["/config"]

# Health check (optional - checks if nodesos_mqtt process is running)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f nodesos_mqtt || exit 1

# Run nodesos_mqtt
ENTRYPOINT ["nodesos_mqtt"]
CMD ["start", "-c", "/config/lifesos2mqtt.yaml"]
