// config/region.ts
export interface RegionConfig {
  name: string;
  webBaseUrl: string;
  apiBaseUrl: string;
  defaultUser: {
    email: string;
    password: string;
  };
  apiToken: string;
}

export function loadRegion(): RegionConfig {
  const regionName = process.env.REGION ?? 'eu-west';
  // Dynamic require keeps region addition to one file only.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(`./regions/${regionName}`) as { default: RegionConfig };
  if (!mod.default) {
    throw new Error(`Region config for "${regionName}" has no default export`);
  }
  return mod.default;
}
