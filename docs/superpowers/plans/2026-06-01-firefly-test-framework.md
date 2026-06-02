# Firefly III Test Automation Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-grade, multi-region Playwright test framework for the Firefly III financial platform covering API and Web layers with CI pipelines.

**Architecture:** Two Playwright projects (`api` / `web`) share a region config loader and a typed API client. Web tests use POMs and can call the API client for setup/teardown. All env-specific values flow through `config/region.ts` — no test file ever imports a URL or credential directly.

**Tech Stack:** TypeScript 5 (strict), Playwright 1.60+, dotenv, Node 20, GitHub Actions

---

## File Map

| Path | Responsibility |
|---|---|
| `tsconfig.json` | Strict TS config for entire repo |
| `package.json` | Scripts, devDependencies |
| `.env.example` | Documented env vars |
| `playwright.config.ts` | Two Playwright projects (api, web) |
| `config/region.ts` | `RegionConfig` interface + `loadRegion()` |
| `config/regions/eu-west.ts` | EU West region values |
| `config/regions/us-east.ts` | US East region values |
| `src/shared/types/firefly.ts` | All Firefly III API response/request types |
| `src/shared/helpers/dataFactory.ts` | `buildTransaction()` seed factory |
| `src/shared/helpers/schemaAssert.ts` | Runtime schema assertion helper |
| `src/api/client/FireflyClient.ts` | Typed API client (wraps Playwright request) |
| `src/api/fixtures/api.fixtures.ts` | Playwright fixture extending `test` with `apiClient` |
| `src/api/tests/transactions.api.spec.ts` | All 4 API tests |
| `src/web/pages/LoginPage.ts` | POM — login form |
| `src/web/pages/DashboardPage.ts` | POM — dashboard |
| `src/web/pages/TransactionCreatePage.ts` | POM — create transaction form |
| `src/web/pages/TransactionListPage.ts` | POM — transaction list |
| `src/web/fixtures/web.fixtures.ts` | Playwright fixture extending `test` with all POMs + `apiClient` |
| `src/web/tests/login.web.spec.ts` | Login happy path + error tests |
| `src/web/tests/transaction.web.spec.ts` | Transaction create + form validation tests |
| `.github/workflows/api.yml` | API test CI workflow |
| `.github/workflows/web.yml` | Web test CI workflow |
| `.github/workflows/full-suite.yml` | Scheduled + manual full suite |
| `README.md` | Setup, usage, known limitations |

---

## Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Delete: `tests/` (scaffold placeholder from Playwright init)

- [ ] **Step 1: Remove Playwright init scaffolding**

```bash
rm -rf tests
```

- [ ] **Step 2: Create directory structure**

