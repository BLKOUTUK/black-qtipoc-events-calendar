# Openings — end-to-end test (spec §7 step 5)

Exact curl steps for the local, real-API run: submit an opening → it appears in
`pending-openings` → moderate approve (bearer-verified) → row lands in `openings_live`
via the anon key → row lands in `first_gestures` → clean up every test row.

Builder B1 already exercised the negative paths (400 validation, 401 without a bearer,
honeypot 200, dedupe) against a live server on 28 Aug 2026 — see the build report. This
doc covers the **positive path with a real moderator bearer**, which B1 was told not to
do (creating/approving is Fable's step).

## 0. Env note (found during B1's build)

`.env.production` in this repo currently carries only `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` — no `SUPABASE_SERVICE_ROLE_KEY`. `submit-opening`,
`pending-openings` and `moderate-opening` all need the service role key server-side, so
the spec's literal command (`source .env.production`) will 500 with "Server
misconfigured" on every request. `.env.local` carries all three
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — use that
instead, or add the missing key to `.env.production` first. Below assumes `.env.local`.

Also check `PORT=3001` is actually free before starting — it was occupied by another
process during B1's build (no owning PID visible via `ps`, so probably a sibling
builder's server or an orphaned container-side listener). Pick a free port
(`ss -ltnp | grep 3001`) rather than assuming.

## 1. Start the server

```bash
cd ~/blkout/platform/apps/events-calendar
set -a; source .env.local; set +a
PORT=3001 npx tsx server.ts
```

Confirm in the log: `✅ Registered route: /api/submit-opening`, `/api/pending-openings`,
`/api/moderate-opening`, and `[submit-opening] Config: { hasUrl: true, hasServiceKey: true }`.

Run everything below in a second terminal, `PORT=3001` (or whatever you started on).

## 2. Submit a test opening

```bash
RESP=$(curl -s -X POST http://localhost:3001/api/submit-opening \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[E2E TEST] Fable bursary",
    "organisation": "[E2E TEST] Test Org",
    "url": "https://example.com/e2e-test-opening",
    "summary": "End-to-end test opening — delete after the run.",
    "found_by": "Fable E2E",
    "found_by_contact": "fable-e2e@example.com",
    "beat": "jobs-training",
    "kind": "bursary",
    "deadline": "2027-01-01"
  }')
echo "$RESP"
OPENING_ID=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "OPENING_ID=$OPENING_ID"
```

Expect `{"success":true,"id":"<uuid>"}`. A future deadline (not `rolling`) is used
deliberately so the row is eligible for `openings_live` (`deadline IS NULL OR deadline
>= current_date`) once approved.

## 3. Negative path sanity (already proven by B1, cheap to re-check)

```bash
# Honeypot — 200, no insert
curl -s -X POST http://localhost:3001/api/submit-opening -H "Content-Type: application/json" \
  -d '{"title":"bot","organisation":"bot","url":"https://example.com","summary":"s","found_by":"f","found_by_contact":"c@example.com","beat":"jobs-training","website":"spam"}'
# -> {"success":true,"id":null}

# 401 without a bearer
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/pending-openings
# -> 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/moderate-opening \
  -H "Content-Type: application/json" -d "{\"id\":\"$OPENING_ID\",\"action\":\"approve\"}"
# -> 401
```

## 4. Obtain a moderator bearer

Create a throwaway test user via the Admin API (service role key), then password-grant
a session for it (anon key). Do this only for the duration of the test — deleted in
step 8.

```bash
TEST_EMAIL="e2e-moderator-$(date +%s)@blkoutuk.com"
TEST_PASSWORD="$(openssl rand -base64 24)"

CREATE_USER=$(curl -s -X POST "${VITE_SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"email_confirm\":true}")
echo "$CREATE_USER"
TEST_USER_ID=$(echo "$CREATE_USER" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "TEST_USER_ID=$TEST_USER_ID"

TOKEN_RESP=$(curl -s -X POST "${VITE_SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
echo "ACCESS_TOKEN obtained: $(test -n "$ACCESS_TOKEN" && echo yes || echo no)"
```

## 5. Confirm it shows in the moderation queue, `found_by_contact` stripped

```bash
curl -s http://localhost:3001/api/pending-openings -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
row = next(o for o in data['openings'] if o['id'] == '$OPENING_ID')
print('found_by_contact key present:', 'found_by_contact' in row)
print(row)
"
```

Expect `found_by_contact key present: False`.

## 6. Approve it

```bash
curl -s -X POST http://localhost:3001/api/moderate-opening \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{\"id\":\"$OPENING_ID\",\"action\":\"approve\"}"
```

Expect `{"success":true,"opening":{...,"status":"approved","moderated_by":"<TEST_EMAIL>",...}}`
with no `found_by_contact` key and a non-null `gesture_id`.

## 7. Check `openings_live` (anon key — this is the public read path) and `first_gestures`

```bash
curl -s "${VITE_SUPABASE_URL}/rest/v1/openings_live?id=eq.${OPENING_ID}&select=*" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}"
# -> one row, status implicit approved+not-expired, no found_by_contact column exists on the view at all

curl -s "${VITE_SUPABASE_URL}/rest/v1/first_gestures?source_table=eq.openings&source_id=eq.${OPENING_ID}&select=*" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
# -> one row, surface='openings', gesture='Found an opening: [E2E TEST] Fable bursary'
```

## 8. Clean up — delete every test row, in this order

```bash
# a) first_gestures row (FK-adjacent to the opening; delete before/either order is fine,
#    there's no FK constraint, but tidy up both explicitly)
curl -s -X DELETE "${VITE_SUPABASE_URL}/rest/v1/first_gestures?source_table=eq.openings&source_id=eq.${OPENING_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: return=representation"

# b) the openings row itself
curl -s -X DELETE "${VITE_SUPABASE_URL}/rest/v1/openings?id=eq.${OPENING_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: return=representation"

# c) the throwaway auth user
curl -s -X DELETE "${VITE_SUPABASE_URL}/auth/v1/admin/users/${TEST_USER_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

# d) verify all three are gone
curl -s "${VITE_SUPABASE_URL}/rest/v1/openings?id=eq.${OPENING_ID}&select=id" -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
curl -s "${VITE_SUPABASE_URL}/rest/v1/first_gestures?source_table=eq.openings&source_id=eq.${OPENING_ID}&select=id" -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
# both should return []
```

## 9. Stop the server

`kill` the `tsx server.ts` process (or Ctrl-C in its terminal). Confirm the port is free:
`ss -ltnp | grep :3001` should show nothing.
