declare global {
  interface Window {
    __APP_CONFIG?: {
      serverUrl?: string;
    };
    APP_CONFIG?: {
      serverUrl?: string;
    };
  }
}

export {};
