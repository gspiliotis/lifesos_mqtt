# LifeSOS to MQTT

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

This project provides an MQTT client that interfaces with [LifeSOS][lifesos-link] alarm systems, available both as a Home Assistant Add-on and as a standalone Docker container.

## About

This project provides an MQTT client that interfaces with [LifeSOS][lifesos-link] alarm systems.
It will publish the state of all devices to an MQTT broker, which can then be
consumed by [Home Assistant][ha-link]. It will also subscribe to topics on the
broker that allow the control of the alarm system (e.g. arm, disarm) and turn
on/off device features (e.g. bypass, home guard etc.).

It was written for & tested with the LS-20/LS-30 model, though it should also
work on the LS-10 model.

## Installation Options

### Option 1: Home Assistant Add-on

For Home Assistant users, this is the recommended installation method.

[:books: Read the full add-on documentation][docs]

### Option 2: Standalone Docker Container

For users who want to run this outside of Home Assistant or on a separate system, a standalone Docker container is available.

[:whale: Read the Docker setup documentation][docker-docs]

**Quick Start:**

```bash
# 1. Build the image
docker build -t lifesos2mqtt:latest .

# 2. Copy and edit the config
cp config/lifesos2mqtt.example.yaml config/lifesos2mqtt.yaml
# Edit config/lifesos2mqtt.yaml with your LifeSOS and MQTT settings

# 3. Run it
docker-compose up -d
```

The standalone Docker container:
- Runs on any system with Docker installed
- Does not require Home Assistant
- Connects directly to your MQTT broker
- Supports Home Assistant MQTT Discovery
- Works with multiple architectures (amd64, arm64, armv7)

## License

MIT License

Copyright (c) Emil Stjerneman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-no-red.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-no-red.svg
[docs]: https://github.com/bratanon/lifesos_addon/blob/master/lifesos2mqtt/DOCS.md
[docker-docs]: https://github.com/bratanon/lifesos_addon/blob/master/DOCKER.md
[lifesos-link]: http://lifesos.com.tw
[ha-link]: https://www.home-assistant.io
