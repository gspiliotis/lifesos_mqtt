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

## Vendored sources

The container is built from source held in this repository, not from the npm
registry. Two upstream projects are vendored under `packages/` as **git
subtrees**:

| Path | Upstream | Imported from | License |
|---|---|---|---|
| `packages/nodesos` | [bratanon/nodesos](https://github.com/bratanon/nodesos) | `master` @ `d84c132` (v2.1.1 + dependency bumps) | MIT |
| `packages/nodesos_mqtt` | [bratanon/nodesos_mqtt](https://github.com/bratanon/nodesos_mqtt) | `master` @ `11a57d9` (v3.0.3 + dependency bumps) | MIT |

Both are the work of Emil Stjerneman and remain under the MIT licence; each
package keeps its original `LICENSE.md`. Local modifications live in ordinary
commits on top of the subtree imports.

The repository is an npm workspace, so `packages/nodesos` is symlinked into
`node_modules/` and `nodesos_mqtt` compiles against the vendored library rather
than the published package.

### Building locally

```bash
npm ci
npm run build          # parcel builds nodesos, then tsc builds nodesos_mqtt
npm start -- --help    # runs packages/nodesos_mqtt/dist/index.js
```

### Pulling upstream updates

The subtrees were added with `--squash`; every later pull must use it too, or
the histories will not line up.

```bash
git remote add upstream-nodesos      https://github.com/bratanon/nodesos.git
git remote add upstream-nodesos_mqtt https://github.com/bratanon/nodesos_mqtt.git

git subtree pull --squash --prefix=packages/nodesos      upstream-nodesos      master
git subtree pull --squash --prefix=packages/nodesos_mqtt upstream-nodesos_mqtt master

npm install    # refresh the root lockfile if upstream changed dependencies
npm run build
```

Conflicts, if any, are resolved in the working tree like any other merge.

### Local changes on top of upstream

- `packages/nodesos_mqtt/src/dump-event-log.ts` — dumps the base unit's internal
  Contact ID event log by index.
- `packages/nodesos_mqtt/tsconfig.json` — sets `"rootDir": "src"`. TypeScript 6
  made the previously inferred value a hard error (TS5011), so upstream does not
  build on a clean clone without it.
- `prepare` removed from both packages' `package.json` — husky needs a `.git`
  directory that does not exist inside the Docker build.

See [CLAUDE.md](CLAUDE.md) for notes on the panel's behaviour and the open
issues in this code.

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
