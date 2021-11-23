/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

// Packages and constant variables for this class
const plugin = require('./../package.json')

// Create the platform class
class FlumePlatform {
  constructor (log, config, api) {
    // Don't load the plugin if these aren't accessible for any reason
    if (!log || !api) {
      return
    }

    // Begin plugin initialisation
    try {
      this.api = api
      this.consts = require('./utils/constants')
      this.funcs = require('./utils/functions')
      this.log = log

      // Configuration objects for accessories
      this.devicesInHB = new Map()

      // Retrieve the user's chosen language file
      this.lang = require('./utils/lang-en')

      // Make sure user is running Homebridge v1.3 or above
      if (!api.versionGreaterOrEqual || !api.versionGreaterOrEqual('1.3.0')) {
        throw new Error(this.lang.hbVersionFail)
      }

      // Check the user has configured the plugin
      if (!config) {
        throw new Error(this.lang.pluginNotConf)
      }

      // Log some environment info for debugging
      this.log(
        '%s v%s | Node %s | HB v%s%s...',
        this.lang.initialising,
        plugin.version,
        process.version,
        api.serverVersion,
        config.plugin_map
          ? ' | HOOBS v3'
          : require('os')
              .hostname()
              .includes('hoobs')
          ? ' | HOOBS v4'
          : ''
      )

      // Apply the user's configuration
      this.config = this.consts.defaultConfig
      this.applyUserConfig(config)

      // Set up the Homebridge events
      this.api.on('didFinishLaunching', () => this.pluginSetup())
      this.api.on('shutdown', () => this.pluginShutdown())
    } catch (err) {
      // Catch any errors during initialisation
      const eText = this.funcs.parseError(err, [this.lang.hbVersionFail, this.lang.pluginNotConf])
      log.warn('***** %s. *****', this.lang.disabling)
      log.warn('***** %s. *****', eText)
    }
  }

  applyUserConfig (config) {
    // These shorthand functions save line space during config parsing
    const logDefault = (k, def) => {
      this.log.warn('%s [%s] %s %s.', this.lang.cfgItem, k, this.lang.cfgDef, def)
    }
    const logIgnore = k => {
      this.log.warn('%s [%s] %s.', this.lang.cfgItem, k, this.lang.cfgIgn)
    }
    const logIncrease = (k, min) => {
      this.log.warn('%s [%s] %s %s.', this.lang.cfgItem, k, this.lang.cfgLow, min)
    }
    const logQuotes = k => {
      this.log.warn('%s [%s] %s.', this.lang.cfgItem, k, this.lang.cfgQts)
    }
    const logRemove = k => {
      this.log.warn('%s [%s] %s.', this.lang.cfgItem, k, this.lang.cfgRmv)
    }

    // Begin applying the user's config
    for (const [key, val] of Object.entries(config)) {
      switch (key) {
        case 'client_id':
        case 'client_secret':
        case 'password':
        case 'username':
          if (typeof val !== 'string' || val === '') {
            logIgnore(key)
          } else {
            this.config[key] = val
          }
          break
        case 'debug':
        case 'disableDeviceLogging':
        case 'disablePlugin':
          if (typeof val === 'string') {
            logQuotes(key)
          }
          this.config[key] = val === 'false' ? false : !!val
          break
        case 'handicap': {
          if (typeof v === 'string') {
            logQuotes(key)
          }
          const numVal = Number(val)
          if (isNaN(numVal)) {
            logIgnore(key)
          } else {
            this.config[key] = numVal
          }
          break
        }
        case 'name':
        case 'platform':
        case 'plugin_map':
          break
        case 'polling_minutes': {
          if (typeof val === 'string') {
            logQuotes(key)
          }
          const intVal = parseInt(val)
          if (isNaN(intVal)) {
            logDefault(key, this.consts.defaultValues[key])
            this.config[key] = this.consts.defaultValues[key]
          } else if (intVal < this.consts.minValues[key]) {
            logIncrease(key, this.consts.minValues[key])
            this.config[key] = this.consts.minValues[key]
          } else {
            this.config[key] = intVal
          }
          break
        }
        default:
          logRemove(key)
          break
      }
    }
  }

