# nodesos_mqtt — battery state handoff

## Setup
LifeSOS LS30 panel → `nodesos_mqtt` (Docker, container `lifesos`) → MQTT broker → Home Assistant.
Home Assistant runs Blackshome's low-battery-notification blueprint.

## The problem
Battery-low notifications keep firing for devices that have had new batteries fitted.

Root cause chain, confirmed:

1. `deviceOnEvent` in `src/NodeSOSMqttAdapter.ts` publishes to `<topic>/battery` with
   `retain: true`, only for event codes `BatteryLow` (2608 / `0x0A30`) and
   `PowerOnReset` (2602 / `0x0A2A`).
2. `publishDeviceBatteryDiscoveryMessage` declares `payload_on: 'BatteryLow'` and
   `payload_off: 'PowerOnReset'`. So `PowerOnReset` is the intended clear signal.
3. Most devices never transmit `PowerOnReset` on battery replacement. A door magnet
   (type `0x40`, id `405072`) sends `Heartbeat` (2592 / `0x0A20`) on power-up instead.
   Across ~10 months of logs, exactly one `PowerOnReset` was seen, from a PIR sensor
   (type `0x50`, id `6b13a3`).
4. The retained `BatteryLow` therefore persists forever and is replayed to Home Assistant
   on every reconnect and every HA restart.

Verified stuck value: `ls30/KonPIR/motion/battery retain=1 BatteryLow`.

## Manual workaround in use
Publish the exact `payload_off` string, retained:

    mosquitto_pub -h <broker> -t 'ls30/<dev>/<type>/battery' -r -m 'PowerOnReset'

## Ruled out: Contact ID restore (investigated 2026-09-06)

The original plan was to route `ContactIDEventCode.RFLowBattery = 900` with a
`Restore` qualifier into the battery topic. **This does not work on this panel.**

Evidence, from a full dump of the base unit event log (221 entries, index 0 =
2026-06-28, roughly ten weeks of history):

- Exactly one `RFLowBattery(900)` entry, qualifier `Event`, category `Fire`,
  zone `01-01`. No restore counterpart.
- The stuck MQTT device (`ls30/KonPIR/motion/battery`, a PIR / burglar category)
  has **no** `RFLowBattery` entry at all, despite MINPIC clearly carrying
  `BatteryLow` for it. Contact ID coverage is partial as well as restore-less.
- 98 entries do carry a `Restore` qualifier, so the panel uses qualifier 3 —
  but only for its own armed state: `Away_QuickArm(1032)` ×48, `Away(1024)` ×42,
  `ArmedSTAY(1089)` ×8. Zero trouble-category restores.

Conclusion: this panel reports batteries going bad and never reports them going
good. No adapter change can derive a signal the hardware does not emit.
Do not spend time re-investigating this.

## Remaining options

### A. Publish heartbeats as `last_seen` + RSSI (recommended patch)
`deviceOnEvent` currently drops `Heartbeat` (2592 / `0x0A20`). Publishing it to a
per-device `<topic>/last_seen` topic, along with the RSSI already carried in the
packet, exposes the heartbeat stream to Home Assistant and enables per-device
availability and signal-quality tracking.

This is worth doing on its own merits and is an easy PR — it only adds
information and changes no existing behaviour. It also provides the raw material
for option B.

### B. Gated heartbeat-as-clear (compromise, has a real flaw)
Devices heartbeat on their supervision cycle regardless of battery state, so a
naive "Heartbeat ⇒ publish PowerOnReset" clears a genuinely low battery and then
re-sets it on the next `BatteryLow`, flapping the entity and spamming the
notification blueprint. Only viable if gated — e.g. clear on Heartbeat only when
no `BatteryLow` has been seen for two supervision intervals. Needs a small state
machine, and the supervision interval is not currently known.

