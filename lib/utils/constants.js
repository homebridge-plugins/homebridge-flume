/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = {
  defaultConfig: {
    name: 'Flume',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    refreshInterval: 1,
    disableDeviceLogging: false,
    debug: false,
    disablePlugin: false,
    platform: 'Flume'
  },

  defaultValues: {
    refreshInterval: 2
  },

  minValues: {
    refreshInterval: 2
  },

  httpRetryCodes: ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNABORTED']
}