```bash
mkdir -p config/regions \
  src/api/client src/api/fixtures src/api/tests \
  src/web/pages src/web/fixtures src/web/tests \
  src/shared/types src/shared/helpers \
  .github/workflows
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src/**/*", "config/**/*", "playwright.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Update `package.json`**

```json
{
  "name": "quipu-automation",
  "version": "1.0.0",
  "description": "Automated test framework for Firefly III financial platform",
  "private": true,
  "scripts": {
    "test:api": "playwright test --project=api",
    "test:web": "playwright test --project=web",
    "test:all": "playwright test",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "@types/node": "^20.0.0",
    "dotenv": "^16.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Copy to .env and fill in values
REGION=eu-west
API_TOKEN=your_personal_access_token_here
USER_EMAIL=demo@firefly
USER_PASSWORD=demo
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: no errors, `node_modules` updated with `typescript` and `dotenv`.

- [ ] **Step 7: Commit**

```bash
git init
git add tsconfig.json package.json package-lock.json .env.example .gitignore
git commit -m "chore: project setup with TypeScript strict config"
```

---

## Task 2: Region Infrastructure

**Files:**
- Create: `config/region.ts`
- Create: `config/regions/eu-west.ts`
- Create: `config/regions/us-east.ts`

- [ ] **Step 1: Create `config/region.ts`**

```typescript
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
```

- [ ] **Step 2: Create `config/regions/eu-west.ts`**

```typescript
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
```

- [ ] **Step 3: Create `config/regions/us-east.ts`**

```typescript
// config/regions/us-east.ts
import type { RegionConfig } from '../region';

const config: RegionConfig = {
  name: 'us-east',
  webBaseUrl: process.env.US_EAST_WEB_URL ?? 'https://us.demo.firefly-iii.org',
  apiBaseUrl: process.env.US_EAST_API_URL ?? 'https://us.demo.firefly-iii.org/api/v1',
  defaultUser: {
    email: process.env.USER_EMAIL ?? 'demo@firefly',
    password: process.env.USER_PASSWORD ?? 'demo',
  },
  apiToken: process.env.API_TOKEN ?? '',
};

export default config;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors only from `playwright.config.ts` (not yet updated) — no errors in `config/`.

- [ ] **Step 5: Commit**

```bash
git add config/
git commit -m "feat: region config loader and eu-west/us-east region files"
```

---

## Task 3: Replace `playwright.config.ts`

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Replace `playwright.config.ts` with two-project config**

```typescript
// playwright.config.ts
import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import { loadRegion } from './config/region';

const region = loadRegion();

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  projects: [
    {
      name: 'api',
      testDir: './src/api/tests',
      use: {
        baseURL: region.apiBaseUrl,
      },
    },
    {
      name: 'web',
      testDir: './src/web/tests',
      use: {
        baseURL: region.webBaseUrl,
        browserName: 'chromium',
        headless: true,
        trace: 'on-first-retry',
      },
    },
  ],
});
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: **0 errors**.

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "feat: playwright config with api and web projects"
```

---

## Task 4: Shared Firefly III Types

**Files:**
- Create: `src/shared/types/firefly.ts`

These types mirror the actual Firefly III v1 API. Note: the list response nests transaction details inside `attributes.transactions[]`, not as flat `attributes` fields — the spec's schema section simplifies this.

- [ ] **Step 1: Create `src/shared/types/firefly.ts`**

```typescript
// src/shared/types/firefly.ts

// ── Request payload ──────────────────────────────────────────────────────────

export interface TransactionSplit {
  type: string;
  date: string;
  amount: string;
  description: string;
  source_name: string;
  destination_name: string;
}

export interface TransactionCreatePayload {
  transactions: TransactionSplit[];
}

// ── Single transaction (in create response and list items) ───────────────────

export interface TransactionJournal {
  transaction_journal_id: number;
  type: string;
  date: string;
  amount: string;
  description: string;
  source_name: string;
  destination_name: string;
}

export interface TransactionGroupAttributes {
  user: number;
  group_title: string | null;
  transactions: TransactionJournal[];
}

export interface TransactionGroupData {
  id: string;
  type: string;
  attributes: TransactionGroupAttributes;
}

// ── POST /transactions response ──────────────────────────────────────────────

export interface TransactionCreateResponse {
  data: TransactionGroupData;
}

// ── GET /transactions list response ─────────────────────────────────────────

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  current_url: string;
  next_url: string | null;
}

export interface TransactionListMeta {
  pagination: Pagination;
}

export interface TransactionListResponse {
  data: TransactionGroupData[];
  meta: TransactionListMeta;
}

// ── Error response ───────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/types/
git commit -m "feat: shared Firefly III TypeScript types"
```

---

## Task 5: Shared Helpers

**Files:**
- Create: `src/shared/helpers/dataFactory.ts`
- Create: `src/shared/helpers/schemaAssert.ts`

- [ ] **Step 1: Create `src/shared/helpers/dataFactory.ts`**

```typescript
// src/shared/helpers/dataFactory.ts
import type { TransactionCreatePayload, TransactionSplit } from '../types/firefly';

// These account names exist on the Firefly III demo instance by default.
// If running against a private instance, create matching accounts first.
const DEFAULT_SOURCE = 'Savings account';
const DEFAULT_DESTINATION = 'Groceries';

