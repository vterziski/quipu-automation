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

const SUPPORTED_REGIONS = ['eu-west', 'us-east'] as const;
type SupportedRegion = (typeof SUPPORTED_REGIONS)[number];

export function loadRegion(): RegionConfig {
  const regionName = process.env.REGION ?? 'eu-west';
  if (!(SUPPORTED_REGIONS as readonly string[]).includes(regionName)) {
    throw new Error(
      `Unknown region "${regionName}". Supported: ${SUPPORTED_REGIONS.join(', ')}`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(`./regions/${regionName as SupportedRegion}`) as { default: RegionConfig };
  if (!mod.default) {
    throw new Error(`Region config for "${regionName}" has no default export`);
  }
  return mod.default;
}
