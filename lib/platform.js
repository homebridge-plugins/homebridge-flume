import { createRequire } from 'module';
import httpClient from './connection/http.js';
import deviceLeakSensor from './device/leak-sensor.js';
import platformConsts from './utils/constants.js';
import platformChars from './utils/custom-chars.js';
import { parseError } from './utils/functions.js';
import platformLang from './utils/lang-en.js';

const require = createRequire(import.meta.url);
const plugin = require('../package.json');

export default class {
  constructor(log, config, api) {
    if (!log || !api) {
      return;
    }

    // Begin plugin initialisation
    try {
      this.api = api;
      this.log = log;

      // Configuration objects for accessories
      this.devicesInHB = new Map();

      // Make sure user is running Homebridge v1.4 or above
      if (!api?.versionGreaterOrEqual('1.4.0')) {
        throw new Error(platformLang.hbVersionFail);
      }

      // Check the user has configured the plugin
      if (!config) {
        throw new Error(platformLang.pluginNotConf);
      }

      // Log some environment info for debugging
      this.log(
        '%s v%s | System %s | Node %s | HB v%s | HAPNodeJS v%s...',
        platformLang.initialising,
        plugin.version,
        process.platform,
        process.version,
        api.serverVersion,
        api.hap.HAPLibraryVersion(),
      );

      // Apply the user's configuration
      this.config = platformConsts.defaultConfig;
      this.applyUserConfig(config);

      // Set up the Homebridge events
      this.api.on('didFinishLaunching', () => this.pluginSetup());
      this.api.on('shutdown', () => this.pluginShutdown());
    } catch (err) {
      // Catch any errors during initialisation
      const eText = parseError(err, [platformLang.hbVersionFail, platformLang.pluginNotConf]);
      log.warn('***** %s. *****', platformLang.disabling);
      log.warn('***** %s. *****', eText);
    }
  }

  applyUserConfig(config) {
    // These shorthand functions save line space during config parsing
    const logDefault = (k, def) => {
      this.log.warn('%s [%s] %s %s.', platformLang.cfgItem, k, platformLang.cfgDef, def);
    };
    const logIgnore = (k) => {
      this.log.warn('%s [%s] %s.', platformLang.cfgItem, k, platformLang.cfgIgn);
    };
    const logIncrease = (k, min) => {
      this.log.warn('%s [%s] %s %s.', platformLang.cfgItem, k, platformLang.cfgLow, min);
    };
    const logQuotes = (k) => {
      this.log.warn('%s [%s] %s.', platformLang.cfgItem, k, platformLang.cfgQts);
    };
    const logRemove = (k) => {
      this.log.warn('%s [%s] %s.', platformLang.cfgItem, k, platformLang.cfgRmv);
    };

    // Begin applying the user's config
    Object.entries(config).forEach((entry) => {
      const [key, val] = entry;
      switch (key) {
        case 'clientId':
        case 'clientSecret':
        case 'password':
        case 'username':
          if (typeof val !== 'string' || val === '') {
            logIgnore(key);
          } else {
            this.config[key] = val;
          }
          break;
        case 'debug':
        case 'disableDeviceLogging':
        case 'disablePlugin':
          if (typeof val === 'string') {
            logQuotes(key);
          }
          this.config[key] = val === 'false' ? false : !!val;
          break;
        case 'name':
        case 'platform':
          break;
        case 'refreshInterval': {
          if (typeof val === 'string') {
            logQuotes(key);
          }
          const intVal = parseInt(val, 10);
          if (Number.isNaN(intVal)) {
            logDefault(key, platformConsts.defaultValues[key]);
            this.config[key] = platformConsts.defaultValues[key];
          } else if (intVal < platformConsts.minValues[key]) {
            logIncrease(key, platformConsts.minValues[key]);
            this.config[key] = platformConsts.minValues[key];
          } else {
            this.config[key] = intVal;
          }
          break;
        }
        default:
          logRemove(key);
          break;
      }
    });
  }

  async pluginSetup() {
    // Plugin has finished initialising so now onto setup
    try {
      // Log that the plugin initialisation has been successful
      this.log('%s.', platformLang.initialised);

      // If the user has disabled the plugin then remove all accessories
      if (this.config.disablePlugin) {
        this.devicesInHB.forEach((accessory) => this.removeAccessory(accessory));
        throw new Error(platformLang.disabled);
      }

      // Ensure username and password have been provided
      if (
        !this.config.username
        || !this.config.password
        || !this.config.clientId
        || !this.config.clientSecret
      ) {
        throw new Error(platformLang.noCreds);
      }

      // Require any libraries that the accessory instances use
      this.cusChar = new platformChars(this.api);

      // Set up the HTTP client if Thermobit username and password have been provided
      this.httpClient = new httpClient(this);
      await this.httpClient.obtainToken();
      const deviceList = await this.httpClient.getDevices();

      // Check we have devices we can work with
      if (!Array.isArray(deviceList) || deviceList.length === 0) {
        this.devicesInHB.forEach((accessory) => this.removeAccessory(accessory));
        throw new Error(platformLang.noDevices);
      }

      // Initialise each device into Homebridge
      deviceList.forEach((device) => {
        if (!device.bridge_id) {
          return;
        }
        this.initialiseDevice(device);
      });

      // Remove any stale accessories that don't appear in the device list
      this.devicesInHB.forEach((accessory) => {
        if (!deviceList.find((el) => accessory.context.deviceId === el.id)) {
          this.removeAccessory(accessory);
        }
      });

      // Perform a first sync and set up the refresh interval
      this.counter = 0;
      this.flumeSync();
      this.refreshInterval = setInterval(
        () => this.flumeSync(),
        this.config.refreshInterval * 60000,
      );

      // Log that the plugin setup has been successful with a welcome message
      const randIndex = Math.floor(Math.random() * platformLang.zWelcome.length);
      this.log('%s. %s', platformLang.complete, platformLang.zWelcome[randIndex]);
    } catch (err) {
      // Catch any errors during setup
      const eText = parseError(err, [
        platformLang.noCreds,
        platformLang.noDevices,
        platformLang.disabled,
      ]);
      this.log.warn('***** %s. *****', platformLang.disabling);
      this.log.warn('***** %s. *****', eText);
      this.pluginShutdown();
    }
  }

