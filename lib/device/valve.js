/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = class deviceValve {
  constructor (platform, accessory) {
    // Set up variables from the platform
    this.accessory = accessory
    this.disableDeviceLogging = platform.config.disableDeviceLogging
    this.funcs = platform.funcs
    this.threshold = platform.config.threshold
    this.hapChar = platform.api.hap.Characteristic
    this.hapErr = platform.api.hap.HapStatusError
    this.hapServ = platform.api.hap.Service
    this.lang = platform.lang
    this.log = platform.log
    this.name = accessory.displayName
    this.platform = platform
    this.refreshInterval = platform.config.refreshInterval
  }

  externalUpdate (params) {
    // Here we deal with the incoming data
    const usage =
      params.currentusage && params.currentusage[0] && params.currentusage[0].value
        ? params.currentusage[0].value
        : 0
    if (usage > this.threshold) {
      this.log(
        '[%s] %s - [%s] gallons within the last [%s] minutes.',
        this.name,
        'usage detected',
        usage,
        this.refreshInterval
      )
    }
  }
}
