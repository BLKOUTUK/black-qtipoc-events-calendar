import test from 'node:test'
import assert from 'node:assert/strict'
import { TavilyEventDiscovery } from '../tavilyEventDiscovery.js'

// Stub config — extractDate() doesn't touch Supabase or the Tavily API, but
// the constructor requires an API key to be present.
const discovery = new TavilyEventDiscovery(null, { tavilyApiKey: 'test-key' })

// The nine phantom listings from the live bug (28 Aug 2026 evidence): a
// scraped page with a no-year date, found on or after the real event date,
// got bumped a year into the future by the old `if (candidate < now) year++`
// logic. Fixed behaviour: an undated past date within 270 days returns null
// instead of inventing a phantom future date.

test('Sugar & Spice 2026 — explicit year near the date wins over the heuristic', () => {
  const now = new Date('2026-03-14')
  const text = 'Sugar & Spice 2026: join us Sat 6 March for good vibes.'
  assert.equal(discovery.extractDate(text, now), '2026-03-06')
})

test('Juneteenth Jamz — found 1 day after an undated past date returns null', () => {
  const now = new Date('2026-06-14')
  const text = 'Juneteenth Jamz: A Black Queer Variety Festival! Join us 13 June for celebration and community.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('QTIPOC Inter-City Gathering — Bristol Pride — found 1 day after returns null', () => {
  const now = new Date('2026-06-28')
  const text = 'QTIPOC Inter-City Gathering at Bristol Pride. Meet us 27 June for the march and after-party.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('Black Like That Community Festival — found 1 day after returns null', () => {
  const now = new Date('2026-06-28')
  const text = 'Black Like That Community Festival — a celebration of Black joy. Doors open 27 June.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('Soft Like Us — found 3 days after returns null', () => {
  const now = new Date('2026-03-14')
  const text = 'Soft Like Us — a gentle social space. Come along 11 March for tea and conversation.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('QTIPOC Writers Group — found 18 days after returns null', () => {
  const now = new Date('2026-03-14')
  const text = 'QTIPOC Writers Group meets 24 February for a reading and feedback session.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('OKHA book club — found 17 days after returns null', () => {
  const now = new Date('2026-03-22')
  const text = "OKHA book club discusses this month's pick on 5 March at the community room."
  assert.equal(discovery.extractDate(text, now), null)
})

test('Manchester Pride in Ageing — found 22 days after returns null', () => {
  const now = new Date('2026-03-29')
  const text = 'Manchester Pride in Ageing workshop takes place 7 March at the community centre.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('Next Gen Black LGBT+ Futures — found 80 days after returns null', () => {
  const now = new Date('2026-04-19')
  const text = 'Next Gen Black LGBT+ Futures panel discussion, held 29 January at the youth centre.'
  assert.equal(discovery.extractDate(text, now), null)
})

test('20 January found in December rolls forward to next year', () => {
  const now = new Date('2026-12-10')
  const text = 'Save the date — our winter social returns 20 January for the new year.'
  assert.equal(discovery.extractDate(text, now), '2027-01-20')
})

test('Saturday 5 September found in August stays this year', () => {
  const now = new Date('2026-08-28')
  const text = 'Join us Saturday 5 September for an afternoon in the park.'
  assert.equal(discovery.extractDate(text, now), '2026-09-05')
})

test('explicit "5 September 2026" is unaffected by the no-year heuristic', () => {
  const text = 'The event is on 5 September 2026, all welcome.'
  assert.equal(discovery.extractDate(text), '2026-09-05')
})

test('ISO date "2026-09-05" passes through unchanged', () => {
  const text = 'Event date: 2026-09-05.'
  assert.equal(discovery.extractDate(text), '2026-09-05')
})

test('UK numeric date "05/09/2026" passes through unchanged', () => {
  const text = 'Event date: 05/09/2026.'
  assert.equal(discovery.extractDate(text), '2026-09-05')
})

test('explicit "September 5, 2026" is unaffected by the no-year heuristic', () => {
  const text = 'Mark your calendar for September 5, 2026.'
  assert.equal(discovery.extractDate(text), '2026-09-05')
})

test('no date in text returns null', () => {
  const text = 'Come along for good vibes and community — details to follow.'
  assert.equal(discovery.extractDate(text), null)
})
