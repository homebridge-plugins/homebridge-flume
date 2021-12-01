/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = class deviceLeakSensor {
  constructor (platform, accessory) {
    // Set up variables from the platform
    this.accessory = accessory
    this.cusChar = platform.cusChar
    this.funcs = platform.funcs
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

    // Add the custom characteristics if they haven't been already
    if (!this.leakService.testCharacteristic(this.cusChar.TodayUsage)) {
      this.leakService.addCharacteristic(this.cusChar.TodayUsage)
    }
    if (!this.leakService.testCharacteristic(this.cusChar.MonthUsage)) {
      this.leakService.addCharacteristic(this.cusChar.MonthUsage)
    }
    if (!this.leakService.testCharacteristic(this.cusChar.PrevMonthUsage)) {
      this.leakService.addCharacteristic(this.cusChar.PrevMonthUsage)
    }
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

    // Water info
    if (params.waterInfo) {
      if (
        params.waterInfo.today &&
        params.waterInfo.today[0] &&
        this.funcs.hasProperty(params.waterInfo.today[0], 'value')
      ) {
        this.leakService.updateCharacteristic(
          this.cusChar.TodayUsage,
          params.waterInfo.today[0].value
        )
      }
      if (
        params.waterInfo.month &&
        params.waterInfo.month[0] &&
        this.funcs.hasProperty(params.waterInfo.month[0], 'value')
      ) {
        this.leakService.updateCharacteristic(
          this.cusChar.MonthUsage,
          params.waterInfo.month[0].value
        )
      }
      if (
        params.waterInfo.prevMonth &&
        params.waterInfo.prevMonth[0] &&
        this.funcs.hasProperty(params.waterInfo.prevMonth[0], 'value')
      ) {
        this.leakService.updateCharacteristic(
          this.cusChar.PrevMonthUsage,
          params.waterInfo.prevMonth[0].value
        )
      }
    }
  }
}
