# Test Framework Build — Claude Prompt for VS Code

Paste the block below into Claude in VS Code to drive the implementation.

---

## PROMPT

You are building a production-grade, multi-region automated test framework for a financial services platform. The platform consists of three independently deployable areas: a REST API backend, a customer-facing web application, and a mobile app (out of scope for this build). Your job is to scaffold the complete framework, write the tests, and wire up CI — following the architectural constraints and coverage requirements defined below.

---

### Target Application

Use **Firefly III** (personal finance manager) as the test target:

- Web UI: https://demo.firefly-iii.org/login  
- API base: https://demo.firefly-iii.org/api/v1  
- API docs: https://api-docs.firefly-iii.org

This is a payments/accounts domain application — it covers transactions, accounts, budgets, and categories, which maps directly to the financial services context.

---

### Technology Stack

- **Language:** TypeScript (strict mode)
- **Test runner:** Playwright (for both API and Web)
- **Package manager:** npm
- **CI:** GitHub Actions
- **Node version:** 20 LTS

---

### Framework Architecture Requirements

#### 1. Monorepo Structure

```
/
├── config/
│   ├── regions/
│   │   ├── eu-west.ts
│   │   └── us-east.ts
│   └── region.ts              # region loader — reads REGION env var
├── src/
│   ├── api/
│   │   ├── client/            # typed API client wrappers
│   │   ├── fixtures/          # Playwright API fixtures
│   │   └── tests/
│   ├── web/
│   │   ├── pages/             # Page Object Model classes
│   │   ├── fixtures/          # Playwright web fixtures
│   │   └── tests/
│   └── shared/
│       ├── types/             # shared TypeScript interfaces
│       └── helpers/           # data factories, wait utilities
├── .github/
│   └── workflows/
│       ├── api.yml
│       ├── web.yml
│       └── full-suite.yml
├── playwright.config.ts
└── package.json
```

#### 2. Region Abstraction

- All environment-specific values (base URL, API URL, auth tokens, test user credentials) are defined in `config/regions/<name>.ts`.
- The active region is selected via the `REGION` environment variable (default: `eu-west`).
- **No test file may import a URL, credential, or environment value directly.** Everything goes through the region config loader.
- Adding a new region means adding one config file only — zero test modifications.

Region config interface:

```typescript
interface RegionConfig {
  name: string;
  webBaseUrl: string;
  apiBaseUrl: string;
  defaultUser: {
    email: string;
    password: string;
  };
  apiToken: string;
}
```

#### 3. Layer Independence

- API tests must run with: `npm run test:api`
- Web tests must run with: `npm run test:web`
- Both together: `npm run test:all`
- Each layer has its own Playwright project in `playwright.config.ts`
- API tests use Playwright's `request` fixture only — no browser launched
- Web tests use browser + page fixtures

#### 4. Shared Infrastructure

Web tests are allowed (and expected) to use API client helpers for test data setup and teardown. Create a shared fixture that exposes both `apiClient` and `page` to web tests that need it.

---

### API Test Coverage

All API tests live under `src/api/tests/`. Use Playwright's `APIRequestContext`.

Build a typed API client class under `src/api/client/` that wraps the Firefly III API endpoints used in tests. The client must accept a `RegionConfig` and set `Authorization: Bearer <token>` on every request.

#### Required API Tests

**1. Happy Path — Create a Transaction**

- Send a valid `POST /transactions` payload (withdrawal type, valid amount, valid date, existing asset account)
- Assert HTTP 200
- Assert response body matches the sent payload (id present, amount matches, description matches)
- Assert `Content-Type: application/json`

**2. Error State — Invalid Transaction Payload**

- Send a `POST /transactions` with a missing required field (`transactions` array empty or amount missing)
- Assert HTTP 422
- Assert response body contains an `errors` or `message` field
- Assert the error refers to the missing field — not a generic 500

**3. Schema Validation — Transaction List Response**

- Send `GET /transactions?type=withdrawal&limit=5`
- Assert HTTP 200
- Validate the full response schema against a defined TypeScript interface:
  - `data` is an array
  - Each item has `id` (string), `type` (string), `attributes` (object)
  - `attributes` contains `amount` (string), `description` (string), `date` (string), `source_name` (string)
- Use a schema assertion helper (write one — do not pull in a third-party schema lib)
- Assert `meta.pagination` exists with `total`, `per_page`, `current_page`

**4. Idempotency / Edge Case — Duplicate Transaction Guard**

