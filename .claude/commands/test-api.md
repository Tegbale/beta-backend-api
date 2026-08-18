# /test-api — Run the Postman collection against staging

Run the full API test suite using Newman. The collection is at the repo root.

## Basic run

```bash
npx newman run Tegbale_API.postman_collection.json --timeout-request 20000
```

## Verbose with full request/response output

```bash
npx newman run Tegbale_API.postman_collection.json --timeout-request 20000 --reporters cli --reporter-cli-no-assertions false
```

## Run a single folder only

```bash
npx newman run Tegbale_API.postman_collection.json --folder "Staff" --timeout-request 20000
```

## What to look for

- **All assertions must pass** (0 failures) before declaring a fix done.
- If a test fails with a 500, check Render logs first — look for Prisma error codes (P2021 = table missing, P2002 = duplicate, P2025 = not found).
- If Auth fails early, all downstream tests will cascade-fail (they depend on the token variable set in the Auth folder's test scripts).
- The **Teardown** folder runs last — it resets the SUPER_ADMIN password back to `Admin@1234` and logs out. Never move Teardown out of last position.

## After fixing a backend bug

1. Fix the code.
2. Push to staging (Render auto-deploys on push to `staging` branch).
3. Wait for Render deploy to complete (~1–2 min).
4. Re-run Newman to confirm green.
5. Update the collection JSON if the fix changed request/response shape, then re-import into Postman desktop.