export function buildTransaction(overrides: Partial<TransactionSplit> = {}): TransactionCreatePayload {
  const today = new Date().toISOString().split('T')[0] as string;
  return {
    transactions: [
      {
        type: overrides.type ?? 'withdrawal',
        date: overrides.date ?? today,
        amount: overrides.amount ?? '10.00',
        description: overrides.description ?? `Test withdrawal ${Date.now()}`,
        source_name: overrides.source_name ?? DEFAULT_SOURCE,
        destination_name: overrides.destination_name ?? DEFAULT_DESTINATION,
      },
    ],
  };
}
```

- [ ] **Step 2: Create `src/shared/helpers/schemaAssert.ts`**

The spec requires a custom schema assertion — no third-party schema lib. This validates the actual Firefly III list response shape (transaction details are nested inside `attributes.transactions[]`).

```typescript
// src/shared/helpers/schemaAssert.ts
import type { TransactionListResponse } from '../types/firefly';

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Schema assertion failed: expected string at ${path}, got ${typeof value}`);
  }
}

function assertNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Schema assertion failed: expected number at ${path}, got ${typeof value}`);
  }
}

function assertObject(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Schema assertion failed: expected object at ${path}, got ${typeof value}`);
  }
}

export function assertTransactionListSchema(
  body: unknown,
): asserts body is TransactionListResponse {
  assertObject(body, 'root');

  if (!Array.isArray(body['data'])) {
    throw new Error(`Schema assertion failed: expected array at root.data`);
  }

  for (let i = 0; i < body['data'].length; i++) {
    const item = body['data'][i] as unknown;
    assertObject(item, `data[${i}]`);
    assertString(item['id'], `data[${i}].id`);
    assertString(item['type'], `data[${i}].type`);
    assertObject(item['attributes'], `data[${i}].attributes`);

    const attrs = item['attributes'] as Record<string, unknown>;
    if (!Array.isArray(attrs['transactions']) || attrs['transactions'].length === 0) {
      throw new Error(`Schema assertion failed: expected non-empty array at data[${i}].attributes.transactions`);
    }

    const tx = attrs['transactions'][0] as unknown;
    assertObject(tx, `data[${i}].attributes.transactions[0]`);
    assertString(tx['amount'], `data[${i}].attributes.transactions[0].amount`);
    assertString(tx['description'], `data[${i}].attributes.transactions[0].description`);
    assertString(tx['date'], `data[${i}].attributes.transactions[0].date`);
    assertString(tx['source_name'], `data[${i}].attributes.transactions[0].source_name`);
  }

  assertObject(body['meta'], 'meta');
  assertObject(body['meta']['pagination'], 'meta.pagination');
  assertNumber(body['meta']['pagination']['total'], 'meta.pagination.total');
  assertNumber(body['meta']['pagination']['per_page'], 'meta.pagination.per_page');
  assertNumber(body['meta']['pagination']['current_page'], 'meta.pagination.current_page');
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/
git commit -m "feat: data factory and schema assertion helper"
```

---

## Task 6: Typed API Client

**Files:**
- Create: `src/api/client/FireflyClient.ts`

The client returns raw `APIResponse` objects so tests can assert status codes. All auth headers are set centrally.

- [ ] **Step 1: Create `src/api/client/FireflyClient.ts`**

```typescript
// src/api/client/FireflyClient.ts
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';
import type { TransactionCreatePayload } from '../../shared/types/firefly';

export class FireflyClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    private readonly request: APIRequestContext,
    config: RegionConfig,
  ) {
    this.baseUrl = config.apiBaseUrl;
    this.token = config.apiToken;
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.api+json',
    };
  }

  async createTransaction(payload: TransactionCreatePayload): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/transactions`, {
      headers: this.authHeaders(),
      data: payload,
    });
  }

  async getTransactions(params: { type?: string; limit?: number } = {}): Promise<APIResponse> {
    const qs = new URLSearchParams();
    if (params.type !== undefined) qs.set('type', params.type);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request.get(`${this.baseUrl}/transactions${query}`, {
      headers: this.authHeaders(),
    });
  }

  async deleteTransaction(id: string): Promise<APIResponse> {
    return this.request.delete(`${this.baseUrl}/transactions/${id}`, {
      headers: this.authHeaders(),
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/client/
git commit -m "feat: typed FireflyClient wrapping Playwright APIRequestContext"
```

---

## Task 7: API Fixtures

**Files:**
- Create: `src/api/fixtures/api.fixtures.ts`

- [ ] **Step 1: Create `src/api/fixtures/api.fixtures.ts`**

```typescript
// src/api/fixtures/api.fixtures.ts
import { test as base } from '@playwright/test';
import { FireflyClient } from '../client/FireflyClient';
import { loadRegion } from '../../../config/region';

type ApiFixtures = {
  apiClient: FireflyClient;
};

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    const region = loadRegion();
    await use(new FireflyClient(request, region));
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/fixtures/
git commit -m "feat: API Playwright fixtures with apiClient"
```

---

## Task 8: API Tests

**Files:**
- Create: `src/api/tests/transactions.api.spec.ts`

All four tests share an `afterEach` that deletes any transactions created during the test.

- [ ] **Step 1: Create `src/api/tests/transactions.api.spec.ts`**

```typescript
// src/api/tests/transactions.api.spec.ts
import { test, expect } from '../fixtures/api.fixtures';
import { buildTransaction } from '../../shared/helpers/dataFactory';
import { assertTransactionListSchema } from '../../shared/helpers/schemaAssert';
import type { TransactionCreateResponse, ApiErrorResponse } from '../../shared/types/firefly';

test.describe('Transactions API', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ apiClient }) => {
    for (const id of createdIds) {
      await apiClient.deleteTransaction(id);
    }
    createdIds.length = 0;
  });

  test('given valid payload when POST /transactions then HTTP 200 and body matches', async ({ apiClient }) => {
    const payload = buildTransaction({ description: 'happy-path-test' });

    const response = await apiClient.createTransaction(payload);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json() as TransactionCreateResponse;
    expect(body.data.id).toBeDefined();
    expect(body.data.attributes.transactions[0].amount).toBe(payload.transactions[0].amount);
    expect(body.data.attributes.transactions[0].description).toBe(payload.transactions[0].description);

    createdIds.push(body.data.id);
  });

  test('given empty transactions array when POST /transactions then HTTP 422 with error details', async ({ apiClient }) => {
    const response = await apiClient.createTransaction({ transactions: [] });

    expect(response.status()).toBe(422);

    const body = await response.json() as ApiErrorResponse;
    expect(body.message ?? body.errors).toBeDefined();
    // Must be a specific validation error, not a generic 500
    expect(response.status()).not.toBe(500);
  });

  test('given withdrawal list request when GET /transactions then HTTP 200 and schema is valid', async ({ apiClient }) => {
    const response = await apiClient.getTransactions({ type: 'withdrawal', limit: 5 });

    expect(response.status()).toBe(200);

    const body: unknown = await response.json();
    // assertTransactionListSchema throws with a descriptive message if shape is wrong
    assertTransactionListSchema(body);

    expect(body.meta.pagination.total).toBeGreaterThanOrEqual(0);
    expect(body.meta.pagination.per_page).toBe(5);
    expect(body.meta.pagination.current_page).toBe(1);
  });

  test('given identical payload when POST /transactions twice then both return 200 with different ids', async ({ apiClient }) => {
    // Firefly III does not enforce idempotency keys — each POST creates a separate transaction.
    // A production-grade API should return 409 or honour an Idempotency-Key header.
    // This test pins the current observed behaviour so regressions are detectable.
    const payload = buildTransaction({ description: 'idempotency-pin-test' });

    const response1 = await apiClient.createTransaction(payload);
    const response2 = await apiClient.createTransaction(payload);

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const body1 = await response1.json() as TransactionCreateResponse;
    const body2 = await response2.json() as TransactionCreateResponse;

    expect(body1.data.id).not.toBe(body2.data.id);

    createdIds.push(body1.data.id, body2.data.id);
  });
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run API tests to verify they pass**

First, copy `.env.example` to `.env` and fill in a valid `API_TOKEN` from the Firefly III demo. To get one: log in at https://demo.firefly-iii.org/login (email: `demo@firefly`, password: `demo`), then go to **Profile → OAuth → Personal Access Tokens → Create new token**.

```bash
cp .env.example .env
# edit .env with a real API_TOKEN
npm run test:api
```

Expected: 4 tests pass. If test 1 fails with 422, check that the source account name matches an existing Asset account (query `GET /api/v1/accounts?type=asset` to find valid names).

- [ ] **Step 4: Commit**

```bash
git add src/api/tests/
git commit -m "feat: API tests — happy path, error, schema, idempotency"
```

---

## Task 9: POM Classes

**Files:**
- Create: `src/web/pages/LoginPage.ts`
- Create: `src/web/pages/DashboardPage.ts`
- Create: `src/web/pages/TransactionCreatePage.ts`
- Create: `src/web/pages/TransactionListPage.ts`

Selectors below are based on Firefly III's Bootstrap-based UI. If the demo server has been updated, run `npx playwright codegen https://demo.firefly-iii.org/login` to regenerate selectors.

- [ ] **Step 1: Create `src/web/pages/LoginPage.ts`**

```typescript
// src/web/pages/LoginPage.ts
import type { Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export class LoginPage {
  private readonly emailInput = this.page.locator('input[name="email"]');
  private readonly passwordInput = this.page.locator('input[name="password"]');
  private readonly submitButton = this.page.locator('button[type="submit"], input[type="submit"]');
  readonly errorAlert = this.page.locator('.alert-danger, .alert.alert-danger');

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {}

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/login`);
    return this;
  }

  async fillCredentials(email: string, password: string): Promise<this> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    return this;
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }
}
```

- [ ] **Step 2: Create `src/web/pages/DashboardPage.ts`**

```typescript
// src/web/pages/DashboardPage.ts
import type { Page } from '@playwright/test';

