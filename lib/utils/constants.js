export default {
  defaultConfig: {
    name: 'Flume',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    disableDeviceLogging: false,
    refreshInterval: 1,
    platform: 'Flume',
  },

  defaultValues: {
    refreshInterval: 2,
  },

  minValues: {
    refreshInterval: 1,
  },

  httpRetryCodes: ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNABORTED'],
};
