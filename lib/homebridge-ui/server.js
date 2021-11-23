/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

const { HomebridgePluginUiServer } = require('@homebridge/plugin-ui-utils')

class PluginUiServer extends HomebridgePluginUiServer {
  constructor () {
    super()
    this.ready()
  }
}

;(() => new PluginUiServer())()
