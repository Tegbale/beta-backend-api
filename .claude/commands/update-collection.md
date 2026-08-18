# /update-collection — Update the Postman collection

Use this skill when adding new endpoints, fixing test assertions, or changing request shapes.

## Collection file

`Tegbale_API.postman_collection.json` in the backend root. Format: Postman Collection v2.1.0.

## Workflow

### 1. Edit the JSON directly

All collection changes go into `Tegbale_API.postman_collection.json`. Never use Postman's GUI to edit and re-export — that would overwrite the chained variable test scripts.

**Folder order (must be preserved):**
```
Health → Auth → School Requests → Schools → Staff → Classrooms → Students →
Parents → Events → Posts → Messages → Notifications → Users → Teardown
```

The Teardown folder must stay last — it resets the SUPER_ADMIN password to `Admin@1234` and logs out.

### 2. Variables set by test scripts

The collection uses chained variables across requests. Key ones:

| Variable | Set by | Used by |
|----------|--------|---------|
| `token` | Login (Auth) | All authenticated requests |
| `refreshToken` | Login (Auth) | Logout (Teardown) |
| `schoolId` | Approve School Request | Schools, Staff, Classrooms, Students, Events, Posts |
| `staffId` | Create Staff | Get/Update/Delete Staff, Toggle Status |
| `classroomId` | Create Classroom | Assign Classroom, Students |
| `studentId` | Create Student | Get/Update/Delete Student |

When adding a new resource, add a `pm.environment.set('newId', ...)` in the Create request's test script, and use `{{newId}}` in subsequent requests.

### 3. Test script conventions

Every request should have a test script with at minimum:

```js
pm.test("Status is 2xx", function () {
  pm.response.to.have.status(200); // or 201
});
pm.test("Response has data", function () {
  const json = pm.response.json();
  pm.expect(json.data).to.not.be.null;
});
```

For paginated list endpoints:
```js
pm.test("Returns paginated list", function () {
  const json = pm.response.json();
  // handle both array shape and { items, total } shape
  const items = Array.isArray(json.data) ? json.data : (json.data.items ?? json.data.requests ?? json.data.staff ?? []);
  pm.expect(items).to.be.an('array');
});
```

### 4. Validate JSON before committing

After editing, validate the JSON is well-formed:
```bash
node -e "JSON.parse(require('fs').readFileSync('Tegbale_API.postman_collection.json','utf8')); console.log('Valid JSON')"
```

### 5. Import into Postman desktop

**File → Import → select `Tegbale_API.postman_collection.json` → Replace** (do not duplicate).

### 6. Run and verify

```bash
npx newman run Tegbale_API.postman_collection.json --timeout-request 20000
```

All assertions must pass before committing the updated collection.