### C. Track battery age in Home Assistant instead (most robust)
Given that the hardware has no recovery signal, deriving battery *state* is
fighting the platform. Track battery *age* instead: an `input_datetime` per
device, reset when a cell is changed, and one automation that notifies past a
threshold. Keep `BatteryLow` as an early-warning trigger, and point Blackshome's
blueprint only at devices that genuinely report both states.

Less elegant than an adapter fix, but it matches what the hardware actually
knows and will not silently break when a sensor fails to cold-start.

## Manual reset (current stopgap)
Publish the exact `payload_off` string, retained:

    mosquitto_pub -h <broker> -t 'ls30/<dev>/<type>/battery' -r -m 'PowerOnReset'

## Separate bugs found in the same code

**a. Crash on devices with no `enabledStatuses` entry** —
`publishDeviceEnableStatusDiscoveryMessage` (dist line ~340) does
`for (const statusName of enabledStatuses[device.category.code])`. For a flood detector
the lookup returns `undefined` and the process dies with
`TypeError: ... is not iterable`. Fires on every HA birth message, not just startup.
Note the adapter logs "cannot be represented in Home Assistant and will be skipped"
and then tries to publish enable-status discovery for it anyway — the skip guard does
not cover this path. Minimal fix: `?? []`.

**b. Missing radix in MINPIC parsing** — in `nodesos`, `DeviceEvent`:
`parseInt(text.substring(21, 23))` has no radix, so `deviceCharacteristics` parses as
decimal. `"10"` becomes 10 instead of 16; anything with a hex letter becomes `NaN`.

## MINPIC packet layout
Offsets are into the whole line, `MINPIC=` prefix included:

| Field | Slice | Notes |
|---|---|---|
| eventCode | 7–11 | `DeviceEventCode` |
| deviceType | 11–13 | `DeviceType` |
| deviceId | 13–19 | matches `devices:` config ids (hex) |
| messageAttribute | 19–21 | |
| deviceCharacteristics | 21–23 | see bug (b) |
| currentStatus | 23–25 | RSSI dB = clamp(value − 0x40, 0, 99) |

Worked example: `MINPIC=0a204040507200107f5cbf`
→ Heartbeat, DoorMagnet, id `405072`, RSSI 63 dB.

## Gotcha
`deviceOnEvent` early-returns when
`this.config.adapter.devices.find(i => i.id === device.deviceId.toString(16))` misses.
A wrong or missing id in the config silently drops **all** events for that device,
which looks identical to the panel not sending them. Check config ids against the
decoded `deviceId` values before concluding anything about firmware.

## Build
    npm install
    npm run build      # tsc → dist/
    npm run watch      # tsc --watch
    npm run lint

There is no test suite (`npm test` is a stub) — verification is against the live panel.

## Tooling in this fork

`src/dump-event-log.ts` — dumps the base unit's Contact ID event log.

    npm run build
    node dist/dump-event-log.js -c config.yaml            # full table
    node dist/dump-event-log.js -c config.yaml --code 900 # filter by event code
    node dist/dump-event-log.js -c config.yaml --json     # machine-readable

Known rough edge: log4js writes to stdout alongside the table, so `head`/`tail`
pick up log lines. Either filter with `grep -E '^ *[0-9]+ '` or switch the
logger appender to stderr.

`decode.sh` — decodes MINPIC broadcasts from a log stream, with timestamps.
Requires gawk.

    docker logs lifesos 2>&1 | ./decode.sh | grep -E 'PowerOnReset|BatteryLow'

## Build blocker on a clean clone

`package.json` pins `"typescript": "^6.0.3"`. TypeScript 6 turned the previously
inferred `rootDir` into a hard error, so `npm run build` fails on a fresh clone:

    error TS5011: The common source directory of 'tsconfig.json' is './src'.
    The 'rootDir' setting must be explicitly set...

Fix — add to `tsconfig.json` `compilerOptions`, next to `outDir`:

    "rootDir": "src",

This is the value TypeScript was already inferring, so output layout is
unchanged. Worth its own upstream PR; it breaks the build for anyone cloning
today. Workaround without editing config: `npx tsc --rootDir src`.