  pluginShutdown() {
    // A function that is called when the plugin fails to load or Homebridge restarts
    try {
      // Stop the refresh interval
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    } catch (err) {
      // No need to show errors at this point
    }
  }

  async flumeSync() {
    try {
      // Reset the counter for water info once we reach 10
      if (this.counter === 10) {
        this.counter = 0;
      }
      this.devicesInHB.forEach(async (accessory) => {
        try {
          const toReturn = {};
          toReturn.devInfo = await this.httpClient.getDeviceInfo(accessory.context.deviceId);
          if (this.counter === 0) {
            toReturn.waterInfo = await this.httpClient.getWaterInfo(accessory.context.deviceId);
          }
          toReturn.leakInfo = await this.httpClient.getLeakInfo(accessory.context.deviceId);
          accessory.control.externalUpdate(toReturn);
        } catch (err) {
          const eText = parseError(err);
          this.log.warn('[%s] %s %s.', accessory.displayName, platformLang.devNotRef, eText);
        }
        this.counter += 1;
      });
    } catch (err) {
      // Catch any errors performing the sync
      const eText = parseError(err, []);
      this.log.warn('%s %s.', platformLang.syncFailed, eText);
    }
  }

  initialiseDevice(device) {
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

      const uuid = this.api.hap.uuid.generate(device.id);

      // Get the cached accessory or add to Homebridge if it doesn't exist
      const accessory = this.devicesInHB.get(uuid) || this.addAccessory(device);

      // Final check the accessory now exists in Homebridge
      if (!accessory) {
        throw new Error(platformLang.accNotFound);
      }

      // Create the instance for this device type
      accessory.control = new deviceLeakSensor(this, accessory);

      // Log the device initialisation
      this.log('[%s] %s [%s].', accessory.displayName, platformLang.devInit, device.id);
    } catch (err) {
      // Catch any errors during device initialisation
      const eText = parseError(err, [platformLang.accNotFound]);
      this.log.warn('[%s] %s %s.', device.id, platformLang.devNotInit, eText);
    }
  }

  addAccessory(device) {
    // Add an accessory to Homebridge
    try {
      const uuid = this.api.hap.uuid.generate(device.id);
      const accessory = new this.api.platformAccessory(platformLang.brand, uuid);
      accessory
        .getService(this.api.hap.Service.AccessoryInformation)
        .setCharacteristic(this.api.hap.Characteristic.Name, platformLang.brand)
        .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, platformLang.brand)
        .setCharacteristic(this.api.hap.Characteristic.Manufacturer, platformLang.brand)
        .setCharacteristic(this.api.hap.Characteristic.SerialNumber, device.id)
        .setCharacteristic(this.api.hap.Characteristic.Model, device.product)
        .setCharacteristic(this.api.hap.Characteristic.Identify, true);
      accessory.context.deviceId = device.id;
      this.api.registerPlatformAccessories(plugin.name, plugin.alias, [accessory]);
      this.devicesInHB.set(accessory.UUID, accessory);
      this.log('[%s] %s.', accessory.displayName, platformLang.devAdd);
      return accessory;
    } catch (err) {
      // Catch any errors during add
      const eText = parseError(err);
      this.log.warn('[%s] %s %s.', platformLang.brand, platformLang.devNotAdd, eText);
      return false;
    }
  }

  configureAccessory(accessory) {
    // Add the configured accessory to our global map
    this.devicesInHB.set(accessory.UUID, accessory);
  }

  removeAccessory(accessory) {
    // Remove an accessory from Homebridge
    try {
      this.api.unregisterPlatformAccessories(plugin.name, plugin.alias, [accessory]);
      this.devicesInHB.delete(accessory.UUID);
      this.log('[%s] %s.', accessory.displayName, platformLang.devRemove);
    } catch (err) {
      // Catch any errors during remove
      const eText = parseError(err);
      const name = accessory.displayName;
      this.log.warn('[%s] %s %s.', name, platformLang.devNotRemove, eText);
    }
  }
}
