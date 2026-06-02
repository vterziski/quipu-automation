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
  // Regex prevents path traversal — no allowlist needed; just add a config/regions/<name>.ts file
  if (!/^[a-z0-9-]+$/.test(regionName)) {
    throw new Error(
      `Invalid region name "${regionName}". Region names must match [a-z0-9-]+ (e.g. "eu-west", "local").`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(`./regions/${regionName}`) as { default?: RegionConfig };
  if (!mod.default) {
    throw new Error(
      `Region "${regionName}" has no default export. Create config/regions/${regionName}.ts.`,
    );
  }
  const config = mod.default;

  if (!config.apiToken) {
    throw new Error(
      `API_TOKEN is not set for region "${regionName}". Both API and web tests require a token for setup and cleanup.`,
    );
  }
  try {
    new URL(config.webBaseUrl);
    new URL(config.apiBaseUrl);
  } catch {
    throw new Error(
      `Invalid URL in region "${regionName}": webBaseUrl="${config.webBaseUrl}", apiBaseUrl="${config.apiBaseUrl}". URLs must include a scheme (e.g. "http://localhost:8080").`,
    );
  }

  return config;
}
