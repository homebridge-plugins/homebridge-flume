import axios from 'axios';
import jwtDecode from 'jwt-decode';
import platformConsts from '../utils/constants.js';
import { sleep } from '../utils/functions.js';
import platformLang from '../utils/lang-en.js';

export default class {
  constructor(platform) {
    // Create variables usable by the class
    this.log = platform.log;
    this.username = platform.config.username;
    this.password = platform.config.password;
    this.clientId = platform.config.clientId;
    this.clientSecret = platform.config.clientSecret;
  }

  async obtainToken() {
    try {
      // Generate the JSON data to send
      const body = {
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password,
      };
      const now = Date.now();

      // Perform the HTTP request
      const res = await axios.post('https://api.flumetech.com/oauth/token', body, {
        timeout: 10000,
      });

      // Check to see we got a response
      if (!res.data) {
        throw new Error(platformLang.noDataReceived);
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
      this.log.debug('[HTTP obtainToken()] %s.', JSON.stringify(res.data));

      // Check to see we got a proper response
      if (!res.data.data || !res.data.data[0]) {
        this.log.warn('[HTTP obtainToken()] %s.', JSON.stringify(res.data));
        throw new Error(platformLang.noDataReceived);
      }

      // Make the token available in other functions
      this.accessToken = res.data.data[0].access_token;
      this.refreshToken = res.data.data[0].refresh_token;
      this.expiresIn = now + res.data.data[0].expires_in;

      // Obtain the user ID
      this.userId = jwtDecode(this.accessToken).user_id;

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
      return true;
    } catch (err) {
      if (err.code && platformConsts.httpRetryCodes.includes(err.code)) {
        // Retry if another attempt could be successful
        this.log.warn('[HTTP obtainToken()] %s [%s].', platformLang.httpRetry, err.code);
        await sleep(30000);
        return this.obtainToken();
      }
      throw new Error(`[HTTP obtainToken()] ${err.message}`);
    }
  }

  async renewToken() {
    try {
      // Check we have a refresh token
      if (!this.refreshToken) {
        throw new Error(platformLang.noRefreshToken);
      }

      // Generate the JSON data to send
      const body = {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
      };
      const now = Date.now();

      // Perform the HTTP request
      const res = await axios.post('https://api.flumetech.com/oauth/token', body, {
        timeout: 10000,
      });

      // Check to see we got a response
      if (!res.data) {
        throw new Error(platformLang.noDataReceived);
      }

      // Log the response if in debug mode
      this.log.debug('[HTTP renewToken()] %s.', JSON.stringify(res.data));

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
      this.accessToken = res.data.data[0].access_token;
      this.refreshToken = res.data.data[0].refresh_token;
      this.expiresIn = now + res.data.data[0].expires_in;
      return true;
    } catch (err) {
      if (err.code && platformConsts.httpRetryCodes.includes(err.code)) {
        // Retry if another attempt could be successful
        this.log.warn('[HTTP renewToken()] %s [%s].', platformLang.httpRetry, err.code);
        await sleep(30000);
        return this.renewToken();
      }
      throw new Error(`[HTTP renewToken()] ${err.message}`);
    }
  }

  async getDevices() {
    try {
      // Check we have a user id
      if (!this.userId || !this.accessToken) {
        throw new Error(platformLang.noUserId);
      }

      // Perform the HTTP request
      const res = await axios.get(`https://api.flumetech.com/users/${this.userId}/devices?list_shared=true`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        timeout: 10000,
      });

      // Check to see we got a response
      if (!res.data) {
        throw new Error(platformLang.noDataReceived);
      }

      // Log the response if in debug mode
      this.log.debug('[HTTP getDevices()] %s.', JSON.stringify(res.data));

      return res.data.data;
    } catch (err) {
      if (err.code && platformConsts.httpRetryCodes.includes(err.code)) {
        // Retry if another attempt could be successful
        this.log.warn('[HTTP getDevices()] %s [%s].', platformLang.httpRetry, err.code);
        await sleep(30000);
        return this.getDevices();
      }
      throw new Error(`[HTTP getDevices()] ${err.message}`);
    }
  }

  async getDeviceInfo(deviceId) {
    // Refresh the access token if it has expired already
    if (Date.now() > this.expiresIn) {
      await this.renewToken();
    }

    // Send the request
    const res = await axios.get(
      `https://api.flumetech.com/users/${this.userId}/devices/${deviceId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    // Check to see we got a response
    if (!res.data) {
      throw new Error(platformLang.noDataReceived);
    }

    // Log the response if in debug mode
    this.log.debug('[HTTP getDeviceInfo()] %s.', JSON.stringify(res.data));

    // Parse the response
    return res.data.data[0];
  }

  async getWaterInfo(deviceId) {
    // Refresh the access token if it has expired already
    if (Date.now() > this.expiresIn) {
      await this.renewToken();
    }

    // Generate dates for the query data
    const date = new Date();
    const startOfToday = `${date.toISOString().substring(0, 10)} 00:00:00`;

    // Set the date to the first of the current month
    date.setDate(1);
    const startOfCurrMonth = `${date.toISOString().substring(0, 10)} 00:00:00`;

    // Set the month to the previous month
    date.setMonth(date.getMonth() - 1);
    const startOfPrevMonth = `${date.toISOString().substring(0, 10)} 00:00:00`;

    // Generate the JSON data to send
    const body = {
      queries: [
        {
          request_id: 'today',
          bucket: 'DAY',
          since_datetime: startOfToday,
          operation: 'SUM',
          units: 'GALLONS',
        },
        {
          request_id: 'month',
          bucket: 'MON',
          since_datetime: startOfCurrMonth,
          operation: 'SUM',
          units: 'GALLONS',
        },
        {
          request_id: 'prevMonth',
          bucket: 'MON',
          since_datetime: startOfPrevMonth,
          until_datetime: startOfCurrMonth,
          operation: 'SUM',
          units: 'GALLONS',
        },
      ],
    };

    // Send the request
    const res = await axios.post(
      `https://api.flumetech.com/users/${this.userId}/devices/${deviceId}/query`,
      body,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    // Check to see we got a response
    if (!res.data) {
      throw new Error(platformLang.noDataReceived);
    }

    // Log the response if in debug mode
    this.log.debug('[HTTP getWaterInfo()] %s.', JSON.stringify(res.data));

    // Parse the response
    return res.data.data[0];
  }

  async getLeakInfo(deviceId) {
    // Refresh the access token if it has expired already
    if (Date.now() > this.expiresIn) {
      await this.renewToken();
    }

    // Send the request
    const res = await axios.get(
      `https://api.flumetech.com/users/${this.userId}/devices/${deviceId}/leaks/active`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    // Check to see we got a response
    if (!res.data) {
      throw new Error(platformLang.noDataReceived);
    }

    // Log the response if in debug mode
    this.log.debug('[HTTP getLeakInfo()] %s.', JSON.stringify(res.data));

    // Parse the response
    return res.data.data[0];
  }
}
