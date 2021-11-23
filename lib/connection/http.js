/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

const axios = require('axios')
const jwtDecode = require('jwt-decode')

module.exports = class connectionHTTP {
  constructor (platform) {
    // Create variables usable by the class
    this.consts = platform.consts
    this.debug = platform.config.debug
    this.funcs = platform.funcs
    this.lang = platform.lang
    this.log = platform.log
    this.username = platform.config.username
    this.password = platform.config.password
    this.clientId = platform.config.clientId
    this.clientSecret = platform.config.clientSecret
  }

  async obtainToken () {
    try {
      // Generate the JSON data to send
      const body = {
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password
      }
      const now = Date.now()

      // Perform the HTTP request
      const res = await axios.post('https://api.flumetech.com/oauth/token', body, {
        timeout: 10000
      })

      // Check to see we got a response
      if (!res.data) {
        throw new Error(this.lang.noDataReceived)
      }

      /*
        {
          success: true,
          code: 602,
          message: 'Request OK',
          http_code: 200,
          http_message: 'OK',
          detailed: null,
          data: [
            {
              token_type: 'bearer',
              access_token: '',
              expires_in: 604800,
              refresh_token: ''
            }
          ],
          count: 1,
          pagination: null
        }
      */

      // Log the response if in debug mode
      if (this.debug) {
        this.log('[HTTP obtainToken()] %s.', JSON.stringify(res.data))
      }

      // Make the token available in other functions
      this.accessToken = res.data.data[0].access_token
      this.refreshToken = res.data.data[0].refresh_token
      this.expiresIn = now + res.data.data[0].expires_in

      // Obtain the user ID
      this.userId = jwtDecode(this.accessToken).user_id

      /*
        {
          user_id: 0000,
          type: 'USER',
          scope: [ 'read:personal', 'update:personal', 'query:personal' ],
          iat: 0000000000,
          exp: 0000000000,
          iss: 'flume_oauth',
          sub: ''
        }
      */
    } catch (err) {
      if (err.code && this.consts.httpRetryCodes.includes(err.code)) {
        // Retry if another attempt could be successful
        this.log.warn('[HTTP obtainToken()] %s [%s].', this.lang.httpRetry, err.code)
        await this.funcs.sleep(30000)
        return await this.login()
      } else {
        throw new Error('[HTTP obtainToken()] ' + err.message)
      }
    }
  }

  async renewToken () {
    try {
      // Check we have a refresh token
      if (!this.refreshToken) {
        throw new Error(this.lang.noRefreshToken)
      }

      // Generate the JSON data to send
      const body = {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken
      }
      const now = Date.now()

      // Perform the HTTP request
      const res = await axios.post('https://api.flumetech.com/oauth/token', body, {
        timeout: 10000
      })

      // Check to see we got a response
      if (!res.data) {
        throw new Error(this.lang.noDataReceived)
      }

      // Log the response if in debug mode
      if (this.debug) {
        this.log('[HTTP renewToken()] %s.', JSON.stringify(res.data))
      }

      /*
          {
            success: true,
            code: 602,
            message: 'Request OK',
            http_code: 200,
            http_message: 'OK',
            detailed: null,
            data: [
              {
                token_type: 'bearer',
                access_token: '',
                expires_in: 604800,
                refresh_token: ''
              }
            ],
            count: 1,
            pagination: null
          }
        */

      // Make the token available in other functions
      this.accessToken = res.data.data[0].access_token
      this.refreshToken = res.data.data[0].refresh_token
      this.expiresIn = now + res.data.data[0].expires_in
    } catch (err) {
      if (err.code && this.consts.httpRetryCodes.includes(err.code)) {
        // Retry if another attempt could be successful
        this.log.warn('[HTTP renewToken()] %s [%s].', this.lang.httpRetry, err.code)
        await this.funcs.sleep(30000)
        return await this.login()
      } else {
        throw new Error('[HTTP renewToken()] ' + err.message)
      }
    }
  }

  async getDevices () {
    try {
      // Check we have a user id
      if (!this.userId || !this.accessToken) {
        throw new Error(this.lang.noUserId)
      }

      // Perform the HTTP request
      const res = await axios.get('https://api.flumetech.com/users/' + this.userId + '/devices', {
        headers: { Authorization: 'Bearer ' + this.accessToken },
        timeout: 10000
      })

      // Check to see we got a response
      if (!res.data) {
        throw new Error(this.lang.noDataReceived)
      }

      // Log the response if in debug mode
      if (this.debug) {
        this.log('[HTTP getDevices()] %s.', JSON.stringify(res.data))
      }

      return res.data.data
    } catch (err) {
      if (err.code && this.consts.httpRetryCodes.includes(err.code)) {
        // Retry if another attempt could be successful
        this.log.warn('[HTTP getDevices()] %s [%s].', this.lang.httpRetry, err.code)
        await this.funcs.sleep(30000)
        return await this.login()
      } else {
        throw new Error('[HTTP getDevices()] ' + err.message)
      }
    }
  }

  async getDeviceInfo (deviceId, fromWhen) {
    // Refresh the access token if it has expired already
    if (Date.now() > this.expiresIn) {
      await this.renewToken()
    }

    // Generate the JSON data to send
    const body = {
      queries: [
        {
          request_id: 'currentusage',
          bucket: 'MIN',
          since_datetime: fromWhen,
          operation: 'SUM',
          units: 'GALLONS'
        }
      ]
    }

    // Send the request
    const res = await axios.post(
      'https://api.flumetech.com/users/' + this.userId + '/devices/' + deviceId + '/query',
      body,
      {
        headers: {
          Authorization: 'Bearer ' + this.accessToken
        }
      }
    )

    // Check to see we got a response
    if (!res.data) {
      throw new Error(this.lang.noDataReceived)
    }

    // Log the response if in debug mode
    if (this.debug) {
      this.log('[HTTP getDevice()] %s.', JSON.stringify(res.data))
    }

    // Parse the response
    return res.data.data[0]
  }
}
