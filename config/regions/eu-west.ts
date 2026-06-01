// config/regions/eu-west.ts
import type { RegionConfig } from '../region';

const config: RegionConfig = {
  name: 'eu-west',
  webBaseUrl: process.env.EU_WEST_WEB_URL ?? 'https://demo.firefly-iii.org',
  apiBaseUrl: process.env.EU_WEST_API_URL ?? 'https://demo.firefly-iii.org/api/v1',
  defaultUser: {
    email: process.env.USER_EMAIL ?? 'demo@firefly',
    password: process.env.USER_PASSWORD ?? 'demo',
  },
  apiToken: process.env.API_TOKEN ?? '',
};

export default config;
