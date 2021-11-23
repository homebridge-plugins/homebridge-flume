/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = class deviceValve {
  constructor (platform, accessory) {
    // Set up variables from the platform
    this.accessory = accessory
    this.disableDeviceLogging = platform.config.disableDeviceLogging
    this.funcs = platform.funcs
    this.hapChar = platform.api.hap.Characteristic
    this.hapErr = platform.api.hap.HapStatusError
    this.hapServ = platform.api.hap.Service
    this.lang = platform.lang
    this.log = platform.log
    this.name = accessory.displayName
    this.platform = platform
  }

  externalUpdate (params) {
    // Here we deal with the incoming data
    this.log('[%s] %s [%s].', this.name, 'current usage', JSON.stringify(params))
  }
}