export class DashboardPage {
  readonly pageHeading = this.page.locator('h1, .breadcrumb-item.active').first();
  readonly navBar = this.page.locator('nav.navbar, #main-nav');

  constructor(private readonly page: Page) {}

  isAt(): Promise<boolean> {
    return this.navBar.isVisible();
  }

  url(): string {
    return this.page.url();
  }
}
```

- [ ] **Step 3: Create `src/web/pages/TransactionCreatePage.ts`**

```typescript
// src/web/pages/TransactionCreatePage.ts
import type { Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export interface TransactionFormData {
  description: string;
  amount: string;
  date: string;
  sourceName: string;
  destinationName: string;
}

export class TransactionCreatePage {
  private readonly descriptionInput = this.page.locator('input[name="description"]').first();
  private readonly amountInput = this.page.locator('input[name="amount"]').first();
  private readonly dateInput = this.page.locator('input[name="date"]').first();
  private readonly sourceDropdown = this.page.locator('input[name="source_name"]').first();
  private readonly destinationDropdown = this.page.locator('input[name="destination_name"]').first();
  private readonly submitButton = this.page.locator('button[type="submit"]').first();
  readonly successMessage = this.page.locator('.alert-success, .message-success');
  readonly validationError = this.page.locator('.has-error, .invalid-feedback, .text-danger');

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {}

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/transactions/create/withdrawal`);
    return this;
  }

  async fill(data: TransactionFormData): Promise<this> {
    await this.descriptionInput.fill(data.description);
    await this.amountInput.fill(data.amount);
    await this.dateInput.fill(data.date);
    await this.sourceDropdown.fill(data.sourceName);
    await this.destinationDropdown.fill(data.destinationName);
    return this;
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
```

- [ ] **Step 4: Create `src/web/pages/TransactionListPage.ts`**

```typescript
// src/web/pages/TransactionListPage.ts
import type { Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export class TransactionListPage {
  readonly firstRow = this.page.locator('table tbody tr').first();

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {}

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/transactions/index/withdrawal`);
    return this;
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/web/pages/
git commit -m "feat: POM classes — LoginPage, DashboardPage, TransactionCreatePage, TransactionListPage"
```

---

## Task 10: Web Fixtures

**Files:**
- Create: `src/web/fixtures/web.fixtures.ts`

- [ ] **Step 1: Create `src/web/fixtures/web.fixtures.ts`**

```typescript
// src/web/fixtures/web.fixtures.ts
import { test as base } from '@playwright/test';
import { loadRegion } from '../../../config/region';
import { FireflyClient } from '../../api/client/FireflyClient';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionCreatePage } from '../pages/TransactionCreatePage';
import { TransactionListPage } from '../pages/TransactionListPage';

