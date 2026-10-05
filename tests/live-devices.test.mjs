import assert from 'node:assert/strict';
import test from 'node:test';
import { requestDevices } from '../src/live-devices.ts';

test('catalogue profiles remain available without network access', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Network should not be used'); });
  const response = await requestDevices(new URLSearchParams({ slug: 'catalogue-s26u' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).device.id, 's26u');
  assert.equal(fetch.mock.callCount(), 0);
});

test('an upstream outage keeps matching catalogue results available', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  const response = await requestDevices(new URLSearchParams({ q: 'Galaxy S26 Ultra' }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.results[0].catalogueId, 's26u');
  assert.match(payload.warning, /could not be reached/);
});

test('browser lookup uses CORS-enabled Wikipedia requests without credentials', async t => {
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://en.wikipedia.org');
    assert.equal(url.searchParams.get('origin'), '*');
    assert.equal(init.credentials, 'omit');
    assert.equal(init.headers['User-Agent'], undefined);
    return Response.json({ query: { pages: { 123: {
      pageid: 123, title: 'ExampleBook', extract: 'A laptop computer.', index: 1,
    } } } });
  });
  const response = await requestDevices(new URLSearchParams({ q: 'ExampleBook', category: 'laptop' }));
  const { results } = await response.json();
  assert.equal(results[0].slug, 'wiki-123');
  assert.equal(results[0].category, 'Laptop');
});

test('imported profiles stay unscored and do not invent prices or release years', async t => {
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    return Response.json(url.searchParams.get('action') === 'parse'
      ? { parse: { title: 'ExampleBook', wikitext: { '*': '{{Infobox information appliance\n| name = ExampleBook\n| cpu = Example chip\n}}' }, text: { '*': '' } } }
      : { query: { pages: { 123: { pageid: 123, extract: 'A laptop computer.' } } } });
  });
  const response = await requestDevices(new URLSearchParams({ slug: 'wiki-123' }));
  const { device } = await response.json();
  assert.equal(device.id, 'live-wiki-123');
  assert.equal(device.category, 'Laptop');
  assert.deepEqual(device.scores, {});
  assert.equal(device.year, 0);
  assert.equal(device.price, 0);
});

test('aborted requests do not turn into stale search results', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Should not fetch'); });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(requestDevices(new URLSearchParams({ q: 'Pixel' }), controller.signal), { name: 'AbortError' });
  assert.equal(fetch.mock.callCount(), 0);
});

test('short queries fail before requesting external sources', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Should not fetch'); });
  const response = await requestDevices(new URLSearchParams({ q: 'x' }));
  assert.equal(response.status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});

test('model numbers stay meaningful and all-device search does not broaden the query', async t => {
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    if (url.origin === 'https://en.wikipedia.org') {
      assert.equal(url.searchParams.get('gsrsearch'), 'Pixel 8');
      return Response.json({ query: { pages: { 123: {
        pageid: 123, title: 'Pixel 8', extract: 'An Android smartphone.', index: 1,
      } } } });
    }
    throw new Error('Fallback should not be used');
  });
  const response = await requestDevices(new URLSearchParams({ q: 'Pixel 8' }));
  const { results } = await response.json();
  assert.deepEqual(results.map(result => result.name), ['Pixel 8']);
});
