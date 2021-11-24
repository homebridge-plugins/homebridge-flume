/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = class deviceValve {
  constructor (platform, accessory) {
    // Set up variables from the platform
    this.accessory = accessory
    this.funcs = platform.funcs
    this.threshold = platform.config.threshold
    this.hapChar = platform.api.hap.Characteristic
    this.hapErr = platform.api.hap.HapStatusError
    this.hapServ = platform.api.hap.Service
    this.lang = platform.lang
    this.log = platform.config.disableDeviceLogging ? () => {} : platform.log
    this.name = accessory.displayName
    this.platform = platform
    this.refreshInterval = platform.config.refreshInterval

    // Add the leak sensor service if it doesn't exist already
    this.leakService =
      this.accessory.getService(this.hapServ.LeakSensor) ||
      this.accessory.addService(this.hapServ.LeakSensor)

    this.cacheLeak = !!this.leakService.getCharacteristic(this.hapChar.LeakDetected).value
    this.cacheBatt = !this.leakService.getCharacteristic(this.hapChar.StatusLowBattery).value
    this.cacheStatus = !this.leakService.getCharacteristic(this.hapChar.StatusFault).value
  }

  externalUpdate (params) {
    // Check the data for leak detection
    if (
      this.funcs.hasProperty(params.leakInfo, 'active') &&
      params.leakInfo.active !== this.cacheLeak
    ) {
      this.cacheLeak = params.leakInfo.active
      this.leakService.updateCharacteristic(this.hapChar.LeakDetected, this.cacheLeak ? 1 : 0)
      this.log('[%s] current leak status [%sdetected].', this.name, this.cacheLeak ? '' : 'not ')
    }

    // Check the data for battery level, cacheBatt is true for OK and false for LOW
    if (
      this.funcs.hasProperty(params.devInfo, 'battery_level') &&
      (params.devInfo.battery_level !== 'low') !== this.cacheBatt
    ) {
      this.cacheBatt = params.devInfo.battery_level !== 'low'
      this.leakService.updateCharacteristic(this.hapChar.StatusLowBattery, this.cacheBatt ? 0 : 1)
      this.log('[%s] current battery [%s].', this.name, this.cacheBatt ? 'ok' : 'low')
    }

    // Check the data for connectivity, cacheStatus is true for OK and false for NOT CONNECTED
    if (
      this.funcs.hasProperty(params.devInfo, 'connected') &&
      params.devInfo.connected !== this.cacheStatus
    ) {
      this.cacheStatus = params.devInfo.connected
      this.leakService.updateCharacteristic(this.hapChar.StatusFault, this.cacheStatus ? 0 : 1)
      this.log('[%s] current status [%sconnected].', this.name, this.cacheStatus ? '' : 'not ')
    }

    const usage =
      params.waterInfo.currentusage &&
      params.waterInfo.currentusage[0] &&
      params.waterInfo.currentusage[0].value
        ? params.waterInfo.currentusage[0].value
        : 0
    if (usage > this.threshold) {
      this.log(
        '[%s] usage detected - [%s] gallons within the last [%s] minutes.',
        this.name,
        usage,
        this.refreshInterval
      )
    }
  }
}
