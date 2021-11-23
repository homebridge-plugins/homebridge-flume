/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

module.exports = {
  defaultConfig: {
    name: 'Flume',
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    refreshInterval: 1,
    threshold: 0,
    disableDeviceLogging: false,
    debug: false,
    disablePlugin: false,
    platform: 'Flume'
  },

  defaultValues: {
    refreshInterval: 1,
    threshold: 0
  },

  minValues: {
    refreshInterval: 1,
    threshold: 0
  },

  httpRetryCodes: ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNABORTED']
}