type WebFixtures = {
  apiClient: FireflyClient;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  transactionCreatePage: TransactionCreatePage;
  transactionListPage: TransactionListPage;
};

export const test = base.extend<WebFixtures>({
  apiClient: async ({ request }, use) => {
    const region = loadRegion();
    await use(new FireflyClient(request, region));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page, loadRegion()));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  transactionCreatePage: async ({ page }, use) => {
    await use(new TransactionCreatePage(page, loadRegion()));
  },
  transactionListPage: async ({ page }, use) => {
    await use(new TransactionListPage(page, loadRegion()));
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/web/fixtures/
git commit -m "feat: web fixtures with POMs and shared apiClient"
```

---

## Task 11: Web Tests

**Files:**
- Create: `src/web/tests/login.web.spec.ts`
- Create: `src/web/tests/transaction.web.spec.ts`

- [ ] **Step 1: Create `src/web/tests/login.web.spec.ts`**

```typescript
// src/web/tests/login.web.spec.ts
import { test, expect } from '../fixtures/web.fixtures';
import { loadRegion } from '../../../config/region';

test.describe('Login', () => {
  test('given valid credentials when submitting login form then dashboard is shown', async ({
    loginPage,
    dashboardPage,
  }) => {
    const { defaultUser, webBaseUrl } = loadRegion();

    await loginPage.goto();
    await loginPage.login(defaultUser.email, defaultUser.password);

    await expect(dashboardPage.navBar).toBeVisible();
    expect(dashboardPage.url()).not.toContain('/login');
    expect(dashboardPage.url()).toContain(new URL(webBaseUrl).hostname);
  });

  test('given wrong password when submitting login form then error is shown and stays on login page', async ({
    loginPage,
    page,
  }) => {
    const { defaultUser, webBaseUrl } = loadRegion();

    await loginPage.goto();
    await loginPage.login(defaultUser.email, 'definitely-wrong-password-xyz');

    await expect(loginPage.errorAlert).toBeVisible();
    expect(page.url()).toContain('/login');

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('laravel'),
    );
    expect(sessionCookie).toBeUndefined();
  });
});
```

- [ ] **Step 2: Create `src/web/tests/transaction.web.spec.ts`**

```typescript
// src/web/tests/transaction.web.spec.ts
import { test, expect } from '../fixtures/web.fixtures';
import { loadRegion } from '../../../config/region';
import { buildTransaction } from '../../shared/helpers/dataFactory';
import type { TransactionCreateResponse, TransactionListResponse } from '../../shared/types/firefly';

test.describe('Transaction creation', () => {
  const createdIds: string[] = [];

  test.beforeEach(async ({ loginPage }) => {
    const { defaultUser } = loadRegion();
    await loginPage.goto();
    await loginPage.login(defaultUser.email, defaultUser.password);
  });

  test.afterEach(async ({ apiClient }) => {
    for (const id of createdIds) {
      await apiClient.deleteTransaction(id);
    }
    createdIds.length = 0;
  });

  test('given authenticated user when creating transaction via UI then API confirms newest transaction matches', async ({
    transactionCreatePage,
    apiClient,
  }) => {
    const seed = buildTransaction({ description: `ui-create-${Date.now()}` });
    const tx = seed.transactions[0];

    await transactionCreatePage.goto();
    await transactionCreatePage.fill({
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      sourceName: tx.source_name,
      destinationName: tx.destination_name,
    });
    await transactionCreatePage.submit();

    await expect(transactionCreatePage.successMessage).toBeVisible();

    const listResponse = await apiClient.getTransactions({ type: 'withdrawal', limit: 1 });
    expect(listResponse.status()).toBe(200);

    const listBody = await listResponse.json() as TransactionListResponse;
    const newestTx = listBody.data[0].attributes.transactions[0];
    expect(newestTx.description).toBe(tx.description);
    expect(newestTx.amount).toBe(tx.amount);

    createdIds.push(listBody.data[0].id);
  });

  test('given empty amount field when submitting transaction form then inline validation error is shown', async ({
    transactionCreatePage,
    page,
  }) => {
    const { webBaseUrl } = loadRegion();
    const createUrl = `${new URL(webBaseUrl).origin}/transactions/create/withdrawal`;

    await transactionCreatePage.goto();
    // Leave amount empty — fill only description
    await transactionCreatePage.fill({
      description: 'validation-test',
      amount: '',
      date: new Date().toISOString().split('T')[0] as string,
      sourceName: 'Savings account',
      destinationName: 'Groceries',
    });
    await transactionCreatePage.submit();

    await expect(transactionCreatePage.validationError).toBeVisible();
    expect(page.url()).toContain(new URL(createUrl).pathname);

    // Form remains interactive
    await expect(transactionCreatePage['descriptionInput']).toBeEnabled();
  });
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Run web tests**

```bash
npm run test:web
```

Expected: tests run against Chromium. If selectors fail, run `npx playwright codegen https://demo.firefly-iii.org/login` to discover current selector names and update the POM classes accordingly.

- [ ] **Step 5: Commit**

```bash
git add src/web/tests/
git commit -m "feat: web tests — login, transaction create, form validation"
```

---

## Task 12: GitHub Actions CI Workflows

**Files:**
- Create: `.github/workflows/api.yml`
- Create: `.github/workflows/web.yml`
- Create: `.github/workflows/full-suite.yml`

- [ ] **Step 1: Create `.github/workflows/api.yml`**

```yaml
name: API Tests

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run API tests
        run: npm run test:api
        env:
          REGION: eu-west
          API_TOKEN: ${{ secrets.API_TOKEN }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: api-playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Create `.github/workflows/web.yml`**

```yaml
name: Web Tests

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright Chromium
        run: npx playwright install chromium --with-deps

      - name: Run web tests
        run: npm run test:web
        env:
          REGION: eu-west
          API_TOKEN: ${{ secrets.API_TOKEN }}
          USER_EMAIL: ${{ secrets.USER_EMAIL }}
          USER_PASSWORD: ${{ secrets.USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: web-playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 3: Create `.github/workflows/full-suite.yml`**

```yaml
name: Full Test Suite

on:
  schedule:
    - cron: '0 6 * * 1-5'
  workflow_dispatch:

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run API tests
        run: npm run test:api
        env:
          REGION: eu-west
          API_TOKEN: ${{ secrets.API_TOKEN }}

      - name: Write API summary
        if: always()
        run: |
          echo "## API Tests — ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
          echo "Run at: $(date -u)" >> $GITHUB_STEP_SUMMARY

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: api-playwright-report
          path: playwright-report/
          retention-days: 14

  web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright Chromium
        run: npx playwright install chromium --with-deps

      - name: Run web tests
        run: npm run test:web
        env:
          REGION: eu-west
          API_TOKEN: ${{ secrets.API_TOKEN }}
          USER_EMAIL: ${{ secrets.USER_EMAIL }}
          USER_PASSWORD: ${{ secrets.USER_PASSWORD }}

      - name: Write web summary
        if: always()
        run: |
          echo "## Web Tests — ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
          echo "Run at: $(date -u)" >> $GITHUB_STEP_SUMMARY

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: web-playwright-report
          path: playwright-report/
          retention-days: 14
```

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "ci: api, web, and full-suite GitHub Actions workflows"
```

---

## Task 13: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# quipu-automation

Automated test framework for Firefly III — covers REST API and Web UI with multi-region support.

![Full Suite](https://github.com/<org>/quipu-automation/actions/workflows/full-suite.yml/badge.svg)

## Prerequisites

- Node.js 20 LTS
- A valid Firefly III Personal Access Token ([how to get one](https://docs.firefly-iii.org/how-to/firefly-iii/features/api/))

## Installation

```bash
npm ci
npx playwright install chromium   # for web tests only
```

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `REGION` | Region to target (default: `eu-west`) |
| `API_TOKEN` | Firefly III Personal Access Token |
| `USER_EMAIL` | Login email for web tests |
| `USER_PASSWORD` | Login password for web tests |

The `API_TOKEN` can also be passed as an environment variable directly without a `.env` file.

## Running tests

```bash
# API tests only (no browser required)
npm run test:api

# Web tests only (requires Chromium)
npm run test:web

# Both layers
npm run test:all
```

## Targeting a different region

```bash
REGION=us-east npm run test:all
```

Adding a new region: create `config/regions/<name>.ts` following the same shape as `eu-west.ts`. No test files need modification.

## CI

Three workflows are defined in `.github/workflows/`:

| Workflow | Trigger |
|---|---|
| `api.yml` | Push / PR to main |
| `web.yml` | Push / PR to main |
| `full-suite.yml` | Weekdays at 06:00 UTC + manual dispatch |

Set the following GitHub Secrets on the repository: `API_TOKEN`, `USER_EMAIL`, `USER_PASSWORD`.

## Known limitations

- **Demo server rate limits:** The public demo at `demo.firefly-iii.org` may throttle requests. Run tests with `workers: 1` (already set for CI) to reduce load.
- **Shared test state:** The demo server is shared globally. Transactions created by parallel test runs from other users may appear in list assertions. Prefer description-based filtering and always clean up in `afterEach`.
- **Account names:** `dataFactory.ts` assumes `Savings account` and `Groceries` exist. These are present on the default Firefly III demo. If targeting a fresh private instance, create these accounts first or update the factory.
- **Web selectors:** POM selectors target Firefly III's Bootstrap UI. If the demo server is updated to a newer UI version, re-generate selectors with `npx playwright codegen <url>`.
```

- [ ] **Step 2: Final type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README with setup, usage, region targeting, and known limitations"
```

---

## Spec Coverage Self-Check

| Requirement | Task |
|---|---|
| Monorepo folder structure | Task 1 |
| `RegionConfig` interface | Task 2 |
| `loadRegion()` via `REGION` env var | Task 2 |
| No direct URL/credential imports in tests | Task 2, enforced by fixture pattern |
| `test:api` / `test:web` / `test:all` scripts | Task 1 |
| Two Playwright projects | Task 3 |
| API tests use `request` only | Task 7, 8 |
| Typed API client | Task 6 |
| API happy path POST 200 | Task 8 |
| API error 422 | Task 8 |
| API schema validation with custom helper | Task 5, 8 |
| API idempotency pin test with comment | Task 8 |
| POM classes (4) | Task 9 |
| Web login happy path | Task 11 |
| Web create transaction (cross-layer verify) | Task 11 |
| Web login error state | Task 11 |
| Web form validation | Task 11 |
| Shared api+page fixture | Task 10 |
| `afterEach` cleanup via API | Task 8, 11 |
| `given/when/then` test names | Task 8, 11 |
| No `waitForTimeout` | Task 9, 11 |
| TypeScript strict / no `any` | Task 1 (tsconfig) |
| GitHub Actions: api.yml | Task 12 |
| GitHub Actions: web.yml | Task 12 |
| GitHub Actions: full-suite.yml (cron + dispatch) | Task 12 |
| `$GITHUB_STEP_SUMMARY` | Task 12 |
| README | Task 13 |
