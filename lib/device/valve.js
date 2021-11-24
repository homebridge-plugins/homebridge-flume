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
    this.leakService = this.accessory.getService(this.hapServ.LeakSensor) ||
      this.accessory.addService(this.hapServ.LeakSensor)

    this.cacheLeak = !!this.leakService.getCharacteristic(this.hapChar.LeakDetected).value
  }

  externalUpdate (params) {
    // Here we deal with the incoming data
    if (this.funcs.hasProperty(params.leakInfo, 'active') && params.leakInfo.active !== this.cacheLeak) {
      this.cacheLeak = params.leakInfo.active
      this.leakService.updateCharacteristic(this.hapChar.LeakDetected, this.cacheLeak ? 1 : 0)
      this.log('[%s] current leak status [%sdetected]', this.name, this.cacheLeak ? '' : 'not ')
    }

    const usage =
      params.currentusage && params.currentusage[0] && params.currentusage[0].value
        ? params.currentusage[0].value
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