- Create a transaction via `POST /transactions`
- Immediately re-send the identical payload
- Assert both requests return 200 (Firefly III does not enforce idempotency keys — assert the second response creates a separate transaction with a different `id`)
- This test documents platform behaviour, not a bug: add a comment explaining that a real production API should return 409 or honour `Idempotency-Key` — this test pins the current observed behaviour

---

### Web Test Coverage

All web tests live under `src/web/tests/`. Use Page Object Model — every page interaction goes through a POM class.

Required POM classes: `LoginPage`, `DashboardPage`, `TransactionCreatePage`, `TransactionListPage`.

#### Required Web Tests

**1. Happy Path — Login and Verify Dashboard**

- Navigate to the login URL (from region config)
- Enter valid credentials (from region config)
- Submit the form
- Assert the dashboard heading or welcome element is visible
- Assert the URL changed to the authenticated route

**2. Happy Path — Create a Transaction via UI (uses API for verification)**

- Use the `apiClient` fixture to fetch the current transaction count for the test account before the UI action
- Navigate to create transaction form
- Fill in: description, amount, date, source account, destination (expense) account
- Submit
- Assert a success notification is visible
- Call `GET /transactions?limit=1` via the API client and assert the newest transaction matches what was entered in the form
- This test demonstrates cross-layer verification: UI creates, API confirms

**3. Error State — Login with Invalid Credentials**

- Navigate to login page
- Enter a valid-format email and a wrong password
- Submit
- Assert an error message is displayed on the page
- Assert the user remains on the login URL (no redirect)
- Assert no auth cookie or session token is set

**4. Edge Case — Transaction Form Validation**

- Navigate to create transaction form (authenticated)
- Submit the form with the amount field left empty
- Assert a validation error is shown inline — no page navigation occurs
- Assert the form remains interactive (fields are not disabled)

---

### CI Pipeline Requirements

Create three GitHub Actions workflow files:

**`.github/workflows/api.yml`**
- Trigger: push to any branch, PR to main
- Job: `api-tests`
- Steps: checkout, setup Node 20, `npm ci`, `npm run test:api`
- Pass `REGION=eu-west` as env var (use GitHub secret `API_TOKEN` for the token)
- Upload Playwright report as artifact on failure

**`.github/workflows/web.yml`**
- Trigger: push to any branch, PR to main
- Job: `web-tests`
- Steps: checkout, setup Node 20, install Playwright browsers, `npm ci`, `npm run test:web`
- Pass `REGION=eu-west`
- Upload Playwright report as artifact on failure

**`.github/workflows/full-suite.yml`**
- Trigger: scheduled (`cron: '0 6 * * 1-5'`) and manual dispatch (`workflow_dispatch`)
- Runs both `api-tests` and `web-tests` as separate parallel jobs
- On completion, post a job summary using GitHub's `$GITHUB_STEP_SUMMARY`

---

### Code Quality Constraints

- TypeScript strict mode — no `any`, no `@ts-ignore`
- All async operations use `async/await` — no `.then()` chains
- No hardcoded waits (`page.waitForTimeout`) — use `page.waitForSelector`, `page.waitForURL`, or `expect(locator).toBeVisible()`
- Every test is fully independent: each test sets up its own data and cleans up after itself (use `afterEach` hooks with API calls for teardown)
- Test descriptions follow the pattern: `given <precondition> when <action> then <assertion>`
- POM methods return `this` where chaining is natural, `void` otherwise
- Fixtures use Playwright's `extend` pattern — no test imports a helper directly

---

### README Requirements

Write a `README.md` covering:

1. Prerequisites (Node 20, a valid Firefly III API token)
2. Installation (`npm ci`, Playwright browser install command)
3. How to set the API token (env var or `.env` file)
4. How to run: API only, Web only, all tests
5. How to target a different region (one-line explanation)
6. CI badge snippet for the full-suite workflow
7. Known limitations (e.g., demo server rate limits, shared test state on the public demo)

---

### Implementation Order

Build in this sequence to avoid dependency blockers:

1. Scaffold folder structure and `package.json` with all dependencies
2. `playwright.config.ts` with two projects (api, web)
3. Region config files and loader
4. Typed API client
5. API fixtures
6. API tests (all four)
7. POM classes
8. Web fixtures (including shared api+page fixture)
9. Web tests (all four)
10. GitHub Actions workflows
11. README

Do not move to the next step until the current step compiles cleanly (`tsc --noEmit`).
