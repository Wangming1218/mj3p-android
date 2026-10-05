const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('APP_CONFIG', {
  serverUrl: process.env.MJ_SERVER_URL || 'http://123.45.67.89:3000'
});
