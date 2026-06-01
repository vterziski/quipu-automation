// config/regions/us-east.ts
import type { RegionConfig } from '../region';

const config: RegionConfig = {
  name: 'us-east',
  webBaseUrl: (process.env.US_EAST_WEB_URL ?? 'https://us.demo.firefly-iii.org').replace(/\/$/, ''),
  apiBaseUrl: (process.env.US_EAST_API_URL ?? 'https://us.demo.firefly-iii.org/api/v1').replace(/\/$/, ''),
  defaultUser: {
    email: process.env.USER_EMAIL ?? 'demo@firefly',
    password: process.env.USER_PASSWORD ?? 'demo',
  },
  apiToken: process.env.API_TOKEN ?? '',
};

export default config;
