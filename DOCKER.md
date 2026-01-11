# LifeSOS to MQTT - Standalone Docker Container

This directory contains the standalone Docker setup for running NodeSoS_mqtt outside of Home Assistant.

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t lifesos2mqtt:latest .
```

### 2. Create Configuration

Copy the example configuration and edit it with your settings:

```bash
mkdir -p config
cp config/lifesos2mqtt.example.yaml config/lifesos2mqtt.yaml
```

Edit `config/lifesos2mqtt.yaml` with your:
- LifeSOS alarm system IP address and port
- LifeSOS password (if required)
- MQTT broker connection details
- Device configurations

### 3. List Available Devices (Optional)

Before running the main service, you can list all enrolled devices on your LS30 base unit:

```bash
docker run --rm -v $(pwd)/config:/config lifesos2mqtt:latest list-devices -c /config/lifesos2mqtt.yaml
```

This will show you the device IDs that you can add to your configuration.

### 4. Run with Docker Compose

```bash
docker-compose up -d
```

Or run directly with Docker:

```bash
docker run -d \
  --name lifesos2mqtt \
  --restart unless-stopped \
  -v $(pwd)/config:/config \
  lifesos2mqtt:latest
```

## Configuration

### LifeSOS Connection

The `lifesos` section configures the connection to your LifeSOS alarm system:

```yaml
lifesos:
  host: '192.168.1.100'  # IP address of your LS-20/LS-30
  port: 1680              # Default port
  password: ''            # Master password if required
```

### MQTT Connection

The `mqtt` section configures the connection to your MQTT broker:

```yaml
mqtt:
  uri: 'mqtt://username:password@192.168.1.50:1883'
  client_id: lifesos
```

URI formats:
- No authentication: `mqtt://localhost:1883`
- With authentication: `mqtt://user:pass@broker.host:1883`
- With SSL/TLS: `mqtts://user:pass@broker.host:8883`

### Devices

Add your devices to the `adapter.devices` array. Each device needs:
- `topic`: MQTT topic for this device
- `id`: Device ID (get this from `list-devices` command)
- `name`: Friendly name
- `manufacturer`: Manufacturer name (optional)
- `model`: Model name (optional)

Example:

```yaml
adapter:
  devices:
    - topic: home/kitchen/pir
      id: 012cba
      name: Kitchen PIR
      manufacturer: LifeSOS
      model: PIR Sensor
```

## Docker Compose Examples

### Basic Setup

```yaml
version: '3.8'

services:
  lifesos2mqtt:
    image: lifesos2mqtt:latest
    container_name: lifesos2mqtt
    restart: unless-stopped
    volumes:
      - ./config:/config
```

### With Local Mosquitto Broker

```yaml
version: '3.8'

services:
  lifesos2mqtt:
    image: lifesos2mqtt:latest
    container_name: lifesos2mqtt
    restart: unless-stopped
    volumes:
      - ./config:/config
    depends_on:
      - mosquitto

  mosquitto:
    image: eclipse-mosquitto:latest
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
```

### With Verbose Logging

```yaml
version: '3.8'

services:
  lifesos2mqtt:
    image: lifesos2mqtt:latest
    container_name: lifesos2mqtt
    restart: unless-stopped
    volumes:
      - ./config:/config
    command: ["start", "-c", "/config/lifesos2mqtt.yaml", "-v"]
```

## Commands

### Start the service

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f
```

### Stop the service

```bash
docker-compose down
```

### List enrolled devices

```bash
docker-compose run --rm lifesos2mqtt list-devices -c /config/lifesos2mqtt.yaml
```

### Run with verbose output

```bash
docker-compose run --rm lifesos2mqtt start -c /config/lifesos2mqtt.yaml -v
```

## Troubleshooting

### Cannot connect to LifeSOS

- Verify the IP address and port in your configuration
- Ensure the LifeSOS device is on the same network or accessible from the Docker host
- Check if a password is required and configured correctly

### Cannot connect to MQTT broker

- Verify the MQTT URI in your configuration
- Test MQTT connection manually: `mosquitto_sub -h broker.host -t '#' -u user -P pass`
- If using `localhost` in the URI, change it to the actual IP or use Docker networking

### Devices not appearing in Home Assistant

- Ensure Home Assistant MQTT integration is configured
- Verify the `discovery_prefix` matches Home Assistant's configuration (default: `homeassistant`)
- Check MQTT topics: `mosquitto_sub -h broker.host -t 'homeassistant/#' -u user -P pass`
- Restart Home Assistant after devices are published

### Check container logs

```bash
docker logs lifesos2mqtt
```

## Environment Variables

You can set these environment variables:

- `TZ`: Timezone (e.g., `Europe/Stockholm`, `America/New_York`)
- `CONFIG_PATH`: Path to config file (default: `/config/lifesos2mqtt.yaml`)

Example:

```yaml
environment:
  - TZ=Europe/Stockholm
```

## Building for Different Architectures

To build for specific platforms:

```bash
# For ARM64 (e.g., Raspberry Pi 4, Apple Silicon)
docker buildx build --platform linux/arm64 -t lifesos2mqtt:arm64 .

# For ARMv7 (e.g., Raspberry Pi 3)
docker buildx build --platform linux/arm/v7 -t lifesos2mqtt:armv7 .

# For AMD64 (standard x86_64)
docker buildx build --platform linux/amd64 -t lifesos2mqtt:amd64 .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t lifesos2mqtt:latest .
```

## Home Assistant Integration

This standalone container works perfectly with Home Assistant's MQTT integration:

1. Configure MQTT in Home Assistant
2. Point this container to the same MQTT broker
3. Devices will be automatically discovered via MQTT Discovery
4. Control your LifeSOS alarm through Home Assistant

## Version

This Docker setup uses NodeSoS_mqtt version 3.0.3 by default. To use a different version, build with:

```bash
docker build --build-arg NODESOS_MQTT_VERSION=3.0.4 -t lifesos2mqtt:latest .
```

## Support

For issues specific to the Docker setup, please open an issue at:
https://github.com/bratanon/lifesos_addon/issues

For issues with NodeSoS_mqtt itself, see:
https://www.npmjs.com/package/nodesos_mqtt
