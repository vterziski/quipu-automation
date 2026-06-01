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

Adding a new region: create `config/regions/<name>.ts` following the same shape as `eu-west.ts`, then add it to the `SUPPORTED_REGIONS` array in `config/region.ts`. No test files need modification.

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
- **Account names:** `dataFactory.ts` assumes `Savings account` and `Groceries` exist. These are present on the default Firefly III demo. If targeting a fresh private instance, create these accounts first or update the factory defaults.
- **Web selectors:** POM selectors target Firefly III's Bootstrap/Vue UI. If the demo server is updated to a newer UI version, re-generate selectors with `npx playwright codegen <url>`.
- **Autocomplete fields:** Source and destination account fields use Vue autocomplete widgets. The `fillAutocomplete()` helper in `TransactionCreatePage` attempts to click the dropdown suggestion; if the demo server's UI changes, this interaction may need updating.
