const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.BROWSER_GLASS_ROOT || path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const resource = manifest.declarative_net_request.rule_resources.find(rule => rule.id === 'youtube_homepage');
const [rule] = JSON.parse(fs.readFileSync(path.join(root, resource.path), 'utf8'));
const pattern = new RegExp(rule.condition.regexFilter, 'i');

test('YouTube homepage redirect is enabled and limited to top-level pages', () => {
  assert.equal(resource.enabled, true);
  assert.ok(manifest.permissions.includes('declarativeNetRequestWithHostAccess'));
  assert.ok(manifest.host_permissions.includes('*://youtube.com/*'));
  assert.ok(manifest.host_permissions.includes('*://www.youtube.com/*'));
  assert.deepEqual(rule.condition.resourceTypes, ['main_frame']);
  assert.deepEqual(rule.action, { type: 'redirect', redirect: { url: 'https://hackertube.io/' } });
});

test('all requested homepage forms redirect', () => {
  for (const protocol of ['http', 'https']) {
    for (const host of ['youtube.com', 'www.youtube.com']) {
      for (const suffix of ['', '/', '?app=desktop', '/?app=desktop']) {
        const url = `${protocol}://${host}${suffix}`;
        assert.equal(pattern.test(url), true, url);
      }
    }
  }
});

test('video, discovery, embed, and unrelated URLs remain available', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=abc123',
    'https://youtube.com/watch?v=abc123&t=60',
    'https://www.youtube.com/shorts/abc123',
    'https://www.youtube.com/results?search_query=music',
    'https://www.youtube.com/@channel',
    'https://www.youtube.com/feed/subscriptions',
    'https://www.youtube.com/embed/abc123',
    'https://youtu.be/abc123',
    'https://m.youtube.com/',
    'https://youtube.com.example.com/',
    'https://example.com/?next=https://www.youtube.com/',
    'https://hackertube.io/',
  ]) assert.equal(pattern.test(url), false, url);
});
