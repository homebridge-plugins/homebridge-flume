# Change Log

All notable changes to homebridge-flume will be documented in this file.

## BETA

### Breaking

- Remove official support for Node 14
- Remove option to disable plugin - this is now available in the Homebridge UI
- Remove option for debug logging - this will be enabled when using a beta version of the plugin

### Added

- Support for shared devices (thanks [@ssmoss](https://github.com/ssmoss)!)

### Changed

- Fix a potential login issue that might be terminating the process incorrectly
- Bump `node` recommended versions to v16.19.1 or v18.14.2

## 2.0.9 (2023-01-07)

### Changed

- Bump `axios` to v1.2.2
- Bump `homebridge` recommended version to v1.6.0 or v2.0.0-beta
- Bump `node` recommended versions to v14.21.2 or v16.19.0 or v18.13.0

## 2.0.8 (2022-10-16)

### Changed

- Requests for device info will occur less often, meaning requests for leak info can occur more frequently
  - Minimum refresh interval reduced to 1 minute
- Bump `node` recommended versions to v14.20.1 or v16.18.0 or v18.11.0
- Updated `axios` to v1.1.3

## 2.0.7 (2022-09-25)

### Changed

- Bump `node` recommended versions to v14.20.1 or v16.17.1
- Updated dev dependencies

## 2.0.6 (2022-08-23)

### Changed

- Bump `node` recommended versions to v14.20.0 or v16.17.0
- Bump `homebridge` recommended version to v1.5.0

## 2.0.5 (2022-06-26)

### Changed

- Updated dependencies

## 2.0.4 (2022-06-21)

### Changed

- Bump `node` recommended versions to v14.19.3 or v16.15.1

## 2.0.3 (2022-05-28)

### Changed

- More fixes and refactoring

## 2.0.2 (2022-05-28)

### Changed

- Bump `node` recommended versions to v14.19.3 or v16.15.0
- Updated dependencies

## 2.0.1 (2022-04-30)

### Changed

- Bump `axios` to v0.27.2
- Bump `node` recommended versions to v14.19.1 or v16.15.0

## 2.0.0 (2022-04-23)

### Potentially Breaking Changes

⚠️ The minimum required version of Homebridge is now v1.4.0
⚠️ The minimum required version of Node is now v14

### Changed

- Changed to ESM package

## 1.2.7 (2022-04-03)

### Changed

- Bump `axios` to v0.26.1
- Updated dependencies

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
