// config/regions/eu-west.ts
import type { RegionConfig } from '../region';

const config: RegionConfig = {
  name: 'eu-west',
  webBaseUrl: 'https://demo.firefly-iii.org',
  apiBaseUrl: 'https://demo.firefly-iii.org/api/v1',
  defaultUser: {
    email: process.env.USER_EMAIL ?? 'demo@firefly',
    password: process.env.USER_PASSWORD ?? 'demo',
  },
  apiToken: process.env.API_TOKEN ?? '',
};

export default config;
