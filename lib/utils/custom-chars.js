/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = class customCharacteristics {
  constructor (api) {
    this.hapServ = api.hap.Service
    this.hapChar = api.hap.Characteristic
    this.uuids = {
      todayUsage: 'E966F001-079E-48FF-8F27-9C2605A29F52',
      monthUsage: 'E966F002-079E-48FF-8F27-9C2605A29F52'
    }
    const self = this
    this.TodayUsage = function () {
      self.hapChar.call(this, 'Today Usage', self.uuids.todayUsage)
      this.setProps({
        format: self.hapChar.Formats.UINT32,
        perms: [self.hapChar.Perms.READ, self.hapChar.Perms.NOTIFY],
        unit: 'Gallons'
      })
      this.value = this.getDefaultValue()
    }
    this.MonthUsage = function () {
      self.hapChar.call(this, 'Month Usage', self.uuids.monthUsage)
      this.setProps({
        format: self.hapChar.Formats.UINT32,
        perms: [self.hapChar.Perms.READ, self.hapChar.Perms.NOTIFY],
        unit: 'Gallons'
      })
      this.value = this.getDefaultValue()
    }
    const inherits = require('util').inherits
    inherits(this.TodayUsage, this.hapChar)
    inherits(this.MonthUsage, this.hapChar)
    this.TodayUsage.UUID = this.uuids.todayUsage
    this.MonthUsage.UUID = this.uuids.monthUsage
  }
}
