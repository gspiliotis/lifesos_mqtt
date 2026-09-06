# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.3] 2026-01-02
- Changed `object_id` to `default_entity_id` to comply with HA 2026.4.
- Bumped dependencies.

## [3.0.2] 2025-05-15
### Fixed
- Add meta file.

## [3.0.1] 2025-05-14
### Changed
- Bumped nodesos to 2.1.0.

## [3.0.0] 2024-06-17
### Added
- .`nvmrc` file.
- Enforce node 20+.

### Changed
- Dependabot uses node version from `.nvmrc`.
- Dependabot updates GitHub actions.
- Bumped nodesos to 2.0.0.

### Fixed
- RSSI sensors `device_class` should be `signal_strength`.
- Graceful shutdown on adapter start error.
- HA 2024.6+ fixes for alarm control panel code requirements.

## [2.0.1] 2023-12-16

### Fixed
- Log4js is configured all the time.
- Handle MQTT client close when it is reconnecting.
- Logger should show category.

### Changed
- Bumped nodesos to 1.0.2.
