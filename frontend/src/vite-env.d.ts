/// <reference types="vite/client" />

import 'axios';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    __wakeUpTracked?: boolean;
  }
}