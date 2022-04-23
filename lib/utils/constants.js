export default {
  defaultConfig: {
    name: 'Flume',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    debug: false,
    disablePlugin: false,
    disableDeviceLogging: false,
    refreshInterval: 1,
    platform: 'Flume',
  },

  defaultValues: {
    refreshInterval: 2,
  },

  minValues: {
    refreshInterval: 2,
  },

  httpRetryCodes: ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNABORTED'],
};
