const fetch = require('node-fetch');
const packageJson = require('./package.json');
var jwtDecode = require('jwt-decode');
var Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-flume', 'Flume', Flume);
}

function Flume (log, config, api) {
    this.log = log;
    this.config = config;

    log("Starting homebridge-flume.");

    // extract name from config
    this.name = config.name;

  // pull in initial variables
    this.username = config["username"];
    this.password = config["password"];
    this.client_id = config["client_id"];
    this.client_secret = config["client_secret"];
    if (config["handicap"] != null) {
      this.handicap = config["handicap"];
    } else {
      this.handicap = 0;
    }
    if (config["polling_minutes"] != null) {
      this.interval = parseInt(config["polling_minutes"]) * 60 * 1000;
    } else {
       this.interval = 1 * 60 * 1000;
    }
    this.debug = config["debug"] || true;

    if (!this.username) throw new Error("You must provide a value for username.");
    if (!this.password) throw new Error("You must provide a value for password.");
    if (!this.client_id) throw new Error("You must provide a value for client_id.");
    if (!this.client_secret) throw new Error("You must provide a value for client_secret.");

    this.expires_in = Date.now();
    this.device_id = "";
    this.device_usage = 0.00;

    log("User variables loaded.");

    if (api) {
      this.api = api;
      this.api.on('didFinishLaunching', this.fetchDevices.bind(this));
      this.timer = setInterval(this.fetchDevices.bind(this), this.interval);

        log("Update interval set.");
    }

    log("Initial load of the accessory started.");

    // get the Valve service if it exists, otherwise create a new Valve service
    this.informationService = this.accessory.getService(Service.Valve) ||
    this.accessory.addService(Service.Valve);

   this.informationService
         .setCharacteristic(Characteristic.Manufacturer, "Flume Water Monitor")
        .setCharacteristic(Characteristic.Model, "001")
        .setCharacteristic(Characteristic.SerialNumber, this.device_id)
        .setCharacteristic(Characteristic.Name, accessory.context.device.name)
        .setCharacteristic(Characteristic.Active, false)
        .setCharacteristic(Characteristic.InUse, false)
        .setCharacteristic(Characteristic.ValveType, "3")
        .setCharacteristic(Characteristic.StatusFault, false);

    log("Starting position is water is Off");
    log("Load of the accessory complete.");
}

Flume.prototype.getAccessToken = function() {
    var now = Date.now();

    log("Getting the access token.");

    if (!this.access_token) {
    return fetch('https://api.flumetech.com/oauth/token', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: '{"grant_type":"password","client_id":' + this.client_id + ',"client_secret":' + this.client_secret + ',"username":' + this.username + ',"password":' + this.password + '}'
            })
            .then(res => {
                if (res.ok) {
                    return res.json();
                    log("res was okay.");
                } else {
                    log("ERROR! Unable to retrieve new token: " + res.statusText);
                }
            })
            .then(json => {
                this.access_token = json.access_token;
                this.refresh_token = json.refresh_token;
                this.expires_in = now + json.expires_in;
                this.log("Token received: " + this.access_token);
                this.log("Refresh token received: " + this.refresh_token);
                this.log("Token expires at: " + new Date(this.expires_in));
                return this.access_token;
            });
  } else if (now > this.expires_in) {
        return fetch('https://api.flumetech.com/oauth/token', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: '{"grant_type":"refresh_token","client_id":' + this.client_id + ',"client_secret":' + this.client_secret + ',"refresh_token":' + this.refresh_token + '}'
        })
        .then(res => {
          if (res.ok) {
              return res.json();
            } else {
              log("ERROR! Unable to retrieve new token: " + res.statusText);
            }
        })
        .then(json => {
          this.access_token = json.access_token;
            this.expires_in = now + json.expires_in;
            this.log("Token received: " + this.access_token);
            this.log("Refresh token received: " + this.refresh_token);
            this.log("Token expires at: " + new Date(this.expires_in));
            return this.access_token;
        });
    }

    this.log("Getting User ID from JWT.")

    var token = this.access_token;
  var decoded = jwt_decode(token);
  // or perhaps: decoded = jwt.decode(config["access_token"], verify=False)

  this.log(decoded);
  this.user_id = decoded.user_id;    // or perhaps: decoded["user_id"]
  this.log("User ID: " + this.user_id);
    this.log("Device ID: " + this.device_id);

    return fetch('https://api.flumetech.com/users/' + this.user_id + '/devices', {
      method: 'GET',
        headers: {
          'authorization': '' + this.access_token + ''
            },
        })
        .then(res => {
          if (res.ok) {
              return res.json();
            } else {
              log("ERROR! Unable to retrieve devices: " + res.statusText);
            }
        })
        .then(json => {
          this.device_id = json.id;
            this.log("User ID: " + this.user_id);
            this.log("Device ID: " + this.device_id);
            return this.device_id;
        });
  }


Flume.prototype.fetchDevices = function() {
    this.log("Fetching current devices and statuses.");

    // alternative approach: var previousminute = (datetime.datetime.now() - datetime.timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S');
  var currentminute = (datetime.datetime.now() - datetime.timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S');

    this.log("Token: " + this.access_token);
    this.log("User ID: " + this.user_id);
    this.log("Device ID: " + this.device_id);

    this.getAccessToken()
      .then(token => fetch('https://api.flumetech.com/users/' + this.user_id + '/devices/' + this.device_id + '/query', {
          method: 'POST',
            headers: {
              'content-type': 'application/json',
                'authorization': 'Bearer ' + this.access_token
            },
      body: '{"queries":[{"request_id":"currentusage","bucket":"MIN","since_datetime": currentminute,"operation":"SUM","units":"GALLONS"}]}'
      // alternative approach might be payload = '{"queries":[{"request_id":"perminute","bucket":"MIN","since_datetime":"' + previousminute() + '","until_datetime":"' + currentminute() + '","group_multiplier":"1","operation":"SUM","sort_direction":"ASC","units":"GALLONS"}]}'
        // as seen at https://github.com/ScriptBlock/flumecli/blob/master/flumecli.py
        })
        .then(res => {
          if (res.ok) {
              return res.json();
                this.device_usage = value;
            } else {
              log("ERROR! Unable to retrieve devices: " + res.statusText);
            }
        }));

    log("Updating the status");
        this.updateState(accessory);
    log("Updated the status");
    }


Flume.prototype.updateState = function(accessory) {
    var fresh = Date.now() - Date.parse(accessory.context.time + ".000Z") < 60 * 60 * 1000;

    log("Device Usage & Handicap: ");
    log(this.device_usage);
    log(this.handicap);

    if (this.device_usage > this.handicap) {
      log("Water is On");
      accessory.getService(Service.Valve)
        .setCharacteristic(Characteristic.Active, true)
        .setCharacteristic(Characteristic.InUse, true);
  } else {
       log("Water is Off");
       accessory.getService(Service.Valve)
        .setCharacteristic(Characteristic.Active, false)
        .setCharacteristic(Characteristic.InUse, false);
  }
}
