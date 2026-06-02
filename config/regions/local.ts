// config/regions/local.ts
import type { RegionConfig } from '../region';

const config: RegionConfig = {
  name: 'local',
  webBaseUrl: (process.env.LOCAL_WEB_URL ?? 'http://localhost:8080').replace(/\/$/, ''),
  apiBaseUrl: (process.env.LOCAL_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/$/, ''),
  defaultUser: {
    email: process.env.USER_EMAIL ?? 'admin@local.dev',
    password: process.env.USER_PASSWORD ?? 'changeme',
  },
  apiToken: process.env.API_TOKEN ?? '',
};

export default config;
