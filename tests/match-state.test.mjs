import assert from 'node:assert/strict';
import test from 'node:test';
import { readPriorities, matchupUrl, comparisonStatus, weightPresets } from '../src/match-state.ts';

test('a shared custom matchup preserves weights, devices, currency and import identity', () => {
  const weights = { Camera: 2.1, Battery: 0.7, Performance: 3, Display: 1.3, Value: 0.5 };
  const url = matchupUrl('https://example.com/?a=old&b=old&focus=Balanced', {
    left: { id: 'op13' }, right: { id: 'live-wiki-123', liveSlug: 'wiki-123' },
    preset: 'Custom', weights, currency: 'AED', region: 'UAE',
  });
  assert.equal(url.searchParams.get('a'), 'op13');
  assert.equal(url.searchParams.get('b'), 'live-wiki-123');
  assert.equal(url.searchParams.get('bSlug'), 'wiki-123');
  assert.equal(url.searchParams.get('currency'), 'AED');
  assert.deepEqual(readPriorities(url.searchParams), { preset: 'Custom', weights });
});

test('malformed or out-of-range shared priorities fall back to Balanced', () => {
  for (const query of ['focus=Custom&weights=1,1,NaN,1,1', 'focus=Custom&weights=1,1,99,1,1', 'focus=constructor', 'focus=Custom&weights=1,1']) {
    assert.deepEqual(readPriorities(new URLSearchParams(query)), { preset: 'Balanced', weights: weightPresets.Balanced });
  }
});

test('preset links remove stale custom weights and stale import slugs', () => {
  const url = matchupUrl('https://example.com/?weights=1,2,3,1,1&aSlug=stale&bSlug=stale', {
    left: { id: 'a55' }, right: { id: 'i15' }, preset: 'Value', weights: weightPresets.Value, currency: 'USD', region: 'International',
  });
  assert.equal(url.searchParams.has('weights'), false);
  assert.equal(url.searchParams.has('aSlug'), false);
  assert.equal(url.searchParams.has('bSlug'), false);
  assert.equal(readPriorities(url.searchParams).preset, 'Value');
});

test('same-device, mixed-category and unreviewed comparisons do not award winners', () => {
  const phone = { id: 'phone' };
  assert.equal(comparisonStatus(phone, phone, 10), 'same');
  assert.equal(comparisonStatus(phone, { id: 'laptop', category: 'Laptop' }, 10), 'mixed');
  assert.equal(comparisonStatus(phone, { id: 'import', source: 'live' }, 10), 'unscored');
  assert.equal(comparisonStatus(phone, { id: 'other' }, 0.2), 'close');
  assert.equal(comparisonStatus(phone, { id: 'other' }, 0.5), 'ranked');
});
