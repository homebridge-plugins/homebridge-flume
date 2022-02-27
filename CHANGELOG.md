# Change Log

All notable changes to homebridge-flume will be documented in this file.

## 1.2.6 (2022-02-27)

### Changed

- Bump `axios` to v0.26.0
- Bump `node` recommended versions to v14.19.0 or v16.14.0

## 1.2.5 (2022-01-24)

### Changed

- Bump `homebridge` recommended version to v1.4.0
- Bump `axios` to v0.25.0

## 1.2.4 (2022-01-13)

### Changed

- Bump `node` recommended versions to v14.18.3 or v16.13.2

### Fixed

- Plugin crash for older versions of Homebridge

## 1.2.3 (2022-01-03)

### Changed

- HOOBS certified badge on README
- Plugin will log HAPNodeJS version on startup
- Bump `homebridge` recommended version to v1.3.9

## 1.2.2 (2021-12-21)

### Changed

- Some config options rearranged for easier access

## 1.2.1 (2021-12-08)

### Changed

- Bump `homebridge` recommended version to v1.3.8
- Bump `node` recommended versions to v14.18.2 or v16.13.1

## 1.2.0 (2021-12-01)

### Added

- Previous month usage custom characteristic (viewable in HomeKit apps like Eve)

## 1.1.0 (2021-11-30)

### Added

- Daily and monthly usage custom characteristics (viewable in HomeKit apps like Eve)

### Removed

- `threshold` configuration option as unused

## 1.0.0 (2021-11-29)

### Added

- Plugin logo

## 0.7.0 (2021-11-24)

### Added

- `StatusFault` and `StatusLowBattery` characteristics to the `LeakSensor` service

## 0.6.0 (2021-11-24)

### Added

- Leak sensor service

### Changed

- Minimum refresh interval increased to two minutes

## 0.5.0 (2021-11-23)

### Added

- Make use of the debug logging option for HTTP responses

### Changed

- `client_id` and `client_secret` config options changed to `clientId` and `clientSecret` for consistency

## 0.4.0 (2021-11-23)

### Added

- The plugin will remove 'stale' accessories that don't appear in the obtained device list

## 0.3.1 (2021-11-23)

### Fixed

- Some logging references to Thermobit rather than Flume

## 0.3.0 (2021-11-22)

Changed some configuration options

## 0.2.0 (2021-11-22)

Converted from accessory plugin to platform plugin

## 0.1.0 (2021-11-22)

Initial release