  async pluginSetup () {
    // Plugin has finished initialising so now onto setup
    try {
      // If the user has disabled the plugin then remove all accessories
      if (this.config.disablePlugin) {
        this.devicesInHB.forEach(accessory => this.removeAccessory(accessory))
        throw new Error(this.lang.disabled)
      }

      // Log that the plugin initialisation has been successful
      this.log('%s.', this.lang.initialised)

      // Ensure username and password have been provided
      if (
        !this.config.username ||
        !this.config.password ||
        !this.config.client_id ||
        !this.config.client_secret
      ) {
        throw new Error(this.lang.noCreds)
      }

      // Setup the HTTP client if Thermobit username and password have been provided
      this.httpClient = new (require('./connection/http'))(this)
      await this.httpClient.obtainToken()
      const deviceList = await this.httpClient.getDevices()

      // Check we have devices we can work with
      if (!Array.isArray(deviceList) || deviceList.length === 0) {
        throw new Error(this.lang.noDevices)
      }

      deviceList.forEach(device => {
        if (!device.bridge_id) {
          return
        }
        this.initialiseDevice(device)
      })

      // Set up an initial last sync time
      this.lastSync = new Date(Date.now() - this.config.polling_minutes * 60000)

      // Perform a first sync and setup the refresh interval
      this.flumeSync()
      this.refreshInterval = setInterval(
        () => this.flumeSync(),
        this.config.polling_minutes * 60000
      )

      // Log that the plugin setup has been successful with a welcome message
      const randIndex = Math.floor(Math.random() * this.lang.zWelcome.length)
      this.log('%s. %s', this.lang.complete, this.lang.zWelcome[randIndex])
    } catch (err) {
      // Catch any errors during setup
      const eText = this.funcs.parseError(err, [
        this.lang.noCreds,
        this.lang.noDevices,
        this.lang.disabled
      ])
      this.log.warn('***** %s. *****', this.lang.disabling)
      this.log.warn('***** %s. *****', eText)
      this.pluginShutdown()
    }
  }

  pluginShutdown () {
    // A function that is called when the plugin fails to load or Homebridge restarts
    try {
      // Stop the refresh interval
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
      }
    } catch (err) {
      // No need to show errors at this point
    }
  }

  async flumeSync () {
    try {
      const fromWhen = this.lastSync
        .toISOString()
        .substring(0, 19)
        .replace('T', ' ')
      this.devicesInHB.forEach(async accessory => {
        try {
          const res = await this.httpClient.getDeviceInfo(accessory.context.deviceId, fromWhen)
          res.fromWhen = fromWhen
          accessory.control.externalUpdate(res)
        } catch (err) {
          const eText = this.funcs.parseError(err)
          this.log.warn(eText)
        }
      })

      this.lastSync = new Date()
    } catch (err) {
      // Catch any errors performing the sync
      const eText = this.funcs.parseError(err, [])
      this.log.warn('%s %s.', this.lang.syncFailed, eText)
    }
  }

  initialiseDevice (device) {
    try {
      /*
        {
          id: '',
          type: 2,
          location_id: 0000,
          user_id: 0000,
          bridge_id: '',
          oriented: true,
          last_seen: '',
          connected: true,
          battery_level: 'high',
          product: 'flume1'
        }
      */

      const uuid = this.api.hap.uuid.generate(device.id)

      // Get the cached accessory or add to Homebridge if doesn't exist
      const accessory = this.devicesInHB.get(uuid) || this.addAccessory(device)

      // Final check the accessory now exists in Homebridge
      if (!accessory) {
        throw new Error(this.lang.accNotFound)
      }

      // Create the instance for this device type
      accessory.control = new (require('./device/valve'))(this, accessory)

      // Log the device initialisation
      this.log('[%s] %s [%s].', accessory.displayName, this.lang.devInit, device.id)
    } catch (err) {
      // Catch any errors during device initialisation
      const eText = this.funcs.parseError(err, [this.lang.accNotFound])
      this.log.warn('[%s] %s %s.', device.id, this.lang.devNotInit, eText)
    }
  }

  addAccessory (device) {
    // Add an accessory to Homebridge
    try {
      const uuid = this.api.hap.uuid.generate(device.id)
      const accessory = new this.api.platformAccessory(this.lang.brand, uuid)
      accessory
        .getService(this.api.hap.Service.AccessoryInformation)
        .setCharacteristic(this.api.hap.Characteristic.Name, this.lang.brand)
        .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, this.lang.brand)
        .setCharacteristic(this.api.hap.Characteristic.Manufacturer, this.lang.brand)
        .setCharacteristic(this.api.hap.Characteristic.SerialNumber, device.id)
        .setCharacteristic(this.api.hap.Characteristic.Model, device.product)
        .setCharacteristic(this.api.hap.Characteristic.Identify, true)
      accessory.context.deviceId = device.id
      this.api.registerPlatformAccessories(plugin.name, plugin.alias, [accessory])
      this.devicesInHB.set(accessory.UUID, accessory)
      this.log('[%s] %s.', accessory.displayName, this.lang.devAdd)
      return accessory
    } catch (err) {
      // Catch any errors during add
      const eText = this.funcs.parseError(err)
      this.log.warn('[%s] %s %s.', this.lang.brand, this.lang.devNotAdd, eText)
    }
  }

  configureAccessory (accessory) {
    // Add the configured accessory to our global map
    this.devicesInHB.set(accessory.UUID, accessory)
  }

  removeAccessory (accessory) {
    // Remove an accessory from Homebridge
    try {
      this.api.unregisterPlatformAccessories(plugin.name, plugin.alias, [accessory])
      this.devicesInHB.delete(accessory.UUID)
      this.log('[%s] %s.', accessory.displayName, this.lang.devRemove)
    } catch (err) {
      // Catch any errors during remove
      const eText = this.funcs.parseError(err)
      const name = accessory.displayName
      this.log.warn('[%s] %s %s.', name, this.lang.devNotRemove, eText)
    }
  }
}

// Export the plugin to Homebridge
module.exports = hb => hb.registerPlatform(plugin.alias, FlumePlatform)
