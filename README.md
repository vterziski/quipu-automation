# quipu-automation

Automated test framework for Firefly III — covers REST API and Web UI with multi-region support.

![Full Suite](https://github.com/YOUR_GITHUB_USERNAME/quipu-automation/actions/workflows/full-suite.yml/badge.svg)

## Prerequisites

- Node.js 20 LTS
- Docker (for local Firefly III instance) — or a self-hosted / public Firefly III URL
- A valid Firefly III Personal Access Token ([how to get one](https://docs.firefly-iii.org/how-to/firefly-iii/features/api/))

## Local setup with Docker

The quickest way to get a test target with no Cloudflare or shared state:

```bash
# 1. Create Docker env file
cp .env.docker.example .env.docker
# Generate APP_KEY and paste it into .env.docker:
docker compose run --rm app php artisan key:generate --show

# 2. Start Firefly III + MariaDB
docker compose up -d

# 3. Open http://localhost:8080, complete the setup wizard, create your admin account

# 4. Create the two accounts the test suite expects:
#    - Asset account:   "Savings account"
#    - Expense account: "Groceries"
#    (Accounts → Asset accounts → Create new)

# 5. Generate a Personal Access Token:
#    Profile → Remote access and tokens → Personal Access Tokens → Create new token
```

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
| `REGION` | Region to target (default: `eu-west`; use `local` for Docker) |
| `API_TOKEN` | Firefly III Personal Access Token |
| `USER_EMAIL` | Login email for web tests |
| `USER_PASSWORD` | Login password for web tests |

Optional URL overrides (useful for staging environments):

| Variable | Default |
|---|---|
| `EU_WEST_WEB_URL` | `https://demo.firefly-iii.org` |
| `EU_WEST_API_URL` | `https://demo.firefly-iii.org/api/v1` |
| `LOCAL_WEB_URL` | `http://localhost:8080` |
| `LOCAL_API_URL` | `http://localhost:8080/api/v1` |

## Running tests

```bash
# API tests only (no browser required)
npm run test:api

# Web tests only (requires Chromium, runs headless by default)
npm run test:web

# Run with a visible browser window
HEADED=1 npm run test:web

# Both layers
npm run test:all
```

## Targeting a different region

```bash
REGION=local npm run test:all
REGION=eu-west npm run test:all
```

Adding a new region: create `config/regions/<name>.ts` following the same shape as `eu-west.ts`. No other files need modification — the region loader discovers it automatically as long as the name matches `[a-z0-9-]+`.

## CI

Three workflows are defined in `.github/workflows/`:

| Workflow | Trigger |
|---|---|
| `api.yml` | Push to any branch / PR to main |
| `web.yml` | Push to any branch / PR to main |
| `full-suite.yml` | Weekdays at 06:00 UTC + manual dispatch |

Set the following GitHub Secrets on the repository: `API_TOKEN`, `USER_EMAIL`, `USER_PASSWORD`.

The web tests run headless in CI automatically (`HEADED` is not set).

## Known limitations

- **Cloudflare on demo.firefly-iii.org:** The public demo blocks automated browsers. Use `REGION=local` with Docker for reliable web tests.
- **Account names:** `dataFactory.ts` defaults to `Savings account` (asset) and `Groceries` (expense). Create these accounts on any fresh instance before running tests, or override the defaults via `buildTransaction({ source_name: '...' })`.
- **Intro.js tour:** On a fresh Firefly III instance, a guided tour overlay appears on the create-transaction page. The POM dismisses it automatically; if a Firefly III upgrade changes the tour library, update the `dismissIntro()` selectors in `TransactionCreatePage.ts`.
- **Shared test state:** Tests clean up after themselves via `afterEach` API calls. If a test run is cancelled mid-way, orphaned transactions may remain — re-run will not be affected since tests find their own data by unique description.
- **Demo server rate limits:** If targeting `eu-west`, the public demo may throttle requests. `workers: 1` is already set for CI.
