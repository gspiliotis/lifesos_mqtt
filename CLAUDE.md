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

## Solved: timeout-based clear (implemented 2026-09-06)

`BatteryLow` **does** repeat while a cell stays flat -- roughly once a day, per
device. Measured from the full container log with a gap analysis over MINPIC
`0x0A30` broadcasts:

| device | events | min | mean | max |
|---|---|---|---|---|
| `506b13a3` | 233 | 21.88h | 23.06h | 23.83h |
| `4040121b` | 7 | 25.09h | 25.44h | 25.77h |
| `404017c9` | 59 | 23.79h | 24.14h | 24.91h |
| `40405072` | 61 | 21.81h | 23.34h | **45.96h** |
| `40401029` | 27 | 24.30h | 41.85h | **235.88h** |

The normal repeat interval is 21.8h-25.8h across every device. `40405072`'s
45.96h gap is a single dropped transmission (its mean sits just above its min
over 60 gaps). `40401029` is intermittent -- dropping its 235.88h outlier still
leaves a 34.1h mean, so it has several multi-day silences, most likely battery
replacements or a marginal cell.

This makes a timeout viable, and fixes the value:

- **12h flaps** -- it expires between every pair of repeats.
- **24h and 48h false-clear** -- 24h is below the routine maximum, and 48h sits
  only 4% above the observed 45.96h dropped-report gap.
- **72h** clears the dropped-report case with 57% margin, tolerates two
  consecutive misses, and still clears a replaced cell within three days.

Implemented in `deviceOnEvent` as `battery_low_timeout_hours` (default 72, 0
disables). Each `BatteryLow` arms or re-arms a timer; expiry publishes the
`payload_off` string `PowerOnReset`, retained.

Two details that are load-bearing:

1. **Restart handling.** A timer armed only when a `BatteryLow` *arrives* would
   not fix anything: after a restart with the cell already replaced, no
   `BatteryLow` ever comes, so no timer is ever armed and the retained value
   stays stuck. The adapter therefore subscribes to each device's own
   `<topic>/battery` and arms a timer when it reads back a retained
   `BatteryLow` on connect. Messages it publishes itself also arrive there, so
   the handler is idempotent -- it only arms when no timer is already running.
2. **Liveness gate.** A silent device -- removed, failed, or a cell flat enough
   to stop transmitting -- looks exactly like one whose battery was replaced.
   Clearing it would report a dead sensor as healthy. The clear is skipped
   unless the device has been heard from within `battery_stale_after_hours`
   (default 48), using the `last_seen` tracking added at the same time, and
   retried after each timeout so a device that resumes transmitting is cleared
   then.

Superseded option B (heartbeat-as-clear): unnecessary, since the repeat
interval is now known and absence of `BatteryLow` is a cleaner signal than
presence of `Heartbeat`.

Superseded option C (track battery age in Home Assistant): only worth revisiting
if the timeout proves unreliable in practice.

Still open: the supervision/heartbeat interval (MINPIC `0x0A20`) has not been
measured, so `battery_stale_after_hours` is set defensively rather than derived.
If the gate proves too tight it fails safe -- nothing is cleared, which is the
pre-existing behaviour.

## Manual reset (override, no longer the primary mechanism)
Still works, and is the way to clear a device immediately rather than waiting out
`battery_low_timeout_hours`. Publish the exact `payload_off` string, retained:

    mosquitto_pub -h <broker> -t 'ls30/<dev>/<type>/battery' -r -m 'PowerOnReset'

## Separate bugs found in the same code (both fixed 2026-09-06)

**a. Crash on devices with no `enabledStatuses` entry** — FIXED.
`enabledStatuses[device.category.code]` returned `undefined` for the special
(`e`, flood detectors) and base unit (`z`) categories, and the process died with
`TypeError: ... is not iterable`. It fired on every HA birth message, not just at
startup. There were **three** call sites, not one: subscribe, property publish
and discovery. All now go through an `enabledStatusesFor()` helper returning `[]`
for unknown categories. Note the adapter logs "cannot be represented in Home
Assistant and will be skipped" and then publishes enable-status discovery for the
device anyway — the skip guard still does not cover that path, it simply no
longer throws.

**b. Missing radix in MINPIC parsing** — FIXED. `DeviceEvent` did
`parseInt(text.substring(21, 23))` with no radix, so `deviceCharacteristics`
parsed as decimal while every other field in the packet used base 16.
`DeviceInfoResponse` reads the same field via `fromAsciiHex()`, so the two
parsers disagreed. For a door magnet the slice `"10"` became decimal 10
(`RFVoice | Reserved_b1`, nonsense) instead of `0x10` (`Supervisory`, correct).
Nothing reads `DeviceEvent.deviceCharacteristics` — `Device` takes
characteristics from `DeviceInfoResponse` — so there was no runtime symptom. The
upstream test asserted the buggy value and was updated.

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

## Build blocker on a clean clone (fixed in this fork)

`package.json` pins `"typescript": "^6.0.3"`. TypeScript 6 turned the previously
inferred `rootDir` into a hard error (`TS5011`), so upstream does not build on a
fresh clone. `"rootDir": "src"` is now set explicitly in
`packages/nodesos_mqtt/tsconfig.json`. This is the value tsc was already
inferring, so output layout is unchanged. Still worth an upstream PR — it breaks
the build for anyone cloning bratanon/nodesos_mqtt today.
